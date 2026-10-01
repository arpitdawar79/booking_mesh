"use client";

import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { SHEET_STREAMS } from "@/lib/sheet-sync/config";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface DashRow {
  id: string;
  sheet: string;
  rowId: string;
  rowNum: number;
  status: string;
  missingRequired: string[];
  missingSoft: string[];
  parsedDate: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastNaggedAt: string | null;
  nagCount: number;
  snoozedUntil: string | null;
  resolvedVia: string | null;
  resolvedAt: string | null;
  linkedRecordId: string | null;
  linkedRecordType: string | null;
  importError: string | null;
  conflictJson: {
    reason?: string;
    previous?: Record<string, string>;
    current?: Record<string, string>;
    candidates?: { type: string; id: string }[];
    duplicateOfRow?: { id: string; rowId: string };
  } | null;
  rawJson: Record<string, string>;
  patches: Record<string, { value: string; source: string }> | null;
}

const colLetter = (idx: number) => String.fromCharCode(65 + idx);

function fmt(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function effective(row: DashRow): Record<string, string> {
  return {
    ...row.rawJson,
    ...Object.fromEntries(
      Object.entries(row.patches ?? {}).map(([k, p]) => [k, p.value]),
    ),
  };
}

function inputType(key: string): string {
  if (["amount", "revenue"].includes(key)) return "number";
  if (["rooms", "pax"].includes(key)) return "number";
  return "text";
}

const SOURCE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  form: "fix link",
  dashboard: "dashboard",
};

