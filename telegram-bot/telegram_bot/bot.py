from __future__ import annotations

from dataclasses import dataclass
from html import escape
from typing import Any

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from telegram_bot.backend_client import BackendClient, BackendClientError

ACTIVE_REQUEST_KEY = "active_request_id"
HELP_TEXT = """<b>Что умеет бот</b>
/start — краткий статус и меню
/help — список команд
/register &lt;email&gt; &lt;login&gt; &lt;password&gt; — создать аккаунт и привязать Telegram
/login &lt;email&gt; &lt;password&gt; — войти и привязать Telegram
/me — показать профиль
/newrequest &lt;title&gt; | &lt;description&gt; — создать обращение
/myrequests — показать заявки из Telegram
/request &lt;request_id&gt; — открыть заявку
/reply &lt;request_id&gt; &lt;text&gt; — ответить явно в заявку

<b>Быстрый режим</b>
Если у вас есть активная заявка, можно просто писать обычными сообщениями — бот отправит ответ в нее и сохранит историю для ассистента.
"""


@dataclass(slots=True)
class BotContext:
    backend: BackendClient


def _telegram_identity(update: Update) -> tuple[str, str | None]:
    user = update.effective_user
    if user is None:
        raise BackendClientError("Telegram user context is not available.")
    return str(user.id), user.username


def _message(update: Update):
    message = update.effective_message
    if message is None:
        raise BackendClientError("Telegram message context is not available.")
    return message


def _status_label(status: str) -> str:
    return {
        "open": "Открыта",
        "in_progress": "В работе",
        "closed": "Закрыта",
    }.get(status, status)


def _trim_title(text: str) -> str:
    normalized = " ".join(text.split()).strip()
    if len(normalized) <= 60:
        return normalized or "Новое обращение"
    return f"{normalized[:60]}..."


def _main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("Активная заявка", callback_data="active"),
                InlineKeyboardButton("Мои заявки", callback_data="list"),
            ],
        ]
    )


def _request_keyboard(request: dict[str, Any]) -> InlineKeyboardMarkup:
    request_id = str(request["id"])
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton("Открыть заявку", callback_data=f"show:{request_id}"),
            InlineKeyboardButton("Мои заявки", callback_data="list"),
        ]
    ]
    if bool(request.get("can_self_close")) and request.get("status") != "closed":
        rows.insert(
            0,
            [InlineKeyboardButton("Закрыть и оценить", callback_data=f"close:{request_id}")],
        )
    if bool(request.get("awaiting_csat")):
        rows.insert(
            0,
            [
                InlineKeyboardButton("1", callback_data=f"rate:{request_id}:1"),
                InlineKeyboardButton("2", callback_data=f"rate:{request_id}:2"),
                InlineKeyboardButton("3", callback_data=f"rate:{request_id}:3"),
                InlineKeyboardButton("4", callback_data=f"rate:{request_id}:4"),
                InlineKeyboardButton("5", callback_data=f"rate:{request_id}:5"),
            ],
        )
    return InlineKeyboardMarkup(rows)


def _request_picker_keyboard(items: list[dict[str, Any]]) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                f"{item['id']} · {_status_label(str(item.get('status')))}",
                callback_data=f"pick:{item['id']}",
            )
        ]
        for item in items[:8]
    ]
    rows.append([InlineKeyboardButton("Мои заявки", callback_data="list")])
    return InlineKeyboardMarkup(rows)


def _latest_turn_assistant_reply(request: dict[str, object]) -> str | None:
    messages = request.get("messages", [])
    if not isinstance(messages, list) or not messages:
        return None
    last_message = messages[-1]
    if not isinstance(last_message, dict) or last_message.get("role") != "assistant":
        return None
    text = last_message.get("text")
    if isinstance(text, str) and text.strip():
        return text.strip()
    return None


