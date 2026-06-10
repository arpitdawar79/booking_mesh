import { refreshAccessToken, verifySessionToken } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/preview-email",
];
const PROTECTED_PREFIX = "/dashboard";

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Rate limiting for sensitive API routes
  const ip = getClientIP(request);
  if (pathname === "/api/auth") {
    const result = checkRateLimit(`auth:${ip}`, 60_000, 5);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
      );
    }
  }
  if (pathname === "/api/send-email") {
    const result = checkRateLimit(`email:${ip}`, 60_000, 10);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
      );
    }
  }
  if (pathname === "/api/whatsapp/send") {
    const result = checkRateLimit(`whatsapp:${ip}`, 60_000, 10);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
      );
    }
  }

  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const token = request.cookies.get("access_token")?.value;
    const isValidAccess = token ? await verifySessionToken(token) : null;

    if (!isValidAccess) {
      const refreshToken = request.cookies.get("refresh_token")?.value;
      if (refreshToken) {
        const result = await refreshAccessToken(refreshToken);
        if (result.success) {
          const res = NextResponse.next();
          res.cookies.set("access_token", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 8,
            path: "/",
          });
          res.cookies.set("refresh_token", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          });
          return res;
        }
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from public auth pages to dashboard
  if (pathname === "/" || pathname === "/login") {
    const token = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    let isAuthenticated = token ? !!(await verifySessionToken(token)) : false;

    if (!isAuthenticated && refreshToken) {
      const result = await refreshAccessToken(refreshToken);
      if (result.success) {
        const res = NextResponse.redirect(new URL("/dashboard", request.url));
        res.cookies.set("access_token", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 8,
          path: "/",
        });
        res.cookies.set("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
        return res;
      }
    }

    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
