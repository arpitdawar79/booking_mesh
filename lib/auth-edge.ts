import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 8; // 8 hours

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "ekantah-default-secret-change-me",
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.AUTH_REFRESH_SECRET || "ekantah-refresh-secret-change-me",
);

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(
  payload: TokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function createRefreshToken(
  payload: TokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    if (payload.type === "refresh") return null;
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET, {
      clockTolerance: 60,
    });
    if (payload.type !== "refresh") return null;
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(payload),
    createRefreshToken(payload),
  ]);
  return { accessToken, refreshToken };
}

export async function verifySessionToken(
  token: string,
): Promise<TokenPayload | null> {
  return verifyAccessToken(token);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isManagerOrAbove(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}
