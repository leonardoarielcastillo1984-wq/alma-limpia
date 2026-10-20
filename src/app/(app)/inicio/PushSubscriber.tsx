"use client";

import { useEffect } from "react";

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Si el usuario activó recordatorios y el permiso está granted, suscribe el
 * dispositivo a Web Push y lo registra en el servidor (upsert por endpoint).
 */
export function PushSubscriber({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vapidKey) as BufferSource,
        });
        const json = sub.toJSON();
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
      } catch {
        // suscripción no disponible (iOS sin PWA instalada, etc.)
      }
    })();
  }, [enabled]);

  return null;
}
