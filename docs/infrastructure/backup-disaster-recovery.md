# Backup and Disaster Recovery

## Backup Strategy

### Automated Backups (Supabase Pro)

| Backup Type | Frequency | Retention | Scope |
|-------------|-----------|-----------|-------|
| Daily snapshot | Every 24 hours | 7 days | Full database |
| Point-in-time recovery (PITR) | Continuous WAL archiving | 7 days | Transaction-level |
| Storage replication | Continuous | N/A (built-in) | All uploaded files |

### Additional External Backups

Weekly `pg_dump` to external S3-compatible storage for defense-in-depth:

```bash
#!/bin/bash
# weekly-backup.sh — run via cron or GitHub Actions schedule

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="studyos_backup_${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "/tmp/${BACKUP_FILE}"

# Upload to S3 (Cloudflare R2, AWS S3, or Backblaze B2)
aws s3 cp "/tmp/${BACKUP_FILE}" \
  "s3://studyos-backups/weekly/${BACKUP_FILE}" \
  --storage-class STANDARD_IA

# Clean up local file
rm "/tmp/${BACKUP_FILE}"

# Prune backups older than 30 days
aws s3 ls s3://studyos-backups/weekly/ \
  | awk '{print $4}' \
  | head -n -4 \
  | xargs -I {} aws s3 rm "s3://studyos-backups/weekly/{}"
```

**Retention policy:**
- Supabase daily backups: 7 days (managed by Supabase)
- External weekly dumps: 30 days
- Monthly archive: 1 year (for compliance, stored in cold storage)

### What Is NOT Backed Up
- Supabase Edge Function code (lives in git repo — that is your backup)
- Environment variables / secrets (store in password manager + secrets manager)
- External API keys (maintain inventory in 1Password/Vault)

---

## Point-in-Time Recovery (PITR)

### Overview
- Available on Supabase Pro plan and above
- Uses PostgreSQL Write-Ahead Log (WAL) streaming
- Recover database to any second within the retention window (7 days)
- Does NOT recover Storage objects (only database tables)

### When to Use PITR
- Accidental `DELETE` or `UPDATE` without `WHERE` clause
- Bad migration that corrupts or drops data
- Application bug that wrote incorrect data over a period
- Need to inspect historical state for debugging

### Recovery Process

1. **Identify the target timestamp** — find the last known good state
   - Check audit logs for the destructive action
   - Check deploy history for the bad migration timestamp
   - Add 1 minute buffer before the incident

2. **Initiate recovery via Supabase Dashboard**
   - Navigate to: Project → Database → Backups → Point in Time
   - Select target timestamp
   - Confirm restoration (this replaces the current database)

3. **Post-recovery validation**
   - Verify row counts on critical tables
   - Run application health checks
   - Check that auth sessions still work (they should — auth is separate)
   - Verify foreign key integrity: `SELECT * FROM pg_catalog.pg_constraint WHERE NOT convalidated;`

### Limitations
- Recovery replaces the entire database (cannot restore single table via PITR alone)
- To restore a single table: restore to a temporary project, then `pg_dump` just that table and import
- Maximum recovery window: 7 days on Pro plan
- Recovery takes 5-30 minutes depending on database size

---

## Disaster Recovery Plan

### Severity Levels

| Level | Definition | Examples | RTO | RPO |
|-------|-----------|----------|-----|-----|
| P1 — Critical | Full outage or data loss | DB corruption, total Supabase outage, data breach | 1 hour | 5 minutes |
| P2 — Major | Partial outage, degraded service | Auth down, API errors > 10%, single region failure | 4 hours | 1 hour |
| P3 — Minor | Single feature broken, workaround exists | PDF upload failing, one AI feature degraded | 24 hours | 24 hours |

**RTO** = Recovery Time Objective (how fast we restore service)
**RPO** = Recovery Point Objective (how much data loss is acceptable)

### Recovery Procedures

#### Database Corruption
1. Identify corruption scope (single table vs. widespread)
2. If single table: restore from PITR to temp instance, export table, import to production
3. If widespread: full PITR restore to last known good timestamp
4. Notify affected users if data loss occurred
5. Post-mortem within 48 hours

