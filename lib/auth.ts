import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const prisma = new PrismaClient();

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

export async function storeRefreshToken(
  token: string,
  userId: string,
  rememberMe: boolean,
): Promise<void> {
  const expiresAt = rememberMe
    ? new Date(Date.now() + REMEMBER_ME_MAX_AGE * 1000)
    : new Date(Date.now() + DEFAULT_REFRESH_MAX_AGE * 1000);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });
}

export async function verifyStoredRefreshToken(
  token: string,
): Promise<{ userId: string } | null> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
  });
  if (!stored) return null;
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    return null;
  }
  return { userId: stored.userId };
}

export async function rotateRefreshToken(
  oldToken: string,
  userId: string,
  rememberMe: boolean,
): Promise<string> {
  await prisma.refreshToken.deleteMany({ where: { token: oldToken } });
  const { refreshToken } = await createSessionToken({
    id: userId,
    email: "",
    name: "",
    role: "staff",
  });
  await storeRefreshToken(refreshToken, userId, rememberMe);
  return refreshToken;
}

export async function clearUserRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function verifySessionToken(
  token: string,
): Promise<TokenPayload | null> {
  return verifyAccessToken(token);
}

export async function getUserFromToken(token: string): Promise<{
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
} | null> {
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  return user;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<
  | {
      success: true;
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string; role: UserRole };
    }
  | { success: false }
> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return { success: false };

  const stored = await verifyStoredRefreshToken(refreshToken);
  if (!stored) return { success: false };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return { success: false };

  // Determine if the old token had a long expiry (rememberMe heuristic: > 14 days)
  // We approximate by checking if the stored expiry is far in the future
  const storedRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    select: { expiresAt: true },
  });
  const rememberMe = storedRecord
    ? storedRecord.expiresAt.getTime() - Date.now() > 14 * 24 * 60 * 60 * 1000
    : true;

  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

  const { accessToken, refreshToken: newRefreshToken } =
    await createSessionToken(user);
  await storeRefreshToken(newRefreshToken, user.id, rememberMe);

  return {
    success: true,
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isManagerOrAbove(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}