def _format_request_card(request: dict[str, Any], *, include_messages: bool = False) -> str:
    lines = [
        f"<b>{escape(str(request.get('title') or 'Без названия'))}</b>",
        f"ID: <code>{escape(str(request['id']))}</code>",
        f"Статус: <b>{escape(_status_label(str(request.get('status') or 'open')))}</b>",
    ]
    description = str(request.get("description") or "").strip()
    if description:
        lines.append(f"Описание: {escape(description)}")
    if request.get("awaiting_csat"):
        lines.append("Ожидается оценка решения по шкале от 1 до 5.")
    elif request.get("can_self_close"):
        lines.append("Проблема выглядит решенной. Можно закрыть заявку и поставить оценку.")

    if include_messages:
        messages = request.get("messages", [])
        if isinstance(messages, list) and messages:
            lines.append("")
            lines.append("<b>Последние сообщения</b>")
            for message in messages[-4:]:
                if not isinstance(message, dict):
                    continue
                role = "Вы" if message.get("role") == "user" else "Ассистент"
                text = str(message.get("text") or "").strip()
                if text:
                    lines.append(f"{role}: {escape(text)}")
    return "\n".join(lines)


def _format_request_list(items: list[dict[str, Any]]) -> str:
    lines = ["<b>Ваши заявки</b>"]
    for item in items[:10]:
        title = escape(str(item.get("title") or "Без названия"))
        lines.append(
            f"• <code>{escape(str(item['id']))}</code> — {_status_label(str(item.get('status')))} — {title}"
        )
    return "\n".join(lines)


def _store_active_request(context: ContextTypes.DEFAULT_TYPE, request_id: str | None) -> None:
    if request_id is None:
        context.user_data.pop(ACTIVE_REQUEST_KEY, None)
        return
    context.user_data[ACTIVE_REQUEST_KEY] = request_id


