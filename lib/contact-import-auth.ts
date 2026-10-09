import { verifyRefreshToken, verifySessionToken } from "./auth-edge";
import { HttpError } from "./http-error";
import type { NextRequest } from "next/server";

export async function requireContactImportSession(request: NextRequest) {
  const access = request.cookies.get("access_token")?.value;
  const accessPayload = access ? await verifySessionToken(access) : null;
  if (accessPayload) return accessPayload;
  const refresh = request.cookies.get("refresh_token")?.value;
  const refreshPayload = refresh ? await verifyRefreshToken(refresh) : null;
  if (!refreshPayload) throw new HttpError(401, "Not authenticated");
  return refreshPayload;
}
