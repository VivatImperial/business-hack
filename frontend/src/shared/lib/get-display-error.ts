import { DEFAULT_ERROR_MESSAGE } from "@/shared/config/error-messages";

const CYRILLIC_RE = /[\u0400-\u04FF]/;

/**
 * Возвращает текст ошибки для показа пользователю.
 * - Если в сообщении есть кириллица — считаем его осмысленным (русский ответ
 *   бэкенда или явный fallback фронта) и показываем как есть.
 * - Иначе (английский технический detail, "HTTP 500", "Failed to fetch", и т.п.)
 *   — показываем `fallback`, либо DEFAULT_ERROR_MESSAGE если fallback не передан.
 *
 * Контекстный fallback (например "Не удалось получить QR-код") сохраняется
 * в call-site'е, потому что он часто содержательнее общей константы.
 */
export function getDisplayError(err: unknown, fallback?: string): string {
    const raw = err instanceof Error ? err.message : "";
    if (raw && CYRILLIC_RE.test(raw)) return raw;
    return fallback ?? DEFAULT_ERROR_MESSAGE;
}

/**
 * То же, что getDisplayError, но для случаев, когда у нас на руках уже строка
 * (например `errData.detail` из распарсенного JSON), а не Error.
 */
export function getDisplayErrorFromString(
    detail: string | undefined | null,
    fallback?: string,
): string {
    if (detail && CYRILLIC_RE.test(detail)) return detail;
    return fallback ?? DEFAULT_ERROR_MESSAGE;
}
