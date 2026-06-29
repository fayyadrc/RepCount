# RepCount Telegram Bot

A Telegram bot that lets you log workouts by sending plain-text messages — using the same AI parsing pipeline as the web app's Quick Log feature.

---

## How it works

```
You  ──(Telegram message)──▶  bot.py  ──(POST /api/log/quick)──▶  FastAPI backend
                                                                        │
                                                                  Groq LLM parsing
                                                                        │
                                                               Supabase gym_logs ✅
                                ◀──────── summary reply ────────────────┘
```

The bot sends your raw workout text to the protected `/api/log/quick` endpoint (authenticated with `BOT_API_KEY`), gets the parsed result, and replies with a formatted summary of every set that was logged.

---

## Setup

### 1. Install dependencies

```bash
cd telegram
pip install -r requirements.txt
```

Or use the shared virtual environment from the project root:
```bash
source .venv/bin/activate
pip install -r telegram/requirements.txt
```

### 2. Add environment variables to `backend/.env`

```dotenv
# Telegram bot token from @BotFather
TELEGRAM_TOKEN=your_bot_token_here

# Secret key the bot uses to authenticate with the FastAPI backend
# Set this to any strong random string (e.g. `openssl rand -hex 32`)
BOT_API_KEY=your_secret_key_here

# URL of the FastAPI /api/log/quick endpoint
# Local dev:
FASTAPI_ENDPOINT=http://localhost:8002/api/log/quick
# Production (Render):
# FASTAPI_ENDPOINT=https://your-app.onrender.com/api/log/quick

# Optional: restrict the bot to your own Telegram chat ID only.
# Find your ID by messaging @userinfobot on Telegram.
# TELEGRAM_ALLOWED_CHAT_ID=123456789
```

### 3. Run the bot

```bash
# From the project root (with venv active)
python telegram/bot.py
```

---

## Example messages

| You send | Result |
|----------|--------|
| `bench press 100kg 3x8, squat 120kg 4x5` | Logs 2 exercises, 7 sets total |
| `yesterday: deadlift 5 plates 1x5, rdl 80kg 3x10 rir 2` | Logs to yesterday's date |
| `OHP 60kg 4x6 to failure, lat pulldown 70kg 3x12` | Logs failure flag on OHP sets |

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and usage examples |
| `/help` | Help text |
| *(any text)* | Parse and log as a workout |

---

## Security

- The FastAPI `/api/log/quick` endpoint is protected by an `X-Bot-API-Key` header.
- The bot sends this key on every request. Requests without the correct key receive a `403 Forbidden`.
- Optionally set `TELEGRAM_ALLOWED_CHAT_ID` to restrict the bot to respond only to your personal Telegram account.

---

## Production deployment (Render)

To run the bot alongside your existing Render service, add a **second service** in `render.yaml`:

```yaml
- type: worker
  name: repcount-telegram-bot
  buildCommand: pip install -r telegram/requirements.txt
  startCommand: python telegram/bot.py
  envVars:
    - key: TELEGRAM_TOKEN
      sync: false
    - key: BOT_API_KEY
      sync: false
    - key: FASTAPI_ENDPOINT
      value: https://your-app.onrender.com/api/log/quick
```
