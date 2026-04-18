import Cookies from "js-cookie";
import { redirect } from "@tanstack/react-router";

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";

export type AuthRole = "client" | "admin";

export function getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string) {
    Cookies.set(TOKEN_KEY, token, { path: "/", sameSite: "lax", expires: 7 });
}

export function removeToken() {
    Cookies.remove(TOKEN_KEY, { path: "/" });
}

export function getRole(): AuthRole | undefined {
    const v = Cookies.get(ROLE_KEY);
    return v === "client" || v === "admin" ? v : undefined;
}

export function setRole(role: AuthRole) {
    Cookies.set(ROLE_KEY, role, { path: "/", sameSite: "lax", expires: 7 });
}

export function removeRole() {
    Cookies.remove(ROLE_KEY, { path: "/" });
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

export function isAdmin(): boolean {
    return getRole() === "admin";
}

export function logout() {
    removeToken();
    removeRole();
    throw redirect({ to: "/login" });
}
