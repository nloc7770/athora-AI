# Rollback Checklist

## Application Rollback (Revert Deploy)

Use when the application code has a bug but the database is fine.

- [ ] Identify the bad commit SHA on `main` (or `develop`)
- [ ] Create a revert commit:
  ```bash
  git revert <commit-sha> --mainline 1
  git push origin main
  ```
- [ ] Wait for the deploy workflow to complete
- [ ] Verify the rollback in the target environment
- [ ] Notify the team in the incident channel

**Alternative — Vercel instant rollback:**

- [ ] Go to Vercel dashboard → Deployments
- [ ] Find the last known good deployment
- [ ] Click "Promote to Production"

**Alternative — Railway instant rollback:**

- [ ] Go to Railway dashboard → Deployments
- [ ] Find the last known good deployment
- [ ] Click "Rollback"

## Database Rollback (Reverse Migration)

Use when a migration introduced a schema issue but the application code is fine.

- [ ] Identify the problematic migration file in `supabase/migrations/`
- [ ] Write a reverse migration:
  ```bash
  supabase migration new rollback_<original_migration_name>
  ```
- [ ] Add SQL to undo the schema change (DROP columns, restore tables, etc.)
- [ ] Test locally:
  ```bash
  supabase db reset
  ```
- [ ] Push the reverse migration:
  ```bash
  supabase db push
  ```
- [ ] Verify the schema is correct in the target environment
- [ ] Notify the team

**Important:** Supabase migrations are append-only. You cannot delete a migration that has already been applied. Always create a new migration that reverses the changes.

## Full Rollback (Application + Database)

Use when both the code and database changes need to be reverted.

- [ ] **Step 1: Stop the bleeding** — Revert the application deploy first (see Application Rollback above)
- [ ] **Step 2: Assess database impact** — Determine if data was corrupted or if schema-only
- [ ] **Step 3: Write reverse migration** — Create migration to undo schema changes
- [ ] **Step 4: Handle data** — If data was modified:
  - [ ] Restore from backup if available
  - [ ] Or write data-fix migration to correct affected rows
- [ ] **Step 5: Push reverse migration**
  ```bash
  supabase link --project-ref <project-id>
  supabase db push
  ```
- [ ] **Step 6: Redeploy application** — Push the revert commit to trigger deploy
- [ ] **Step 7: Verify end-to-end** — Test critical flows in the environment
- [ ] **Step 8: Post-incident** — Document what went wrong and update procedures

## Emergency Procedures

### Complete Service Outage

1. [ ] Check Supabase status: https://status.supabase.com
2. [ ] Check Vercel status: https://www.vercel-status.com
3. [ ] Check Railway status: https://status.railway.app
4. [ ] If provider issue — wait and communicate to users
5. [ ] If our issue — follow Full Rollback above

### Data Corruption

1. [ ] Immediately disable writes (set RLS to deny inserts/updates if possible)
2. [ ] Identify scope of corruption
3. [ ] Check Supabase daily backups (available on Pro plan)
4. [ ] Restore from point-in-time recovery if available
5. [ ] If no backup — write corrective migration based on audit logs
6. [ ] Re-enable writes after verification

### Secret Exposure

1. [ ] Rotate the exposed secret immediately
2. [ ] Update the secret in GitHub Actions secrets
3. [ ] Update the secret in Supabase / Vercel / Railway dashboards
4. [ ] Review access logs for unauthorized usage
5. [ ] Re-run deploys to pick up new secrets
6. [ ] Document the incident

## Post-Rollback Verification

After any rollback, verify:

- [ ] Application loads without errors
- [ ] Authentication flow works
- [ ] Core CRUD operations succeed
- [ ] No console errors in browser
- [ ] API health endpoint returns 200
- [ ] Database schema matches expected state
