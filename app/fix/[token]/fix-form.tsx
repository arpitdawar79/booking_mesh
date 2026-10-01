"use client";

import { Input } from "@/components/ui/form-primitives";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, Loader2, PenLine } from "lucide-react";
import { useEffect, useState } from "react";

interface FieldDef {
  key: string;
  label: string;
  severity: "required" | "soft";
}

interface Payload {
  sheet: string;
  rowId: string;
  status: string;
  fields: Record<string, string>;
  patches: Record<string, { value: string }>;
  missingRequired: string[];
  missingSoft: string[];
  fieldDefs: FieldDef[];
}

const SHEET_LABEL: Record<string, string> = {
  expenses: "Expense",
  payouts: "Payout",
  revenue: "Revenue",
};

function inputProps(key: string) {
  // stayDates is a range ("12th-14th Oct") — a native date input would
  // silently save a single day, truncating the booking to one night.
  if (["date", "dateOfSale"].includes(key)) return { type: "date" };
  if (key === "stayDates") return { placeholder: "e.g. 12th-14th Oct" };
  if (["amount", "revenue"].includes(key)) {
    return { type: "number", inputMode: "decimal" as const };
  }
  if (["rooms", "pax"].includes(key)) {
    return { type: "number", inputMode: "numeric" as const };
  }
  return {};
}

export default function FixForm({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSoft, setShowSoft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/sheet-fix?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "link invalid");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  async function submit() {
    if (!data) return;
    setSaving(true);
    setSubmitError("");
    const res = await fetch("/api/sheet-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, fields: values }),
    });
    const out = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSubmitError(out.error ?? "save failed — try again");
      return;
    }
    if (out.complete) {
      setDone(true);
    } else {
      setData((d) =>
        d
          ? {
              ...d,
              missingRequired: out.stillMissing,
              patches: {
                ...d.patches,
                ...Object.fromEntries(
                  Object.entries(values).map(([k, v]) => [
                    k,
                    { value: v },
                  ]),
                ),
              },
            }
          : d,
      );
      setValues({});
      setSubmitError(
        `saved — still missing: ${out.stillMissing.join(", ")}`,
      );
    }
  }

  const filled = (f: FieldDef) =>
    data?.patches[f.key]?.value ?? data?.fields[f.key];

  const missingReqDefs =
    data?.fieldDefs.filter((f) => data.missingRequired.includes(f.key)) ?? [];
  const missingSoftDefs =
    data?.fieldDefs.filter((f) => data.missingSoft.includes(f.key)) ?? [];

  return (
    <main className="min-h-dvh bg-background flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
            Ekantah · Sheet fix
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
            <p className="text-sm font-medium text-destructive">
              This link is invalid or has expired.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ask for a fresh link in the admin group.
            </p>
          </div>
        )}

        {!error && !data && (
          <div className="space-y-4" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}

        {data && !done && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h1 className="text-lg font-bold text-foreground">
                {SHEET_LABEL[data.sheet] ?? data.sheet} #{data.rowId}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.fieldDefs
                  .filter((f) => filled(f))
                  .map((f) => (
                    <span
                      key={f.key}
                      className="rounded-lg bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {f.label}:{" "}
                      <span className="text-foreground font-medium">
                        {filled(f)}
                      </span>
                    </span>
                  ))}
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.15em] pl-1 flex items-center gap-2">
                <PenLine className="w-3.5 h-3.5" /> Fill what&rsquo;s missing
              </p>
              {missingReqDefs.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  value={values[f.key] ?? ""}
                  onChange={(v) =>
                    setValues((s) => ({ ...s, [f.key]: v }))
                  }
                  onEnter={submit}
                  {...inputProps(f.key)}
                />
              ))}
              {missingReqDefs.length === 0 && (
                <p className="text-sm text-muted-foreground pl-1">
                  No required fields missing 🎉
                </p>
              )}

              {missingSoftDefs.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSoft((s) => !s)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors pl-1"
                  >
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        showSoft && "rotate-180",
                      )}
                    />
                    Optional ({missingSoftDefs.length} more)
                  </button>
                  {showSoft && (
                    <div className="mt-4 space-y-5">
                      {missingSoftDefs.map((f) => (
                        <Input
                          key={f.key}
                          label={f.label}
                          value={values[f.key] ?? ""}
                          onChange={(v) =>
                            setValues((s) => ({ ...s, [f.key]: v }))
                          }
                          onEnter={submit}
                          {...inputProps(f.key)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {submitError && (
              <p role="alert" className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/15 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={saving || Object.keys(values).length === 0}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        )}

        {done && (
          <div role="status" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h1 className="text-lg font-bold text-foreground">
              Done — #{data?.rowId} complete
            </h1>
            <p className="text-sm text-muted-foreground">
              Thanks! This row won&rsquo;t be nagged about again.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
