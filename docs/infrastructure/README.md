# Infrastructure Documentation

This directory contains documentation for Athora's infrastructure, deployment, and database strategy.

## Contents

| Document | Description |
|----------|-------------|
| [Environment Architecture](./environment-architecture.md) | Three-environment setup, deployment flow, Supabase project mapping |
| [Database Strategy](./database-strategy.md) | Migration workflow, schema management, rollback procedures |

## Quick Reference

### Local Development

```bash
# Start Supabase locally (from project root)
supabase start

# Apply migrations and seed data
supabase db reset

# Stop local Supabase
supabase stop
```

### Deployment

```bash
# Link to a remote project
supabase link --project-ref <project-id>

# Push migrations to linked project
supabase db push

# Check migration status
supabase migration list
```

## Related Directories

- `/supabase/` — Supabase CLI config, migrations, edge functions, seed data
- `/apps/web/` — Next.js 16 frontend
- `/apps/backend/` — NestJS API server
- `/apps/mobile/` — React Native Expo mobile app
- `/packages/shared/` — Shared TypeScript types
