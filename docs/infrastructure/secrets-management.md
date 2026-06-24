# Secrets Management — Athora

Last reviewed: 2026-06-24

---

## Environment Variable Strategy

### Naming Convention

| Prefix | Visibility | Rule |
|--------|-----------|------|
| `NEXT_PUBLIC_` | Exposed to browser bundle | Only use for values safe to be public (project URL, anon key) |
| No prefix | Server-only | Never reaches the client. Used in API routes, Edge Functions, NestJS backend. |

---

## Environment Configurations

### Local Development (.env.local — gitignored)

```bash
# Supabase (local instance via supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
SUPABASE_SERVICE_KEY=<local-service-key-from-supabase-start>

# AI Service (local)
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_KEY=dev-key-local

# Mobile (Expo)
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
```

### Development (GitHub Secrets → Vercel/Railway env)

```bash
# Supabase (dev project)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_KEY=<dev-service-key>

# AI Service (dev)
AI_SERVICE_URL=https://ai-dev.athora.ai
AI_SERVICE_KEY=<dev-ai-key>

# Backend
DATABASE_URL=postgresql://postgres:<dev-db-password>@db.xxx.supabase.co:5432/postgres
REDIS_URL=redis://:<dev-redis-password>@<dev-redis-host>:6379
```

### Production (GitHub Secrets → Vercel/Railway env)

```bash
# Supabase (prod project)
NEXT_PUBLIC_SUPABASE_URL=https://yyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_KEY=<prod-service-key>

# AI Service (prod)
AI_SERVICE_URL=https://ai.athora.ai
AI_SERVICE_KEY=<prod-ai-key>

# In-App Purchase
APPLE_SHARED_SECRET=<apple-iap-secret>
GOOGLE_SERVICE_ACCOUNT_KEY=<gcp-json-key-base64-encoded>

# Backend
DATABASE_URL=postgresql://postgres:<prod-db-password>@db.yyy.supabase.co:5432/postgres
REDIS_URL=redis://:<prod-redis-password>@<prod-redis-host>:6379

# Monitoring
SENTRY_DSN=https://<key>@sentry.io/<project-id>
```

---

## Rules

### Exposure Rules

1. **`NEXT_PUBLIC_*` prefix** = bundled into client JavaScript. Only safe for: Supabase URL and anon key (RLS protects data).
2. **`EXPO_PUBLIC_*` prefix** = embedded in mobile binary. Same rules as `NEXT_PUBLIC_*`.
3. **No `SUPABASE_SERVICE_KEY` in any frontend code** — this key bypasses RLS entirely.
4. **Different keys per environment** — a compromised dev key does not grant prod access.

### Rotation Schedule

| Secret | Rotation Frequency | Method |
|--------|-------------------|--------|
| Supabase anon key | On compromise only | Regenerate in Supabase Dashboard → Settings → API |
| Supabase service key | Quarterly | Same as above |
| AI service key | Quarterly | Regenerate in AI provider dashboard |
| Apple shared secret | On compromise only | App Store Connect → Manage Shared Secret |
| Google service account | Annually | GCP IAM → Create new key → delete old |
| Database password | Quarterly | Supabase Dashboard → Database → Connection |

### Storage Locations

| Environment | Secret Store | Access Control |
|-------------|-------------|----------------|
| Local dev | `.env.local` file (gitignored) | Developer machine only |
| CI/CD | GitHub Secrets | Repo admin access required |
| Vercel (web) | Environment Variables (encrypted) | Project admin access |
| Railway (backend) | Environment Variables (encrypted) | Project admin access |
| Edge Functions | Supabase Vault or project env vars | Supabase admin access |
| Mobile builds | EAS Secrets (Expo) | Expo project admin |

---

## Supabase Vault (for Edge Functions)

For secrets needed in Edge Functions, prefer Supabase Vault over plain environment variables:

```sql
-- Store a secret
SELECT vault.create_secret('ai-service-key', '<actual-key>', 'AI service API key');

-- Retrieve in Edge Function
const { data } = await supabase.rpc('get_secret', { secret_name: 'ai-service-key' });
```

Benefits:
- Secrets encrypted at rest with a project-specific key
- Accessible only from within Supabase infrastructure
- Auditable access via pg_audit

---

## Prevention Mechanisms

### .gitignore (root level)

```gitignore
# Environment files
.env
.env.*
.env.local
.env.development
.env.production
!.env.example

# Key files
*.pem
*.key
service-account*.json
```

### Pre-Commit Hook (secret scanning)

Install via husky or lefthook:

```bash
#!/bin/sh
# .husky/pre-commit

# Patterns that should never appear in committed code
PATTERNS="SUPABASE_SERVICE_KEY|service_role|sk-[a-zA-Z0-9]{20,}|eyJhbGciOi[A-Za-z0-9_-]{50,}|APPLE_SHARED_SECRET|GOOGLE_SERVICE_ACCOUNT"

# Search staged files (excluding .env.example files and docs)
MATCHES=$(git diff --cached --name-only | \
  grep -v '\.env\.example' | \
  grep -v 'docs/' | \
  grep -v 'secrets-management.md' | \
  xargs grep -lE "$PATTERNS" 2>/dev/null)

if [ -n "$MATCHES" ]; then
  echo "ERROR: Potential secrets detected in staged files:"
  echo "$MATCHES"
  echo ""
  echo "If these are intentional (documentation references), use:"
  echo "  git commit --no-verify"
  exit 1
fi
```

### GitHub Configuration

1. **Secret scanning**: Enable in repo Settings → Code security → Secret scanning
2. **Push protection**: Enable to block pushes containing detected secrets
3. **Dependabot**: Enable for security vulnerability alerts on dependencies
4. **Branch protection**: Require PR reviews for changes to infrastructure/ and auth-related code

### CI Validation

Add to GitHub Actions workflow:

```yaml
- name: Check for exposed secrets
  run: |
    # Verify service key is not in frontend code
    if grep -rE "service_role|SUPABASE_SERVICE_KEY" apps/web/ apps/mobile/ --include="*.ts" --include="*.tsx" --include="*.js"; then
      echo "::error::Service key reference found in frontend code"
      exit 1
    fi
    
    # Verify no .env files are being committed
    if git ls-files --cached | grep -E '\.env$|\.env\.(local|development|production)$'; then
      echo "::error::.env file found in repository"
      exit 1
    fi
```

---

## Key Compromise Response

If a secret is exposed:

1. **Immediate**: Rotate the compromised key (Supabase Dashboard, provider console)
2. **Assess**: Check access logs for unauthorized usage during exposure window
3. **Scrub**: If committed to git, use `git filter-repo` or BFG to remove from history
4. **Notify**: If user data may have been accessed, follow incident response procedure
5. **Prevent**: Add the pattern to pre-commit hook if not already covered
6. **Post-mortem**: Document how the exposure happened and update processes

---

## Mobile-Specific Considerations

- Binary analysis can extract embedded strings — treat `EXPO_PUBLIC_*` as fully public
- Never embed service keys in mobile builds, even in "release" configurations
- Use certificate pinning for API communication (prevents MITM on rooted devices)
- Store auth tokens in `expo-secure-store` (iOS Keychain / Android Keystore)
- Implement device attestation for sensitive operations (optional, adds friction)
