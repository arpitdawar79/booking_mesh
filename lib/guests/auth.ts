import { cookies } from "next/headers";
import { verifyAccessToken, verifyRefreshToken } from "../auth-edge";
import { prisma } from "../prisma";
import { HttpError } from "../http-error";

export async function requireGuestStaff(manager = false) {
  const jar = await cookies();
  const access = jar.get("access_token")?.value;
  let payload = access ? await verifyAccessToken(access) : null;
  if (!payload) {
    const refresh = jar.get("refresh_token")?.value;
    const candidate = refresh ? await verifyRefreshToken(refresh) : null;
    const stored =
      refresh && candidate
        ? await prisma.refreshToken.findUnique({ where: { token: refresh } })
        : null;
    if (
      stored &&
      stored.expiresAt > new Date() &&
      stored.userId === candidate?.userId
    )
      payload = candidate;
  }
  if (!payload) throw new HttpError(401, "Please sign in");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!user?.isActive) throw new HttpError(401, "Please sign in");
  if (manager && user.role === "staff")
    throw new HttpError(403, "Manager access required");
  return user;
}
