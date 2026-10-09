"use client";
import { useState } from "react";
import type { Detail } from "./types";
import {
  Panel,
  Badge,
  Notice,
  inputClass,
  buttonClass,
  primaryClass,
  guestApi,
  money,
  date,
} from "./ui";
export function RewardsPanel({
  data,
  reload,
}: {
  data: Detail;
  reload: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [bookingId, setBookingId] = useState(""),
    [mode, setMode] = useState("points"),
    [points, setPoints] = useState(0),
    [code, setCode] = useState(""),
    [adjustment, setAdjustment] = useState(0),
    [reason, setReason] = useState("");
  const bookings = data.bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(b.checkInDate) > new Date() &&
      b.currency === "INR",
  );
  async function post(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await guestApi(`/api/guests/${data.guest.id}/rewards`, body);
      setNotice("Rewards updated");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update rewards");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <Panel
        title="Loyalty wallet"
        action={
          <Badge>
            {data.program.enabled ? "Program active" : "Program disabled"}
          </Badge>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">
              {data.wallet.toLocaleString("en-IN")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                points
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Redemption value:{" "}
              {money(Math.max(0, data.wallet) * data.program.rupeesPerPoint)} ·{" "}
              {data.expiringPoints} points expire within 30 days
            </p>
          </div>
          {data.canManage && (
            <button
              disabled={busy}
              className={buttonClass}
              onClick={() => post({ action: "reconcile" })}
            >
              Reconcile stays
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{data.tier.name}</Badge>
          <Badge>
            {data.program.enabled ? data.tier.percent : 0}% tier discount
          </Badge>
          {data.program.benefits.map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Benefits depend on availability. Points earn after completed, settled
          INR stays; refunds can reverse earnings.
        </p>
      </Panel>
      {data.canManage && (
        <Panel title="Apply a booking benefit">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post({
                bookingId,
                points: mode === "points" ? points : 0,
                tierBenefit: mode === "tier",
                offerCode: mode === "offer" ? code : undefined,
                idempotencyKey: crypto.randomUUID(),
              });
            }}
            className="space-y-3"
          >
            <label className="block text-sm">
              Upcoming booking
              <select
                className={inputClass + " mt-1"}
                required
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              >
                <option value="">Select booking</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.bookingId} · {date(b.checkInDate)} ·{" "}
                    {money(b.totalAmount)}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Benefit
                <select
                  className={inputClass + " mt-1"}
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="points">Use loyalty points</option>
                  <option value="tier">Use tier discount</option>
                  <option value="offer">Use an offer code</option>
                </select>
              </label>
              {mode === "points" ? (
                <label className="block text-sm">
                  Points
                  <input
                    className={inputClass + " mt-1"}
                    type="number"
                    min={1}
                    max={Math.max(0, data.wallet)}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                  />
                </label>
              ) : mode === "offer" ? (
                <label className="block text-sm">
                  Offer code
                  <input
                    className={inputClass + " mt-1"}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </label>
              ) : (
                <p className="self-end py-2 text-sm">
                  Eligible tier discount: {data.tier.percent}%
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              One benefit per booking; capped at{" "}
              {data.program.maxDiscountPercent}% and the unpaid balance. The
              booking total and taxes update when applied.
            </p>
            <button
              className={primaryClass}
              disabled={busy || !data.program.enabled || !bookingId}
            >
              Apply benefit
            </button>
          </form>
        </Panel>
      )}
      {data.canManage && data.guest.redemptions.some((r) => !r.reversedAt) && (
        <Panel title="Applied booking benefits">
          <div className="space-y-3">
            {data.guest.redemptions
              .filter((r) => !r.reversedAt)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <span className="text-sm">
                    {money(r.amount)} · {r.points} points ·{" "}
                    {data.bookings.find((b) => b.id === r.bookingId)?.bookingId}
                  </span>
                  <button
                    className={buttonClass}
                    disabled={
                      busy ||
                      data.bookings.find((b) => b.id === r.bookingId)
                        ?.status === "completed"
                    }
                    onClick={() =>
                      post({
                        action: "reverse_benefit",
                        bookingId: r.bookingId,
                      })
                    }
                  >
                    Reverse benefit
                  </button>
                </div>
              ))}
          </div>
        </Panel>
      )}
      <Panel title="Points history">
        {!data.ledger.length ? (
          <p className="text-sm text-muted-foreground">
            No points transactions yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.ledger.map((r) => (
              <div key={r.id} className="flex justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {date(r.createdAt)} · {r.kind.replaceAll("_", " ")}
                    {r.expiresAt ? ` · expires ${date(r.expiresAt)}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {r.points > 0 ? "+" : ""}
                  {r.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      {data.canManage && (
        <Panel title="Staff adjustment">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post({
                action: "adjust",
                points: adjustment,
                reason,
                idempotencyKey: crypto.randomUUID(),
              });
            }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <label className="text-sm">
              Points (+ or −)
              <input
                className={inputClass + " mt-1"}
                type="number"
                min={-100000}
                max={100000}
                required
                value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value))}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Reason
              <input
                className={inputClass + " mt-1"}
                required
                minLength={5}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button
              className={buttonClass + " sm:col-span-3"}
              disabled={busy || !adjustment}
            >
              Record adjustment
            </button>
          </form>
        </Panel>
      )}
      {error && <Notice error message={error} />}{" "}
      {notice && <Notice message={notice} />}
    </div>
  );
}
