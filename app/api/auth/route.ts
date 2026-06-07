import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "ekantah2024";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.logout) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set("session", "", { maxAge: 0, path: "/" });
    return res;
  }

  if (body.password === DASHBOARD_PASSWORD) {
    const token = await createSessionToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
