import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
    component: AuthLayout,
});

function AuthLayout() {
    return (
        <>
            <header className="fixed left-0 top-0 z-10 px-4 py-4 sm:px-6 sm:py-5">
                <Link
                    to="/"
                    className="font-heading hidden items-center rounded-full border border-[var(--brand-border)] bg-white/90 px-4 py-2 text-[13px] font-semibold tracking-tight text-[var(--brand-dark)] shadow-[0_2px_12px_-6px_rgba(42,31,54,0.08)] backdrop-blur-md transition-colors hover:bg-white sm:inline-flex"
                >
                    Балтийский Берег
                </Link>
            </header>
            <Outlet />
        </>
    );
}
