import type { ReactNode } from "react";

interface AuthShellProps {
    children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
    return (
        <div className="flex min-h-svh">
            <div className="relative hidden shrink-0 bg-[var(--brand-cream)] lg:block">
                <img
                    src="/images/layout/login-bg.webp"
                    alt=""
                    className="block h-screen w-auto max-w-none"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
                {/* Brand-tinted overlay — warms the photo to the landing palette */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 mix-blend-multiply"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(242,234,214,0.55) 0%, rgba(217,119,87,0.22) 55%, rgba(42,31,54,0.38) 100%)",
                    }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(140% 80% at 20% 10%, rgba(242,234,214,0.28) 0%, transparent 55%), radial-gradient(120% 70% at 90% 100%, rgba(42,31,54,0.35) 0%, transparent 60%)",
                    }}
                />
            </div>
            <div className="flex min-h-svh flex-1 items-center justify-center bg-background px-6 py-10 sm:px-16">
                {children}
            </div>
        </div>
    );
}
