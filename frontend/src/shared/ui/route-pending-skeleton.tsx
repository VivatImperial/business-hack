type SkeletonVariant =
    | "dashboard"
    | "leads"
    | "chats"
    | "tags"
    | "settings"
    | "balance"
    | "admin";

const B = "bg-muted/50";
const BL = "bg-muted/30";
const BORDER = "border border-border/20";

function Header({ withButton = true }: { withButton?: boolean }) {
    return (
        <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex flex-col gap-2">
                <div className={`h-7 w-36 md:w-48 rounded-xl ${B}`} />
                <div className={`h-4 w-48 md:w-72 rounded-md ${BL}`} />
            </div>
            {withButton && (
                <div className={`h-10 w-28 md:w-32 rounded-xl ${BL}`} />
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <>
            <Header />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-[88px] rounded-2xl ${BL} ${BORDER}`}
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className={`h-[440px] rounded-2xl ${BL} ${BORDER}`} />
                <div className="flex flex-col gap-4">
                    <div className={`h-52 rounded-2xl ${BL} ${BORDER}`} />
                    <div className={`h-52 rounded-2xl ${BL} ${BORDER}`} />
                </div>
            </div>
        </>
    );
}

function LeadsSkeleton() {
    return (
        <>
            <Header />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3">
                        <div className={`h-8 rounded-xl ${B}`} />
                        {Array.from({ length: 3 - (i % 2) }).map((_, j) => (
                            <div
                                key={j}
                                className={`h-32 rounded-2xl ${BL} ${BORDER}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}

function ChatsSkeleton() {
    return (
        <>
            <Header />
            <div className="flex flex-col divide-y divide-border/20">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                        <div
                            className={`size-[44px] md:size-[54px] rounded-full ${B} shrink-0`}
                        />
                        <div className="flex flex-col gap-1.5 flex-1">
                            <div
                                className={`h-4 rounded-md ${B}`}
                                style={{ width: `${60 + ((i * 7) % 30)}%` }}
                            />
                            <div className={`h-3 w-24 rounded-md ${BL}`} />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

function TagsSkeleton() {
    return (
        <>
            <Header />
            <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-4 rounded-2xl p-4 ${BL} ${BORDER}`}
                    >
                        <div className={`size-10 rounded-xl ${B} shrink-0`} />
                        <div className="flex flex-col gap-1.5 flex-1">
                            <div
                                className={`h-4 rounded-md ${B}`}
                                style={{ width: `${40 + ((i * 13) % 35)}%` }}
                            />
                            <div className={`h-3 w-20 rounded-md ${BL}`} />
                        </div>
                        <div className={`h-8 w-16 rounded-xl ${BL}`} />
                    </div>
                ))}
            </div>
        </>
    );
}

function SettingsSkeleton() {
    return (
        <>
            <Header withButton={false} />
            <div className="flex gap-8 mb-6 border-b border-border/30 pb-4">
                <div className={`h-5 w-28 rounded-md ${B}`} />
                <div className={`h-5 w-24 rounded-md ${BL}`} />
            </div>
            <div className="flex flex-col items-center py-8 gap-6">
                <div className={`size-[220px] rounded-3xl ${BL} ${BORDER}`} />
                <div className="flex flex-col items-center gap-2">
                    <div className={`h-5 w-40 rounded-md ${B}`} />
                    <div className={`h-4 w-56 rounded-md ${BL}`} />
                </div>
            </div>
        </>
    );
}

function BalanceSkeleton() {
    return (
        <>
            <Header withButton={false} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div className={`h-32 rounded-2xl ${BL} ${BORDER}`} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-44 rounded-2xl ${BL} ${BORDER}`}
                            />
                        ))}
                    </div>
                </div>
                <div className={`h-80 rounded-2xl ${BL} ${BORDER}`} />
            </div>
        </>
    );
}

function AdminSkeleton() {
    return (
        <>
            <Header />
            <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-16 rounded-xl ${BL} ${BORDER}`}
                    />
                ))}
            </div>
        </>
    );
}

const VARIANTS: Record<SkeletonVariant, () => React.JSX.Element> = {
    dashboard: DashboardSkeleton,
    leads: LeadsSkeleton,
    chats: ChatsSkeleton,
    tags: TagsSkeleton,
    settings: SettingsSkeleton,
    balance: BalanceSkeleton,
    admin: AdminSkeleton,
};

export function RoutePendingSkeleton({
    variant = "dashboard",
}: {
    variant?: SkeletonVariant;
}) {
    const Content = VARIANTS[variant];
    return (
        <div className="flex flex-col h-full md:min-h-[calc(100svh-240px)] rounded-xl bg-background p-4 md:p-8 relative animate-pulse">
            <Content />
        </div>
    );
}
