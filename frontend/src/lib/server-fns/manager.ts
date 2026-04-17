import { createServerFn } from "@tanstack/react-start";

const MAX_PREFILL_LEN = 500;

type RuntimeProcessEnv = {
    env?: Record<string, string | undefined>;
};

// Real manager handle is resolved server-side only. It never appears in the
// client bundle, SSR HTML, or JSON-LD — scrapers must follow a live 302 to
// discover it, which we can rate-limit at the edge.
export const resolveManagerRedirect = createServerFn({ method: "GET" })
    .inputValidator((input: unknown) => {
        const raw = (input ?? {}) as { text?: unknown };
        const text =
            typeof raw.text === "string" && raw.text.length > 0
                ? raw.text.slice(0, MAX_PREFILL_LEN)
                : undefined;
        return { text };
    })
    .handler(({ data }) => {
        const env = (
            globalThis as typeof globalThis & { process?: RuntimeProcessEnv }
        ).process?.env;
        const base = env?.TG_MANAGER_URL ?? "https://t.me/Egor_Kuznetsov03";
        const href = data.text
            ? `${base}?text=${encodeURIComponent(data.text)}`
            : base;
        return { href };
    });
