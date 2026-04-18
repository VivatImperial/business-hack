import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import Cookies from "js-cookie";

export type AuthRole = "client" | "admin";

const ROLE_COOKIE = "auth_role";

function normalize(v: string | undefined | null): AuthRole | undefined {
    return v === "client" || v === "admin" ? v : undefined;
}

/**
 * Isomorphic auth role reader — same call from client/server,
 * reads cookie via js-cookie on client and via TanStack Start's
 * `getCookie` helper on server.
 */
export const getAuthRole = createIsomorphicFn()
    .client((): AuthRole | undefined => normalize(Cookies.get(ROLE_COOKIE)))
    .server((): AuthRole | undefined => normalize(getCookie(ROLE_COOKIE)));
