import { verifySessionToken } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC = ["/", "/login", "/api/auth", "/api/preview-email"];
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
    const token = request.cookies.get("session")?.value;
    if (!token || !(await verifySessionToken(token))) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
