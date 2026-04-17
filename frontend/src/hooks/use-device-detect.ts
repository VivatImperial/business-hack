import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

function checkUserAgent(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
    );
}

function checkScreenWidth(): boolean {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
}

function getInitialMobile(): boolean {
    if (typeof window === "undefined") return false;
    return checkUserAgent() || checkScreenWidth();
}

export function useDeviceDetect() {
    const [isMobile, setIsMobile] = useState(getInitialMobile);
    const [isDetected, setIsDetected] = useState(() => typeof window !== "undefined");

    useEffect(() => {
        setIsMobile(checkUserAgent() || checkScreenWidth());
        setIsDetected(true);

        const mql = window.matchMedia(
            `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
        );
        const onChange = () => {
            setIsMobile(checkUserAgent() || mql.matches);
        };
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return { isMobile, isDetected };
}
