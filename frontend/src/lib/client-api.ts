import { BASE_URL } from "@/lib/api/client";

export type ClientChannel = "web" | "telegram";

export interface ClientAuthPayload {
    email: string;
    password: string;
    login?: string;
}

export interface ClientTokenResponse {
    access_token: string;
}

export interface ClientRequestPayload {
    title: string;
    description: string;
    category?: string;
    priority?: "p1" | "p2" | "p3" | "p4";
    channel?: ClientChannel;
}

export async function clientRegister(
    payload: Required<ClientAuthPayload>,
): Promise<ClientTokenResponse> {
    return request<ClientTokenResponse>("/api/v1/client/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function clientLogin(
    payload: ClientAuthPayload,
): Promise<ClientTokenResponse> {
    return request<ClientTokenResponse>("/api/v1/client/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function clientMe(token: string) {
    return request("/api/v1/client/me", {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function createClientRequest(
    token: string,
    payload: ClientRequestPayload,
) {
    return request("/api/v1/client/requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channel: "web", ...payload }),
    });
}

export async function listClientRequests(
    token: string,
    channel: ClientChannel = "web",
) {
    return request(`/api/v1/client/requests?channel=${channel}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init.headers ?? {}),
        },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
}
