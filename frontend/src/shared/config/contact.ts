// Bot-scraper defense: the real Telegram handle must never appear in static
// HTML, JSON-LD, or the client bundle. All contact links route through this
// internal URL; the server resolves the real destination via a 302 redirect
// (see routes/go.manager.tsx + lib/server-fns/manager.ts).
export const MANAGER_CONTACT_URL = "/go/manager";

export function buildManagerContactUrl(prefilledText?: string): string {
    if (!prefilledText) return MANAGER_CONTACT_URL;
    return `${MANAGER_CONTACT_URL}?text=${encodeURIComponent(prefilledText)}`;
}

// Canonical absolute form for JSON-LD / meta tags. Points at our own origin
// so structured-data crawlers see our domain, not the Telegram handle.
export const ABSOLUTE_MANAGER_CONTACT_URL = "https://pulsar-tg.ru/go/manager";
