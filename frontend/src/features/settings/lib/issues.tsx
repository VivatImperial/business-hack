import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/shared/ui/tooltip";
import type { SettingsIssue, SourceChat } from "@/features/settings/types";
import { getDisplayErrorFromString } from "@/shared/lib/get-display-error";

export const IssueCode = {
    NO_SESSION: "no_session",
    SESSION_ERROR_AI: "session_error_ai",
    SESSION_ERROR_ACCESS: "session_error_access",
    SESSION_ERROR_AUTH: "session_error_auth",
    SESSION_ERROR_FLOOD: "session_error_flood",
    SESSION_ERROR_NETWORK: "session_error_network",
    SESSION_ERROR_BANNED: "session_error_banned",
    SESSION_ERROR_CHAT_INVALID: "session_error_chat_invalid",
    SESSION_ERROR_GENERIC: "session_error_generic",
    NO_SOURCES: "no_sources",
    UNRESOLVED_SOURCES: "unresolved_sources",
    NO_DESTINATION: "no_destination",
    DESTINATION_INACCESSIBLE: "destination_inaccessible",
    SOURCE_INACCESSIBLE: "source_inaccessible",
    SOURCE_USER_LEFT: "source_user_left",
    QUOTA_EXHAUSTED: "quota_exhausted",
    PROMPT_BLOCKED: "prompt_blocked",
} as const;

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
    const routerState = useRouterState();
    const isCurrentPage = routerState.location.pathname === to;

    if (isCurrentPage) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="underline underline-offset-2 opacity-50 cursor-default">
                        {children}
                    </span>
                </TooltipTrigger>
                <TooltipContent>Вы на нужной странице</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Link
            to={to}
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
            {children}
        </Link>
    );
}

type IssueData = Record<string, unknown>;

type IssueRenderer = (data?: IssueData) => React.ReactNode;

