import Cookies from "js-cookie";
import { redirect } from "@tanstack/react-router";

const TOKEN_KEY = "auth_token";
const TENANT_KEY = "tenant_id";

export function getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string) {
    Cookies.set(TOKEN_KEY, token, { path: "/", sameSite: "lax", expires: 7 });
}

export function removeToken() {
    Cookies.remove(TOKEN_KEY, { path: "/" });
}

export function getTenantId(): number | undefined {
    const val = Cookies.get(TENANT_KEY);
    return val ? Number(val) : undefined;
}

export function setTenantId(id: number) {
    Cookies.set(TENANT_KEY, String(id), {
        path: "/",
        sameSite: "lax",
        expires: 7,
    });
}

export function removeTenantId() {
    Cookies.remove(TENANT_KEY, { path: "/" });
}

export function getUsername(): string | null {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sub ?? null;
    } catch {
        return null;
    }
}

export function isAuthenticated(): boolean {
    return !!getToken() && !!getTenantId();
}

// Admin impersonation
const ADMIN_KEY = "admin_impersonating";

export function setAdminImpersonating(value = "1") {
    Cookies.set(ADMIN_KEY, value, { path: "/", sameSite: "lax", expires: 1 });
}

export function removeAdminImpersonating() {
    Cookies.remove(ADMIN_KEY, { path: "/" });
}

export function isAdminImpersonating(): boolean {
    return Cookies.get(ADMIN_KEY) === "1";
}

export function logout() {
    removeToken();
    removeTenantId();
    removeAdminImpersonating();
    throw redirect({ to: "/login" });
}

import { BASE_URL } from "./api/client";

export async function login(
    username: string,
    password: string,
): Promise<string | null> {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        body,
    });
    if (res.status === 401) {
        return null;
    }
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || `Ошибка входа: ${res.status}`);
    }
    const data = await res.json();
    const token = data.access_token as string;
    setToken(token);
    return token;
}

export async function register(
    username: string,
    password: string,
): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || `Ошибка регистрации: ${res.status}`);
    }
    const data = await res.json();
    const token = data.access_token as string;
    setToken(token);
    return token;
}

// ---------------------------------------------------------------------------
// QR-first registration (unauthenticated)
// ---------------------------------------------------------------------------

export interface QrRegistrationStartResult {
    session_id: string;
    url: string;
    expires_at: string;
}

export interface QrRegistrationStatus {
    status: "waiting_qr" | "waiting_password" | "success" | "failed";
    url: string | null;
    error: string | null;
    expires_at: string | null;
    access_token: string | null;
    tenant_id: number | null;
    is_new_user: boolean | null;
}

export async function startQrRegistration(): Promise<QrRegistrationStartResult> {
    const res = await fetch(`${BASE_URL}/api/auth/qr/start`, {
        method: "POST",
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || `Ошибка запуска QR: ${res.status}`);
    }
    return res.json();
}

export async function checkQrRegistrationStatus(
    sessionId: string,
): Promise<QrRegistrationStatus> {
    const res = await fetch(`${BASE_URL}/api/auth/qr/status/${sessionId}`);
    if (!res.ok) {
        throw new Error("Сессия регистрации не найдена или истекла");
    }
    return res.json();
}

export async function submitQrRegistrationPassword(
    sessionId: string,
    password: string,
): Promise<QrRegistrationStatus> {
    const res = await fetch(`${BASE_URL}/api/auth/qr/password/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || "Ошибка подтверждения 2FA");
    }
    return res.json();
}

// ---------------------------------------------------------------------------
// Phone registration (unauthenticated)
// ---------------------------------------------------------------------------

export interface PhoneRegistrationStartResult {
    session_id: string;
    phone_code_hash: string;
}

export interface PhoneRegistrationStatus {
    status: "waiting_code" | "waiting_password" | "success" | "failed";
    error: string | null;
    access_token: string | null;
    tenant_id: number | null;
    is_new_user: boolean | null;
}

export async function startPhoneRegistration(
    phone: string,
): Promise<PhoneRegistrationStartResult> {
    const res = await fetch(`${BASE_URL}/api/auth/phone/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || `Ошибка отправки кода: ${res.status}`);
    }
    return res.json();
}

export async function submitPhoneCode(
    sessionId: string,
    code: string,
): Promise<PhoneRegistrationStatus> {
    const res = await fetch(`${BASE_URL}/api/auth/phone/code/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || "Неверный код");
    }
    return res.json();
}

export async function submitPhonePassword(
    sessionId: string,
    password: string,
): Promise<PhoneRegistrationStatus> {
    const res = await fetch(
        `${BASE_URL}/api/auth/phone/password/${sessionId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        },
    );
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message || "Ошибка подтверждения 2FA");
    }
    return res.json();
}

export interface TenantInfo {
    id: number;
    slug: string;
    name: string;
    is_active: boolean;
    role?: string;
}

export async function fetchTenants(): Promise<TenantInfo[]> {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/platform/tenants`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("");
    return res.json();
}

export async function createTenant(
    name: string,
    slug: string,
): Promise<TenantInfo> {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/platform/tenants`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, slug }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
            const json = JSON.parse(text);
            if (json.detail) message = json.detail;
        } catch {
            /* raw text */
        }
        throw new Error(message);
    }
    return res.json();
}
