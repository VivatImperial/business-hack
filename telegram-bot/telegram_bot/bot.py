from __future__ import annotations

from dataclasses import dataclass

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from telegram_bot.backend_client import BackendClient, BackendClientError


HELP_TEXT = """Доступные команды:
/start - краткий статус и подсказка
/help - список команд
/register <email> <login> <password> - создать аккаунт и привязать Telegram
/login <email> <password> - войти и привязать Telegram
/me - показать профиль
/newrequest <title> | <description> - создать обращение
/myrequests - показать последние обращения из Telegram
/request <request_id> - показать одно обращение
/reply <request_id> <text> - отправить сообщение в обращение
"""


@dataclass(slots=True)
class BotContext:
    backend: BackendClient


def _telegram_identity(update: Update) -> tuple[str, str | None]:
    user = update.effective_user
    if user is None:
        raise BackendClientError("Telegram user context is not available.")
    return str(user.id), user.username


def _latest_assistant_reply(request: dict[str, object]) -> str | None:
    messages = request.get("messages", [])
    if not isinstance(messages, list):
        return None
    for message in reversed(messages):
        if isinstance(message, dict) and message.get("role") == "assistant":
            text = message.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()
    return None


async def _resolve_token(update: Update, backend: BackendClient) -> str | None:
    telegram_user_id, telegram_username = _telegram_identity(update)
    return await backend.telegram_login(
        telegram_user_id=telegram_user_id,
        telegram_username=telegram_username,
    )


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await update.effective_message.reply_text(
            "Аккаунт еще не привязан. Используйте /register или /login.\n\n" + HELP_TEXT
        )
        return

    profile = await bot_context.backend.get_me(token)
    await update.effective_message.reply_text(
        f"Вы вошли как {profile['login']} ({profile['email']}).\n\n{HELP_TEXT}"
    )


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(HELP_TEXT)


async def register_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if len(context.args) != 3:
        await update.effective_message.reply_text(
            "Формат: /register <email> <login> <password>"
        )
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
    await update.effective_message.reply_text(
        f"Аккаунт создан и привязан: {profile['login']} ({profile['email']})."
    )


async def login_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if len(context.args) != 2:
        await update.effective_message.reply_text("Формат: /login <email> <password>")
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
    await update.effective_message.reply_text(
        f"Telegram привязан к аккаунту {profile['login']}."
    )


async def me_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await update.effective_message.reply_text("Сначала используйте /register или /login.")
        return

    profile = await bot_context.backend.get_me(token)
    await update.effective_message.reply_text(
        "\n".join(
            [
                f"ID: {profile['id']}",
                f"Логин: {profile['login']}",
                f"Email: {profile['email']}",
                f"Telegram: {profile['telegram_username'] or 'без username'}",
            ]
        )
    )


async def new_request_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await update.effective_message.reply_text("Сначала используйте /register или /login.")
        return

    payload = " ".join(context.args).strip()
    if "|" not in payload:
        await update.effective_message.reply_text(
            "Формат: /newrequest <title> | <description>"
        )
        return

    title, description = [part.strip() for part in payload.split("|", maxsplit=1)]
    if not title or not description:
        await update.effective_message.reply_text(
            "И заголовок, и описание должны быть заполнены."
        )
        return

    request = await bot_context.backend.create_request(
        token=token,
        title=title,
        description=description,
    )
    assistant_reply = _latest_assistant_reply(request)
    reply_lines = [f"Обращение создано: {request['id']} ({request['status']})."]
    if assistant_reply:
        reply_lines.extend(["", assistant_reply])
    await update.effective_message.reply_text(
        "\n".join(reply_lines)
    )


async def my_requests_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await update.effective_message.reply_text("Сначала используйте /register или /login.")
        return

    items = await bot_context.backend.list_requests(token=token)
    if not items:
        await update.effective_message.reply_text("У вас пока нет Telegram-обращений.")
        return

    lines = [
        f"{item['id']} | {item['status']} | {item.get('title') or 'Без названия'}"
        for item in items[:10]
    ]
    await update.effective_message.reply_text("\n".join(lines))


async def request_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await update.effective_message.reply_text("Сначала используйте /register или /login.")
        return

    if len(context.args) != 1:
        await update.effective_message.reply_text("Формат: /request <request_id>")
        return

    request = await bot_context.backend.get_request(token=token, request_id=context.args[0])
    message_lines = [
        f"[{message['role']}] {message.get('author_login') or 'system'}: {message['text']}"
        for message in request["messages"][-5:]
    ]
    await update.effective_message.reply_text(
        "\n".join(
            [
                f"ID: {request['id']}",
                f"Статус: {request['status']}",
                f"Тема: {request.get('title') or 'Без названия'}",
                f"Описание: {request.get('description') or '-'}",
                "",
                *message_lines,
            ]
        )
    )


async def reply_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    bot_context: BotContext = context.application.bot_data["context"]
    token = await _resolve_token(update, bot_context.backend)
    if token is None:
        await update.effective_message.reply_text("Сначала используйте /register или /login.")
        return

    if len(context.args) < 2:
        await update.effective_message.reply_text("Формат: /reply <request_id> <text>")
        return

    request_id = context.args[0]
    text = " ".join(context.args[1:]).strip()
    request = await bot_context.backend.add_message(
        token=token,
        request_id=request_id,
        text=text,
        source_message_id=str(update.effective_message.message_id),
    )
    assistant_reply = _latest_assistant_reply(request)
    reply_lines = [f"Сообщение добавлено в {request['id']}. Всего сообщений: {len(request['messages'])}."]
    if assistant_reply:
        reply_lines.extend(["", assistant_reply])
    await update.effective_message.reply_text(
        "\n".join(reply_lines)
    )


async def error_handler(
    update: object,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:
    if isinstance(context.error, BackendClientError) and isinstance(update, Update):
        await update.effective_message.reply_text(str(context.error))
        return
    raise context.error


def build_application(backend: BackendClient, token: str) -> Application:
    application = Application.builder().token(token).build()
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
    application.add_error_handler(error_handler)
    return application
