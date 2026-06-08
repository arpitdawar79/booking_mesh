import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const prisma = new PrismaClient();

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
    .setExpirationTime("7d")
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

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isManagerOrAbove(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}
