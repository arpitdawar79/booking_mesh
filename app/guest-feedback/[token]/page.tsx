"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
interface LinkData {
  name: string;
  scope: string;
  submitted: boolean;
  googleReviewUrl: string | null;
  preferences: {
    whatsappConsent: boolean;
    emailConsent: boolean;
    doNotContact: boolean;
  } | null;
}
export default function GuestFeedbackPage() {
  const { token } = useParams<{ token: string }>(),
    [data, setData] = useState<LinkData | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [done, setDone] = useState(false);
  const [rating, setRating] = useState(0),
    [comment, setComment] = useState(""),
    [followUp, setFollowUp] = useState(false),
    [preferences, setPreferences] = useState({
      whatsappConsent: false,
      emailConsent: false,
      doNotContact: false,
    });
  useEffect(() => {
    fetch(`/api/guest-feedback/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
        setDone(d.submitted);
        if (d.preferences) setPreferences(d.preferences);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch(`/api/guest-feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          data?.scope === "feedback"
            ? { rating, comment, followUp }
            : preferences,
        ),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="min-h-dvh bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-sm font-semibold text-primary">
          The Stream by Ekantah
        </div>
        <h1 className="text-2xl font-semibold">
          {data?.scope === "preferences"
            ? "Your communication preferences"
            : "How was your stay?"}
        </h1>
        {loading ? (
          <p role="status">Loading your form…</p>
        ) : data ? (
          <>
            <p className="text-muted-foreground">
              Hi {data.name},{" "}
              {data.scope === "feedback"
                ? "your feedback helps our team make every stay better."
                : "choose how you would like to hear from us."}
            </p>
            {done ? (
              <div
                role="status"
                className="rounded-xl border border-border bg-card p-5"
              >
                {data.scope === "feedback"
                  ? "Thank you. Your feedback has been received."
                  : "Your preferences have been saved."}
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="space-y-5 rounded-xl border border-border bg-card p-5"
              >
                {data.scope === "feedback" ? (
                  <>
                    <fieldset>
                      <legend className="mb-3 font-medium">
                        Your overall experience
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label
                            key={n}
                            className={`cursor-pointer rounded-lg border px-4 py-3 ${rating === n ? "border-primary bg-primary/10" : "border-border"}`}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={n}
                              required
                              checked={rating === n}
                              onChange={() => setRating(n)}
                              className="mr-1"
                            />
                            {n}
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        1 = Poor · 5 = Excellent
                      </p>
                    </fieldset>
                    <label className="block text-sm">
                      What should we know?
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={3000}
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-input bg-background p-3"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={followUp}
                        onChange={(e) => setFollowUp(e.target.checked)}
                      />
                      I would like the team to follow up with me
                    </label>
                  </>
                ) : (
                  <>
                    {(
                      [
                        ["whatsappConsent", "WhatsApp offers and updates"],
                        ["emailConsent", "Email offers and updates"],
                        ["doNotContact", "Stop all marketing messages"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={preferences[key]}
                          onChange={(e) =>
                            setPreferences((p) => ({
                              ...p,
                              [key]: e.target.checked,
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Essential booking messages may still be sent.
                    </p>
                  </>
                )}
                <button
                  disabled={saving}
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : data.scope === "feedback"
                      ? "Share feedback"
                      : "Save preferences"}
                </button>
              </form>
            )}
            {data.scope === "feedback" && data.googleReviewUrl && (
              <div className="space-y-2 border-t border-border pt-5">
                <h2 className="font-medium">Share your experience on Google</h2>
                <p className="text-sm text-muted-foreground">
                  You are welcome to leave an honest public review,
                  independently of this private feedback.
                </p>
                <a
                  href={data.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="inline-flex rounded-lg border border-border px-4 py-3 text-sm font-medium"
                >
                  Write a Google review ↗
                </a>
              </div>
            )}
          </>
        ) : null}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
