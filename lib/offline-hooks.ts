"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearFailedMutations,
  enqueueMutation,
  getPendingMutations,
  processQueue,
  type QueuedMutation,
} from "./offline-queue";
import { useNetworkState } from "./pwa-hooks";

export function useOfflineQueue() {
  const { online } = useNetworkState();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const lastOnline = useRef(online);

  const refresh = useCallback(async () => {
    const all = await getPendingMutations();
    setPendingCount(all.filter((m) => m.status === "pending").length);
    setFailedCount(all.filter((m) => m.status === "failed").length);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (online && !lastOnline.current) {
      // Came back online — attempt sync
      setSyncing(true);
      processQueue()
        .then(() => refresh())
        .finally(() => setSyncing(false));
    }
    lastOnline.current = online;
  }, [online, refresh]);

  const queueMutation = useCallback(
    async (
      url: string,
      options: {
        method?: string;
        body?: unknown;
        headers?: Record<string, string>;
      } = {},
    ) => {
      await enqueueMutation({
        url,
        method: options.method || "POST",
        body: options.body ? JSON.stringify(options.body) : "",
        headers: options.headers || { "Content-Type": "application/json" },
      });
      await refresh();
    },
    [refresh],
  );

  const syncNow = useCallback(async () => {
    if (!online) return;
    setSyncing(true);
    try {
      await processQueue();
    } finally {
      await refresh();
      setSyncing(false);
    }
  }, [online, refresh]);

  const clearFailed = useCallback(async () => {
    await clearFailedMutations();
    await refresh();
  }, [refresh]);

  return {
    pendingCount,
    failedCount,
    syncing,
    online,
    queueMutation,
    syncNow,
    clearFailed,
    refresh,
  };
}

export function useOfflineMutation() {
  const { queueMutation } = useOfflineQueue();
  const { online } = useNetworkState();

  const mutate = useCallback(
    async (
      url: string,
      options: {
        method?: string;
        body?: unknown;
        headers?: Record<string, string>;
      } = {},
    ) => {
      if (!online) {
        await queueMutation(url, options);
        return { queued: true as const, ok: true };
      }
      try {
        const res = await fetch(url, {
          method: options.method || "POST",
          headers: options.headers || { "Content-Type": "application/json" },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) {
          // If request fails while online, still queue for retry
          await queueMutation(url, options);
          return { queued: true as const, ok: false };
        }
        return { queued: false as const, ok: true, response: res };
      } catch {
        await queueMutation(url, options);
        return { queued: true as const, ok: false };
      }
    },
    [online, queueMutation],
  );

  return { mutate };
}
