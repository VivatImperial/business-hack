import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

const MOBILE_UA_RE =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const getDeviceType = createServerFn({ method: "GET" }).handler(
    async () => {
        const ua = getRequestHeader("user-agent") || "";
        return { isMobile: MOBILE_UA_RE.test(ua) };
    },
);
