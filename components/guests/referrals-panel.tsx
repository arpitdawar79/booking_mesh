"use client";
import { useState } from "react";
import Link from "next/link";
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
export function ReferralsPanel({
  data,
  reload,
}: {
  data: Detail;
  reload: () => void;
}) {
  const [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  async function attribute(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await guestApi(`/api/guests/${data.guest.id}/referrals`, {
        referralCode: code,
      });
      setCode("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not attribute referral");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <Panel title="Referral program">
        <p className="text-sm text-muted-foreground">Their referral code</p>
        <p className="my-3 break-all font-mono text-lg">
          {data.guest.referralCode}
        </p>
        <button
          className={buttonClass}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(data.guest.referralCode);
              setCopied(true);
            } catch {
              setError(
                "Clipboard unavailable; select and copy the code above.",
              );
            }
          }}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          {data.program.enabled ? data.program.referralPoints : 0} points for
          the referrer after a new guest’s first qualifying, completed, settled
          stay. Self-referrals and repeated attribution are blocked.
        </p>
      </Panel>
      <Panel title="Who referred this guest?">
        {data.guest.referredBy ? (
          <p className="text-sm">
            <Link
              className="text-primary underline"
              href={`/dashboard/guests/${data.guest.referredBy.referrer.id}`}
            >
              {data.guest.referredBy.referrer.name}
            </Link>{" "}
            · {data.guest.referredBy.status}
          </p>
        ) : (
          <form onSubmit={attribute} className="space-y-3">
            <label className="block text-sm">
              Referrer’s code
              <input
                required
                className={inputClass + " mt-1"}
                maxLength={100}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Record before the referred guest’s first reservation.
            </p>
            <button disabled={busy} className={buttonClass}>
              {busy ? "Saving…" : "Attribute referral"}
            </button>
          </form>
        )}
      </Panel>
      <Panel title="Guests they referred">
        {!data.guest.referrals.length ? (
          <p className="text-sm text-muted-foreground">No referrals yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.guest.referrals.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/guests/${r.referredGuest.id}`}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {r.referredGuest.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {date(r.createdAt)} · {r.awardedPoints} points awarded
                  </p>
                </div>
                <Badge>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Panel>
      {error && <Notice message={error} error />}
    </div>
  );
}
