import { verifyRefreshToken, verifySessionToken } from "@/lib/auth-edge";
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

  // Lazy eviction: sweep expired entries when the store grows, so it stays bounded
  if (rateLimitStore.size > 1000) {
    for (const [k, e] of rateLimitStore) {
      if (now > e.resetAt) rateLimitStore.delete(k);
    }
  }

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

const RATE_LIMITED_ROUTES: Array<{
  prefix: string;
  key: string;
  windowMs: number;
  max: number;
}> = [
  { prefix: "/api/auth", key: "auth", windowMs: 60_000, max: 5 },
  { prefix: "/api/passkeys/login", key: "passkey", windowMs: 60_000, max: 10 },
  { prefix: "/api/send-email", key: "email", windowMs: 60_000, max: 10 },
  { prefix: "/api/whatsapp/send", key: "whatsapp", windowMs: 60_000, max: 10 },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Temporary: redirect root to login (logged out) or dashboard (logged in)
  if (pathname === "/") {
    const token = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    let isAuthenticated = token ? !!(await verifySessionToken(token)) : false;
    if (!isAuthenticated && refreshToken) {
      isAuthenticated = !!(await verifyRefreshToken(refreshToken));
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Rate limiting for sensitive API routes
  const ip = getClientIP(request);
  for (const rule of RATE_LIMITED_ROUTES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      const result = checkRateLimit(
        `${rule.key}:${ip}`,
        rule.windowMs,
        rule.max,
      );
      if (!result.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Try again later." },
          {
            status: 429,
            headers: { "Retry-After": String(result.retryAfter) },
          },
        );
      }
    }
  }

  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const token = request.cookies.get("access_token")?.value;
    const isValidAccess = token ? await verifySessionToken(token) : null;

    if (!isValidAccess) {
      const refreshToken = request.cookies.get("refresh_token")?.value;
      const isValidRefresh = refreshToken
        ? !!(await verifyRefreshToken(refreshToken))
        : false;

      if (!isValidRefresh) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // Redirect logged-in users away from public auth pages to dashboard
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password"
  ) {
    const token = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;
    let isAuthenticated = token ? !!(await verifySessionToken(token)) : false;

    if (!isAuthenticated && refreshToken) {
      isAuthenticated = !!(await verifyRefreshToken(refreshToken));
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
