import { PrismaClient } from "@prisma/client";
import {
  createSessionToken,
  DEFAULT_REFRESH_MAX_AGE,
  REMEMBER_ME_MAX_AGE,
  verifyAccessToken,
  verifyRefreshToken,
} from "./auth-edge";
export {
  ACCESS_TOKEN_MAX_AGE, createAccessToken,
  createRefreshToken,
  createSessionToken, DEFAULT_REFRESH_MAX_AGE, hashPassword, isAdmin,
  isManagerOrAbove,
  REMEMBER_ME_MAX_AGE, verifyAccessToken, verifyPassword, verifyRefreshToken,
  verifySessionToken
} from "./auth-edge";
export type { TokenPayload } from "./auth-edge";

const prisma = new PrismaClient();

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

export async function getUserFromToken(token: string): Promise<{
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
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

export async function refreshAccessToken(refreshToken: string): Promise<
  | {
      success: true;
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "manager" | "staff";
      };
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