async def _reply(
    update: Update,
    text: str,
    *,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> None:
    await _message(update).reply_text(
        text,
        parse_mode=ParseMode.HTML,
        disable_web_page_preview=True,
        reply_markup=reply_markup,
    )


async def _resolve_token(update: Update, backend: BackendClient) -> str | None:
    telegram_user_id, telegram_username = _telegram_identity(update)
    return await backend.telegram_login(
        telegram_user_id=telegram_user_id,
        telegram_username=telegram_username,
    )


async def _resolve_active_request(
    *,
    backend: BackendClient,
    token: str,
    context: ContextTypes.DEFAULT_TYPE,
) -> tuple[dict[str, Any] | None, bool]:
    active_request_id = context.user_data.get(ACTIVE_REQUEST_KEY)
    if isinstance(active_request_id, str):
        request = await backend.get_request(token=token, request_id=active_request_id)
        if request.get("status") != "closed" or request.get("awaiting_csat"):
            return request, False
        _store_active_request(context, None)

    items = await backend.list_requests(token=token)
    open_items = [
        item for item in items if isinstance(item, dict) and item.get("status") != "closed"
    ]
    if not open_items:
        return None, False

    sorted_items = sorted(
        open_items,
        key=lambda item: str(item.get("updated_at") or item.get("created_at") or ""),
        reverse=True,
    )
    request = await backend.get_request(token=token, request_id=str(sorted_items[0]["id"]))
    return request, len(sorted_items) > 1


async def _show_request_result(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    request: dict[str, Any],
    *,
    created: bool = False,
) -> None:
    _store_active_request(context, str(request["id"]))
    lines = [
        "<b>Обращение создано</b>" if created else "<b>Сообщение отправлено</b>",
        _format_request_card(request),
    ]
    assistant_reply = _latest_turn_assistant_reply(request)
    if assistant_reply:
        lines.extend(["", "<b>Ответ ассистента</b>", escape(assistant_reply)])
    elif request.get("awaiting_csat"):
        lines.extend(["", "Заявка закрыта. Поставьте оценку по кнопкам ниже."])
    elif request.get("can_self_close"):
        lines.extend(["", "Если вопрос решен, можно сразу закрыть заявку и оценить ответ."])

    await _reply(
        update,
        "\n".join(lines),
        reply_markup=_request_keyboard(request),
    )


async def _show_request_details(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    request: dict[str, Any],
) -> None:
    _store_active_request(context, str(request["id"]))
    await _reply(
        update,
        _format_request_card(request, include_messages=True),
        reply_markup=_request_keyboard(request),
    )


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(
            update,
            "Аккаунт еще не привязан. Используйте /register или /login.\n\n" + HELP_TEXT,
            reply_markup=_main_keyboard(),
        )
        return

    profile = await bot_context.backend.get_me(token)
    await _reply(
        update,
        f"Вы вошли как <b>{escape(str(profile['login']))}</b> ({escape(str(profile['email']))}).\n\n{HELP_TEXT}",
        reply_markup=_main_keyboard(),
    )


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply(update, HELP_TEXT, reply_markup=_main_keyboard())


async def register_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if len(context.args) != 3:
        await _reply(update, "Формат: <code>/register &lt;email&gt; &lt;login&gt; &lt;password&gt;</code>")
        return

    email, login, password = context.args
    bot_context: BotContext = context.application.bot_data["context"]
    telegram_user_id, telegram_username = _telegram_identity(update)
    token = await bot_context.backend.register(
        email=email,
        login=login,
        password=password,
        telegram_user_id=telegram_user_id,
        telegram_username=telegram_username,
    )
    profile = await bot_context.backend.get_me(token)
    await _reply(
        update,
        f"Аккаунт создан и привязан: <b>{escape(str(profile['login']))}</b> ({escape(str(profile['email']))}).",
        reply_markup=_main_keyboard(),
    )


async def login_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if len(context.args) != 2:
        await _reply(update, "Формат: <code>/login &lt;email&gt; &lt;password&gt;</code>")
        return

    email, password = context.args
    bot_context: BotContext = context.application.bot_data["context"]
    telegram_user_id, telegram_username = _telegram_identity(update)
    token = await bot_context.backend.login(
        email=email,
        password=password,
        telegram_user_id=telegram_user_id,
        telegram_username=telegram_username,
    )
    profile = await bot_context.backend.get_me(token)
    await _reply(
        update,
        f"Telegram привязан к аккаунту <b>{escape(str(profile['login']))}</b>.",
        reply_markup=_main_keyboard(),
    )


async def me_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    profile = await bot_context.backend.get_me(token)
    await _reply(
        update,
        "\n".join(
            [
                f"ID: <code>{escape(str(profile['id']))}</code>",
                f"Логин: <b>{escape(str(profile['login']))}</b>",
                f"Email: {escape(str(profile['email']))}",
                f"Telegram: {escape(str(profile['telegram_username'] or 'без username'))}",
            ]
        ),
        reply_markup=_main_keyboard(),
    )


async def new_request_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    payload = " ".join(context.args).strip()
    if "|" not in payload:
        await _reply(update, "Формат: <code>/newrequest &lt;title&gt; | &lt;description&gt;</code>")
        return

    title, description = [part.strip() for part in payload.split("|", maxsplit=1)]
    if not title or not description:
        await _reply(update, "И заголовок, и описание должны быть заполнены.")
        return

    request = await bot_context.backend.create_request(
        token=token,
        title=title,
        description=description,
    )
    await _show_request_result(update, context, request, created=True)


async def my_requests_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    items = await bot_context.backend.list_requests(token=token)
    if not items:
        await _reply(update, "У вас пока нет Telegram-обращений.", reply_markup=_main_keyboard())
        return

    await _reply(
        update,
        _format_request_list(items),
        reply_markup=_request_picker_keyboard(items),
    )


async def request_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    if len(context.args) != 1:
        await _reply(update, "Формат: <code>/request &lt;request_id&gt;</code>")
        return

    request = await bot_context.backend.get_request(token=token, request_id=context.args[0])
    await _show_request_details(update, context, request)


async def reply_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    if len(context.args) < 2:
        await _reply(update, "Формат: <code>/reply &lt;request_id&gt; &lt;text&gt;</code>")
        return

    request_id = context.args[0]
    text = " ".join(context.args[1:]).strip()
    request = await bot_context.backend.add_message(
        token=token,
        request_id=request_id,
        text=text,
        source_message_id=str(_message(update).message_id),
    )
    await _show_request_result(update, context, request)


async def text_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    text = _message(update).text.strip()
    active_request, ambiguous = await _resolve_active_request(
        backend=bot_context.backend,
        token=token,
        context=context,
    )

    if active_request and active_request.get("awaiting_csat"):
        if text in {"1", "2", "3", "4", "5"}:
            await bot_context.backend.submit_rating(
                token=token,
                request_id=str(active_request["id"]),
                score=int(text),
            )
            _store_active_request(context, None)
            await _reply(
                update,
                "Спасибо! Оценка сохранена, заявка полностью завершена.",
                reply_markup=_main_keyboard(),
            )
            return
        await _reply(
            update,
            "Заявка уже закрыта. Поставьте оценку от 1 до 5 кнопками ниже или отправьте число сообщением.",
            reply_markup=_request_keyboard(active_request),
        )
        return

    if ambiguous and ACTIVE_REQUEST_KEY not in context.user_data:
        items = await bot_context.backend.list_requests(token=token)
        open_items = [item for item in items if item.get("status") != "closed"]
        await _reply(
            update,
            "У вас несколько активных заявок. Выберите, в какую отправить сообщение.",
            reply_markup=_request_picker_keyboard(open_items),
        )
        return

    if active_request is None:
        request = await bot_context.backend.create_request(
            token=token,
            title=_trim_title(text),
            description=text,
        )
        await _show_request_result(update, context, request, created=True)
        return

    request = await bot_context.backend.add_message(
        token=token,
        request_id=str(active_request["id"]),
        text=text,
        source_message_id=str(_message(update).message_id),
    )
    await _show_request_result(update, context, request)


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()

    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await _reply(update, "Сначала используйте /register или /login.")
        return

    data = query.data or ""
    if data == "list":
        items = await bot_context.backend.list_requests(token=token)
        if not items:
            await _reply(update, "У вас пока нет Telegram-обращений.", reply_markup=_main_keyboard())
            return
        await _reply(update, _format_request_list(items), reply_markup=_request_picker_keyboard(items))
        return

    if data == "active":
        request, ambiguous = await _resolve_active_request(
            backend=bot_context.backend,
            token=token,
            context=context,
        )
        if request is None:
            await _reply(
                update,
                "Активной заявки нет. Напишите сообщение, и я создам новую заявку автоматически.",
                reply_markup=_main_keyboard(),
            )
            return
        if ambiguous and ACTIVE_REQUEST_KEY not in context.user_data:
            items = await bot_context.backend.list_requests(token=token)
            open_items = [item for item in items if item.get("status") != "closed"]
            await _reply(
                update,
                "У вас несколько активных заявок. Выберите нужную.",
                reply_markup=_request_picker_keyboard(open_items),
            )
            return
        await _show_request_details(update, context, request)
        return

    if data.startswith("pick:") or data.startswith("show:"):
        request_id = data.split(":", maxsplit=1)[1]
        request = await bot_context.backend.get_request(token=token, request_id=request_id)
        await _show_request_details(update, context, request)
        return

    if data.startswith("close:"):
        request_id = data.split(":", maxsplit=1)[1]
        await bot_context.backend.close_request(token=token, request_id=request_id)
        request = await bot_context.backend.get_request(token=token, request_id=request_id)
        await _show_request_details(update, context, request)
        return

    if data.startswith("rate:"):
        _, request_id, score = data.split(":", maxsplit=2)
        await bot_context.backend.submit_rating(
            token=token,
            request_id=request_id,
            score=int(score),
        )
        _store_active_request(context, None)
        await _reply(
            update,
            "Спасибо! Оценка сохранена, заявка полностью завершена.",
            reply_markup=_main_keyboard(),
        )


async def error_handler(
    update: object,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:
    if isinstance(context.error, BackendClientError) and isinstance(update, Update):
        await _reply(update, escape(str(context.error)))
        return
    raise context.error


def build_application(backend: BackendClient, token: str) -> Application:
    application = (
        Application.builder()
        .token(token)
        .connect_timeout(30)
        .read_timeout(30)
        .write_timeout(30)
        .pool_timeout(30)
        .build()
    )
    application.bot_data["context"] = BotContext(backend=backend)
    application.add_handler(CommandHandler("start", start_handler))
    application.add_handler(CommandHandler("help", help_handler))
    application.add_handler(CommandHandler("register", register_handler))
    application.add_handler(CommandHandler("login", login_handler))
    application.add_handler(CommandHandler("me", me_handler))
    application.add_handler(CommandHandler("newrequest", new_request_handler))
    application.add_handler(CommandHandler("myrequests", my_requests_handler))
    application.add_handler(CommandHandler("request", request_handler))
    application.add_handler(CommandHandler("reply", reply_handler))
    application.add_handler(CallbackQueryHandler(callback_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_message_handler))
    application.add_error_handler(error_handler)
    return application
