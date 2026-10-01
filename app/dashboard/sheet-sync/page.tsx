"use client";

import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";
import {
    AlarmClock,
    AlertTriangle,
    CheckCircle2,
    CircleSlash,
    ExternalLink,
    FileSpreadsheet,
    Loader2,
    RefreshCw,
    Search,
    SkipForward,
    Trash2,
    TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RowDrawer, type DashRow } from "./row-drawer";

interface Payload {
  rows: DashRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: { byStatus: Record<string, number>; softGaps: number };
  settings: {
    syncFromDate: string;
    lastSyncAt: string | null;
    lastDigestAt: string | null;
    fileId: string;
    fileUrl: string;
    watchActive: boolean;
    watchExpiry: string | null;
    adminGroupConfigured: boolean;
  };
}

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: React.ElementType }
> = {
  incomplete: {
    label: "Incomplete",
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: AlarmClock,
  },
  nagged: {
    label: "Nagged",
    cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: AlarmClock,
  },
  complete: {
    label: "Complete",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  resolved: {
    label: "Resolved",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  skipped: {
    label: "Skipped",
    cls: "bg-muted/40 text-muted-foreground border-border",
    icon: SkipForward,
  },
  snoozed: {
    label: "Snoozed",
    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: AlarmClock,
  },
  deleted: {
    label: "Deleted",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    icon: Trash2,
  },
  legacy: {
    label: "Legacy",
    cls: "bg-muted/40 text-muted-foreground border-border",
    icon: CircleSlash,
  },
  conflict: {
    label: "Review",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
  possible_duplicate: {
    label: "Possible duplicate",
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: AlertTriangle,
  },
};

const SHEET_META: Record<string, { tag: string; label: string; chip: string }> = {
  expenses: {
    tag: "e",
    label: "Expenses",
    chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  payouts: {
    tag: "p",
    label: "Payouts",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  revenue: {
    tag: "r",
    label: "Revenue",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

const TABS = [
  { key: "attention", label: "Needs attention" },
  { key: "expenses", label: "Expenses" },
  { key: "revenue", label: "Revenue" },
  { key: "payouts", label: "Payouts" },
  { key: "all", label: "All rows" },
];

const STATUS_FILTERS = [
  "",
  "incomplete",
  "nagged",
  "snoozed",
  "conflict",
  "complete",
  "resolved",
  "skipped",
  "deleted",
  "legacy",
];

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export default function SheetSyncPage() {
  const { success: toastOk, error: toastErr } = useToast();
  const [data, setData] = useState<Payload | null>(null);
  const [tab, setTab] = useState("attention");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [cutoff, setCutoff] = useState("");
  const [savingCutoff, setSavingCutoff] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [openRow, setOpenRow] = useState<DashRow | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [qDebounced, setQDebounced] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (status) params.set("status", status);
    if (qDebounced) params.set("q", qDebounced);
    if (tab === "attention") params.set("queue", "attention");
    else if (tab !== "all") params.set("sheet", tab);
    const res = await fetch(`/api/sheet-sync?${params}`);
    if (!res.ok) {
      setLoadFailed(true);
      return;
    }
    setLoadFailed(false);
    const d = await res.json();
    setData(d);
    if (!cutoff && d.settings?.syncFromDate) setCutoff(d.settings.syncFromDate);
  }, [page, status, tab, qDebounced, cutoff]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQDebounced(q.trim());
      setPage(1);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [q]);

  async function syncNow() {
    setSyncing(true);
    const res = await fetch("/api/sync/sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wait: true }),
    });
    setSyncing(false);
    if (res.ok) {
      toastOk("Sync finished");
      await load();
    } else {
      toastErr("Sync failed");
    }
  }

  async function saveCutoff() {
    setSavingCutoff(true);
    const res = await fetch("/api/sheet-sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syncFromDate: cutoff }),
    });
    setSavingCutoff(false);
    if (res.ok) toastOk("Cutoff saved");
    else toastErr("Invalid date");
  }

  const st = data?.stats?.byStatus ?? {};
  const tracked = (st.complete ?? 0) + (st.resolved ?? 0);
  const needsWork =
    (st.incomplete ?? 0) +
    (st.nagged ?? 0) +
    (st.snoozed ?? 0) +
    (st.conflict ?? 0) +
    (st.possible_duplicate ?? 0);
  const pct =
    tracked + needsWork > 0
      ? Math.round((tracked / (tracked + needsWork)) * 100)
      : 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Sheet Sync
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Last sync: {fmt(data?.settings?.lastSyncAt ?? null)} · Last digest:{" "}
            {fmt(data?.settings?.lastDigestAt ?? null)} ·{" "}
            {data?.settings?.watchActive
              ? `watch live until ${fmt(data.settings.watchExpiry ?? null)}`
              : "watch inactive"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.settings?.fileUrl && (
            <a
              href={data.settings.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border/60 bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open sheet
            </a>
          )}
          <button
            onClick={syncNow}
            disabled={syncing}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MagicCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Complete
          </p>
          <p className="text-2xl font-black text-foreground mt-1">{pct}%</p>
          <p className="text-[11px] text-muted-foreground">
            {tracked} of {tracked + needsWork} tracked rows
          </p>
        </MagicCard>
        <MagicCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Needs work
          </p>
          <p className="text-2xl font-black text-amber-500 mt-1">{needsWork}</p>
          <p className="text-[11px] text-muted-foreground">
            incomplete + nagged + review
          </p>
        </MagicCard>
        <MagicCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Soft gaps
          </p>
          <p className="text-2xl font-black text-foreground mt-1">
            {data?.stats?.softGaps ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">
            optional fields missing
          </p>
        </MagicCard>
        <MagicCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sync from date
          </p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="date"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              className="rounded-lg border border-border/60 bg-muted/15 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Sync from date"
            />
            <button
              onClick={saveCutoff}
              disabled={savingCutoff}
              className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50 transition"
            >
              {savingCutoff ? "…" : "Save"}
            </button>
          </div>
        </MagicCard>
      </div>

      {data && !data.settings?.adminGroupConfigured && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          ADMIN_GROUP_JID is not configured — digests and commands won&rsquo;t
          work until it&rsquo;s set.
        </p>
      )}

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Row views"
          className="flex gap-1 rounded-xl border border-border/60 bg-card p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search e182, guest, particular…"
            aria-label="Search rows"
            className="w-full rounded-xl border border-border/60 bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Status chips (secondary filter) */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-bold transition border",
              status === s
                ? "bg-primary/10 text-primary border-primary/25"
                : "bg-card text-muted-foreground border-border/60 hover:text-foreground",
            )}
          >
            {s ? (STATUS_META[s]?.label ?? s) : "Any status"}
          </button>
        ))}
      </div>

      {/* Rows */}
      <MagicCard className="overflow-hidden">
        {loadFailed ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Couldn&rsquo;t load sync data — you may need to log in again.
          </div>
        ) : !data ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.rows.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
            <p className="text-sm font-medium text-foreground mt-2">
              {tab === "attention" ? "Nothing needs attention" : "No rows match"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === "attention"
                ? "Every tracked row is complete or handled."
                : "Try another tab or clear the search."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40" role="list">
            {data.rows.map((row) => {
              const meta = STATUS_META[row.status] ?? STATUS_META.incomplete;
              const Icon = meta.icon;
              const sm = SHEET_META[row.sheet];
              const f = {
                ...row.rawJson,
                ...Object.fromEntries(
                  Object.entries(row.patches ?? {}).map(([key, patch]) => [
                    key,
                    patch.value,
                  ]),
                ),
              };
              return (
                <li key={row.id}>
                  <button
                    onClick={() => setOpenRow(row)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-black shrink-0 tabular-nums",
                        sm?.chip,
                      )}
                    >
                      {sm?.tag}
                      {row.rowId}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground/70 w-8 shrink-0 hidden sm:inline">
                      #{row.rowNum}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {[
                          f.property,
                          f.particular ?? f.type,
                          f.guestName,
                          f.amount ?? f.revenue
                            ? `₹${f.amount ?? f.revenue}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "(empty row)"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {row.importError && `import: ${row.importError}`}
                        {!row.importError && row.missingRequired.length > 0 &&
                          `missing: ${row.missingRequired.join(", ")}`}
                        {!row.importError &&
                          row.missingRequired.length === 0 &&
                          row.missingSoft.length > 0 &&
                          `soft gaps: ${row.missingSoft.join(", ")}`}
                        {!row.importError &&
                          row.missingRequired.length === 0 &&
                          row.missingSoft.length === 0 &&
                          `seen ${fmt(row.lastSeenAt)}`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold shrink-0",
                        meta.cls,
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.label}
                      {row.nagCount > 0 &&
                        (row.status === "nagged" || row.status === "snoozed") &&
                        ` ×${row.nagCount}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </MagicCard>

      {data && data.total > data.pageSize && (
        <Pagination
          page={data.page}
          total={data.total}
          totalPages={Math.ceil(data.total / data.pageSize)}
          onPageChange={setPage}
        />
      )}

      <RowDrawer
        row={openRow}
        fileUrl={data?.settings?.fileUrl ?? "#"}
        onClose={() => setOpenRow(null)}
        onSaved={(fresh) => {
          setOpenRow(fresh);
          setData((d) =>
            d
              ? {
                  ...d,
                  rows: d.rows.map((r) => (r.id === fresh.id ? fresh : r)),
                }
              : d,
          );
          void load();
        }}
      />
    </div>
  );
}
