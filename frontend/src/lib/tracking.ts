import { generateUUID } from "@/lib/utils";

type EventType = string;

const SESSION_KEY = "pulsar_session_id";

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function getSessionId() {
  const win = safeWindow();
  if (!win) return "server";

  const existing = win.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = generateUUID();
  win.localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function getUtmSource() {
  const win = safeWindow();
  if (!win) return undefined;
  const params = new URLSearchParams(win.location.search);
  return params.get("utm_source") ?? undefined;
}

export function trackEvent(eventType: EventType, payload?: Record<string, unknown>) {
  const win = safeWindow();
  if (!win) return;

  const body = JSON.stringify({
    sessionId: getSessionId(),
    eventType,
    path: win.location.pathname,
    ...(payload ?? {}),
  });

  const url = "/api/analytics/track";
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // non-blocking analytics
  });
}
