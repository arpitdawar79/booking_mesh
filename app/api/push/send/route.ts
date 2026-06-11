import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// NOTE: Run `npm install web-push` and generate VAPID keys:
// npx web-push generate-vapid-keys
// Then set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
let webPush: typeof import("web-push") | null = null;
try {
  webPush = require("web-push");
} catch {
  webPush = null;
}

export async function POST(req: NextRequest) {
  if (!webPush) {
    return NextResponse.json(
      { error: "web-push not installed. Run: npm install web-push" },
      { status: 500 },
    );
  }

  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, message, userId } = body;
  if (!title || !message) {
    return NextResponse.json(
      { error: "Missing title or message" },
      { status: 400 },
    );
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@ekantah.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 },
    );
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const where = userId ? { userId } : {};
  const subs = await prisma.pushSubscription.findMany({ where });

  const results = await Promise.all(
    subs.map(
      async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webPush!.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({ title, message }),
          );
          return { ok: true, endpoint: sub.endpoint };
        } catch {
          // Remove invalid subscription
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: sub.endpoint },
          });
          return { ok: false, endpoint: sub.endpoint };
        }
      },
    ),
  );

  return NextResponse.json({ sent: results.length, results });
}
