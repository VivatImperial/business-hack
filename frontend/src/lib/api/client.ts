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

/**
 * Error thrown by customFetch when the API returns a non-2xx response.
 * Carries the HTTP status so callers can branch on it (e.g. 401 vs 422).
 */
export class ApiError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

function resolveRequestUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    const normalizedBase = BASE_URL.replace(/\/$/, "");
    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

    if (normalizedBase.endsWith("/api") && normalizedUrl.startsWith("/api")) {
        return `${normalizedBase}${normalizedUrl.replace(/^\/api/, "")}`;
    }

    return `${normalizedBase}${normalizedUrl}`;
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
        const isAuthEndpoint = /\/auth\/(login|register)/i.test(url);
        if (typeof document !== "undefined" && !isAuthEndpoint) {
            Cookies.remove("auth_token", { path: "/" });
            Cookies.remove("auth_role", { path: "/" });
            window.location.href = "/login";
            throw new ApiError("Unauthorized", 401);
        }
        // For /auth/login and /auth/register let the caller handle 401 via onError
        const errorBody = await response.text().catch(() => "");
        let parsedBody: unknown = errorBody;
        let errorMessage = errorBody;
        try {
            const parsed = JSON.parse(errorBody);
            parsedBody = parsed;
            if (
                parsed &&
                typeof parsed === "object" &&
                "detail" in parsed &&
                typeof (parsed as { detail: unknown }).detail === "string"
            ) {
                errorMessage = (parsed as { detail: string }).detail;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Not JSON
        }
        throw new ApiError(errorMessage || "Unauthorized", 401, parsedBody);
    }

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        let errorMessage = errorBody;
        let parsedBody: unknown = errorBody;
        try {
            const parsed = JSON.parse(errorBody);
            parsedBody = parsed;
            if (parsed && typeof parsed === "object" && "detail" in parsed) {
                const detail = (parsed as { detail: unknown }).detail;
                if (typeof detail === "string") {
                    errorMessage = detail;
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Not JSON
        }
        throw new ApiError(
            errorMessage || `HTTP ${response.status}`,
            response.status,
            parsedBody,
        );
    }

    const contentType = response.headers.get("content-type");
    const data =
        response.status === 204 || !contentType?.includes("application/json")
            ? {}
            : await response.json();

    // Return shape matching Orval's generated response types: { data, status, headers }
    return { data, status: response.status, headers: response.headers } as T;
};
