# Security Review — Athora

Last reviewed: 2026-06-24

---

## Authentication Security

### JWT Configuration

- **Access token expiry**: 1 hour (Supabase default, configurable in Dashboard → Auth → Settings)
- **Refresh token rotation**: Enabled — each refresh issues a new refresh token and invalidates the previous one
- **Password hashing**: Supabase Auth uses bcrypt with cost factor 10 (handled server-side, never in client code)
- **MFA**: Supabase supports TOTP-based MFA — enable for admin accounts at minimum

### Token Storage

| Platform | Storage Method | Risk Level |
|----------|---------------|------------|
| Web (Next.js) | localStorage via `@supabase/ssr` | MEDIUM — XSS exposure |
| Mobile (Expo) | expo-secure-store | LOW — encrypted keychain |
| Backend (NestJS) | Not stored — validates per request | LOW |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| JWT stored in localStorage on web — accessible via XSS | MEDIUM | Use httpOnly cookies via `@supabase/ssr` with `createServerClient` and Next.js middleware. This removes tokens from JavaScript access entirely. |
| Refresh token reuse after rotation | LOW | Supabase detects reuse and revokes the entire token family. No action needed beyond enabling rotation. |
| No session revocation mechanism | MEDIUM | Implement a `revoked_sessions` table checked on each request, or use Supabase's `auth.sessions` admin API for forced logout. |

### Recommended Configuration (supabase/config.toml)

```toml
[auth]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10  # seconds grace period for concurrent requests
```

---

## Row Level Security (RLS)

### Policy Summary

ALL tables MUST have RLS enabled. A table without RLS is fully exposed via the PostgREST API to anyone with the anon key.

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| profiles | Own row only (`auth.uid() = id`) | Own row only | Own row only | Disabled | Profile deletion via auth cascade |
| courses | Owner only (`auth.uid() = user_id`) | Owner only | Owner only | Owner only | |
| documents | Owner only (`auth.uid() = user_id`) | Owner only | Owner only | Owner only | |
| flashcard_sets | Owner only (`auth.uid() = user_id`) | Owner only | Owner only | Owner only | |
| flashcards | Via set ownership (subquery) | Via set ownership | Via set ownership | Via set ownership | See performance note |
| exams | Owner only (`auth.uid() = user_id`) | Owner only | Owner only | Owner only | |
| exam_questions | Via exam ownership (subquery) | Via exam ownership | Via exam ownership | Via exam ownership | See performance note |
| exam_attempts | Owner only (`auth.uid() = user_id`) | Owner only | Read-only after submission | Disabled | Immutable after creation |
| subscriptions | Own row only | System only (service key) | System only | Disabled | IAP webhook writes |

### Example Policy (flashcards via subquery)

```sql
CREATE POLICY "Users can access own flashcards"
ON flashcards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM flashcard_sets
    WHERE flashcard_sets.id = flashcards.set_id
    AND flashcard_sets.user_id = auth.uid()
  )
);
```

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Missing RLS on any table = full data exposure | CRITICAL | CI check: run `SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity;` — fail if non-empty |
| Subquery policies on flashcards/exam_questions degrade at scale | MEDIUM | Add indexes: `CREATE INDEX idx_flashcard_sets_user_id ON flashcard_sets(user_id);` and `CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);`. Consider denormalizing `user_id` onto child tables if query plans show sequential scans beyond 100k rows. |
| Policy bypass via service key | LOW (by design) | Service key is only used in NestJS backend — never exposed to clients. Audit all service key usage quarterly. |

---

## API Key Security

### Key Classification

| Key | Exposure | Purpose |
|-----|----------|---------|
| `SUPABASE_ANON_KEY` | Public (client-safe) | Identifies the project; all data access governed by RLS |
| `SUPABASE_SERVICE_KEY` | Server-only (NEVER expose) | Bypasses RLS — full database access |
| `AI_SERVICE_KEY` | Server-only | Authenticates calls to AI processing service |
| `APPLE_SHARED_SECRET` | Server-only | IAP receipt validation |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Server-only | Google Play billing validation |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Service key in frontend code = full DB access bypass | CRITICAL | Grep CI: `grep -r "service_role\|SUPABASE_SERVICE_KEY" apps/web apps/mobile` — fail if found. Only import in `apps/backend`. |
| Anon key + no RLS = same as service key exposure | CRITICAL | Always pair anon key with RLS (see above). |
| Key committed to git history | HIGH | Pre-commit hook + GitHub secret scanning (see secrets-management.md). |

---

## Storage Security

