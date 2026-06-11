"use client";

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useHaptic } from "@/lib/pwa-hooks";
import { formatDate } from "@/lib/utils";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Loader2,
    Play,
    RefreshCw,
    Terminal,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CronJobDef {
  name: string;
  schedule: string;
  timezone: string;
  description: string;
  label: string;
  latestRun: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    triggeredBy: string;
  } | null;
  stats: { success: number; failed: number; total: number };
}

interface CronRunItem {
  id: string;
  jobName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  logs: string | null;
  error: string | null;
  triggeredBy: string;
}

interface HistoryResponse {
  runs: CronRunItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function statusBadge(status: string) {
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Success
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
          <Loader2 className="w-3 h-3 animate-spin" /> Running
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {status}
        </span>
      );
  }
}

function formatDuration(ms: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function CronsPage() {
  const haptic = useHaptic();
  const [jobs, setJobs] = useState<CronJobDef[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [detailRun, setDetailRun] = useState<CronRunItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/crons");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to load cron jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (selectedJob) params.set("jobName", selectedJob);
      if (selectedStatus) params.set("status", selectedStatus);
      const res = await fetch(`/api/crons/history?${params.toString()}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load cron history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [page, selectedJob, selectedStatus]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTrigger = async (name: string) => {
    haptic("medium");
    setTriggering(name);
    try {
      await fetch("/api/crons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setTimeout(() => {
        fetchJobs();
        fetchHistory();
      }, 1000);
    } finally {
      setTriggering(null);
    }
  };

  const openDetail = (run: CronRunItem) => {
    setDetailRun(run);
    setDrawerOpen(true);
  };

  const jobOptions = useMemo(
    () => [
      { value: "", label: "All jobs" },
      ...jobs.map((j) => ({ value: j.name, label: j.label })),
    ],
    [jobs],
  );

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
    { value: "running", label: "Running" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Cron Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor, trigger, and review scheduled job executions.
        </p>
      </div>

      {/* Jobs Overview */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Jobs</h2>
        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border p-4 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.map((job) => (
              <div
                key={job.name}
                className="rounded-xl border border-border p-3 sm:p-4 space-y-3 bg-muted/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {job.label}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {job.schedule}
                      </div>
                    </div>
                  </div>
                  {job.latestRun ? (
                    statusBadge(job.latestRun.status)
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Never run
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {job.description}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400">
                      {job.stats.success} ok
                    </span>
                    <span className="text-rose-400">
                      {job.stats.failed} fail
                    </span>
                    <span className="text-muted-foreground">
                      {job.stats.total} total
                    </span>
                  </div>
                  <button
                    onClick={() => handleTrigger(job.name)}
                    disabled={!!triggering}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 px-2.5 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    {triggering === job.name ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Run
                  </button>
                </div>

                {job.latestRun && (
                  <div className="text-xs text-muted-foreground border-t border-border pt-2">
                    Last run: {formatDate(job.latestRun.startedAt)} ·{" "}
                    {formatDuration(job.latestRun.durationMs)} ·{" "}
                    {job.latestRun.triggeredBy === "manual"
                      ? "Manual"
                      : "Scheduled"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            Run History
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedJob}
                onChange={(e) => {
                  setSelectedJob(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-3 py-1.5 text-xs rounded-md border border-border bg-background appearance-none cursor-pointer"
              >
                {jobOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-md border border-border bg-background appearance-none cursor-pointer"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSelectedJob("");
                setSelectedStatus("");
                setPage(1);
                fetchHistory();
              }}
              className="p-1.5 rounded-md border border-border hover:bg-muted transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loadingHistory ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="animate-pulse space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : !history || history.runs.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No run history found.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Started</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Trigger</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.runs.map((run) => (
                      <tr
                        key={run.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition cursor-pointer"
                        onClick={() => openDetail(run)}
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {jobs.find((j) => j.name === run.jobName)?.label ||
                            run.jobName}
                        </td>
                        <td className="px-4 py-2.5">
                          {statusBadge(run.status)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {new Date(run.startedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {formatDuration(run.durationMs)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs capitalize">
                          {run.triggeredBy}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {run.status === "failed" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrigger(run.jobName);
                              }}
                              disabled={!!triggering}
                              className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 transition disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {history.pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {history.pagination.page} of {history.pagination.pages} ·{" "}
                  {history.pagination.total} runs
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-md border border-border hover:bg-muted transition disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(history.pagination.pages, p + 1))
                    }
                    disabled={page >= history.pagination.pages}
                    className="p-1.5 rounded-md border border-border hover:bg-muted transition disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerTitle className="flex items-center gap-2">
            {detailRun && statusBadge(detailRun.status)}
            <span className="text-sm text-muted-foreground font-normal">
              {detailRun
                ? jobs.find((j) => j.name === detailRun.jobName)?.label ||
                  detailRun.jobName
                : ""}
            </span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Run details and logs
          </DrawerDescription>
          {detailRun && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Started
                  </div>
                  <div>{new Date(detailRun.startedAt).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Duration
                  </div>
                  <div>{formatDuration(detailRun.durationMs)}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Trigger
                  </div>
                  <div className="capitalize">{detailRun.triggeredBy}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Job Key
                  </div>
                  <div className="font-mono text-xs">{detailRun.jobName}</div>
                </div>
              </div>

              {detailRun.error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-400 mb-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Error
                  </div>
                  <pre className="text-xs text-rose-300 whitespace-pre-wrap font-mono">
                    {detailRun.error}
                  </pre>
                </div>
              )}

              {detailRun.logs ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                    <Terminal className="w-3.5 h-3.5" /> Logs
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-[50vh] overflow-y-auto">
                    {detailRun.logs}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No logs captured for this run.
                </div>
              )}

              {detailRun.status === "failed" && (
                <button
                  onClick={() => {
                    handleTrigger(detailRun.jobName);
                    setDrawerOpen(false);
                  }}
                  disabled={!!triggering}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" /> Retry Job
                </button>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