#### Supabase Region Outage
1. Confirm outage via [Supabase Status](https://status.supabase.com)
2. Enable maintenance mode in frontend (show banner)
3. Wait for Supabase to restore (no multi-region failover on Pro plan)
4. If outage > 4 hours: communicate ETA to users via email/social
5. **Future mitigation**: Consider multi-region on Enterprise plan if SLA requires it

#### Accidental Table Drop
```sql
-- DO NOT PANIC. The data exists in PITR.
-- 1. Note the exact time of the DROP
-- 2. Go to Supabase Dashboard → Database → Backups
-- 3. Restore to 1 minute before the DROP
-- 4. After restore, re-apply any migrations that ran AFTER the target timestamp
```

#### Bad Migration Deployed
1. Immediately run the reverse migration (every migration should have a `down` script)
2. If no reverse migration exists:
   - Assess: Is the data still intact but schema wrong? Write a fix-forward migration.
   - Assess: Is data lost? Use PITR to restore to pre-migration state.
3. Block further deployments until root cause understood
4. Add migration to CI integration tests

#### Auth Service Down
1. Confirm via Supabase status page
2. Impact: Users cannot login, signup, or refresh tokens
3. Existing sessions with valid JWTs continue to work until expiry
4. No workaround (hard dependency on Supabase Auth)
5. Enable maintenance mode if outage > 30 minutes
6. **Future mitigation**: Consider longer JWT expiry (1 hour → 4 hours) to extend session survival

#### Storage Corruption
1. Supabase Storage is replicated — corruption is handled automatically
2. If files are missing: check if accidentally deleted via API/Dashboard
3. Deleted files within retention window may be recoverable via Supabase support
4. For critical files: maintain a CDN cache layer (serves as informal backup)

### Communication Plan

#### Status Page
- Use **Instatus**, **Statuspage.io**, or **Better Stack Status**
- Components to track:
  - API
  - Authentication
  - Document Processing
  - AI Features
  - Mobile App
  - Web App

#### Notification Matrix

| Severity | Internal | External |
|----------|----------|----------|
| P1 | PagerDuty alert → on-call engineer (immediate) | In-app banner + email to all users + status page update |
| P2 | Slack #incidents channel + on-call ping | Status page update + in-app banner for affected feature |
| P3 | Slack #incidents channel (async) | Status page note (if user-facing) |

#### Incident Template
```
**Incident**: [Short description]
**Severity**: P1/P2/P3
**Start time**: [ISO timestamp]
**Impact**: [What users experience]
**Status**: Investigating / Identified / Monitoring / Resolved
**Updates**: [Timestamped entries]
**Resolution**: [What fixed it]
**Follow-up**: [Post-mortem link]
```

---

## Database Cloning (Production → Development)

### Safety Rules
- **NEVER** clone production data with real user information to development environments
- **NEVER** share production database credentials with development machines
- **ALWAYS** anonymize PII before restoring to non-production environments

### Anonymization Process

```bash
#!/bin/bash
# clone-prod-to-dev.sh

# 1. Dump production schema + data
pg_dump "$PROD_DATABASE_URL" \
  --no-owner \
  --no-privileges \
  > /tmp/prod_dump.sql

# 2. Restore to isolated temporary database
psql "$TEMP_DATABASE_URL" < /tmp/prod_dump.sql

# 3. Run anonymization script
psql "$TEMP_DATABASE_URL" << 'EOF'
-- Anonymize user emails
UPDATE auth.users SET
  email = 'user_' || id::text || '@example.com',
  encrypted_password = 'REDACTED',
  phone = NULL,
  raw_user_meta_data = jsonb_build_object(
    'name', 'Test User ' || substr(id::text, 1, 8)
  );

-- Anonymize any PII in application tables
UPDATE profiles SET
  full_name = 'User ' || substr(id::text, 1, 8),
  avatar_url = NULL;

-- Clear sensitive audit logs
TRUNCATE audit_logs;

-- Remove any stored API keys or tokens
TRUNCATE user_api_keys;
EOF

# 4. Dump anonymized data
pg_dump "$TEMP_DATABASE_URL" > /tmp/anonymized_dump.sql

# 5. Restore to dev
psql "$DEV_DATABASE_URL" < /tmp/anonymized_dump.sql

# 6. Cleanup
rm /tmp/prod_dump.sql /tmp/anonymized_dump.sql
psql "$TEMP_DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### What to Preserve
- Schema and relationships (exact production structure)
- Data distribution patterns (realistic volume)
- Enum values and reference data
- RLS policies and indexes

### What to Anonymize/Remove
- Email addresses → generated placeholders
- Names → generic "User XXXX"
- Phone numbers → NULL
- Passwords → placeholder hash
- API keys/tokens → REDACTED
- File contents (documents) → keep metadata, remove actual files
- Audit logs → TRUNCATE

### Frequency
- Refresh dev database from anonymized prod: weekly or on-demand
- Automate via CI pipeline (GitHub Actions scheduled workflow)
