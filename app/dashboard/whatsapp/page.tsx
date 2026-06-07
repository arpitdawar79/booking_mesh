"use client";

import {
  CheckCircle,
  LogOut,
  QrCode,
  RefreshCw,
  Smartphone,
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

export default function WhatsAppSetupPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 text-muted-foreground">
        Loading WhatsApp status...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-teal-500" />
        <h1 className="text-xl sm:text-2xl font-bold">WhatsApp Setup</h1>
      </div>

      {/* Status Card */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Connection Status
          </h2>
          {status?.isConnected ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-900/30 px-2.5 py-1 rounded-full">
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
          <p className="text-xs text-red-400 break-words">
            Last error: {status.lastError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRestart}
            disabled={restarting || loggingOut}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition"
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
              className="flex items-center gap-2 rounded-xl border border-red-500/30 text-red-400 px-4 py-2.5 text-sm font-medium hover:bg-red-900/20 disabled:opacity-50 transition"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          )}
        </div>
      </div>

      {/* QR Code Card */}
      {status?.qrCode && !status?.isConnected && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-900/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-yellow-400" />
            <h2 className="text-sm font-semibold text-yellow-300">
              Scan to Connect
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Open WhatsApp on your phone, go to{" "}
            <strong>Settings &rarr; Linked Devices &rarr; Link a Device</strong>
            , and scan the QR code below.
          </p>
          <div className="flex justify-center">
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
        <div className="rounded-xl border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            WhatsApp is initializing. The QR code will appear here shortly.
          </p>
        </div>
      )}
    </div>
  );
}
