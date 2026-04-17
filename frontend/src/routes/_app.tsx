import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { StoriesCarousel } from "@/shared/stories/stories-carousel";
import { MobileLayout } from "@/shared/layout/mobile-layout";
import { AppFooter } from "@/shared/layout/app-footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsQueries, settingsMutations } from "@/lib/queries/settings";
import { promptsMutations } from "@/lib/queries/prompts";
import type { SettingsResponse } from "@/lib/api/generated/schemas";
import { authQueries } from "@/lib/queries/auth";
import { balanceQueries } from "@/lib/queries/balance";
import { leadsQueries } from "@/lib/queries/leads";
import { useEffect, useRef } from "react";
import type { SettingsIssue } from "@/features/settings/types";
import type { UtmResolveData } from "@/features/admin/types";
import { snackbarStore } from "@/shared/lib/snackbar-store";
import { BannerManager } from "@/shared/layout/banner-manager";
import { isAdminImpersonating } from "@/lib/auth";
import { useBanners } from "@/shared/layout/use-banners";
import { SidebarTour } from "@/shared/layout/sidebar-tour";
import { RouteErrorFallback } from "@/shared/ui/route-error-fallback";

export const Route = createFileRoute("/_app")({
    loader: async ({ context: { queryClient, token, tenantId } }) => {
        if (!token) return;
        const promises: Promise<unknown>[] = [
            queryClient.ensureQueryData(authQueries.me(token)),
            queryClient.ensureQueryData(authQueries.tenants(token)),
        ];
        if (tenantId) {
            promises.push(
                queryClient.ensureQueryData(settingsQueries.detail(tenantId)),
                queryClient.ensureQueryData(balanceQueries.detail(tenantId)),
                queryClient.ensureQueryData(
                    leadsQueries.list(tenantId, {
                        pageSize: 1,
                        period: "today",
                    }),
                ),
            );
        }
        await Promise.all(promises).catch(() => {});
    },
    component: AppLayout,
    errorComponent: RouteErrorFallback,
});

function AppLayout() {
    const { tenantId, isMobile, token, dismissedBanners, sidebarTourSeen, issuesBannerCollapsed } =
        Route.useRouteContext();
    const pathname = useRouterState({
        select: (s) => s.location.pathname,
    });
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        ...settingsQueries.detail(tenantId!),
        retry: 2,
        enabled: !!tenantId,
    });
    const { data: me } = useQuery(authQueries.me(token));
    const settings = settingsData as
        | (SettingsResponse & { issues?: SettingsIssue[] })
        | undefined;
    const navigate = useNavigate();
    const isPlatformAdmin = me?.canAccessAdmin === true;

    const isSettingsFilled = !!(
        settings?.telegram &&
        "apiId" in settings.telegram &&
        settings.telegram.apiId &&
        "apiHash" in settings.telegram &&
        settings.telegram.apiHash
    );

    useEffect(() => {
        if (settingsLoading) return;

        if (!isSettingsFilled) {
            const canStayWithoutTenantSetup =
                pathname === "/settings" ||
                (isPlatformAdmin && pathname === "/prompts") ||
                isAdminImpersonating();
            if (!canStayWithoutTenantSetup) {
                navigate({ to: "/welcome" });
            }
        }
    }, [
        isSettingsFilled,
        settingsLoading,
        navigate,
        isPlatformAdmin,
        pathname,
    ]);

    // Live-check chat membership on mount, refresh settings after
    const qc = useQueryClient();
    useEffect(() => {
        if (!tenantId || !isSettingsFilled) return;
        let cancelled = false;
        settingsMutations.checkChatsAccess(tenantId).then(
            () => {
                if (!cancelled) {
                    qc.invalidateQueries({
                        queryKey: ["settings", "detail", tenantId],
                    });
                }
            },
            () => {},
        );
        return () => {
            cancelled = true;
        };
    }, [tenantId, isSettingsFilled, qc]);

    // Apply UTM pending data (prompt + source chats) for existing users
    const utmApplied = useRef(false);
    useEffect(() => {
        if (!tenantId || settingsLoading || utmApplied.current) return;
        if (!isSettingsFilled) return; // new user → will be handled in welcome-page
        const raw = sessionStorage.getItem("utm_pending");
        if (!raw) return;
        utmApplied.current = true;

        let utmData: UtmResolveData;
        try {
            utmData = JSON.parse(raw) as UtmResolveData;
        } catch {
            sessionStorage.removeItem("utm_pending");
            return;
        }

        (async () => {
            try {
                // Overwrite prompt
                if (utmData.promptContent) {
                    await promptsMutations.update(tenantId, {
                        id: 1,
                        criteriaPrompt: utmData.promptContent,
                    });
                }
                // Add source chats (existing ones are idempotent)
                if (utmData.chatUrls && utmData.chatUrls.length > 0) {
                    const addResults = await Promise.allSettled(
                        utmData.chatUrls.map((url) =>
                            settingsMutations.addSource(tenantId, url),
                        ),
                    );
                    const failed = addResults.filter((r) => r.status === "rejected").length;
                    if (failed > 0) {
                        snackbarStore.show(
                            `Настройки обновлены по UTM-ссылке (${failed} чатов не удалось добавить)`,
                        );
                    } else {
                        snackbarStore.show("Настройки обновлены по UTM-ссылке");
                    }
                } else {
                    snackbarStore.show("Промпт обновлён по UTM-ссылке");
                }
                sessionStorage.removeItem("utm_pending");
                qc.invalidateQueries({ queryKey: ["settings"] });
                qc.invalidateQueries({ queryKey: ["prompts"] });
            } catch {
                sessionStorage.removeItem("utm_pending");
            }
        })();
    }, [tenantId, settingsLoading, isSettingsFilled, qc]);

    const issues = settings?.issues ?? [];

    const { data: balanceData } = useQuery({
        ...balanceQueries.detail(tenantId!),
        enabled: !!tenantId,
    });

    const { data: leadsDataToday } = useQuery({
        ...leadsQueries.list(tenantId!, { pageSize: 1, period: "today" }),
        enabled: !!tenantId,
    });
    const leadsCountsToday = (
        leadsDataToday as { counts?: Record<string, number> } | undefined
    )?.counts;
    const pendingLeads = leadsCountsToday
        ? (leadsCountsToday.new ?? 0) + (leadsCountsToday.viewed ?? 0)
        : 0;

    const { visibleBanners, dismissBanner } = useBanners(
        issues,
        settings?.telegram,
        balanceData,
        pendingLeads,
        dismissedBanners,
    );

    if (isMobile) {
        return (
            <MobileLayout
                disabled={!isSettingsFilled}
                banners={visibleBanners}
                onDismissBanner={dismissBanner}
                issuesBannerCollapsed={issuesBannerCollapsed}
            />
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar disabled={!isSettingsFilled} />
            <SidebarInset
                topContent={<StoriesCarousel />}
                footerContent={<AppFooter />}
            >
                <BannerManager
                    banners={visibleBanners}
                    onDismiss={dismissBanner}
                    issuesBannerCollapsed={issuesBannerCollapsed}
                />
                <Outlet />
            </SidebarInset>
            {isSettingsFilled && (
                <SidebarTour initialSeen={sidebarTourSeen} />
            )}
        </SidebarProvider>
    );
}
