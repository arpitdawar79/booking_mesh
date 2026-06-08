import type { Boom } from "@hapi/boom";
import type { Booking } from "@prisma/client";
import {
    Browsers,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    makeWASocket,
    useMultiFileAuthState,
    type AnyMessageContent,
} from "@whiskeysockets/baileys";
import fs, { existsSync } from "fs";
import pino from "pino";
import QRCode from "qrcode";
import {
    renderBookingPdfHtml,
    renderSalarySlipPdfHtml,
    type SalarySlipPdfData,
} from "./pdf";
import { prisma } from "./prisma";
import { formatDate } from "./utils";

function getPuppeteerLaunchOptions(): import("puppeteer").LaunchOptions {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === "linux" && existsSync("/usr/bin/chromium-browser")
      ? "/usr/bin/chromium-browser"
      : process.platform === "linux" && existsSync("/usr/bin/chromium")
        ? "/usr/bin/chromium"
        : undefined);

  return {
    headless: true,
    executablePath: executablePath || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  };
}

type WASocket = ReturnType<typeof makeWASocket>;
type WAStatus = "connecting" | "qr" | "open" | "close" | "logged_out";

interface WAState {
  sock: WASocket | null;
  qrCode: string | null;
  status: WAStatus;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  initPromise: Promise<WASocket | null> | null;
  lastError: string | null;
  lastConnectedAt: number | null;
}

const AUTH_FOLDER = process.env.WHATSAPP_AUTH_DIR || "./whatsapp_auth";
const MAX_RECONNECT_DELAY_MS = 30_000;

const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || "silent" });

// Persist the connection state on globalThis so that it survives Next.js
// module re-evaluation, route-bundle isolation and dev hot-reloads. Without
// this the live socket is lost on every refresh and the session "breaks".
const globalForWA = globalThis as unknown as { __waState?: WAState };

function getState(): WAState {
  if (!globalForWA.__waState) {
    globalForWA.__waState = {
      sock: null,
      qrCode: null,
      status: "close",
      reconnectAttempts: 0,
      reconnectTimer: null,
      initPromise: null,
      lastError: null,
      lastConnectedAt: null,
    };
  }
  return globalForWA.__waState;
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] [whatsapp] ${message}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "91" + digits.slice(1);
  }
  if (!digits.startsWith("91")) {
    return "91" + digits;
  }
  return digits;
}

function toJid(phone: string): string {
  return normalizePhone(phone) + "@s.whatsapp.net";
}

function isSocketHealthy(): boolean {
  const { sock } = getState();
  // Baileys 7.x wraps the raw WebSocket in a WebSocketClient that exposes an
  // `isOpen` getter (there is no `readyState` on the wrapper). Relying on
  // `readyState === 1` here always failed, so a live connection was reported
  // as "disconnected". Use `isOpen` and treat the open `connection.update`
  // (status === "open") as the source of truth.
  const ws = sock?.ws as { isOpen?: boolean } | undefined;
  return (
    sock !== null &&
    sock.user !== undefined &&
    (ws?.isOpen === true || getState().status === "open")
  );
}

export function getConnectionStatus() {
  const state = getState();
  const healthy = isSocketHealthy();
  return {
    status: healthy ? "open" : state.status,
    qrCode: state.qrCode,
    isConnected: healthy,
    lastError: state.lastError,
    lastConnectedAt: state.lastConnectedAt,
    user:
      healthy && state.sock?.user
        ? { id: state.sock.user.id, name: state.sock.user.name }
        : undefined,
  };
}

function wipeAuth() {
  try {
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }
  } catch {
    // ignore cleanup errors
  }
}

function scheduleReconnect(delayMs: number) {
  const state = getState();
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
  }
  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = null;
    initWhatsApp().catch((err) => {
      log(`reconnect failed: ${err instanceof Error ? err.message : err}`);
    });
  }, delayMs);
}

