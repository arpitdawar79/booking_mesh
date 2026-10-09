"use client";
import { useState } from "react";
import Link from "next/link";
import { buttonClass, primaryClass, inputClass, guestApi, Notice } from "./ui";
interface Preview {
  eligible: number;
  excluded: { id: string; name: string; reason: string }[];
  samples: { id: string; name: string; message: string }[];
}
export function CampaignDraft({
  guestIds,
  initialMessage,
  onClose,
}: {
  guestIds: string[];
  initialMessage?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("Guest comeback"),
    [message, setMessage] = useState(
      initialMessage ||
        "Hi {{first_name}}, we would love to welcome you back to The Stream by Ekantah. Shall we help you plan your next stay?",
    ),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function submit(draft: boolean) {
    setBusy(true);
    setError("");
    try {
      const body = { guestIds, name, message, preview: !draft };
      if (draft) {
        await guestApi("/api/guest-retention", body);
        setSaved(true);
      } else setPreview(await guestApi<Preview>("/api/guest-retention", body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare campaign");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border border-primary/30 bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Prepare a WhatsApp campaign</h2>
        <button className={buttonClass} onClick={onClose}>
          Close
        </button>
      </div>
      {saved ? (
        <Notice message="Campaign draft saved. Review and send it from Marketing." />
      ) : (
        <>
          <label className="block text-sm">
            Campaign name
            <input
              className={inputClass + " mt-1"}
              value={name}
              maxLength={120}
              onChange={(e) => {
                setName(e.target.value);
                setPreview(null);
              }}
            />
          </label>
          <label className="block text-sm">
            Message
            <textarea
              className={inputClass + " mt-1"}
              rows={4}
              maxLength={4000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setPreview(null);
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Personalize with{" "}
            {
              "{{first_name}}, {{name}}, {{tier}}, {{points}}, {{preferred_room}}, {{referral_code}}"
            }
            . Sends respect consent, cooldown, 9 AM–8 PM India time, and a daily
            cap of 50 guest contacts.
          </p>
          {preview && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {preview.eligible} eligible · {preview.excluded.length} excluded
              </p>
              {preview.samples.map((s) => (
                <div key={s.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="mb-1 font-medium">{s.name}</p>
                  <p className="whitespace-pre-wrap">{s.message}</p>
                </div>
              ))}
              {preview.excluded.map((g) => (
                <p key={g.id} className="text-xs text-muted-foreground">
                  {g.name}: {g.reason}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonClass}
              disabled={busy || !name.trim() || !message.trim()}
              onClick={() => submit(false)}
            >
              {busy ? "Preparing…" : "Preview audience"}
            </button>
            <button
              className={primaryClass}
              disabled={busy || !preview?.eligible}
              onClick={() => submit(true)}
            >
              Save draft
            </button>
          </div>
        </>
      )}
      {error && <Notice message={error} error />}
      {saved && (
        <Link href="/dashboard/marketing" className={buttonClass}>
          Open Marketing →
        </Link>
      )}
    </section>
  );
}
