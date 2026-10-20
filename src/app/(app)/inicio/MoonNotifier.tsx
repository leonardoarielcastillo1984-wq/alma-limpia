"use client";

import { useEffect } from "react";

/**
 * Dispara una notificación del navegador una vez por día si el usuario
 * tiene "Recordatorios suaves" activos y el permiso concedido.
 * El flag diario vive en localStorage (solo este dispositivo).
 */
export function MoonNotifier({
  enabled,
  title,
  body,
}: {
  enabled: boolean;
  title: string;
  body: string;
}) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("alma_last_notif") === today) return;
    try {
      new Notification(title, { body, icon: "/icons/icon-192.png", tag: "alma-dia" });
      localStorage.setItem("alma_last_notif", today);
    } catch {
      // algunos navegadores (iOS Safari sin PWA instalada) no soportan new Notification
    }
  }, [enabled, title, body]);

  return null;
}
