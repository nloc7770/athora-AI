# Environment Architecture

Athora uses three environments to balance fast iteration with production safety.

## Environments

### Local

**Purpose:** Fast iteration, offline development, instant feedback loops.

- Supabase runs entirely in Docker via `supabase start`
- No network dependency — works offline
- Database resets are instant (`supabase db reset`)
- Seed data provides a consistent starting state
- Email confirmations disabled for frictionless auth testing

### Development

**Purpose:** Integration testing with real Supabase infrastructure before production.

- Hosted Supabase project: `athora-dev` on supabase.com
- Shared among the team for integration testing
- Real auth providers (Google, Apple) configured with test credentials
- Edge functions deployed and testable
- Data is expendable — can be wiped between sprints

### Production

**Purpose:** Serving real users with maximum reliability.

- Hosted Supabase project: `athora-prod` on supabase.com
- Point-in-time recovery enabled
- Connection pooling via Supavisor
- Read replicas if needed at scale
- Monitoring and alerting configured
- Migrations applied via CI/CD only — never manually

## Supabase Organization Structure

```
Athora (Organization)
├── athora-dev   (Development project)
└── athora-prod  (Production project)
```

Single organization, two projects. This gives:

- Unified billing and team management
- Separate databases, auth configs, and storage per environment
- Independent scaling and configuration
- Clear separation between test and user data

## Deployment Flow

```
feature/xyz ──→ Pull Request ──→ dev ──→ main ──→ production
     │               │            │        │           │
     │          CI checks     Deploy    Deploy     Deploy
     │          lint/test     to dev    to prod    migrations
     │               │            │        │           │
     ▼               ▼            ▼        ▼           ▼
  Local DB      Preview env   athora-   athora-   athora-
  (Docker)      (Vercel)      dev        prod       prod
```

### Branch Strategy

| Branch | Deploys To | Supabase Target |
|--------|-----------|-----------------|
| `feature/*` | Local only | Docker (supabase start) |
| `dev` | Development | athora-dev |
| `main` | Production | athora-prod |

### Pull Request Workflow

1. Developer works on `feature/xyz` with local Supabase
2. Opens PR targeting `dev`
3. CI runs lint, type check, unit tests, migration validation
4. On merge to `dev`: deploy apps to dev, push migrations to athora-dev
5. QA and integration testing on dev environment
6. PR from `dev` → `main`
7. On merge to `main`: deploy apps to prod, push migrations to athora-prod

## Network Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOCAL DEVELOPMENT                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                     │
│  │ Next.js  │  │ NestJS   │  │ Expo Dev  │                     │
│  │ :3000    │  │ :4000    │  │ Client    │                     │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘                     │
│       │              │              │                            │
│       └──────────────┼──────────────┘                           │
│                      ▼                                           │
│  ┌─────────────────────────────────────┐                        │
│  │        Supabase Local (Docker)       │                       │
│  │                                      │                       │
│  │  ┌────────┐ ┌─────┐ ┌───────────┐  │                       │
│  │  │Postgres│ │Auth │ │  Storage   │  │                       │
│  │  │ :54322 │ │:9099│ │  :54321   │  │                       │
│  │  └────────┘ └─────┘ └───────────┘  │                       │
│  │  ┌────────┐ ┌─────────────────┐    │                       │
│  │  │Studio  │ │  Edge Runtime   │    │                       │
│  │  │ :54323 │ │     :54321      │    │                       │
│  │  └────────┘ └─────────────────┘    │                       │
│  └─────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT (CLOUD)                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                     │
│  │ Vercel   │  │ Railway/ │  │ Expo Dev  │                     │
│  │ Preview  │  │ Fly.io   │  │ Build     │                     │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘                     │
│       │              │              │                            │
│       └──────────────┼──────────────┘                           │
│                      ▼                                           │
│  ┌─────────────────────────────────────┐                        │
│  │    Supabase Cloud: athora-dev      │                        │
│  │    https://xxx.supabase.co          │                        │
│  └─────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION (CLOUD)                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐                     │
│  │ Vercel   │  │ Railway/ │  │ App Store │                     │
│  │ Prod     │  │ Fly.io   │  │ / Play    │                     │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘                     │
│       │              │              │                            │
│       └──────────────┼──────────────┘                           │
│                      ▼                                           │
│  ┌─────────────────────────────────────┐                        │
│  │    Supabase Cloud: athora-prod     │                        │
│  │    https://yyy.supabase.co          │                        │
│  │                                      │                       │
│  │  • Connection pooling (Supavisor)   │                        │
│  │  • Point-in-time recovery           │                        │
│  │  • Daily backups                    │                        │
│  └─────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables

Each app reads Supabase credentials from environment variables:

| Variable | Local | Development | Production |
|----------|-------|-------------|------------|
| `SUPABASE_URL` | `http://localhost:54321` | `https://xxx.supabase.co` | `https://yyy.supabase.co` |
| `SUPABASE_ANON_KEY` | Local anon key | Dev anon key | Prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Local service key | Dev service key | Prod service key |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:54322/postgres` | Dev connection string | Prod pooled connection |

Keys are never committed to source control. Each environment has its own `.env` file (gitignored) or uses the hosting platform's secret management.
