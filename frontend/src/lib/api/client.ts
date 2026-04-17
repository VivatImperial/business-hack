import Cookies from "js-cookie";

type RuntimeProcessEnv = {
    env?: Record<string, string | undefined>;
};

const runtimeProcess = (
    globalThis as typeof globalThis & { process?: RuntimeProcessEnv }
).process;

const CLIENT_BASE_URL = (import.meta.env.VITE_API_URL ?? "").trim();
const SERVER_BASE_URL =
    runtimeProcess?.env?.INTERNAL_API_URL ||
    runtimeProcess?.env?.VITE_API_URL ||
    "http://backend:8080";

function resolveBaseUrl(): string {
    if (typeof document !== "undefined") {
        return CLIENT_BASE_URL.replace(/\/$/, "");
    }
    return SERVER_BASE_URL.replace(/\/$/, "");
}

export const BASE_URL = resolveBaseUrl();

function resolveRequestUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    return `${BASE_URL}${url}`;
}

/**
 * Read auth_token on both server (SSR) and client.
 * On server, dynamically imports the server function to read cookies.
 * On client, reads from js-cookie (document.cookie).
 */
async function resolveToken(): Promise<string | undefined> {
    if (typeof document !== "undefined") {
        return Cookies.get("auth_token");
    }
    try {
        const { getAuthState } = await import("@/lib/server-fns/auth");
        const state = await getAuthState();
        return state.token;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return undefined;
    }
}

/**
 * Custom fetcher for Orval.
 * Returns { data, status, headers } matching Orval's expected response shape.
 */
export const customFetch = async <T>(
    url: string,
    init: RequestInit,
): Promise<T> => {
    const token = await resolveToken();

    const headers = new Headers(init.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Set Content-Type for JSON bodies if not already set
    if (
        init.body &&
        typeof init.body === "string" &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(resolveRequestUrl(url), {
        ...init,
        headers,
    });

    if (response.status === 401) {
        console.log("[customFetch] 401 on:", url);
        if (typeof document !== "undefined") {
            const wasAdmin = Cookies.get("admin_impersonating") === "1";
            console.log("[customFetch] clearing cookies, wasAdmin:", wasAdmin);
            Cookies.remove("auth_token", { path: "/" });
            Cookies.remove("tenant_id", { path: "/" });
            Cookies.remove("admin_impersonating", { path: "/" });
            window.location.href = wasAdmin ? "/admin/login" : "/login";
        }
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        let errorMessage = errorBody;
        try {
            const parsed = JSON.parse(errorBody);
            if (parsed.detail) {
                errorMessage = parsed.detail;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Not JSON
        }
        throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    const data =
        response.status === 204 || !contentType?.includes("application/json")
            ? {}
            : await response.json();

    // Return shape matching Orval's generated response types: { data, status, headers }
    return { data, status: response.status, headers: response.headers } as T;
};
