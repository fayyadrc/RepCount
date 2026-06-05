# RepCount — Codebase Overview

RepCount (GymTrackerAI) is a full-stack fitness analytics platform that unifies manual gym workout logs and Strava activity data into a single dashboard. The standout feature is **Quick Log**: a natural-language input interface that uses LLMs to parse unstructured workout notes into structured database records.

---

## Architecture

The app is a **monorepo** with a Python FastAPI backend and a React (Vite) frontend. In production, both are served from a single Render web service — the backend builds the frontend and serves the compiled SPA from `frontend/dist`.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / PWA                        │
│              React 19 + TypeScript + Tailwind CSS           │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api/* (proxied in dev)
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI (Uvicorn)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ History  │ │ Strava   │ │Analytics │ │ Health       │   │
│  │ Module   │ │ Module   │ │ Module   │ │ Module       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────┘   │
│       │            │            │                           │
│       └────────────┴────────────┴──► Supabase (PostgreSQL)  │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   Groq / OpenRouter              Strava API v3
   (LLM parsing)                  (activity sync)
```

### Background jobs (APScheduler)

On startup, the backend runs two scheduled tasks:

| Job | Interval | Purpose |
|-----|----------|---------|
| `sync_strava_data` | Every 12 hours | Pulls new Strava activities and upserts them into Supabase |
| `keep_alive_ping` | Every 14 minutes | Pings the service to prevent Render free-tier spin-down |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, Framer Motion, Recharts |
| UI primitives | Radix UI (dialog, toast, slot), Lucide icons |
| PWA | `vite-plugin-pwa` — installable as "RepCount Gym Tracker" |
| Backend | Python 3.12, FastAPI, Uvicorn, APScheduler |
| Database | Supabase (PostgreSQL) via `supabase-py` |
| AI parsing | Groq (`llama-3.3-70b-versatile`) with OpenRouter fallback |
| Deployment | Render (single combined web service) |

---

## Project Structure

```
GymTrackerAI/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, SPA serving, scheduler
│   │   ├── core/config.py          # Environment settings
│   │   ├── db/supabase.py          # Supabase client singleton
│   │   └── modules/
│   │       ├── analytics/          # Stats, recommendations, muscle mapping
│   │       ├── health/             # Health checks, keep-alive ping
│   │       ├── history/            # Workout history, quick log, CRUD
│   │       └── strava/             # Strava OAuth + sync
│   ├── dev_tools/                  # Data ingestion scripts, DB tests
│   ├── data/                       # Processed gym data (CSV/JSON)
│   ├── schema.sql                  # Base gym_logs table schema
│   └── supabase_rls_policies.sql   # Row-level security policies
├── frontend/
│   └── src/
│       ├── App.tsx                 # View routing, error boundaries
│       ├── components/
│       │   ├── layout/             # Shell, nav bar, notes input
│       │   ├── ui/                 # Reusable UI (button, dialog, table…)
│       │   └── views/              # Feature screens (see below)
│       ├── hooks/                  # Theme, toast
│       └── lib/                    # API client, types, workout store
├── dev.sh                          # Local dev: backend + frontend
├── render.yaml                     # Render deployment config
└── requirements.txt                # Python dependencies
```

---

## Frontend Views

The app uses client-side view state (no React Router). Navigation is handled via a floating bottom nav bar on mobile and a sidebar on desktop.

| View | File | Description |
|------|------|-------------|
| **Quick Log** | `QuickLog.tsx` | Natural-language workout entry; drafts autosaved to `localStorage` |
| **Next Session** | `NextSession.tsx` | Mock progressive-overload suggestions based on recent logs |
| **History** | `History.tsx` | Chronological list of merged gym + Strava sessions |
| **Workout Details** | `WorkoutDetails.tsx` | Drill-down into a single session's entries and Strava activities |
| **Analytics** | `Analytics.tsx` | Volume charts, exercise progress, split-based recommendations |
| **AI Insights** | `AI_Insights.tsx` | Placeholder — "Coming Soon" for deeper AI analytics |
| **Profile** | `Profile.tsx` | Activity calendar, theme toggle (light/dark) |
| **Data Health** | `DataHealth.tsx` | Rule-based anomaly detection (unrealistic weights, suspicious units, etc.) |

### State management

`workout-store.tsx` provides a React Context + reducer that:

- Fetches merged history from `/api/history` on mount
- Optimistically adds sessions after Quick Log
- Exposes `sessions`, `loading`, and `error` to all views

---

## Backend Modules

### History (`/api/history`, `/api/log/quick`)

The core data pipeline:

1. **GET `/api/history`** — Fetches `gym_logs` and `strava_activities` from Supabase, merges them by date into `WorkoutSession` objects with computed volume, reps, duration, and heart rate.
2. **POST `/api/log/quick`** — Accepts `{ raw_text: "..." }`, sends it to Groq (or OpenRouter fallback) for structured JSON extraction, enriches each entry with muscle group metadata, and bulk-inserts into `gym_logs`.
3. **PUT/DELETE `/api/history/log/{id}`** — Update or delete individual log entries.

The LLM parser handles exercise normalization, weight/unit inference (kg vs plates), RIR, failure flags, and relative date resolution ("yesterday", "today").

### Analytics (`/api/analytics`, `/api/recommendations`)

- **GET `/api/analytics`** — Dashboard stats: total workouts, weekly count, volume per muscle group, exercise-level history with estimated 1RM.
- **GET `/api/recommendations`** — Per-exercise next-session weight recommendations using the `recommendation_service` engine (EWMA smoothing, fatigue detection, category-aware increments).
- **GET `/api/recommendations/dynamic`** — Auto-discovers exercises from logs, groups them into Push/Pull/Legs splits, and generates recommendations for each.

### Strava (`/api/strava/sync`)

- **POST `/api/strava/sync`** — Triggers a background Strava sync.
- The sync service refreshes OAuth tokens, paginates through activities (filtered by a configurable `after` timestamp), fetches detailed activity data, and upserts into `strava_activities` in batches of 100.

### Health (`/api/health`)

- **GET `/api/health`** — Returns backend and Supabase connectivity status (used by Render health checks).
- **GET `/api/health/keep-alive`** — Manual keep-alive trigger.

---

## Recommendation Engine

`recommendation_service.py` is a deterministic, sports-science-grounded engine (not LLM-based):

```
Raw gym_logs → e1RM calculation → EWMA baseline → Fatigue detection → Load increment → Confidence score
```

| Fatigue State | Drop from EWMA | Action |
|---------------|----------------|--------|
| Clear | 0–14% | Full increment (+5 kg lower compound, +2.5 kg upper, +1 kg isolation) |
| Overreaching | 15–29% | Half increment |
| Severe fatigue | ≥30% | Hold or deload |
| New | No history | Default weight from split config |

Exercise categories and muscle groups are resolved via `muscle_mapping.py` — a large lookup table with fuzzy matching for exercise name variations.

---

## Database

### Tables

**`gym_logs`** — One row per set. Key fields: `date`, `exercise`, `weight`, `weight_unit`, `reps`, `set_number`, `to_failure`, `rir`, `notes`, `exercise_group`, `sub_muscle_group`.

**`strava_activities`** — Synced Strava data. Key fields: `id`, `name`, `type`, `start_date`, `distance_meters`, `duration_seconds`, `avg_heartrate`, `max_heartrate`, `elevation_gain`, `calories`.

### Security

`supabase_rls_policies.sql` enables Row Level Security with permissive anon policies (select/insert/update/delete) so the backend can operate with a Supabase anon key. The base `schema.sql` disables RLS for initial setup — use the RLS policies file for production.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (backend + database) |
| `GET` | `/api/history` | Merged workout history (gym + Strava) |
| `POST` | `/api/log/quick` | Parse and log a natural-language workout |
| `PUT` | `/api/history/log/{id}` | Update a gym log entry |
| `DELETE` | `/api/history/log/{id}` | Delete a gym log entry |
| `POST` | `/api/strava/sync` | Trigger Strava data sync |
| `GET` | `/api/analytics` | Dashboard analytics |
| `GET` | `/api/recommendations` | Per-exercise weight recommendations |
| `GET` | `/api/recommendations/dynamic` | Auto-discovered split recommendations |
| `GET` | `/docs` | FastAPI auto-generated API docs |

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Supabase anon/service key |
| `GROQ_API_KEY` | For Quick Log | Primary LLM provider for workout parsing |
| `OPENROUTER_API_KEY` | Fallback | Secondary LLM provider |
| `STRAVA_CLIENT_ID` | For Strava sync | Strava OAuth client ID |
| `STRAVA_CLIENT_SECRET` | For Strava sync | Strava OAuth client secret |
| `STRAVA_REFRESH_TOKEN` | For Strava sync | Long-lived Strava refresh token |

Create a `.env` file in the project root (gitignored). Render env vars are configured in `render.yaml`.

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+
- A Supabase project with `gym_logs` and `strava_activities` tables

### Quick start

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Set up environment variables
cp .env.example .env   # then fill in your keys

# 4. Run both services
./dev.sh
```

`dev.sh` starts the FastAPI backend on port **8002** and the Vite dev server on port **5173**. Vite proxies `/api` requests to the backend.

### Dev tools

Scripts in `backend/dev_tools/` support one-off data operations:

| Script | Purpose |
|--------|---------|
| `data_scripts/ingest_gym.py` | Import gym data from CSV/JSON into Supabase |
| `data_scripts/ingest_strava.py` | Import Strava activity data |
| `data_scripts/extract_strava.py` | Extract raw Strava API responses |
| `test_db.py` | Verify Supabase connectivity |
| `test_strava.py` | Test Strava API integration |
| `findModel.py` | Explore available LLM models |

---

## Deployment (Render)

`render.yaml` defines a single web service:

1. **Build**: `cd frontend && npm install && npm run build && pip install -r requirements.txt`
2. **Start**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
3. **Health check**: `/api/health`

The FastAPI app serves the built frontend as a SPA — all non-API routes fall through to `index.html`.

---

## Key Design Decisions

- **Single-service deployment** — Backend and frontend are bundled into one Render service to avoid CORS complexity and reduce hosting cost.
- **LLM for parsing only** — AI is used exclusively for natural-language → structured data conversion. Recommendations and analytics are deterministic algorithms.
- **Date-based merging** — Gym logs and Strava activities are joined by calendar date, not by explicit session IDs, so a day with both a gym session and a run appears as one unified session.
- **Muscle mapping as code** — Exercise → muscle group resolution lives in a Python dictionary (`muscle_mapping.py`) rather than a database table, with fuzzy matching for name variations.
- **PWA support** — The frontend is installable on mobile devices via the Vite PWA plugin, making Quick Log accessible from the gym floor.

---

## Current Limitations & Roadmap

| Area | Status |
|------|--------|
| Quick Log (LLM parsing) | Production-ready |
| Strava sync | Production-ready (12-hour interval) |
| Analytics dashboard | Production-ready |
| Recommendation engine | Production-ready (EWMA + fatigue) |
| Next Session suggestions | Mock data (client-side progressive overload) |
| AI Insights view | Placeholder ("Coming Soon") |
| Multi-user / auth | Not implemented (single-user, anon key) |
| Real-time sync | Polling on mount only (no WebSockets) |
