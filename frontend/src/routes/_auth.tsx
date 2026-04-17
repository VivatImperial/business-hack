import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
    component: AuthLayout,
});

function AuthLayout() {
    return (
        <>
            <header className="fixed left-0 top-0 z-10 px-6 py-5">
                <Link
                    to="/"
                    className="hidden sm:inline-flex items-center gap-2.5 group"
                >
                    <img
                        src="/images/common/logo.webp"
                        alt="Пульсар"
                        className="size-8 rounded-xl transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="font-pixel text-lg tracking-wide text-foreground">
                        Пульсар
                    </span>
                </Link>
            </header>
            <Outlet />
        </>
    );
}
