"use client";
import { useState } from "react";
import type { Detail } from "./types";
import {
  Panel,
  Badge,
  Notice,
  inputClass,
  buttonClass,
  guestApi,
  date,
} from "./ui";
interface Invitation {
  url: string;
  expiresAt: string;
  message: string;
  googleReviewUrl: string | null;
}
export function ExperiencePanel({
  data,
  reload,
  onDraft,
}: {
  data: Detail;
  reload: () => void;
  onDraft: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [booking, setBooking] = useState(""),
    [invitation, setInvitation] = useState<Invitation | null>(null),
    [resolution, setResolution] = useState(""),
    [selected, setSelected] = useState("");
  async function invite(scope: "feedback" | "preferences") {
    setBusy(true);
    setError("");
    try {
      setInvitation(
        await guestApi<Invitation>(`/api/guests/${data.guest.id}/experience`, {
          scope,
          bookingId: scope === "feedback" ? booking : undefined,
        }),
      );
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare invitation");
    } finally {
      setBusy(false);
    }
  }
  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await guestApi(
        `/api/guests/${data.guest.id}/experience`,
        { feedbackId: selected, resolution },
        "PATCH",
      );
      setSelected("");
      setResolution("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resolve");
    } finally {
      setBusy(false);
    }
  }
  const completed = data.bookings.filter(
    (b) => b.status === "completed" && new Date(b.checkOutDate) <= new Date(),
  );
  return (
    <div className="space-y-5">
      <Panel title="Feedback & Google reviews">
        <p className="mb-4 text-sm text-muted-foreground">
          Invite guests to share private feedback and an honest Google review
          independently. Invitations do not verify that a review was published.
        </p>
        <label className="block text-sm">
          Completed stay
          <select
            className={inputClass + " mt-1"}
            value={booking}
            onChange={(e) => setBooking(e.target.value)}
          >
            <option value="">Select a stay</option>
            {completed.map((b) => (
              <option key={b.id} value={b.id}>
                #{b.bookingId} · {date(b.checkOutDate)}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={buttonClass}
            disabled={busy || !booking}
            onClick={() => invite("feedback")}
          >
            Prepare feedback invitation
          </button>
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => invite("preferences")}
          >
            Prepare preferences link
          </button>
        </div>
        {invitation && (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Expires {date(invitation.expiresAt)}. This link grants access to
              this guest’s form.
            </p>
            <a
              href={invitation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-sm text-primary underline"
            >
              {invitation.url}
            </a>
            <p className="whitespace-pre-wrap text-sm">{invitation.message}</p>
            {data.canManage && (
              <button
                disabled={!data.marketingEligible}
                className={buttonClass}
                onClick={() => onDraft(invitation.message)}
              >
                Create invitation campaign draft
              </button>
            )}
            {!data.marketingEligible && (
              <p className="text-xs text-muted-foreground">
                WhatsApp campaign unavailable: {data.exclusionReason}
              </p>
            )}
          </div>
        )}
      </Panel>
      <Panel title="Guest feedback">
        {!data.guest.feedback.length ? (
          <p className="text-sm text-muted-foreground">
            No feedback received yet.
          </p>
        ) : (
          <div className="space-y-4">
            {data.guest.feedback.map((f) => (
              <article
                key={f.id}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {f.rating}/5 · {date(f.createdAt)}
                  </p>
                  <Badge>{f.status}</Badge>
                </div>
                {f.comment && (
                  <p className="whitespace-pre-wrap text-sm">{f.comment}</p>
                )}
                {f.followUp && (
                  <p className="text-xs font-medium text-primary">
                    Guest requested follow-up
                  </p>
                )}
                {f.resolution && (
                  <p className="text-xs text-muted-foreground">
                    Resolution: {f.resolution}
                  </p>
                )}
                {f.status === "open" && (
                  <button
                    className={buttonClass}
                    onClick={() => setSelected(f.id)}
                  >
                    Record resolution
                  </button>
                )}
                {selected === f.id && (
                  <form onSubmit={resolve} className="space-y-2">
                    <label className="block text-sm">
                      How was this resolved?
                      <textarea
                        className={inputClass + " mt-1"}
                        rows={3}
                        required
                        minLength={5}
                        maxLength={2000}
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button className={buttonClass} disabled={busy}>
                        Save resolution
                      </button>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setSelected("")}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </Panel>
      {error && <Notice message={error} error />}
    </div>
  );
}