function handleClose(code: number | undefined) {
  const state = getState();
  state.sock = null;

  // Device was unlinked from the phone — credentials are invalid forever.
  // This is the ONLY case where wiping auth is correct.
  if (code === DisconnectReason.loggedOut) {
    log("logged out (device unlinked) — clearing auth, fresh QR required");
    wipeAuth();
    state.status = "logged_out";
    state.qrCode = null;
    state.reconnectAttempts = 0;
    scheduleReconnect(1_000);
    return;
  }

  state.status = "close";

  // Expected right after pairing — reconnect immediately, keep auth.
  if (code === DisconnectReason.restartRequired) {
    log("restart required — reconnecting immediately");
    state.reconnectAttempts = 0;
    scheduleReconnect(0);
    return;
  }

  // Another connection took over this session. Do not fight it.
  if (code === DisconnectReason.connectionReplaced) {
    log("connection replaced by another session — not reconnecting");
    return;
  }

  // Transient: connectionLost (408), connectionClosed (428), timedOut,
  // badSession (500), etc. Reconnect with exponential backoff. NEVER wipe auth.
  state.reconnectAttempts++;
  const delay = Math.min(
    MAX_RECONNECT_DELAY_MS,
    1_000 * 2 ** Math.min(state.reconnectAttempts, 5),
  );
  log(
    `connection closed (code=${code ?? "n/a"}) — reconnect #${state.reconnectAttempts} in ${delay}ms`,
  );
  scheduleReconnect(delay);
}

export async function initWhatsApp(): Promise<WASocket | null> {
  const state = getState();

  if (isSocketHealthy()) {
    state.reconnectAttempts = 0;
    return state.sock;
  }

  // Prevent concurrent initializations from spawning duplicate sockets.
  if (state.initPromise) {
    return state.initPromise;
  }

  // A socket already exists and is mid-handshake (connecting / awaiting QR).
  // Spawning another now would trigger a "connectionReplaced" churn. Reuse it;
  // connectTimeoutMs guarantees a close → reconnect if the handshake stalls.
  if (state.sock && (state.status === "connecting" || state.status === "qr")) {
    return state.sock;
  }

  state.initPromise = (async () => {
    const { state: authState, saveCreds } =
      await useMultiFileAuthState(AUTH_FOLDER);

    let version: [number, number, number] | undefined;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      // fall back to the bundled version if the lookup fails offline
    }

    const sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      logger,
      browser: Browsers.ubuntu("Chrome"),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      keepAliveIntervalMs: 30_000,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      retryRequestDelayMs: 1_000,
      // Required so Baileys can resend messages on retry receipts.
      getMessage: async () => undefined,
    });

    state.sock = sock;
    if (state.status !== "logged_out") {
      state.status = "connecting";
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          state.qrCode = await QRCode.toDataURL(qr);
          state.status = "qr";
          state.lastError = null;
        } catch {
          // ignore QR encode errors
        }
      }

      if (connection === "connecting") {
        if (state.status !== "qr") state.status = "connecting";
      }

      if (connection === "open") {
        state.status = "open";
        state.qrCode = null;
        state.reconnectAttempts = 0;
        state.lastError = null;
        state.lastConnectedAt = Date.now();
        log(`connected as ${sock.user?.id ?? "unknown"}`);
      }

      if (connection === "close") {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        state.lastError =
          lastDisconnect?.error instanceof Error
            ? lastDisconnect.error.message
            : null;
        handleClose(code);
      }
    });

    return sock;
  })();

  try {
    return await state.initPromise;
  } finally {
    state.initPromise = null;
  }
}

/**
 * Wait until the socket is connected. Triggers init if needed. Returns false
 * if the connection cannot be established within the timeout or is logged out.
 */
async function waitForConnection(timeoutMs = 25_000): Promise<boolean> {
  const state = getState();
  if (!isSocketHealthy()) {
    await initWhatsApp();
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isSocketHealthy()) return true;
    if (state.status === "logged_out") return false;
    await sleep(500);
  }
  return isSocketHealthy();
}

