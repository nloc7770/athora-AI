# Security Audit Report — Athora

**Date:** 2026-06-25  
**Auditor:** Senior Security Engineer (12yr, CISSP, ex-Cloudflare)  
**Scope:** Backend API (NestJS), Web frontend (Next.js 15), Auth flow, File upload, CSP  

---

## Executive Summary

Athora has a reasonable security baseline — Helmet, global ValidationPipe with whitelist/forbidNonWhitelisted, Supabase-managed auth tokens, and a CSP header set. However, several **CRITICAL** and **HIGH** severity issues exist that must be addressed before production launch.

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 5 |
| MEDIUM | 4 |
| LOW | 2 |

---

## CRITICAL Findings

### C1 — Hardcoded Secrets in `.env` (Committed or Accessible)

**Location:** `/apps/backend/.env`, `/apps/web/.env.local`

The `.env` files contain live secrets:
- `SUPABASE_SERVICE_KEY` (service_role — full admin access to all Supabase data)
- `AI_API_KEY` (sk-467f6b09...)
- `RAGFLOW_API_KEY`

**Risk:** Although `.env` is listed in `.gitignore`, the file is present on disk and readable. If this repo was ever committed with these files, or if any CI/deployment system copies them verbatim, all secrets are compromised.

**Remediation:**
1. Rotate ALL keys immediately (SUPABASE_SERVICE_KEY, AI_API_KEY, RAGFLOW_API_KEY)
2. Verify git history: `git log --all --full-history -- '*.env*'`
3. Use a secrets manager (Vault, AWS SSM, Doppler) for production
4. Add `.env*` patterns to `.gitignore` (already done) AND run `git-secrets` or `trufflehog` in CI

---

### C2 — JWT Token Stored in localStorage (XSS → Full Account Takeover)

**Location:** `/apps/web/src/stores/auth-store.ts:45-46`, `/apps/web/src/lib/api.ts:46`

```typescript
localStorage.setItem(TOKEN_KEY, token)
localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
```

Access tokens AND refresh tokens are stored in `localStorage`, which is accessible to any JavaScript running on the page.

**Risk:** A single XSS vulnerability (or malicious browser extension) exfiltrates both tokens, granting persistent access to the user's account. The refresh token in localStorage is especially dangerous — it allows indefinite session hijacking.

**Remediation:**
1. Store tokens in `httpOnly`, `Secure`, `SameSite=Strict` cookies set by the backend
2. If localStorage is absolutely required for the access token, NEVER store the refresh token there — keep it in an httpOnly cookie
3. The current cookie being set (`document.cookie = ...` without `Secure` or `HttpOnly`) provides zero protection — it's readable by JS

---

### C3 — Cookie Missing `Secure` and `HttpOnly` Flags

**Location:** `/apps/web/src/stores/auth-store.ts:11`

```typescript
document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Lax`
```

The token cookie has:
- No `Secure` flag → sent over HTTP in dev, but also in any misconfigured production deploy
- No `HttpOnly` flag → fully accessible via `document.cookie` (defeats purpose of cookie-based storage)
- `SameSite=Lax` rather than `Strict` → vulnerable to top-level navigation CSRF

**Remediation:**
1. Set cookies from the backend with `HttpOnly; Secure; SameSite=Strict`
2. Remove client-side cookie manipulation entirely

---

## HIGH Findings

### H1 — No Rate Limiting on Chat Endpoints (Cost Amplification Attack)

**Location:** `/apps/backend/src/chat/chat.controller.ts`

The entire chat controller (including streaming LLM calls) has NO per-endpoint rate limiting. The global throttler (30 req/60s) may apply via ThrottlerModule, but:
- 30 requests/minute of LLM streaming can generate significant AI API costs
- No per-user daily budget or token consumption cap

**Risk:** An authenticated user can drain AI credits rapidly. A compromised account amplifies this.

**Remediation:**
1. Add `@UseGuards(ThrottlerGuard)` with strict limits (e.g., 10 req/min) to message endpoints
2. Implement per-user daily token/request budgets at the service layer
3. Add cost monitoring alerts

---

### H2 — No Rate Limiting on Documents Upload Endpoint

**Location:** `/apps/backend/src/documents/documents.controller.ts:76-114`

The upload endpoint has auth but no throttle decorator. The in-memory `maxConcurrent = 5` in `DocumentProcessorService` is a processing limit, not a request rate limit.

**Risk:** An attacker can flood uploads (50MB each), consuming storage and processing resources. 50MB × 30 req/min (global throttle) = 1.5GB/min of storage writes.

**Remediation:**
1. Add `@Throttle({ default: { ttl: 60000, limit: 3 } })` to upload endpoint
2. Implement per-user storage quota checks before accepting uploads
3. Add global storage budget alerting

---

### H3 — CSP Allows `'unsafe-inline'` and `'unsafe-eval'` for Scripts

**Location:** `/apps/web/next.config.ts:8`

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
```

