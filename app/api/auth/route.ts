import {
    createSessionToken,
    DEFAULT_REFRESH_MAX_AGE,
    hashPassword,
    refreshAccessToken,
    REMEMBER_ME_MAX_AGE,
    storeRefreshToken,
    verifyPassword
} from "@/lib/auth";
import {
    authForgotPasswordSchema,
    authLoginSchema,
    authResetPasswordSchema,
    authSignupSchema,
} from "@/lib/validation";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe = true,
) {
  res.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_REFRESH_MAX_AGE,
    path: "/",
  });
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "login";

  if (action === "logout") {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (refreshToken) {
      try {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      } catch {
        // ignore
      }
    }
    const res = NextResponse.json({ success: true });
    clearAuthCookies(res);
    return res;
  }

  if (action === "login") {
    const parsed = authLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password, rememberMe } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = await createSessionToken(user);
    await storeRefreshToken(refreshToken, user.id, rememberMe);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    setAuthCookies(res, accessToken, refreshToken, rememberMe);
    return res;
  }

  if (action === "signup") {
    const parsed = authSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "staff",
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Account created successfully. Please wait for admin approval before logging in.",
    });
  }

  if (action === "forgot-password") {
    const parsed = authForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${url.origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    console.log(`Password reset URL: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  }

  if (action === "reset-password") {
    const parsed = authResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { token, email, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });
  }

  if (action === "refresh") {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const result = await refreshAccessToken(refreshToken);
    if (!result.success) {
      const res = NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
      clearAuthCookies(res);
      return res;
    }

    const res = NextResponse.json({ success: true, user: result.user });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
