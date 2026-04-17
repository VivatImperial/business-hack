import { useMemo, useCallback, useState } from "react";
import Cookies from "js-cookie";
import type { SettingsIssue } from "@/features/settings/types";
import type { BalanceResponse, TelegramCredentials } from "@/lib/api/generated/schemas";
import { isVisibleIssue } from "@/features/settings/lib/issues";
import { IssueCode } from "@/features/settings/lib/issues";
import type { Banner } from "./banner-types";

const DISMISSED_COOKIE = "dismissed_banners";

function parseDismissedMap(raw: string | undefined): Record<string, boolean> {
    if (!raw) return {};
    try {
        return JSON.parse(raw) as Record<string, boolean>;
    } catch {
        return {};
    }
}

function persistDismissedMap(map: Record<string, boolean>) {
    Cookies.set(DISMISSED_COOKIE, JSON.stringify(map), { expires: 1 });
}

function buildBalanceBanner(balance: BalanceResponse): Banner | null {
    const { current, credit } = balance;
    const total = credit.total;
    if (total <= 0) return null;

    const percent = (current / total) * 100;

    if (current <= 0) {
        return {
            id: "treasury_empty",
            title: "Казна пуста",
            description:
                "Баланс сообщений исчерпан. Пополните баланс, чтобы продолжить поиск лидов.",
            variant: "error",
            isDismissible: true,
            action: { label: "Пополнить баланс", to: "/balance" },
        };
    }

    if (percent < 20) {
        return {
            id: "treasury_low",
            title: "Казна пустеет",
            description: `Осталось ${current.toLocaleString("ru-RU")} из ${total.toLocaleString("ru-RU")} сообщений. Пополните баланс заранее, чтобы не прерывать поиск лидов.`,
            variant: "warning",
            isDismissible: true,
            action: { label: "Пополнить", to: "/balance" },
        };
    }

    return null;
}

function buildIssuesBanner(issues: SettingsIssue[]): Banner | null {
    const visible = issues.filter(
        (i) => isVisibleIssue(i) && i.code !== IssueCode.QUOTA_EXHAUSTED,
    );

    if (visible.length === 0) return null;

    return {
        id: "issues",
        title: "Поиск лидов приостановлен",
        description: null,
        issues: visible,
        variant: "error",
        isDismissible: false,
    };
}

function buildPendingLeadsBanner(pendingLeads: number): Banner | null {
    if (pendingLeads <= 0) return null;

    return {
        id: "pending_leads",
        title: `${pendingLeads} необработанных`,
        description:
            "У вас есть новые лиды, которые ждут обработки. Перейдите в раздел лидов.",
        variant: "default",
        isDismissible: true,
        action: { label: "Перейти к лидам", to: "/leads" },
    };
}

function buildPausedScanBanner(telegram: TelegramCredentials | undefined): Banner | null {
    if (!telegram?.scanPaused) return null;

    return {
        id: "scan_paused",
        title: "Поиск лидов на паузе",
        description:
            "Сканирование Telegram остановлено вручную. Откройте настройки и возобновите поиск лидов.",
        variant: "warning",
        isDismissible: false,
        action: { label: "Возобновить", to: "/settings" },
    };
}

export function useBanners(
    issues: SettingsIssue[],
    telegram: TelegramCredentials | undefined,
    balance: BalanceResponse | undefined,
    pendingLeads: number,
    initialDismissed?: string,
) {
    const [dismissedState, setDismissedState] = useState(() =>
        parseDismissedMap(
            typeof document !== "undefined"
                ? Cookies.get(DISMISSED_COOKIE)
                : initialDismissed,
        ),
    );

    const banners = useMemo(() => {
        const result: Banner[] = [];

        // 1. Manual pause banner (highest priority)
        const pausedBanner = buildPausedScanBanner(telegram);
        if (pausedBanner) {
            result.push(pausedBanner);
        }

        // 2. Issues banner
        const issuesBanner = buildIssuesBanner(issues);
        if (issuesBanner) {
            result.push(issuesBanner);
        }

        // 3. Balance / treasury banners
        const hasQuotaExhausted = issues.some(
            (i) => i.code === IssueCode.QUOTA_EXHAUSTED,
        );

        if (balance) {
            const balanceBanner = buildBalanceBanner(balance);
            if (balanceBanner) {
                result.push(balanceBanner);
            }
        } else if (hasQuotaExhausted) {
            result.push({
                id: "treasury_empty",
                title: "Казна пуста",
                description:
                    "Баланс сообщений исчерпан. Пополните баланс, чтобы продолжить поиск лидов.",
                variant: "error",
                isDismissible: true,
                action: { label: "Пополнить баланс", to: "/balance" },
            });
        }

        // 4. Pending leads banner
        const leadsBanner = buildPendingLeadsBanner(pendingLeads);
        if (leadsBanner) {
            result.push(leadsBanner);
        }

        return result;
    }, [issues, telegram, balance, pendingLeads]);

    const visibleBanners = useMemo(
        () => banners.filter((b) => !b.isDismissible || !dismissedState[b.id]),
        [banners, dismissedState],
    );

    const dismissBanner = useCallback(
        (id: string) => {
            const banner = banners.find((b) => b.id === id);
            if (!banner?.isDismissible) return;
            setDismissedState((prev) => {
                const next = { ...prev, [id]: true };
                persistDismissedMap(next);
                return next;
            });
        },
        [banners],
    );

    return {
        banners,
        visibleBanners,
        totalCount: banners.length,
        unseenCount: visibleBanners.length,
        dismissBanner,
    };
}