**Risk:** This CSP is effectively useless for XSS mitigation. `'unsafe-inline'` allows injected `<script>` tags, and `'unsafe-eval'` allows `eval()` — both are primary XSS attack vectors.

**Remediation:**
1. Remove `'unsafe-eval'` entirely (Next.js production builds do not require it)
2. Replace `'unsafe-inline'` with nonce-based CSP: `'nonce-${nonce}'`
3. Use Next.js's built-in CSP nonce support (available since Next.js 13.4+)
4. If inline styles are needed, keep `'unsafe-inline'` only in `style-src` (lower risk)

---

### H4 — File Upload Validation Relies Only on MIME Type

**Location:** `/apps/backend/src/documents/documents.controller.ts:82-86`

```typescript
new FileTypeValidator({ fileType: 'application/pdf' }),
```

NestJS `FileTypeValidator` checks the `Content-Type` header or file extension — both are trivially spoofed by an attacker.

**Risk:** Malicious files disguised as PDFs can be uploaded and stored. If any downstream system (RAGFlow, browser preview) processes them without re-validation, this enables stored file attacks.

**Remediation:**
1. Validate file magic bytes (first 4 bytes of PDF are `%PDF`): 
   ```typescript
   if (!file.buffer.subarray(0, 4).toString().startsWith('%PDF')) {
     throw new BadRequestException('Invalid PDF file');
   }
   ```
2. Run uploaded files through a malware scanner (ClamAV or equivalent)
3. Serve user-uploaded files from a separate domain/subdomain with restrictive headers

---

### H5 — CORS Single-Origin Configuration May Break or Be Too Permissive

**Location:** `/apps/backend/src/main.ts:20-23`

```typescript
origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
credentials: true,
```

**Risk:**
- The fallback default is `http://localhost:3000` — if `FRONTEND_URL` is unset in production, CORS allows localhost
- No validation that the env var contains a single, valid HTTPS URL
- `credentials: true` with a dynamic origin can be problematic if ever changed to a regex or array

**Remediation:**
1. Validate and require `FRONTEND_URL` in production (throw on startup if missing/http)
2. Consider an explicit allowlist array for staging + production domains
3. Log a warning if the origin does not start with `https://`

---

## MEDIUM Findings

### M1 — No CSRF Protection

**Location:** Backend-wide

The app uses Bearer token auth (not cookies for auth), so traditional CSRF is mitigated by design — browsers don't auto-attach `Authorization` headers. However, the frontend ALSO sets a cookie (`athora-token`) with `SameSite=Lax`, and the API client reads from cookies as a fallback.

**Risk:** If any middleware or future change makes the backend read auth from the cookie, CSRF becomes exploitable since `SameSite=Lax` allows top-level navigations (GET-based state changes).

**Remediation:**
1. Ensure the backend ONLY reads from `Authorization` header (current behavior — verified in guard)
2. Remove the cookie storage entirely OR add CSRF token validation
3. If keeping cookies, set `SameSite=Strict`

---

### M2 — Error Messages May Leak Supabase Internals

**Location:** `/apps/backend/src/auth/auth.service.ts:22, 36, 49`

```typescript
throw new UnauthorizedException(error.message);
```

Supabase error messages are passed directly to the client (e.g., "Email rate limit exceeded", "User already registered", etc.)

**Risk:** Enables email enumeration (register endpoint reveals if email exists), and may leak internal infrastructure details.

**Remediation:**
1. Map Supabase errors to generic messages: "Invalid credentials", "Registration failed"
2. Log the original error server-side
3. The `forgotPassword` method already does this correctly — apply same pattern to login/register

---

### M3 — Global ThrottlerModule Applied but Not Enforced per Controller

**Location:** `/apps/backend/src/app.module.ts:21-26`

The `ThrottlerModule.forRoot` sets a global config (30 req/60s), but NestJS throttler requires `@UseGuards(ThrottlerGuard)` on each controller or method to be enforced. Only `AuthController` and `AiGenerationController` explicitly apply it.

