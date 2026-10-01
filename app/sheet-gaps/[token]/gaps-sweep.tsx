"use client";

import { Input } from "@/components/ui/form-primitives";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface FieldDef {
  key: string;
  label: string;
  severity: "required" | "soft";
}

interface GapRow {
  id: string;
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
  expenses: "Expenses",
  payouts: "Payouts",
  revenue: "Revenue",
};

const TAG: Record<string, string> = { expenses: "e", payouts: "p", revenue: "r" };

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

export default function GapsSweep({ token }: { token: string }) {
  const [rows, setRows] = useState<GapRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/sheet-gaps?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "link invalid");
        return r.json();
      })
      .then((d) => setRows(d.rows))
      .catch((e) => setError(e.message));
  }, [token]);

  const dirtyIds = useMemo(
    () =>
      Object.entries(values)
        .filter(([, v]) => Object.values(v).some((x) => x.trim()))
        .map(([id]) => id),
    [values],
  );

  const bySheet = useMemo(() => {
    const m = new Map<string, GapRow[]>();
    for (const r of rows ?? []) {
      const list = m.get(r.sheet) ?? [];
      list.push(r);
      m.set(r.sheet, list);
    }
    return m;
  }, [rows]);

  function setVal(rowId: string, field: string, v: string) {
    setValues((s) => ({ ...s, [rowId]: { ...s[rowId], [field]: v } }));
  }

  async function saveAll() {
    setSaving(true);
    setSubmitError("");
    const updates = dirtyIds.map((id) => ({ id, fields: values[id] }));
    const res = await fetch("/api/sheet-gaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, updates }),
    });
    const out = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSubmitError(out.error ?? "save failed — try again");
      return;
    }
    const done = new Set(savedIds);
    for (const result of out.results as {
      id: string;
      stillMissing: string[];
      stillMissingSoft: string[];
    }[]) {
      if (
        result.stillMissing.length === 0 &&
        result.stillMissingSoft.length === 0
      ) {
        done.add(result.id);
      } else {
        setRows(
          (currentRows) =>
            currentRows?.map((row) =>
              row.id === result.id
                ? {
                    ...row,
                    missingRequired: result.stillMissing,
                    missingSoft: result.stillMissingSoft,
                  }
                : row,
            ) ?? null,
        );
      }
    }
    setSavedIds(done);
    setValues({});
  }

  const pending = (rows ?? []).filter((r) => !savedIds.has(r.id));

  return (
    <main className="min-h-dvh bg-background px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
            Ekantah · Sheet gaps sweep
          </p>
          {rows && (
            <p className="text-sm text-muted-foreground mt-2">
              {pending.length} rows with missing fields
            </p>
          )}
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

        {!error && !rows && (
          <div className="space-y-4" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}

        {rows && pending.length === 0 && (
          <div role="status" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h1 className="text-lg font-bold text-foreground">All caught up</h1>
            <p className="text-sm text-muted-foreground">
              Every tracked row has its fields filled.
            </p>
          </div>
        )}

        {rows &&
          [...bySheet.entries()].map(([sheet, list]) => {
            const visible = list.filter((r) => !savedIds.has(r.id));
            if (!visible.length) return null;
            return (
              <section key={sheet} className="mb-8">
                <h2 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.15em] pl-1 mb-3">
                  {SHEET_LABEL[sheet] ?? sheet}
                </h2>
                <div className="space-y-4">
                  {visible.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-border/60 bg-card p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {TAG[row.sheet]}
                          {row.rowId}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {row.fieldDefs
                            .filter(
                              (f) =>
                                row.fields[f.key] || row.patches[f.key]?.value,
                            )
                            .slice(0, 4)
                            .map((f) => (
                              <span
                                key={f.key}
                                className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                              >
                                {f.label}:{" "}
                                <span className="text-foreground">
                                  {row.patches[f.key]?.value ??
                                    row.fields[f.key]}
                                </span>
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                        {row.fieldDefs
                          .filter(
                            (f) =>
                              row.missingRequired.includes(f.key) ||
                              row.missingSoft.includes(f.key),
                          )
                          .map((f) => (
                            <div key={f.key} className="relative">
                              <Input
                                label={
                                  f.severity === "required"
                                    ? `${f.label} *`
                                    : f.label
                                }
                                value={values[row.id]?.[f.key] ?? ""}
                                onChange={(v) => setVal(row.id, f.key, v)}
                                {...inputProps(f.key)}
                              />
                            </div>
                          ))}
                      </div>
                      {row.missingRequired.length > 0 && (
                        <p
                          className={cn(
                            "text-[11px] font-medium pl-1",
                            "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          required: {row.missingRequired.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

        {rows && pending.length > 0 && (
          <div className="sticky bottom-4 mt-6">
            {submitError && (
              <p role="alert" className="mb-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/15 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}
            <button
              type="button"
              onClick={saveAll}
              disabled={saving || dirtyIds.length === 0}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save all ({dirtyIds.length} rows edited)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
