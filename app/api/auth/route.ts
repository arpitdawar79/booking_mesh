import { createSessionToken } from "@/lib/auth";
import { authSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "ekantah2024";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = authSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.logout) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set("session", "", { maxAge: 0, path: "/" });
    return res;
  }

  if (parsed.data.password === DASHBOARD_PASSWORD) {
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
