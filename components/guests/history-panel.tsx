import Link from "next/link";
import type { Detail } from "./types";
import { Panel, Badge, money, date } from "./ui";
export function HistoryPanel({ data }: { data: Detail }) {
  return (
    <div className="space-y-5">
      <Panel title="Stays & reservations">
        {data.bookings.length ? (
          <div className="divide-y divide-border">
            {data.bookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/booking/${b.id}`}
                    className="text-sm font-semibold hover:text-primary"
                  >
                    #{b.bookingId} →
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {date(b.checkInDate)} – {date(b.checkOutDate)} ·{" "}
                    {b.nightCount} nights · {b.roomType}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.currency === "INR"
                      ? money(b.totalAmount)
                      : `${b.currency} ${b.totalAmount}`}{" "}
                    total · {b.currency} {b.balanceAmount} balance
                  </p>
                </div>
                <Badge>{b.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No linked reservations yet.
          </p>
        )}
      </Panel>
      <Panel title="Relationship timeline">
        {data.guest.activities.length ? (
          <ol className="space-y-4">
            {data.guest.activities.map((a) => (
              <li key={a.id} className="border-l-2 border-border pl-4">
                <p className="text-sm">{a.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {date(a.createdAt)} · {a.kind.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Profile activity will appear here.
          </p>
        )}
      </Panel>
    </div>
  );
}
