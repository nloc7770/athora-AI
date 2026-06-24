# Getting Started

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| pnpm | 11+ | `npm install -g pnpm@11` |
| Supabase account | — | [supabase.com](https://supabase.com) |
| Supabase CLI (optional) | — | `brew install supabase/tap/supabase` |

## Clone and Install

```bash
git clone <your-repo-url> athora
cd athora
pnpm install
```

The project uses pnpm workspaces. All packages are installed from the root.

## Project Structure

```
athora/
├── apps/
│   ├── web/          # Next.js 16 frontend (port 3000)
│   ├── backend/      # NestJS API (port 3001)
│   └── mobile/       # Expo React Native app
├── packages/
│   └── shared/       # Shared types and utilities
├── supabase/
│   ├── migrations/   # SQL schema migrations
│   └── seed/         # Seed data
└── start.sh          # Dev launcher script
```

## Supabase Setup

### Option A: Hosted Supabase (recommended for getting started)

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Once the project is ready, go to **Settings > API** and note:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`)
   - **anon (public) key**
   - **service_role key** (keep secret)
3. Go to **Settings > Database** and note the **JWT secret**.
4. Run the SQL migrations in order via the **SQL Editor** in the dashboard:

```bash
# Copy and run each file in the Supabase SQL Editor:
supabase/migrations/00001_initial_schema.sql
supabase/migrations/00002_storage_buckets.sql
supabase/migrations/00003_functions.sql
```

Or, if you have the Supabase CLI linked to your project:

```bash
supabase db push
```

### Option B: Local Supabase (via CLI)

```bash
supabase init   # if not already initialized
supabase start  # starts local Supabase on port 54321
```

The local instance prints anon key, service key, and JWT secret to the terminal.

## Environment Variables

### Backend (`apps/backend/.env`)

```bash
cp apps/backend/.env.example apps/backend/.env
```

Fill in:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co   # or http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_KEY=dev-key
```

### Web (`apps/web/.env.local`)

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Mobile (`apps/mobile/.env.local`)

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

Fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Running the Project

### All services at once

```bash
./start.sh
```

This starts the web app (port 3000) and backend (port 3001) in parallel.

### Individual services

```bash
# Web only
./start.sh web
# or: pnpm dev:web

# Backend only
./start.sh backend
# or: pnpm dev:backend

# Mobile (Expo)
./start.sh mobile
```

### Stop all services

```bash
./start.sh stop
```

## Verify Everything Works

### Backend health check

```bash
curl http://localhost:3001/
```

Expected: a response from NestJS (typically a welcome message or 200 OK).

### Web app

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the landing page.

### Backend API

```bash
# List courses (requires auth token)
curl -H "Authorization: Bearer <your-jwt>" http://localhost:3001/courses
```

## Seed Data (Optional)

If you want sample data for development:

```bash
# Run via Supabase SQL Editor or CLI
psql $DATABASE_URL -f supabase/seed/seed.sql
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `pnpm: command not found` | `npm install -g pnpm@11` |
| Port 3000 already in use | Kill the process: `lsof -ti:3000 \| xargs kill` |
| Supabase connection refused | Check your URL and keys in `.env`; ensure the project is running |
| `nest: command not found` | Run from the root with `pnpm dev:backend` (uses local NestJS CLI) |
| Mobile can't reach backend | Use your machine's LAN IP instead of `localhost` in `EXPO_PUBLIC_API_URL` |
