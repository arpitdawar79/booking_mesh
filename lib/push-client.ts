"use client";

import { useCallback, useEffect, useState } from "react";

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
            auth: arrayBufferToBase64(sub.getKey("auth")!),
          },
        }),
      });

      setSubscription(sub);
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await subscription.unsubscribe();
      await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: "DELETE",
      });
      setSubscription(null);
    } catch (err) {
      console.error("Push unsubscription failed:", err);
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  return { supported, subscribed: !!subscription, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
