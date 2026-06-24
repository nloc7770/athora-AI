# Deployment Guide

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Web App    │────▶│  Backend API │────▶│  Supabase    │
│  (Vercel)   │     │  (Railway)   │     │  (Hosted)    │
└─────────────┘     └──────────────┘     └──────────────┘
                           ▲
┌─────────────┐            │
│  Mobile App │────────────┘
│  (EAS)      │
└─────────────┘
```

---

## Web App — Vercel

The web app is a Next.js 16 project. Vercel is the natural deployment target.

### Steps

1. Push your repo to GitHub/GitLab.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Set the **Root Directory** to `apps/web`.
4. Set the **Build Command** to `pnpm build` (Vercel auto-detects pnpm).
5. Set the **Install Command** to `pnpm install --filter @athora/web...` (installs only web dependencies).
6. Add environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your production anon key |
| `SUPABASE_SERVICE_KEY` | Your production service key |
| `AI_SERVICE_URL` | Your deployed backend URL |
| `AI_SERVICE_KEY` | Production AI service key |

### Monorepo Configuration

In `vercel.json` at the repo root (create if missing):

```json
{
  "buildCommand": "pnpm --filter @athora/web build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next"
}
```

Or configure these in the Vercel dashboard directly.

---

## Backend API — Railway / Render / Fly.io

The backend is a NestJS application that compiles to a Node.js server.

### Railway (recommended)

1. Create a new project at [railway.com](https://railway.com).
2. Connect your GitHub repo.
3. Set the **Root Directory** to `apps/backend`.
4. Railway auto-detects the start command. If not, set:
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `node dist/main`
5. Add environment variables (see table below).

### Render

1. Create a new Web Service at [render.com](https://render.com).
2. Connect your repo, set root to `apps/backend`.
3. Build command: `pnpm install && pnpm --filter @athora/backend build`
4. Start command: `node apps/backend/dist/main`
5. Add environment variables.

### Fly.io

Create a `Dockerfile` in `apps/backend/`:

```dockerfile
FROM node:20-slim AS builder
RUN corepack enable && corepack prepare pnpm@11 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter @athora/backend...
COPY apps/backend/ apps/backend/
RUN pnpm --filter @athora/backend build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
```

Then deploy:

```bash
cd apps/backend
fly launch
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=...
fly deploy
```

### Backend Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `PORT` | Port to listen on (usually set by platform) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your deployed web app URL (for CORS) |
| `SUPABASE_URL` | Production Supabase URL |
| `SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_KEY` | Production service role key |
| `SUPABASE_JWT_SECRET` | Production JWT secret |
| `DATABASE_URL` | Production Postgres connection string (from Supabase dashboard) |
| `REDIS_URL` | Redis instance URL (optional, for caching/rate limiting) |
| `AI_SERVICE_URL` | External AI service endpoint |
| `AI_SERVICE_KEY` | AI service API key |
| `RATE_LIMIT_TTL` | `60` |
| `RATE_LIMIT_MAX` | `30` (tighter in production) |

---

## Mobile App — EAS Build

The mobile app uses Expo with EAS (Expo Application Services) for building and submitting.

### Initial Setup

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build:configure
```

This creates an `eas.json` configuration file.

### Build Profiles (`eas.json`)

```json
{
  "build": {
    "development": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

### Build Commands

```bash
# Development build (for testing on simulators/devices)
npx eas-cli build --platform all --profile development

# Preview build (internal distribution for testers)
npx eas-cli build --platform all --profile preview

# Production build (for App Store / Play Store)
npx eas-cli build --platform all --profile production
```

### Environment Variables for EAS

Set secrets via EAS CLI (not committed to source):

```bash
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
npx eas-cli secret:create --name EXPO_PUBLIC_API_URL --value "https://api.athora.app"
```

### Submit to Stores

```bash
npx eas-cli submit --platform ios --profile production
npx eas-cli submit --platform android --profile production
```

---

## Supabase Production Setup

1. Your Supabase project created at setup time is already production-ready.
2. Under **Settings > Database**, enable connection pooling (Supavisor) for better performance.
3. Under **Authentication > Settings**:
   - Set your **Site URL** to your deployed web app domain.
   - Add redirect URLs for OAuth callbacks.
   - Enable the auth providers you need (email, Google, Apple, etc.).
4. Under **Storage**, verify bucket policies are correct (they were set by migration 00002).
5. Enable **Point-in-Time Recovery** under database settings for production safety.
6. Set up **Database Backups** schedule.

### Custom Domain (optional)

In Supabase dashboard, go to **Settings > Custom Domains** to use your own domain for the Supabase API.

---

## CI/CD Suggestions

### GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm --filter @athora/backend test
      - run: pnpm build

  deploy-web:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Recommended CI Steps

1. **Lint** — `pnpm lint` (ESLint across all packages)
2. **Type check** — `pnpm build` (TypeScript catches type errors at build)
3. **Unit tests** — `pnpm --filter @athora/backend test`
4. **E2E tests** — Playwright against a preview deployment
5. **Deploy** — Auto-deploy main to production; PRs get preview deployments

### Branch Protection

- Require CI to pass before merging to `main`.
- Require at least one review on PRs.
- Auto-deploy `main` to production after merge.
