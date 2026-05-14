"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(b64: string) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "on" | "off" | "unsupported" | "denied";

export function EnablePushButton() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    });
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setState("on");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    "w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50";

  if (state === "loading") {
    return <div className="text-xs text-slate-500">Checking notification status…</div>;
  }
  if (state === "unsupported") {
    return (
      <p className="text-xs text-slate-500">
        Notifications aren&apos;t supported on this browser. On iPhone, install the app to your
        home screen first, then come back here.
      </p>
    );
  }
  if (state === "denied") {
    return (
      <p className="text-xs text-slate-500">
        Notifications are blocked. Enable them in your browser&apos;s site settings, then reload.
      </p>
    );
  }
  if (state === "on") {
    return (
      <button type="button" onClick={disable} disabled={busy} className={buttonClass}>
        {busy ? "Disabling…" : "Disable notifications"}
      </button>
    );
  }
  return (
    <button type="button" onClick={enable} disabled={busy} className={buttonClass}>
      {busy ? "Enabling…" : "Enable notifications"}
    </button>
  );
}
