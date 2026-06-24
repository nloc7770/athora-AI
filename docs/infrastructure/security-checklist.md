# Security Checklist — Athora

Pre-launch production security checklist. All CRITICAL and HIGH items must be resolved before go-live.

---

## Authentication & Authorization

- [ ] **CRITICAL** — Supabase Auth email confirmation enabled in production
- [ ] **CRITICAL** — Password minimum length set to 8+ characters
- [ ] **HIGH** — Rate limiting enabled on auth endpoints (login, signup, password reset)
- [ ] **HIGH** — Refresh token rotation enabled
- [ ] **MEDIUM** — Account lockout after 10 failed login attempts
- [ ] **MEDIUM** — Web tokens stored in httpOnly cookies (not localStorage)
- [ ] **MEDIUM** — Mobile tokens stored in expo-secure-store
- [ ] **LOW** — MFA available for user accounts
- [ ] **LOW** — Admin accounts require MFA

---

## Row Level Security (RLS)

- [ ] **CRITICAL** — RLS enabled on ALL public tables (zero exceptions)
- [ ] **CRITICAL** — CI check validates no tables have RLS disabled
- [ ] **CRITICAL** — `profiles` table: users can only read/write their own row
- [ ] **CRITICAL** — `courses` table: owner-only access
- [ ] **CRITICAL** — `documents` table: owner-only access
- [ ] **CRITICAL** — `flashcard_sets` table: owner-only access
- [ ] **CRITICAL** — `flashcards` table: access restricted via set ownership subquery
- [ ] **CRITICAL** — `exams` table: owner-only access
- [ ] **CRITICAL** — `exam_questions` table: access restricted via exam ownership subquery
- [ ] **CRITICAL** — `exam_attempts` table: owner read-only, no delete
- [ ] **CRITICAL** — `subscriptions` table: user read-only, service-key write-only
- [ ] **HIGH** — Indexes exist on all foreign keys used in RLS subqueries
- [ ] **MEDIUM** — RLS policies tested with integration tests (attempt cross-user access)

---

## API Key & Secret Management

- [ ] **CRITICAL** — `SUPABASE_SERVICE_KEY` absent from all frontend code (web + mobile)
- [ ] **CRITICAL** — CI grep check for service key patterns in frontend directories
- [ ] **CRITICAL** — No `.env` files committed to repository
- [ ] **HIGH** — Different API keys used per environment (local/dev/prod)
- [ ] **HIGH** — GitHub secret scanning enabled on repository
- [ ] **HIGH** — Push protection enabled (blocks commits with detected secrets)
- [ ] **MEDIUM** — Pre-commit hook scans for key patterns (sk-, eyJ, service_role)
- [ ] **MEDIUM** — AI service keys stored in Supabase Vault for Edge Functions
- [ ] **LOW** — Key rotation schedule documented and calendar reminders set

---

## Storage Security

- [ ] **HIGH** — Documents bucket set to private (not public)
- [ ] **HIGH** — Storage RLS policies enforce user-folder isolation
- [ ] **HIGH** — Signed URLs used for all document access (60 min expiry)
- [ ] **MEDIUM** — Max file size limit enforced (50MB)
- [ ] **MEDIUM** — MIME type validation on upload
- [ ] **LOW** — Download audit logging enabled

---

## Edge Functions & API Security

- [ ] **CRITICAL** — JWT validation in every Edge Function
- [ ] **HIGH** — Per-user rate limiting on AI-powered endpoints
- [ ] **HIGH** — Subscription tier check before expensive AI operations
- [ ] **HIGH** — Input validation (Zod or equivalent) on all function inputs
- [ ] **MEDIUM** — Request body size limits configured
- [ ] **MEDIUM** — Error responses do not leak internal details
- [ ] **LOW** — Request logging with correlation IDs

---

## In-App Purchase Security

