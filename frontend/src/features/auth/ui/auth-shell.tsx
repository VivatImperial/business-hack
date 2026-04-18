import type { ReactNode } from "react";

interface AuthShellProps {
    children: ReactNode;
}

/**
 * Two-column auth shell:
 * - Left: Baltic photo with a flat navy-tinted overlay (matches brand palette).
 * - Right: form panel on warm canvas.
 */
export function AuthShell({ children }: AuthShellProps) {
    return (
        <div className="flex min-h-svh bg-[var(--brand-cream)]">
            <div className="relative hidden shrink-0 bg-[var(--brand-dark)] lg:block">
                <img
                    src="/images/layout/login-bg.webp"
                    alt=""
                    className="block h-screen w-auto max-w-none"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
                {/* Flat brand-blue tint overlay */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[var(--brand-dark)] opacity-40"
                />
            </div>
            <div className="flex min-h-svh flex-1 items-center justify-center bg-[var(--brand-cream)] px-6 py-10 sm:px-16">
                {children}
            </div>
        </div>
    );
}
