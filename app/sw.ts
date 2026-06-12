/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
    BackgroundSyncPlugin,
    CacheableResponsePlugin,
    CacheFirst,
    ExpirationPlugin,
    NetworkFirst,
    Serwist,
    StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  cacheId: "ekantah-stream",
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^gclid$/],
  },
  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "stream-pages",
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 48,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) =>
        url.pathname.startsWith("/api/") && request.method === "GET",
      handler: new NetworkFirst({
        cacheName: "stream-api",
        networkTimeoutSeconds: 4,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 10 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) =>
        url.pathname.startsWith("/api/") &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method),
      handler: new NetworkFirst({
        cacheName: "stream-api-mutations",
        networkTimeoutSeconds: 10,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200, 201, 204] }),
          new ExpirationPlugin({
            maxEntries: 40,
            maxAgeSeconds: 24 * 60 * 60,
          }),
          new BackgroundSyncPlugin("stream-api-sync", {
            maxRetentionTime: 24 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) =>
        ["image", "font", "style", "script"].includes(request.destination),
      handler: new CacheFirst({
        cacheName: "stream-assets",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 160,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.origin === "https://fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "stream-google-fonts",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 12,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.origin === "https://fonts.googleapis.com",
      handler: new StaleWhileRevalidate({
        cacheName: "stream-google-fonts-stylesheets",
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

/* ─── Push Notifications ─── */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options: NotificationOptions & { actions?: any[] } = {
    body: data.body || "",
    icon: "/icons/iconxxxhdpi.png",
    badge: "/icons/iconhdpi.png",
    tag: data.tag || "default",
    data: data.url ? { url: data.url } : undefined,
    requireInteraction: data.requireInteraction ?? false,
    actions: data.actions || [],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "The Stream", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});

/* ─── Periodic Background Sync (best effort) ─── */
self.addEventListener("periodicsync", (event: any) => {
  if (event.tag === "refresh-data") {
    event.waitUntil(
      fetch("/api/analytics")
        .then((res) => {
          if (res.ok)
            return caches
              .open("stream-api")
              .then((cache) => cache.put("/api/analytics", res));
        })
        .catch(() => {}),
    );
  }
});