- [ ] **HIGH** — Apple receipt validation is server-side only
- [ ] **HIGH** — Google Play receipt validation is server-side only
- [ ] **HIGH** — Webhook signatures validated before processing
- [ ] **MEDIUM** — Processed webhook IDs stored to prevent replay
- [ ] **MEDIUM** — Subscription state only writable via service key (not user-facing API)

---

## Network & Transport Security

- [ ] **HIGH** — HTTPS enforced on all endpoints (HSTS header set)
- [ ] **HIGH** — CORS restricted to known origins (athora.ai, localhost in dev)
- [ ] **HIGH** — Security headers configured:
  - [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **MEDIUM** — Content Security Policy configured for web app
- [ ] **MEDIUM** — Certificate pinning on mobile for API endpoints
- [ ] **LOW** — Permissions-Policy header restricts camera/microphone/geolocation

---

## Frontend Security (Web)

- [ ] **HIGH** — No `dangerouslySetInnerHTML` without sanitization
- [ ] **HIGH** — User-generated content escaped before rendering
- [ ] **HIGH** — No inline scripts (CSP nonce-based if needed)
- [ ] **MEDIUM** — Third-party scripts loaded async with SRI hashes
- [ ] **MEDIUM** — Form submissions include CSRF protection
- [ ] **LOW** — Subresource integrity on CDN-loaded assets

---

## Mobile Security

- [ ] **HIGH** — Auth tokens in secure storage (expo-secure-store)
- [ ] **HIGH** — No sensitive data in AsyncStorage
- [ ] **HIGH** — API keys not extractable from binary (use EXPO_PUBLIC_ only for public values)
- [ ] **MEDIUM** — Root/jailbreak detection for sensitive operations
- [ ] **MEDIUM** — Screen capture disabled on sensitive screens (exam mode)
- [ ] **LOW** — ProGuard/R8 obfuscation enabled for Android release builds

---

## Monitoring & Incident Response

- [ ] **HIGH** — Error monitoring configured (Sentry or equivalent)
- [ ] **HIGH** — Failed auth attempt alerting (>10/min from same IP)
- [ ] **HIGH** — Supabase audit logs enabled for auth events
- [ ] **MEDIUM** — Anomaly detection on AI API usage (spike = possible abuse)
- [ ] **MEDIUM** — Incident response runbook documented
- [ ] **MEDIUM** — On-call rotation defined for production issues
- [ ] **LOW** — Regular penetration testing scheduled (annually)

---

## Dependency Security

- [ ] **HIGH** — Dependabot or Snyk enabled for vulnerability scanning
- [ ] **HIGH** — No known critical vulnerabilities in production dependencies
- [ ] **MEDIUM** — Lock files committed (pnpm-lock.yaml, package-lock.json)
- [ ] **MEDIUM** — Dependencies pinned to exact versions (no open ranges)
- [ ] **LOW** — Quarterly dependency audit and update cycle

---

## Data Protection

- [ ] **HIGH** — User data deletion endpoint functional (GDPR/CCPA)
- [ ] **HIGH** — Data export endpoint functional (GDPR right to portability)
- [ ] **MEDIUM** — Privacy policy published and accessible from app
- [ ] **MEDIUM** — Data retention policy defined (exam attempts, documents)
- [ ] **MEDIUM** — PII minimized in logging (no passwords, tokens, or full documents)
- [ ] **LOW** — Data processing agreement with AI service providers

---

## Deployment Security

- [ ] **HIGH** — Production deployments require PR approval
- [ ] **HIGH** — Branch protection on main (no direct pushes)
- [ ] **MEDIUM** — Database migrations reviewed before apply
- [ ] **MEDIUM** — Rollback procedure documented and tested
- [ ] **LOW** — Deployment audit trail (who deployed what, when)

---

## Summary

| Severity | Total | Resolved |
|----------|-------|----------|
| CRITICAL | 13 | ___ / 13 |
| HIGH | 27 | ___ / 27 |
| MEDIUM | 23 | ___ / 23 |
| LOW | 11 | ___ / 11 |

**Launch gate**: All CRITICAL resolved, all HIGH resolved or with documented exception and timeline.
