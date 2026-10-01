import { runJob } from "@/lib/cron-jobs";
import { verifyRefreshToken, verifySessionToken } from "@/lib/auth-edge";
import { prisma } from "@/lib/prisma";
import { APP_CONFIG_KEYS } from "@/lib/sheet-sync/config";
import { runSheetSyncJob } from "@/lib/sheet-sync/job";
import { syncRequestSchema } from "@/lib/sheet-sync/validation";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sheet Referee sync endpoint — three callers:
 *  1. Drive webhook: POST with x-goog-channel-* headers (validated against
 *     the stored watch channel id)
 *  2. Cron/manual service: POST with x-sync-secret header
 *  3. Admin UI: POST with a valid admin session cookie
 */
export async function POST(req: NextRequest) {
  const googChannel = req.headers.get("x-goog-channel-id");
  const googState = req.headers.get("x-goog-resource-state");

  if (googChannel) {
    const [channel, resource, token] = await Promise.all([
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.watchChannelId },
      }),
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.watchResourceId },
      }),
      prisma.appConfig.findUnique({
        where: { key: APP_CONFIG_KEYS.watchToken },
      }),
    ]);
    const tokenMatch =
      channel?.value === googChannel &&
      token?.value === req.headers.get("x-goog-channel-token") &&
      !!token?.value;
    // The `sync` handshake can arrive before resourceId is persisted —
    // ack it on channel+token; real notifications need the full triple.
    if (googState === "sync") {
      return tokenMatch
        ? new NextResponse(null, { status: 200 })
        : NextResponse.json({ error: "Unknown channel" }, { status: 401 });
    }
    const validWebhook =
      tokenMatch && resource?.value === req.headers.get("x-goog-resource-id");
    if (!validWebhook) {
      return NextResponse.json({ error: "Unknown channel" }, { status: 401 });
    }

    // Drive fires a push per change — debounce bursts of cell edits.
    const lastSync = await prisma.appConfig.findUnique({
      where: { key: APP_CONFIG_KEYS.lastSyncAt },
    });
    const lastMs = lastSync ? new Date(lastSync.value).getTime() : 0;
    if (Date.now() - lastMs < 2 * 60 * 1000) {
      return NextResponse.json({ ok: true, via: "webhook", debounced: true });
    }

    runJob("sheet-sync", async (log) => {
      await runSheetSyncJob(log);
    }, "schedule").catch(() => {});
    return NextResponse.json({ ok: true, via: "webhook" });
  }

  const secret = req.headers.get("x-sync-secret");
  const session = req.cookies.get("access_token")?.value;
  const refresh = req.cookies.get("refresh_token")?.value;
  const accessPayload = session ? await verifySessionToken(session) : null;
  const refreshPayload = refresh ? await verifyRefreshToken(refresh) : null;
  const isAdmin =
    accessPayload?.role === "admin" || refreshPayload?.role === "admin";
  const hasSecret =
    !!process.env.SYNC_SECRET && secret === process.env.SYNC_SECRET;

  if (!isAdmin && !hasSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = syncRequestSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 422 });
  }
  const { dryRun, wait } = parsed.data;

  if (wait) {
    // synchronous path (used by scripts/tests)
    const report = await runSheetSyncJob(
      (l, m) => console.log(`[${l}] ${m}`),
      { dryRun },
    );
    return NextResponse.json({ ok: true, report });
  }

  runJob("sheet-sync", async (log) => {
    await runSheetSyncJob(log, { dryRun });
  }, "manual").catch(() => {});

  return NextResponse.json({ ok: true, dryRun });
}
