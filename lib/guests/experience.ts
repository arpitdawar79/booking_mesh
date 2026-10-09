import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../prisma";
import { HttpError } from "../http-error";
export const hashGuestToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function reviewUrl() {
  try {
    const u = new URL(process.env.GOOGLE_REVIEW_URL || "");
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
export async function issueGuestLink(
  guestId: string,
  scope: "feedback" | "preferences",
  bookingId: string | undefined,
  actorId: string,
  origin: string,
) {
  const g = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!g || g.mergedIntoId) throw new HttpError(404, "Guest not found");
  if (scope === "feedback") {
    if (!bookingId) throw new HttpError(400, "Select a completed stay");
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (
      !b ||
      b.guestId !== guestId ||
      b.status !== "completed" ||
      b.checkOutDate > new Date()
    )
      throw new HttpError(400, "Feedback is available after a completed stay");
  }
  const raw = randomBytes(32).toString("hex"),
    expiresAt = new Date(Date.now() + 30 * 86400000);
  await prisma.$transaction(async (tx) => {
    await tx.guestLink.create({
      data: {
        guestId,
        bookingId,
        scope,
        tokenHash: hashGuestToken(raw),
        expiresAt,
      },
    });
    await tx.guestActivity.create({
      data: {
        guestId,
        kind: scope === "feedback" ? "feedback_invitation" : "preferences_link",
        summary:
          scope === "feedback"
            ? "Feedback and independent Google review invitation prepared"
            : "Communication preferences link prepared",
        actorId,
      },
    });
  });
  const base = new URL(process.env.APP_BASE_URL || origin);
  const url = new URL(`/guest-feedback/${raw}`, base).toString();
  const message =
    scope === "feedback"
      ? `Hi {{name}}, thank you for staying at The Stream. Share your private feedback here: ${url}. You can also leave an honest Google review using the link on that page.`
      : `Hi {{name}}, you can update your communication preferences here: ${url}`;
  return { url, expiresAt, message, googleReviewUrl: reviewUrl() };
}
export async function validGuestLink(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new HttpError(404, "Link not found");
  const link = await prisma.guestLink.findUnique({
    where: { tokenHash: hashGuestToken(token) },
    include: { guest: true },
  });
  if (!link || link.expiresAt <= new Date() || link.guest.mergedIntoId)
    throw new HttpError(
      410,
      "This link has expired. Please contact the property for a new link.",
    );
  return link;
}
