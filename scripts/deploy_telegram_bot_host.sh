#!/usr/bin/env bash

set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 user@host [backend_base_url]" >&2
  exit 1
fi

HOST="$1"
BACKEND_BASE_URL="${2:-https://bereg.website}"
REMOTE_DIR="/opt/business-hack-telegram-bot"
SERVICE_NAME="bb-telegram-bot"

if [ ! -f ".env" ]; then
  echo "Expected .env in repository root." >&2
  exit 1
fi

TELEGRAM_BOT_TOKEN="$(python - <<'PY'
from pathlib import Path

values = {}
for line in Path(".env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    values[key] = value

token = values.get("TELEGRAM_BOT_TOKEN", "").strip()
if not token:
    raise SystemExit(1)
print(token)
PY
)"

git archive --format=tar HEAD | ssh "$HOST" "rm -rf \"$REMOTE_DIR\" && mkdir -p \"$REMOTE_DIR\" && tar -xf - -C \"$REMOTE_DIR\""

python - <<PY | ssh "$HOST" "cat > \"$REMOTE_DIR/telegram-bot/.env\""
print("TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}")
print("BACKEND_BASE_URL=${BACKEND_BASE_URL}")
print("BACKEND_TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}")
print("TELEGRAM_BOT_TIMEOUT_SECONDS=30")
PY

ssh "$HOST" "apt-get update && apt-get install -y python3-pip python3-venv >/dev/null"
ssh "$HOST" "cd \"$REMOTE_DIR/telegram-bot\" && python3 -m venv .venv && .venv/bin/pip install --upgrade pip >/dev/null && .venv/bin/pip install httpx pydantic-settings python-telegram-bot >/dev/null"
ssh "$HOST" "cat > /etc/systemd/system/${SERVICE_NAME}.service" < telegram-bot/deploy/bb-telegram-bot.service
ssh "$HOST" "systemctl daemon-reload && systemctl enable --now ${SERVICE_NAME} && systemctl status --no-pager ${SERVICE_NAME} | sed -n '1,20p'"