**Risk:** Most endpoints (courses, sessions, users, flashcards, exams, documents, chat) only have the global 30/min as a ceiling if `APP_GUARD` is not set globally.

**Remediation:**
1. Add `ThrottlerGuard` as a global guard in `main.ts`:
   ```typescript
   app.useGlobalGuards(new ThrottlerGuard());
   ```
   Or via `APP_GUARD` provider in AppModule
2. Then use `@SkipThrottle()` on health checks
3. Apply stricter limits on expensive endpoints (upload, chat, AI gen)

---

### M4 — `connect-src` CSP Allows Wildcard Supabase + All Localhost Ports

**Location:** `/apps/web/next.config.ts:12`

```typescript
"connect-src 'self' https://*.supabase.co http://localhost:*",
```

**Risk:**
- `http://localhost:*` allows connections to ANY local port — if a user has local services, malicious JS could interact with them
- `https://*.supabase.co` is broader than needed — should be pinned to the specific project URL

**Remediation (production):**
1. Remove `http://localhost:*` in production builds (use env-conditional CSP)
2. Pin to `https://yebgnhxennlspkbnhwcl.supabase.co` specifically

---

## LOW Findings

### L1 — Password Policy is Minimal (6 Characters)

**Location:** `/apps/backend/src/auth/dto/register.dto.ts:13`

```typescript
@MinLength(6)
password: string;
```

**Risk:** 6-character passwords are brute-forceable. Supabase handles password hashing, but weak passwords remain a user-side risk.

**Remediation:**
1. Increase to `@MinLength(8)` with complexity requirements (via `@Matches` decorator)
2. Consider integrating with Have I Been Pwned API for breached password detection

---

### L2 — No Request Logging/Audit Trail for Sensitive Operations

**Location:** Backend-wide

While `AllExceptionsFilter` logs errors, there's no explicit audit logging for:
- Login attempts (successful/failed)
- Password reset requests
- Document deletions
- Admin operations

**Remediation:**
1. Add structured audit logging for auth events
2. Include user ID, IP, user-agent, and action type
3. Ship to a centralized logging system (not just stdout)

---

## SQL Injection Assessment

**Status: LOW RISK**

All database queries use the Supabase client library's parameterized query builder:
```typescript
.from('documents').select('*').eq('id', documentId).eq('user_id', userId)
```

These are parameterized by design. No raw SQL queries were found in the codebase. UUID params are validated with `ParseUUIDPipe`.

---

## Secrets Grep Results

```
grep -rn "sk-|password.*=.*['"]" ... | grep -v "node_modules|.env|test"
```

**Result:** No hardcoded secrets found in source code (`.ts`/`.tsx` files). Only legitimate password form field references in `auth-form.tsx`. Secrets are properly loaded from environment variables via `ConfigService.getOrThrow()`.

---

## Summary of Immediate Actions (Priority Order)

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 1 | Rotate all API keys/secrets (they were readable in .env) | CRITICAL | 1h |
| 2 | Move tokens to httpOnly cookies (backend-set) | CRITICAL | 4-8h |
| 3 | Remove `'unsafe-eval'` and `'unsafe-inline'` from script-src CSP | HIGH | 2-4h |
| 4 | Add magic-byte validation to file uploads | HIGH | 1h |
| 5 | Add rate limiting to chat and upload endpoints | HIGH | 1-2h |
| 6 | Apply ThrottlerGuard globally | MEDIUM | 30m |
| 7 | Sanitize Supabase error messages before returning to client | MEDIUM | 1-2h |
| 8 | Remove localhost from production CSP connect-src | MEDIUM | 30m |
| 9 | Strengthen password policy | LOW | 30m |
| 10 | Add audit logging | LOW | 4h |

---

## Positive Security Observations

- Helmet middleware applied globally
- ValidationPipe with `whitelist: true` and `forbidNonWhitelisted: true` strips unknown fields
- UUID validation on all route params via `ParseUUIDPipe`
- Anti-enumeration pattern on forgot-password endpoint
- File names sanitized before storage (`[^a-zA-Z0-9._-]` → `_`)
- Auth guard validates JWT on every request via Supabase's `getUser()` (not just decode)
- No `innerHTML` or `dangerouslySetInnerHTML` usage in frontend
- Body size limits configured (10MB JSON, 50MB file upload)
- HSTS, X-Frame-Options, X-Content-Type-Options all configured
- Supabase queries use parameterized builders (no raw SQL)
