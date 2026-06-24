# Database Strategy

How Athora manages database schema changes across environments.

## Core Principle

**The database schema is defined entirely by migrations.** No manual DDL changes in any environment. Ever.

## Migration-Based Workflow

Migrations are sequential SQL files in `/supabase/migrations/`. Each file represents one atomic schema change. They run in lexicographic order and are tracked by Supabase so each migration applies exactly once.

```
supabase/migrations/
├── 00001_initial_schema.sql
├── 00002_storage_buckets.sql
├── 00003_functions.sql
└── ...future migrations
```

## Creating a New Migration

```bash
# Generate a timestamped migration file
supabase migration new add_study_sessions_table

# This creates:
# supabase/migrations/20260624120000_add_study_sessions_table.sql
```

Write your SQL in the generated file. Include both the change and any necessary indexes, RLS policies, or triggers.

### Migration Guidelines

- One logical change per migration (one table, one feature, one refactor)
- Always include `IF NOT EXISTS` / `IF EXISTS` guards where appropriate
- Add indexes for columns used in WHERE, JOIN, or ORDER BY clauses
- Enable RLS and create policies for every new table
- Add comments explaining non-obvious decisions
- Test locally before pushing to any remote environment

## Applying Migrations

### Locally

```bash
# Reset local database: drops, recreates, runs all migrations, then seeds
supabase db reset

# This is safe and fast — use it freely during development
```

### Development / Production

```bash
# Link CLI to a remote project (one-time setup)
supabase link --project-ref <project-id>

# Push pending migrations to the linked project
supabase db push

# Check which migrations have been applied
supabase migration list
```

## Schema Diffing

When you make changes via Supabase Studio (locally) and want to capture them as a migration:

```bash
# Generate a migration from the diff between migrations and current local DB
supabase db diff --schema public -f describe_the_change

# Review the generated file, then commit it
```

This is useful for prototyping in Studio, then formalizing the change as a versioned migration.

## Shadow Database

Supabase uses a shadow database (port 54320 locally) to validate migrations:

1. Creates a fresh database
2. Runs all migrations in sequence
3. Compares the result against your local database
4. Reports any drift or conflicts

This catches issues like:
- Migrations that depend on manual changes
- Migrations that conflict with each other
- Migrations that fail on a clean database

The shadow database runs automatically during `supabase db diff` and `supabase db push`.

## Rollback Strategy

Supabase migrations are forward-only. There is no built-in rollback command.

### How to Roll Back

Create a new migration that reverses the change:

```bash
supabase migration new revert_add_study_sessions_table
```

```sql
-- 20260625_revert_add_study_sessions_table.sql
DROP POLICY IF EXISTS "Users can manage own sessions" ON study_sessions;
DROP TABLE IF EXISTS study_sessions;
```

### Why Forward-Only

- Reverse migrations are error-prone and rarely tested
- Data migrations cannot be automatically reversed
- A new forward migration is explicit, reviewable, and testable
- It goes through the same PR review process as any other change

### Emergency Production Rollback

If a migration causes a production incident:

1. **Assess impact** — Is the app down or just degraded?
2. **Create a revert migration** — Reverse the schema change
3. **Test locally** — `supabase db reset` to verify the full sequence
4. **Push immediately** — `supabase db push` to production
5. **Post-mortem** — Document what went wrong and add safeguards

For data-destructive migrations (dropping columns, tables), always:
- Deploy the migration behind a feature flag first
- Verify the app works without the old schema
- Only then remove the old schema in a follow-up migration

## Type Generation

After changing the schema, regenerate TypeScript types for the frontend and backend:

```bash
# Generate types from the local running database
supabase gen types typescript --local > packages/shared/src/database.types.ts

# Or from a linked remote project
supabase gen types typescript --linked > packages/shared/src/database.types.ts
```

Keep `database.types.ts` in `/packages/shared/` so all apps consume the same types.

## Checklist for Schema Changes

- [ ] Created migration with `supabase migration new`
- [ ] Added RLS policies for new tables
- [ ] Added indexes for query patterns
- [ ] Tested with `supabase db reset` locally
- [ ] Generated fresh TypeScript types
- [ ] Updated seed data if needed
- [ ] PR includes the migration file
- [ ] No destructive changes without a two-phase approach