### Bucket Configuration

| Bucket | Visibility | Access Pattern |
|--------|-----------|----------------|
| documents | Private | Signed URLs (60 min expiry) |
| avatars | Public | Direct URL (non-sensitive) |

### Path Convention

```
documents/{user_id}/{document_id}/{filename}
```

### Storage RLS Policy

```sql
-- Users can only access their own folder
CREATE POLICY "User document access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Direct URL sharing bypasses authentication | MEDIUM | Never use public URLs for the documents bucket. Always generate signed URLs server-side with 60-minute expiry. |
| Signed URL forwarded to unauthorized user | LOW | Accept as a known trade-off (like pre-signed S3 URLs). Short expiry limits window. For high-sensitivity docs, add download logging. |
| Large file upload abuse | MEDIUM | Set max file size (50MB) in storage policy. Validate MIME type server-side before processing. |

---

## Edge Functions Security

### Requirements for Every Edge Function

1. **Verify JWT**: Extract and validate `Authorization: Bearer <token>` using `supabase.auth.getUser()`
2. **Rate limiting**: Supabase built-in rate limiting + custom per-user limits via Redis or pg-based counter
3. **Input validation**: Validate all inputs with Zod or equivalent before processing
4. **Subscription check**: Verify user's subscription tier before expensive operations (AI calls)

### Example Pattern

```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  // Check subscription tier
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, ai_calls_remaining')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.ai_calls_remaining <= 0) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // Process request...
})
```

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI service abuse (expensive API calls without auth) | HIGH | Per-user daily/monthly call limits based on subscription tier. Decrement counter atomically before calling AI service. |
| Denial-of-wallet via rapid requests | HIGH | Supabase Edge Functions have built-in concurrency limits. Add per-user rate limiting (e.g., 10 req/min for AI endpoints). |
| Prompt injection via user documents | MEDIUM | Sanitize document content before sending to AI. Set max token limits. Monitor for anomalous response patterns. |

---

## Third-Party Service Security

### AI Services

- API keys stored in Supabase Vault (preferred) or environment variables
- All AI calls routed through backend/Edge Functions — never called from client
- Response sanitization before storing results in database

### In-App Purchases (Apple/Google)

| Requirement | Implementation |
|-------------|----------------|
| Receipt validation | Server-side only via Edge Function |
| Apple App Store | Verify with Apple's `/verifyReceipt` endpoint using shared secret |
| Google Play | Validate via Google Play Developer API with service account |
| Subscription state | Webhook-driven updates to `subscriptions` table |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Client-side receipt validation = free subscriptions | HIGH | All validation server-side. Client sends raw receipt; server verifies and updates DB. |
| Webhook replay attacks | MEDIUM | Validate webhook signatures. Store processed webhook IDs to prevent replay. |
| AI provider outage leaks errors to user | LOW | Catch AI service errors; return generic "processing failed" message. Log full error server-side only. |

---

## Production Risks (Priority Order)

| Priority | Risk | Impact | Status |
|----------|------|--------|--------|
| 1 | CRITICAL: Service key exposure in frontend | Full database access bypass | Verify with CI grep |
| 2 | CRITICAL: Missing RLS on any table | Complete data exposure via anon key | Verify with SQL check |
| 3 | HIGH: No rate limiting on auth endpoints | Brute force attacks, account enumeration | Configure Supabase rate limits |
| 4 | HIGH: AI API abuse without subscription check | Unbounded cost from free-tier users | Implement tier-based limits |
| 5 | MEDIUM: JWT in localStorage (XSS vector) | Session hijacking if XSS exists | Migrate to httpOnly cookies |
| 6 | MEDIUM: No audit logging for admin actions | Cannot trace unauthorized changes | Add pg_audit or custom logging |
| 7 | LOW: CORS misconfiguration | Cross-origin data leakage | Restrict to known origins only |

---

## Recommendations

### Immediate (Before Launch)

1. Verify RLS on all tables (automated CI check)
2. Confirm service key is absent from all frontend code
3. Enable Supabase rate limiting on auth endpoints
4. Implement subscription-tier checks on AI endpoints
5. Set up GitHub secret scanning

### Short-Term (First Month)

1. Migrate web token storage to httpOnly cookies
2. Add audit logging for sensitive operations
3. Implement webhook signature validation for IAP
4. Set up alerting on failed auth attempts (>10/min from same IP)

### Ongoing

1. Quarterly key rotation
2. Monthly RLS policy review
3. Dependency vulnerability scanning (Dependabot/Snyk)
4. Penetration testing annually
