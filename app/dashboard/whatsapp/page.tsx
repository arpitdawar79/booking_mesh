"use client";

import {
    CheckCircle,
    LogOut,
    QrCode,
    RefreshCw,
    Save,
    Search,
    Smartphone,
    Users,
    XCircle,
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
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
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
        if (data.adminGroupId) {
          setSelectedGroupId(data.adminGroupId);
        }
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

  async function handleSaveConfig() {
    if (!selectedGroupId) return;
    setSavingConfig(true);
    setConfigSaved(false);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminGroupId: selectedGroupId }),
      });
      if (res.ok) {
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSavingConfig(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 text-muted-foreground">
        Loading WhatsApp status...
      </div>
    );
  }

  return (
    <div className="max-w-none sm:max-w-xl sm:mx-auto space-y-5 lg:space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold">WhatsApp Setup</h1>
      </div>

      {/* Status Card */}
      <div className="rounded-xl border border-border p-4 sm:p-6 space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Connection Status
          </h2>
          {status?.isConnected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-500/10 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-500/10 px-2.5 py-1 rounded-full">
              <XCircle className="w-3.5 h-3.5" />
              Disconnected
            </span>
          )}
        </div>

        {status?.user && (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Account:</span>{" "}
              <span className="font-medium">{status.user.name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Number:</span>{" "}
              <span className="font-medium">
                {status.user.id.split(":")[0]}
              </span>
            </p>
          </div>
        )}

        {status?.lastError && !status?.isConnected && (
          <p className="text-xs text-destructive break-words">
            Last error: {status.lastError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRestart}
            disabled={restarting || loggingOut}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${restarting ? "animate-spin" : ""}`}
            />
            {restarting ? "Restarting..." : "Restart Connection"}
          </button>

          {status?.isConnected && (
            <button
              onClick={handleLogout}
              disabled={loggingOut || restarting}
              className="flex items-center gap-2 rounded-xl border border-destructive/30 text-destructive px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 dark:hover:bg-destructive/20 disabled:opacity-50 transition"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          )}
        </div>
      </div>

      {/* QR Code Card */}
      {status?.qrCode && !status?.isConnected && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Scan to Connect
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Open WhatsApp on your phone, go to{" "}
            <strong>Settings &rarr; Linked Devices &rarr; Link a Device</strong>
            , and scan the QR code below.
          </p>
          <div className="flex justify-center p-3 bg-white dark:bg-[#112023] rounded-xl border border-border w-fit mx-auto shadow-sm">
            <img
              src={status.qrCode}
              alt="WhatsApp QR Code"
              className="w-64 h-64 rounded-xl"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            The QR code refreshes automatically. This page polls every 5
            seconds.
          </p>
        </div>
      )}

      {!status?.isConnected && !status?.qrCode && (
        <div className="rounded-xl border border-border p-4 sm:p-6 text-center bg-card">
          <p className="text-sm text-muted-foreground">
            WhatsApp is initializing. The QR code will appear here shortly.
          </p>
        </div>
      )}

      {/* Admin Group Selection */}
      {status?.isConnected && (
        <div className="rounded-xl border border-border p-4 sm:p-6 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Admin Group
              </h2>
            </div>
            {groupsCached && (
              <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                cached
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Choose the WhatsApp group where daily digests and admin
            notifications will be sent.
          </p>

          {groupsLoading ? (
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          ) : groups.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No groups found. Make sure this WhatsApp account is a member of
                at least one group.
              </p>
              <button
                onClick={() => fetchGroups(true)}
                disabled={refreshingGroups}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50 transition"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshingGroups ? "animate-spin" : ""}`}
                />
                {refreshingGroups ? "Refreshing..." : "Refresh Groups"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50"
                />
              </div>

              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50"
              >
                <option value="">Select a group...</option>
                {groups
                  .filter((g) =>
                    g.name.toLowerCase().includes(groupSearch.toLowerCase()),
                  )
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
              </select>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleSaveConfig}
                  disabled={!selectedGroupId || savingConfig}
                  className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  {savingConfig ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => fetchGroups(true)}
                  disabled={refreshingGroups}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50 transition"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshingGroups ? "animate-spin" : ""}`}
                  />
                  {refreshingGroups ? "Refreshing..." : "Refresh"}
                </button>
                {configSaved && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
