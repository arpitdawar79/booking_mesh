"use client";
import { LeadLinker } from "@/components/guests/lead-linker";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { GuestProgram } from "@/lib/guests/core";
import type { Offer } from "@/components/guests/types";
import {
  Panel,
  Badge,
  Notice,
  Loading,
  inputClass,
  buttonClass,
  primaryClass,
  guestApi,
  money,
  date,
} from "@/components/guests/ui";
interface HistoryRow {
  id: string;
  bookingId: string;
  name: string;
  status: string;
  guestIds?: string[];
  reason?: string;
}
const fields: [keyof GuestProgram, string][] = [
  ["pointsPer100", "Points per ₹100"],
  ["rupeesPerPoint", "₹ value per point"],
  ["referralPoints", "Referrer bonus points"],
  ["minimumSpend", "Minimum settled spend (₹)"],
  ["expiryDays", "Points expire after (days)"],
  ["maxDiscountPercent", "Maximum discount (%)"],
  ["silverStays", "Silver qualifying stays"],
  ["silverPercent", "Silver discount (%)"],
  ["goldStays", "Gold qualifying stays"],
  ["goldPercent", "Gold discount (%)"],
  ["platinumStays", "Platinum qualifying stays"],
  ["platinumPercent", "Platinum discount (%)"],
  ["winBackDays", "Win-back after (days)"],
  ["secondStayDays", "Second-stay nudge after (days)"],
  ["cooldownDays", "Marketing cooldown (days)"],
];
export default function GuestProgramPage() {
  const [program, setProgram] = useState<GuestProgram | null>(null),
    [offers, setOffers] = useState<Offer[]>([]),
    [canManage, setCanManage] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [history, setHistory] = useState<HistoryRow[]>([]),
    [remaining, setRemaining] = useState(0),
    [selected, setSelected] = useState<string[]>([]);
  const [offer, setOffer] = useState({
    code: "",
    name: "",
    percent: 5,
    maxAmount: 1000,
    minAmount: 1000,
    minStays: 1,
    startsAt: "",
    expiresAt: "",
    maxUses: 100,
    enabled: false,
  });
  const load = () =>
    guestApi<{ program: GuestProgram; offers: Offer[]; canManage: boolean }>(
      "/api/guest-program",
    )
      .then((d) => {
        setProgram(d.program);
        setOffers(d.offers);
        setCanManage(d.canManage);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  async function work(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  async function link(apply: boolean) {
    const d = await guestApi<{ results: HistoryRow[]; remaining: number }>(
      "/api/guests/link-history",
      { apply, bookingIds: apply ? selected : undefined },
    );
    setHistory(d.results);
    setRemaining(d.remaining);
    setSelected([]);
    if (apply)
      setNotice(
        "Selected historical bookings linked. Conflicts remain for review.",
      );
  }
  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/guests"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Guest directory
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Guest program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control rewards, benefits and comeback rules in one place.
        </p>
      </div>
      {error && <Notice message={error} error />}
      {notice && <Notice message={notice} />}
      {!program ? (
        <Loading />
      ) : (
        <>
          <Panel
            title="Loyalty & retention settings"
            action={<Badge>{program.enabled ? "Active" : "Disabled"}</Badge>}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                work(async () => {
                  await guestApi("/api/guest-program", program, "PATCH");
                  setNotice("Guest program settings saved");
                });
              }}
              className="space-y-5"
            >
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  disabled={!canManage}
                  checked={program.enabled}
                  onChange={(e) =>
                    setProgram({ ...program, enabled: e.target.checked })
                  }
                />
                Enable loyalty earning, referral bonuses and booking discounts
              </label>
              <p className="text-xs text-muted-foreground">
                The initial values are proposed rules. Saving with the program
                enabled activates them. Existing earning rates are retained in
                the points history.
              </p>
              <fieldset
                disabled={!canManage || busy}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {fields.map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    {label}
                    <input
                      className={inputClass + " mt-1"}
                      type="number"
                      step={
                        key === "rupeesPerPoint"
                          ? "0.01"
                          : key === "minimumSpend"
                            ? "0.01"
                            : "1"
                      }
                      required
                      value={Number(program[key])}
                      onChange={(e) =>
                        setProgram({
                          ...program,
                          [key]: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
                <label className="block text-sm sm:col-span-2 lg:col-span-3">
                  Included benefits (one per line)
                  <textarea
                    className={inputClass + " mt-1"}
                    rows={3}
                    value={program.benefits.join("\n")}
                    onChange={(e) =>
                      setProgram({
                        ...program,
                        benefits: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
              </fieldset>
              {canManage ? (
                <button className={primaryClass} disabled={busy}>
                  {busy ? "Saving…" : "Save settings"}
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  A manager can change these settings.
                </p>
              )}
            </form>
          </Panel>
          <Panel title="Discount offers">
            <div className="mb-4 space-y-3">
              {offers.length ? (
                offers.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {o.name} · {o.code}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {o.percent}% up to {money(o.maxAmount)} · minimum{" "}
                        {money(o.minAmount)} · {o.minStays} qualifying stay(s)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {date(o.startsAt)} – {date(o.expiresAt)} · {o.maxUses}{" "}
                        total uses · once per guest
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>
                        {new Date(o.expiresAt) < new Date()
                          ? "Expired"
                          : o.enabled
                            ? "Enabled"
                            : "Draft"}
                      </Badge>
                      {canManage && (
                        <button
                          disabled={busy}
                          className={buttonClass}
                          onClick={() =>
                            work(async () => {
                              await guestApi(
                                `/api/guest-program/offers/${o.id}`,
                                { enabled: !o.enabled },
                                "PATCH",
                              );
                              await load();
                              setNotice("Offer updated");
                            })
                          }
                        >
                          {o.enabled ? "Disable" : "Enable"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No offers created yet.
                </p>
              )}
            </div>
            {canManage && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  work(async () => {
                    await guestApi("/api/guest-program", {
                      ...offer,
                      startsAt: new Date(
                        offer.startsAt + "T00:00:00+05:30",
                      ).toISOString(),
                      expiresAt: new Date(
                        offer.expiresAt + "T23:59:59+05:30",
                      ).toISOString(),
                    });
                    await load();
                    setNotice("Offer created");
                  });
                }}
                className="space-y-3 border-t border-border pt-4"
              >
                <h3 className="text-sm font-semibold">Create an offer</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      ["name", "Offer name", "text"],
                      ["code", "Code", "text"],
                      ["percent", "Discount (%)", "number"],
                      ["maxAmount", "Maximum discount (₹)", "number"],
                      ["minAmount", "Minimum booking (₹)", "number"],
                      ["minStays", "Minimum qualifying stays", "number"],
                      ["maxUses", "Maximum uses", "number"],
                      ["startsAt", "Starts on", "date"],
                      ["expiresAt", "Expires on", "date"],
                    ] as const
                  ).map(([key, label, type]) => (
                    <label key={key} className="block text-sm">
                      {label}
                      <input
                        className={inputClass + " mt-1"}
                        type={type}
                        required
                        value={offer[key]}
                        onChange={(e) =>
                          setOffer({
                            ...offer,
                            [key]:
                              type === "number"
                                ? Number(e.target.value)
                                : key === "code"
                                  ? e.target.value.toUpperCase()
                                  : e.target.value,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={offer.enabled}
                    onChange={(e) =>
                      setOffer({ ...offer, enabled: e.target.checked })
                    }
                  />
                  Enable this offer
                </label>
                <button disabled={busy} className={buttonClass}>
                  Create offer
                </button>
              </form>
            )}
          </Panel>
          {canManage && (
            <Panel title="Unify historical records">
              <p className="mb-3 text-sm text-muted-foreground">
                Preview up to 100 unlinked bookings, then select the matches to
                apply. Contact conflicts and missing contact details stay
                untouched.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => work(() => link(false))}
                >
                  Preview historical linking
                </button>
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() =>
                    work(async () => {
                      const d = await guestApi<{ linked: number }>(
                        "/api/guest-retention",
                        { action: "link_leads" },
                      );
                      setNotice(
                        `Linked ${d.linked} existing marketing contacts`,
                      );
                    })
                  }
                >
                  Link marketing contacts
                </button>
              </div>
              {history.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {remaining} booking(s) still unlinked. Resolve conflicts by
                    reviewing the profiles.
                  </p>
                  {history.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={!["match", "new_profile"].includes(b.status)}
                        checked={selected.includes(b.id)}
                        onChange={(e) =>
                          setSelected((p) =>
                            e.target.checked
                              ? [...p, b.id]
                              : p.filter((id) => id !== b.id),
                          )
                        }
                      />
                      <span className="min-w-0">
                        <Link
                          href={`/dashboard/booking/${b.id}`}
                          className="font-medium hover:text-primary"
                        >
                          #{b.bookingId} · {b.name}
                        </Link>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {b.status.replaceAll("_", " ")}
                          {b.reason ? ` · ${b.reason}` : ""}
                        </span>
                        {b.guestIds?.map((id) => (
                          <Link
                            key={id}
                            className="mr-3 text-xs text-primary underline"
                            href={`/dashboard/guests/${id}`}
                          >
                            Review guest
                          </Link>
                        ))}
                      </span>
                    </label>
                  ))}
                  <button
                    className={primaryClass}
                    disabled={busy || !selected.length}
                    onClick={() => work(() => link(true))}
                  >
                    Link {selected.length} selected booking(s)
                  </button>
                </div>
              )}
            </Panel>
          )}
          {canManage && <LeadLinker />}
          <Notice message="Guest program reconciliation runs daily at 6:15 AM India time. Campaigns are prepared as drafts and require staff to send them. Review invitations are independent of feedback scores." />
        </>
      )}
    </div>
  );
}
