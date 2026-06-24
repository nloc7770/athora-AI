# CI/CD Workflow

## Branching Strategy

```
feature/* ──→ develop ──→ main
              (dev env)    (production)
```

- **feature branches**: Created from `develop`, merged back via PR
- **develop**: Integration branch, auto-deploys to dev environment
- **main**: Production branch, deploys require manual approval

## Pull Request Checks

Every PR targeting `main` or `develop` runs:

| Check | Description |
|-------|-------------|
| lint-and-type-check | Builds shared, web, and backend packages |
| test | Runs backend test suite |
| migration-check | Validates Supabase migrations with `db start`, `db reset`, `db lint` |

All checks must pass before merge is allowed.

## Deployment Pipeline

### Development (automatic)

Triggered on push to `develop`:

1. **migrate-dev** — Links Supabase project and pushes pending migrations
2. **deploy-web-dev** — Deploys frontend to Vercel (preview)
3. **deploy-backend-dev** — Deploys backend to Railway (dev service)

Web and backend deploy in parallel after migration succeeds.

### Production (manual approval)

Triggered on push to `main`:

1. **migrate-prod** — Runs migrations against production database
2. **deploy-web-prod** — Deploys frontend to Vercel with `--prod` flag
3. **deploy-backend-prod** — Deploys backend to Railway (production service)

The `production` environment requires manual approval via GitHub environment protection rules.

## GitHub Environments

| Environment | Branch | Protection |
|-------------|--------|------------|
| development | develop | None (auto-deploy) |
| production | main | Required reviewers, wait timer optional |

### Setting Up Environment Protection Rules

1. Go to repo Settings → Environments
2. Create `production` environment
3. Add required reviewers (at least 1 team lead)
4. Optionally add a wait timer (e.g., 5 minutes)
5. Restrict deployment branches to `main` only

## Required Secrets

Configure in repo Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication |
| `DEV_DB_PASSWORD` | Dev database password |
| `DEV_PROJECT_ID` | Dev Supabase project ref |
| `PROD_DB_PASSWORD` | Prod database password |
| `PROD_PROJECT_ID` | Prod Supabase project ref |
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID_WEB` | Vercel project ID for web app |
| `RAILWAY_TOKEN_DEV` | Railway token for dev environment |
| `RAILWAY_TOKEN_PROD` | Railway token for production |

## Rollback Procedure

See [rollback-checklist.md](./rollback-checklist.md) for detailed steps.

**Quick rollback:**

```bash
# Revert the merge commit on main
git revert <merge-commit-sha> --mainline 1
git push origin main
```

This triggers a new production deploy with the reverted code. For database rollbacks, follow the full checklist.