const RENDERERS: Record<string, IssueRenderer> = {
    [IssueCode.NO_SESSION]: () => (
        <>
            Telegram аккаунт не подключён.{" "}
            <NavLink to="/settings">Перейдите в Настройки</NavLink> →
            отсканируйте QR-код.
        </>
    ),
    [IssueCode.SESSION_ERROR_AI]: () => (
        <>
            AI временно не ответил. Telegram подключён, сканирование повторится
            автоматически.
        </>
    ),
    [IssueCode.SESSION_ERROR_ACCESS]: () => (
        <>
            Аккаунт не имеет доступа к одному из чатов. Вступите в нужные чаты
            или удалите недоступные в{" "}
            <NavLink to="/chats">разделе Чаты</NavLink>.
        </>
    ),
    [IssueCode.SESSION_ERROR_AUTH]: () => (
        <>
            Сессия Telegram устарела.{" "}
            <NavLink to="/settings">Переподключите аккаунт</NavLink> через
            QR-код.
        </>
    ),
    [IssueCode.SESSION_ERROR_FLOOD]: () => (
        <>
            Telegram временно ограничил запросы. Сканирование возобновится
            автоматически.
        </>
    ),
    [IssueCode.SESSION_ERROR_NETWORK]: () => (
        <>
            Проблема с подключением к Telegram. Сканирование возобновится
            автоматически.
        </>
    ),
    [IssueCode.SESSION_ERROR_BANNED]: () => (
        <>
            Аккаунт Telegram заблокирован.{" "}
            <NavLink to="/settings">Подключите другой аккаунт</NavLink> через
            QR-код.
        </>
    ),
    [IssueCode.SESSION_ERROR_CHAT_INVALID]: () => (
        <>
            Один из добавленных чатов больше не существует.{" "}
            <NavLink to="/chats">Проверьте список чатов</NavLink>.
        </>
    ),
    [IssueCode.SESSION_ERROR_GENERIC]: () => (
        <>
            Ошибка при сканировании чатов.{" "}
            <NavLink to="/settings">Проверьте Настройки</NavLink> или
            переподключите аккаунт.
        </>
    ),
    [IssueCode.NO_SOURCES]: () => (
        <>
            Не добавлены чаты для сканирования.{" "}
            <NavLink to="/chats">Перейдите в раздел Чаты</NavLink> → добавьте
            ссылки на чаты.
        </>
    ),
    [IssueCode.UNRESOLVED_SOURCES]: (data) => {
        const count = (data?.count as number | undefined) ?? 0;
        return (
            <>
                Не удалось найти {count} {count === 1 ? "чат" : "чатов"} из списка источников.{" "}
                <NavLink to="/chats">Проверьте ссылки</NavLink>.
            </>
        );
    },
    [IssueCode.NO_DESTINATION]: () => (
        <>
            Не указан чат для пересылки лидов.{" "}
            <NavLink to="/my-chat">Перейдите в Мой чат</NavLink> → создайте чат.
        </>
    ),
    [IssueCode.DESTINATION_INACCESSIBLE]: (data) => {
        const chatTitle = (data?.chatTitle as string | undefined) ?? (data?.chatId as string | undefined);
        const reason = data?.reason as string | undefined;
        return (
            <>
                Целевой чат{chatTitle ? ` «${chatTitle}»` : ""} недоступен
                {reason ? ` — ${reason}` : ""}.{" "}
                <NavLink to="/my-chat">Проверьте настройки чата</NavLink>.
            </>
        );
    },
    [IssueCode.SOURCE_INACCESSIBLE]: (data) => {
        const chatTitle = (data?.chatTitle as string | undefined) ?? (data?.chatId as string | undefined);
        const reason = data?.reason as string | undefined;
        return (
            <>
                Чат-источник{chatTitle ? ` «${chatTitle}»` : ""} недоступен
                {reason ? ` — ${reason}` : ""}.{" "}
                <NavLink to="/chats">Проверьте список чатов</NavLink>.
            </>
        );
    },
    [IssueCode.SOURCE_USER_LEFT]: (data) => {
        const count = (data?.count as number | undefined) ?? 0;
        return (
            <>
                Нет доступа к {count} {count === 1 ? "чату" : "чатам"} из списка источников.{" "}
                <NavLink to="/chats">Вступите обратно или удалите</NavLink>.
            </>
        );
    },
    [IssueCode.QUOTA_EXHAUSTED]: () => (
        <>
            Квота сообщений исчерпана. Обратитесь к менеджеру для пополнения
            баланса.
        </>
    ),
    [IssueCode.PROMPT_BLOCKED]: (data) => (
        <>
            Поиск лидов остановлен из-за рискованного промпта. Откройте{" "}
            <NavLink to="/settings">Настройки</NavLink> и исправьте критерии поиска.
            {data?.reason ? ` Причина: ${String(data.reason)}` : ""}
        </>
    ),
};

const SKIP_CODES = new Set<string>([IssueCode.SESSION_ERROR_AI]);

export function isVisibleIssue(issue: SettingsIssue): boolean {
    return !SKIP_CODES.has(issue.code);
}

export function renderIssueMessage(issue: SettingsIssue): React.ReactNode {
    const renderer = RENDERERS[issue.code];

    if (!renderer) {
        // Fallback: show a human-readable message for unknown issue codes
        const detail = issue.data?.detail as string | undefined;
        return getDisplayErrorFromString(detail, `Неизвестная проблема (${issue.code})`);
    }

    return renderer(issue.data);
}

/** Check if destination chat has an issue */
export function hasDestinationIssue(issues: SettingsIssue[]): boolean {
    return issues.some(
        (i) =>
            i.code === IssueCode.DESTINATION_INACCESSIBLE ||
            i.code === IssueCode.NO_DESTINATION,
    );
}

/** Per-chat error message derived from the chat's own status field. */
export function getChatIssueMessage(chat: SourceChat): string | null {
    switch (chat.status.kind) {
        case "user_left":
            return "Нет доступа к этому чату. Вступите в него или удалите из списка.";
        case "unresolved":
            return "Не удалось найти этот чат. Проверьте ссылку или удалите из списка.";
        case "ok":
            return null;
        default:
            return null;
    }
}
