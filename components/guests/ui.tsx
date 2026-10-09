import type { ReactNode } from "react";
export const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export const primaryClass =
  buttonClass + " bg-primary text-primary-foreground hover:bg-primary/90";
export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium">
      {children}
    </span>
  );
}
export function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-lg border p-3 text-sm ${error ? "border-destructive/30 text-destructive" : "border-border text-muted-foreground"}`}
    >
      {message}
    </p>
  );
}
export function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading guest workspace"
      className="space-y-4"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
export const money = (n: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(n));
export const date = (v: string | null | undefined) =>
  v
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(v))
    : "—";
export async function guestApi<T>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const r = await fetch(
    url,
    body === undefined
      ? { cache: "no-store" }
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await r.json();
  if (!r.ok)
    throw new Error(data.error || "The request could not be completed");
  return data;
}
