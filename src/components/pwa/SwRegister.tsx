"use client";

import { useEffect } from "react";

/** Registra el service worker una sola vez por sesión. */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !navigator.serviceWorker) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silencioso: la app funciona igual sin SW */
    });
  }, []);
  return null;
}