export function RowDrawer({
  row,
  onClose,
  onSaved,
  fileUrl,
}: {
  row: DashRow | null;
  onClose: () => void;
  onSaved: (row: DashRow) => void;
  fileUrl: string;
}) {
  const { success: toastOk, error: toastErr } = useToast();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const def = useMemo(
    () => SHEET_STREAMS.find((s) => s.key === row?.sheet),
    [row?.sheet],
  );

  useEffect(() => {
    setDraft(row ? effective(row) : {});
  }, [row]);

  if (!row || !def) {
    return (
      <SlideOver
        open={!!row}
        onClose={onClose}
        title="Row"
      >
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </SlideOver>
    );
  }

  const tag = `${{ expenses: "e", payouts: "p", revenue: "r" }[row.sheet]}${row.rowId}`;
  const editable = !["legacy", "deleted"].includes(row.status);
  const missingReq = new Set(row.missingRequired);
  const missingSoft = new Set(row.missingSoft);
  const patchedKeys = new Set(Object.keys(row.patches ?? {}));

  async function call(body: Record<string, unknown>, verb: string) {
    if (!row) return;
    setBusy(verb);
    try {
      const res = await fetch("/api/sheet-sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, ...body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toastErr(data?.error ?? `${verb} failed`);
        return;
      }
      if (data.row) onSaved(data.row);
      toastOk(`${verb} done`);
      if (data.patch?.rejectedStatus) {
        toastErr(`row is ${data.patch.rejectedStatus} — not editable`);
      }
    } finally {
      setBusy(null);
    }
  }

  const dirty = def.fields.some(
    (f) => (draft[f.key] ?? "") !== (effective(row)[f.key] ?? ""),
  );

  return (
    <SlideOver open onClose={onClose} title={`${tag} · ${def.tabName}`} size="lg">
      <div className="space-y-5">
        {/* Identity */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">
            Row <span className="font-bold text-foreground">{row.rowNum}</span>{" "}
            in the sheet · status{" "}
            <span className="font-bold text-foreground">{row.status}</span>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Open sheet <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {row.importError && (
          <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
            Import failed: {row.importError}
          </p>
        )}
        {row.status === "conflict" && row.conflictJson && (
          <div className="text-xs rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-1">
            <p className="font-bold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {(row.conflictJson.reason ?? "needs review").toString()}
            </p>
            <p className="text-muted-foreground">
              The sheet no longer matches the imported record. Pick Accept or
              Keep below.
            </p>
          </div>
        )}
        {row.status === "possible_duplicate" && row.conflictJson && (
          <div className="text-xs rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-1">
            <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Possible duplicate — {row.conflictJson.reason}
            </p>
            <p className="text-muted-foreground">
              {row.conflictJson.duplicateOfRow
                ? `Matches sheet row ${
                    { expenses: "e", revenue: "r", payouts: "p" }[row.sheet]
                  }${row.conflictJson.duplicateOfRow.rowId} — same date, amount and name.`
                : "Matches an existing record in the app."}{" "}
              Link it to avoid double-entry, or import it anyway.
            </p>
          </div>
        )}
        {row.linkedRecordId && (
          <div className="flex items-center gap-2 text-xs rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-600 dark:text-emerald-400">
            <Link2 className="w-3.5 h-3.5" />
            Linked to{" "}
            <span className="font-bold">
              {row.linkedRecordType?.replace("_", " ")}
            </span>
            <code className="text-[10px] opacity-70">{row.linkedRecordId}</code>
          </div>
        )}

        {/* Fields — same order + labels as the sheet columns */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Sheet fields
          </p>
          {def.fields.map((f) => {
            const isReqMissing = missingReq.has(f.key);
            const isSoftMissing = missingSoft.has(f.key);
            const patched = patchedKeys.has(f.key);
            const source = row.patches?.[f.key]?.source;
            return (
              <div key={f.key}>
                <label
                  htmlFor={`f-${f.key}`}
                  className={cn(
                    "flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-1",
                    isReqMissing
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-muted/60 font-black">
                    {colLetter(f.col)}
                  </span>
                  {f.label}
                  {isReqMissing && <span className="normal-case">· missing</span>}
                  {isSoftMissing && (
                    <span className="normal-case text-muted-foreground/70">
                      · optional
                    </span>
                  )}
                  {patched && source && (
                    <span className="ml-auto normal-case font-semibold text-primary/80">
                      via {SOURCE_LABEL[source] ?? source}
                    </span>
                  )}
                </label>
                <input
                  id={`f-${f.key}`}
                  type={inputType(f.key)}
                  inputMode={
                    f.key === "amount" || f.key === "revenue"
                      ? "decimal"
                      : f.key === "rooms" || f.key === "pax"
                        ? "numeric"
                        : undefined
                  }
                  disabled={!editable}
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  placeholder={
                    f.key === "stayDates" ? "e.g. 12th-14th Oct" : undefined
                  }
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-sm bg-muted/15 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50",
                    isReqMissing
                      ? "border-amber-500/40 ring-1 ring-amber-500/20"
                      : "border-border/60",
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              disabled={!editable || !dirty || busy !== null}
              onClick={() =>
                call(
                  {
                    fields: Object.fromEntries(
                      def.fields
                        .map((f) => [
                          f.key,
                          (draft[f.key] ?? "").trim(),
                        ])
                        .filter(
                          ([k, v]) =>
                            v !== (effective(row)[k] ?? "") && v !== "",
                        ),
                    ),
                  },
                  "Save",
                )
              }
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {busy === "Save" && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {row.status === "conflict" && (
              <>
                <ActionBtn label="Accept sheet values" busy={busy === "accept"} onClick={() => call({ action: "accept" }, "Accept")} />
                <ActionBtn label="Keep app record" busy={busy === "keep"} onClick={() => call({ action: "keep" }, "Keep")} />
                <ActionBtn label="Unlink record" busy={busy === "unlink"} onClick={() => call({ action: "unlink" }, "Unlink")} />
              </>
            )}
            {row.status === "possible_duplicate" && (
              <>
                <ActionBtn
                  label="Link to existing — don't create"
                  busy={busy === "link"}
                  onClick={() => call({ action: "link" }, "Link")}
                />
                <ActionBtn
                  label="Not a duplicate — import"
                  busy={busy === "import"}
                  onClick={() => call({ action: "import" }, "Import")}
                />
              </>
            )}
            {["incomplete", "nagged"].includes(row.status) && (
              <>
                <ActionBtn label="Skip — stop nags" busy={busy === "skip"} onClick={() => call({ action: "skip" }, "Skip")} />
                <ActionBtn label="Snooze 3d" busy={busy === "snooze"} onClick={() => call({ action: "snooze", days: 3 }, "Snooze")} />
              </>
            )}
            {(row.status === "skipped" || row.status === "deleted") && (
              <ActionBtn label="Restore tracking" busy={busy === "restore"} onClick={() => call({ action: "restore" }, "Restore")} />
            )}
            {row.linkedRecordId && row.status !== "conflict" && (
              <ActionBtn label="Unlink record" busy={busy === "unlink"} onClick={() => call({ action: "unlink" }, "Unlink")} />
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border/50 divide-y divide-border/40 text-xs">
          <TimelineRow label="First seen" value={fmt(row.firstSeenAt)} />
          <TimelineRow label="Last seen in sheet" value={fmt(row.lastSeenAt)} />
          <TimelineRow
            label="Nagged"
            value={
              row.nagCount
                ? `${row.nagCount}× · last ${fmt(row.lastNaggedAt)}`
                : "never"
            }
          />
          {row.snoozedUntil && (
            <TimelineRow label="Snoozed until" value={fmt(row.snoozedUntil)} />
          )}
          {row.resolvedAt && (
            <TimelineRow
              label="Resolved"
              value={`${fmt(row.resolvedAt)} via ${SOURCE_LABEL[row.resolvedVia ?? ""] ?? row.resolvedVia}`}
            />
          )}
          {row.parsedDate && (
            <TimelineRow
              label="Parsed date"
              value={new Date(row.parsedDate).toISOString().slice(0, 10)}
            />
          )}
        </div>
      </div>
    </SlideOver>
  );
}

function ActionBtn({
  label,
  onClick,
  busy,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50 transition flex items-center gap-1.5"
    >
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 opacity-40" />}
      {label}
    </button>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
