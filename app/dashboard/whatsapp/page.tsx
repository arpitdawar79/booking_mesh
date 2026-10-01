"use client";

import { cn } from "@/lib/utils";
import {
    CheckCircle,
    FileSpreadsheet,
    Loader2,
    LogOut,
    QrCode,
    RefreshCw,
    Save,
    Search,
    Smartphone,
    Users,
    Wifi,
    WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

interface WhatsAppStatus {
  isConnected: boolean;
  qrCode: string | null;
  status: string;
  lastError?: string | null;
  lastConnectedAt?: number | null;
  user?: { id: string; name: string };
}

interface WhatsAppGroup {
  id: string;
  name: string;
}

export default function WhatsAppSetupPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [refreshingGroups, setRefreshingGroups] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedOpsGroupId, setSelectedOpsGroupId] = useState<string>("");
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingOps, setSavingOps] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [opsSaved, setOpsSaved] = useState(false);
  const [groupsCached, setGroupsCached] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGroups(refresh = false) {
    if (refresh) {
      setRefreshingGroups(true);
    } else {
      setGroupsLoading(true);
    }
    try {
      const res = await fetch(`/api/whatsapp/groups?refresh=${refresh}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        setGroupsCached(data.cached === true);
      } else {
        setGroups([]);
        setGroupsCached(false);
      }
    } catch {
      setGroups([]);
      setGroupsCached(false);
    } finally {
      setGroupsLoading(false);
      setRefreshingGroups(false);
    }
  }

  async function fetchConfig() {
    try {
      const res = await fetch("/api/whatsapp/config");
      if (res.ok) {
        const data = await res.json();
        if (data.adminGroupId) setSelectedGroupId(data.adminGroupId);
        if (data.opsGroupId) setSelectedOpsGroupId(data.opsGroupId);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status?.isConnected) {
      fetchGroups();
    } else {
      setGroups([]);
    }
  }, [status?.isConnected]);

  async function handleRestart() {
    setRestarting(true);
    try {
      await fetch("/api/whatsapp/restart", { method: "POST" });
      setTimeout(() => {
        fetchStatus();
        setRestarting(false);
      }, 2000);
    } catch {
      setRestarting(false);
    }
  }

  async function handleLogout() {
    if (
      !confirm(
        "Log out the connected WhatsApp account? You'll need to scan a new QR code to reconnect.",
      )
    ) {
      return;
    }
    setLoggingOut(true);
    try {
      await fetch("/api/whatsapp/logout", { method: "POST" });
      setTimeout(() => {
        fetchStatus();
        setLoggingOut(false);
      }, 2000);
    } catch {
      setLoggingOut(false);
    }
  }

  async function saveGroup(which: "admin" | "ops") {
    const id = which === "admin" ? selectedGroupId : selectedOpsGroupId;
    if (!id) return;
    const setSaving = which === "admin" ? setSavingAdmin : setSavingOps;
    const setSaved = which === "admin" ? setAdminSaved : setOpsSaved;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          which === "admin" ? { adminGroupId: id } : { opsGroupId: id },
        ),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const groupName = (id: string) =>
    groups.find((g) => g.id === id)?.name ?? null;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
        <div className="h-56 rounded-2xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  const connected = !!status?.isConnected;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">WhatsApp</h1>
            <p className="text-xs text-muted-foreground">
              Connection &amp; notification routing
            </p>
          </div>
        </div>
        <span
          role="status"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
            connected
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500",
            )}
          />
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      {/* Connection card */}
      <section
        aria-label="Connection"
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div
          className={cn(
            "px-5 py-4 border-b border-border/60 flex items-center gap-3",
            connected ? "bg-emerald-500/5" : "bg-amber-500/5",
          )}
        >
          {connected ? (
            <Wifi className="w-5 h-5 text-emerald-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-500" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              {connected ? "Connected" : "Not connected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {connected && status?.user
                ? `${status.user.name} · ${status.user.id.split(":")[0]}`
                : status?.lastError
                  ? `Last error: ${status.lastError}`
                  : "Scan the QR code to link the account"}
            </p>
          </div>
        </div>

        <div className="p-5 flex flex-wrap gap-2">
          <button
            onClick={handleRestart}
            disabled={restarting || loggingOut}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <RefreshCw
              className={cn("w-4 h-4", restarting && "animate-spin")}
            />
            {restarting ? "Restarting…" : "Restart connection"}
          </button>

          {connected && (
            <button
              onClick={handleLogout}
              disabled={loggingOut || restarting}
              className="flex items-center gap-2 rounded-xl border border-destructive/30 text-destructive px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-destructive/30"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          )}
        </div>
      </section>

      {/* QR pairing */}
      {status?.qrCode && !connected && (
        <section
          aria-label="Pair device"
          className="rounded-2xl border border-amber-500/25 bg-amber-500/5 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-amber-500/15 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-foreground">
              Pair a device
            </h2>
          </div>
          <div className="p-5 grid sm:grid-cols-[auto_1fr] gap-5 items-center">
            <div className="mx-auto sm:mx-0 p-3 bg-white rounded-2xl border border-border shadow-sm w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={status.qrCode}
                alt="WhatsApp QR code — scan with your phone"
                className="w-52 h-52 rounded-lg"
              />
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground list-none">
              {[
                "Open WhatsApp on your phone",
                "Settings → Linked Devices → Link a Device",
                "Point the camera at this QR code",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-black flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
              <li className="text-xs pt-1 text-muted-foreground/70">
                The QR refreshes automatically — this page checks status every
                5 seconds.
              </li>
            </ol>
          </div>
        </section>
      )}

      {!connected && !status?.qrCode && (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">
            WhatsApp is initializing — the QR code will appear shortly.
          </p>
        </div>
      )}

      {/* Notification groups */}
      {connected && (
        <section
          aria-label="Notification groups"
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Notification groups
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {groupsCached && (
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  cached
                </span>
              )}
              <button
                onClick={() => fetchGroups(true)}
                disabled={refreshingGroups || groupsLoading}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50 transition"
              >
                <RefreshCw
                  className={cn(
                    "w-3.5 h-3.5",
                    refreshingGroups && "animate-spin",
                  )}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {groupsLoading ? (
              <div className="space-y-3">
                <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-4">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground mt-2">
                  No groups found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This WhatsApp account must be a member of at least one
                  group.
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search groups…"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    aria-label="Search WhatsApp groups"
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>

                <GroupPicker
                  tone="primary"
                  icon={<Users className="w-4 h-4" />}
                  label="Admin group"
                  hint="Booking digests & admin notifications"
                  value={selectedGroupId}
                  onChange={setSelectedGroupId}
                  groups={groups}
                  search={groupSearch}
                  currentName={groupName(selectedGroupId)}
                  onSave={() => saveGroup("admin")}
                  saving={savingAdmin}
                  saved={adminSaved}
                />

                <GroupPicker
                  tone="accent"
                  icon={<FileSpreadsheet className="w-4 h-4" />}
                  label="Ops group"
                  hint="Sheet-sync alerts & commands (skip, fix, sync)"
                  value={selectedOpsGroupId}
                  onChange={setSelectedOpsGroupId}
                  groups={groups}
                  search={groupSearch}
                  currentName={groupName(selectedOpsGroupId)}
                  onSave={() => saveGroup("ops")}
                  saving={savingOps}
                  saved={opsSaved}
                />
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function GroupPicker({
  tone,
  icon,
  label,
  hint,
  value,
  onChange,
  groups,
  search,
  currentName,
  onSave,
  saving,
  saved,
}: {
  tone: "primary" | "accent";
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  groups: WhatsAppGroup[];
  search: string;
  currentName: string | null;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );
  const tones = {
    primary: {
      chip: "bg-primary/10 text-primary border-primary/25",
      ring: "focus:ring-primary/30 focus:border-primary/50",
    },
    accent: {
      chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      ring: "focus:ring-emerald-500/30 focus:border-emerald-500/50",
    },
  }[tone];

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
            tones.chip,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {saved && (
          <span
            role="status"
            className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} selector`}
          className={cn(
            "flex-1 min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2",
            tones.ring,
          )}
        >
          <option value="">Select a group…</option>
          {filtered.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <button
          onClick={onSave}
          disabled={!value || saving}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2.5 text-sm font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {currentName && (
        <p className="text-[11px] text-muted-foreground">
          Currently set to{" "}
          <span className="font-semibold text-foreground">{currentName}</span>
        </p>
      )}
    </div>
  );
}