/**
 * Best-effort check whether a phone number is registered on WhatsApp.
 * Returns the resolved JID (which may differ from the input) or null.
 * Non-fatal: if the lookup itself fails we proceed with the normalized JID.
 */
async function resolveJid(phone: string): Promise<string | null> {
  const state = getState();
  const jid = toJid(phone);
  try {
    const results = await state.sock!.onWhatsApp(jid);
    const match = results?.[0];
    if (match && match.exists) {
      return match.jid;
    }
    return null;
  } catch {
    return jid;
  }
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const connected = await waitForConnection();
  if (!connected) {
    return { success: false, error: "WhatsApp not connected" };
  }

  const state = getState();
  const jid = await resolveJid(phone);
  if (!jid) {
    return { success: false, error: "Number is not registered on WhatsApp" };
  }

  try {
    await state.sock!.presenceSubscribe(jid);
    await state.sock!.sendPresenceUpdate("composing", jid);
    await sleep(400);
    await state.sock!.sendMessage(jid, { text: message });
    await state.sock!.sendPresenceUpdate("paused", jid);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendWhatsAppPdf(
  phone: string,
  pdfBuffer: Buffer,
  filename: string,
  caption?: string,
): Promise<{ success: boolean; error?: string }> {
  const connected = await waitForConnection();
  if (!connected) {
    return { success: false, error: "WhatsApp not connected" };
  }

  const state = getState();
  const jid = await resolveJid(phone);
  if (!jid) {
    return { success: false, error: "Number is not registered on WhatsApp" };
  }

  const messageContent: AnyMessageContent = {
    document: pdfBuffer,
    mimetype: "application/pdf",
    fileName: filename,
    caption: caption || undefined,
  };

  try {
    await state.sock!.sendMessage(jid, messageContent);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Send an image (e.g. a property photo or promotional banner).
 */
export async function sendWhatsAppImage(
  phone: string,
  imageBuffer: Buffer,
  caption?: string,
): Promise<{ success: boolean; error?: string }> {
  const connected = await waitForConnection();
  if (!connected) {
    return { success: false, error: "WhatsApp not connected" };
  }

  const state = getState();
  const jid = await resolveJid(phone);
  if (!jid) {
    return { success: false, error: "Number is not registered on WhatsApp" };
  }

  try {
    await state.sock!.sendMessage(jid, {
      image: imageBuffer,
      caption: caption || undefined,
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function formatWhatsAppMessage(
  type: string,
  booking: Booking,
  customMessage?: string,
): string {
  const total = Number(booking.totalAmount).toLocaleString("en-IN");
  const paid = Number(booking.amountPaidOnline).toLocaleString("en-IN");
  const balance = Number(booking.balanceAmount).toLocaleString("en-IN");
  const checkIn = formatDate(booking.checkInDate);
  const checkOut = formatDate(booking.checkOutDate);

  switch (type) {
    case "booking_confirmation":
      return (
        `*Booking Confirmed* \u2728\n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Your stay at *The Stream by Ekantah* is confirmed!\n\n` +
        `*Booking ID:* #${booking.bookingId}\n` +
        `*Check-in:* ${checkIn} at ${booking.checkInTime}\n` +
        `*Check-out:* ${checkOut} by ${booking.checkOutTime}\n` +
        `*Nights:* ${booking.nightCount}\n` +
        `*Rooms:* ${booking.roomCount} \u00d7 ${booking.roomType}\n` +
        `*Guests:* ${booking.adultCount} adults${booking.childCount ? `, ${booking.childCount} children` : ""}\n\n` +
        `*Payment:*\n` +
        `Total: ${booking.currency} ${total}\n` +
        `Paid Online: ${booking.currency} ${paid}\n` +
        `Balance: ${booking.currency} ${balance}\n` +
        `Status: ${booking.paymentStatus}\n\n` +
        `*Property Address:*\n${booking.propertyAddress}\n\n` +
        `*Contact:*\n${booking.propertyPhone}\n` +
        `Caretaker: ${booking.caretakerNumber} (Ram)\n\n` +
        `*Map:* ${booking.mapLink}\n\n` +
        `We look forward to welcoming you! \n\ud83c\udfe8 The Stream by Ekantah`
      );

    case "cancellation":
      return (
        `*Booking Cancelled* \n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Your booking *#${booking.bookingId}* has been cancelled.\n\n` +
        (customMessage ? `${customMessage}\n\n` : "") +
        `If you have any questions, please contact us:\n` +
        `${booking.propertyPhone}\n${booking.propertyEmail}`
      );

    case "checkout_reminder":
      return (
        `*Checkout Reminder* \n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Thank you for staying with us! Your checkout is by *${booking.checkOutTime}* today.\n\n` +
        `We hope you had a wonderful stay at *The Stream by Ekantah*.\n\n` +
        `*Property:* ${booking.propertyPhone}\n` +
        `*Caretaker:* ${booking.caretakerNumber} (Ram)\n\n` +
        `Safe travels! \u2708\ufe0f`
      );

    case "pre_arrival_reminder":
      return (
        `*Arriving Tomorrow!* \n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Your stay at *The Stream by Ekantah* begins tomorrow!\n\n` +
        `*Check-in:* ${checkIn} at ${booking.checkInTime}\n` +
        `*Booking ID:* #${booking.bookingId}\n\n` +
        `*Caretaker:* ${booking.caretakerNumber} (Ram)\n` +
        `*Parking:* ${booking.parkingDetails}\n\n` +
        `*Map:* ${booking.mapLink}\n\n` +
        `See you soon! \ud83c\udfe0`
      );

    case "thank_you":
      return (
        `*Thank You!* \n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Thank you for choosing *The Stream by Ekantah*.\n\n` +
        `We hope you enjoyed your stay from *${checkIn}* to *${checkOut}*.\n\n` +
        `We'd love to see you again soon!`
      );

    case "refund_credited":
      return (
        `*Refund Credited* \n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Your refund for booking *#${booking.bookingId}* has been processed.\n\n` +
        (customMessage ? `${customMessage}\n\n` : "") +
        `For any queries, contact us at ${booking.propertyEmail}`
      );

    case "notification":
    default:
      return (
        `*Update from The Stream by Ekantah* \n\n` +
        `Dear ${booking.guestFirstName},\n\n` +
        `Regarding your booking *#${booking.bookingId}*:\n\n` +
        (customMessage || "Please find the update details attached.") +
        `\n\n*Contact:* ${booking.propertyPhone}`
      );
  }
}

async function sendWithRetry(
  sendFn: () => Promise<{ success: boolean; error?: string }>,
): Promise<{ success: boolean; error?: string }> {
  let result = await sendFn();
  if (
    !result.success &&
    result.error?.toLowerCase().includes("not connected")
  ) {
    await initWhatsApp();
    // Give the socket a moment to open if it's connecting
    await new Promise((r) => setTimeout(r, 2000));
    result = await sendFn();
  }
  return result;
}

export async function generateBookingPdf(
  type: string,
  booking: Booking,
  customMessage?: string,
): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  const page = await browser.newPage();
  const html = await renderBookingPdfHtml(type, booking, customMessage);
  await page.setContent(html, { waitUntil: "load" });

  // Measure rendered content height so the PDF is one continuous page
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const heightMm = Math.ceil(bodyHeight * 0.264583) + 20; // px → mm (96 dpi) + padding

  const pdfUint8 = await page.pdf({
    width: "210mm",
    height: `${heightMm}mm`,
    printBackground: true,
    margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    preferCSSPageSize: false,
  });
  await browser.close();
  return Buffer.from(pdfUint8);
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });

  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const heightMm = Math.ceil(bodyHeight * 0.264583) + 20;

  const pdfUint8 = await page.pdf({
    width: "210mm",
    height: `${heightMm}mm`,
    printBackground: true,
    margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    preferCSSPageSize: false,
  });
  await browser.close();
  return Buffer.from(pdfUint8);
}

export async function sendBookingWhatsApp(
  type: string,
  booking: Booking,
  options?: { customMessage?: string; sendPdf?: boolean },
): Promise<{ success: boolean; error?: string }> {
  if (!booking.guestPhone) {
    return { success: false, error: "Guest phone number not available" };
  }

  const message = formatWhatsAppMessage(type, booking, options?.customMessage);
  let pdfResult: { success: boolean; error?: string } = { success: false };

  if (options?.sendPdf) {
    try {
      const pdfBuffer = await generateBookingPdf(
        type,
        booking,
        options?.customMessage,
      );
      pdfResult = await sendWithRetry(() =>
        sendWhatsAppPdf(
          booking.guestPhone!,
          pdfBuffer,
          `Booking_${booking.bookingId}.pdf`,
          message,
        ),
      );
    } catch (err) {
      pdfResult = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    pdfResult = await sendWithRetry(() =>
      sendWhatsAppMessage(booking.guestPhone!, message),
    );
  }

  await prisma.whatsAppMessage.create({
    data: {
      bookingId: booking.id,
      type,
      toPhone: booking.guestPhone,
      body: message,
      status: pdfResult.success ? "sent" : "failed",
      error: pdfResult.error || null,
      hasPdf: options?.sendPdf || false,
    },
  });

  return pdfResult;
}

/**
 * Fetch all WhatsApp groups the connected account participates in.
 * Returns an array of { id, name } objects, or null if not connected.
 */
export async function getWhatsAppGroups(): Promise<
  { id: string; name: string }[] | null
> {
  const connected = await waitForConnection();
  if (!connected) {
    return null;
  }

  const state = getState();
  try {
    const groups = await state.sock!.groupFetchAllParticipating();
    return Object.values(groups).map((g: any) => ({
      id: g.id,
      name: g.subject || "Unnamed Group",
    }));
  } catch (err) {
    log(
      `groupFetchAllParticipating failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

/**
 * Send a plain text message to a WhatsApp group JID.
 * `groupJid` can be either the full JID (e.g. 123456789@g.us) or just the
 * numeric part (e.g. 123456789).
 */
export async function sendWhatsAppGroupMessage(
  groupJid: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const connected = await waitForConnection();
  if (!connected) {
    return { success: false, error: "WhatsApp not connected" };
  }

  const state = getState();
  const jid = groupJid.includes("@") ? groupJid : `${groupJid}@g.us`;

  try {
    await state.sock!.sendMessage(jid, { text: message });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Send a PDF document to a WhatsApp group JID.
 * `groupJid` can be either the full JID (e.g. 123456789@g.us) or just the
 * numeric part (e.g. 123456789).
 */
export async function sendWhatsAppGroupPdf(
  groupJid: string,
  pdfBuffer: Buffer,
  filename: string,
  caption?: string,
): Promise<{ success: boolean; error?: string }> {
  const connected = await waitForConnection();
  if (!connected) {
    return { success: false, error: "WhatsApp not connected" };
  }

  const state = getState();
  const jid = groupJid.includes("@") ? groupJid : `${groupJid}@g.us`;

  const messageContent: AnyMessageContent = {
    document: pdfBuffer,
    mimetype: "application/pdf",
    fileName: filename,
    caption: caption || undefined,
  };

  try {
    await state.sock!.sendMessage(jid, messageContent);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Gracefully tears down the live socket WITHOUT wiping the auth state, so the
 * next init reuses the existing session (no QR re-scan). Used by "Restart".
 */
export async function disconnectWhatsApp() {
  const state = getState();
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
  const sock = state.sock;
  if (sock) {
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
      if (typeof (sock as { end?: (err?: Error) => void }).end === "function") {
        (sock as { end: (err?: Error) => void }).end(undefined);
      }
    } catch {
      // ignore
    }
  }
  state.sock = null;
  state.qrCode = null;
  state.reconnectAttempts = 0;
  if (state.status !== "logged_out") {
    state.status = "close";
  }
}

/**
 * Fully logs out: unlinks the device on WhatsApp's side, wipes the local auth
 * state, and re-initializes so a fresh QR is produced. Use this to switch the
 * connected WhatsApp account.
 */
export async function logoutWhatsApp() {
  const state = getState();
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
  const sock = state.sock;
  if (sock) {
    try {
      await sock.logout();
    } catch {
      // ignore — proceed to local cleanup regardless
    }
    try {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
      if (typeof (sock as { end?: (err?: Error) => void }).end === "function") {
        (sock as { end: (err?: Error) => void }).end(undefined);
      }
    } catch {
      // ignore
    }
  }
  state.sock = null;
  state.qrCode = null;
  state.reconnectAttempts = 0;
  state.status = "close";
  wipeAuth();
  await initWhatsApp();
}

export function formatSalarySlipMessage(data: SalarySlipPdfData): string {
  const net = Number(data.netSalary).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const basic = Number(data.basicSalary).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let msg =
    `*Salary Slip — ${data.month} ${data.year}* \u2728\n\n` +
    `Dear ${data.employeeName},\n\n` +
    `Your salary for *${data.month} ${data.year}* has been processed.\n\n` +
    `*Details:*\n` +
    `Designation: ${data.designation}\n` +
    `Days Worked: ${data.daysWorked} / ${data.totalDays}\n` +
    `Basic Salary: INR ${basic}\n`;

  if (Number(data.overtimeAmount) > 0) {
    msg += `Overtime: INR ${Number(data.overtimeAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  }
  if (Number(data.allowance) > 0) {
    msg += `Allowance: INR ${Number(data.allowance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  }
  if (Number(data.deduction) > 0) {
    msg += `Deduction: INR ${Number(data.deduction).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  }

  msg +=
    `\n*Net Salary: INR ${net}*\n` +
    `Payment Method: ${data.paymentMethod.replace("_", " ").toUpperCase()}\n`;

  if (data.paymentDate) {
    msg += `Payment Date: ${data.paymentDate}\n`;
  }

  msg += `\n*${data.employerName}*\n` + `Tirthan Valley, Himachal Pradesh`;

  return msg;
}

export async function generateSalarySlipPdf(
  data: SalarySlipPdfData,
): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  const page = await browser.newPage();
  const html = await renderSalarySlipPdfHtml(data);
  await page.setContent(html, { waitUntil: "load" });

  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const heightMm = Math.ceil(bodyHeight * 0.264583) + 20;

  const pdfUint8 = await page.pdf({
    width: "210mm",
    height: `${heightMm}mm`,
    printBackground: true,
    margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    preferCSSPageSize: false,
  });
  await browser.close();
  return Buffer.from(pdfUint8);
}

export async function sendSalarySlipWhatsApp(
  phone: string,
  data: SalarySlipPdfData,
): Promise<{ success: boolean; error?: string }> {
  if (!phone) {
    return { success: false, error: "Employee phone number not available" };
  }

  const message = formatSalarySlipMessage(data);
  let pdfResult: { success: boolean; error?: string } = { success: false };

  try {
    const pdfBuffer = await generateSalarySlipPdf(data);
    pdfResult = await sendWithRetry(() =>
      sendWhatsAppPdf(
        phone,
        pdfBuffer,
        `Salary_Slip_${data.employeeName.replace(/\s+/g, "_")}_${data.month}_${data.year}.pdf`,
        message,
      ),
    );
  } catch (err) {
    pdfResult = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return pdfResult;
}
