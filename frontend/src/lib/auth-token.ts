import Cookies from "js-cookie";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "auth_token";

export const getAuthToken = createIsomorphicFn()
    .client((): string | undefined => Cookies.get(COOKIE_NAME))
    .server((): string | undefined => getCookie(COOKIE_NAME) ?? undefined);
