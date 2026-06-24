# Observability

## Logging

### Supabase Dashboard Logs
- **API Logs**: All REST and GraphQL requests with status codes, latency
- **Auth Logs**: Login attempts, token refreshes, password resets, MFA events
- **Realtime Logs**: WebSocket connections, channel subscriptions, broadcast events
- **Edge Function Logs**: Invocation logs with `console.log` output visible in dashboard

### Backend (NestJS) Structured Logging
- Format: JSON with consistent schema
- Required fields per log entry:
  - `timestamp` (ISO 8601)
  - `level` (error, warn, info, debug)
  - `requestId` (UUID, propagated via X-Request-ID header)
  - `userId` (when authenticated)
  - `service` (module name)
  - `message` (human-readable)
  - `metadata` (structured context)

```typescript
// Example log output
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_abc123",
  "service": "flashcard-service",
  "message": "Flashcard deck created",
  "metadata": { "deckId": "deck_xyz", "cardCount": 25 }
}
```

### Edge Functions
- Use `console.log`, `console.warn`, `console.error` — visible in Supabase dashboard
- Include request context manually (no automatic request ID injection)
- Keep logs concise — Supabase retains limited history on Free/Pro

### External Log Aggregation (Recommended)
- **Axiom**: Generous free tier, good Supabase integration
- **Logtail** (Better Stack): Simple setup, log-based alerting
- **Datadog**: Full observability platform (expensive, better for 10k+ users)
- Integration: Forward logs via Supabase Log Drains (Pro plan) or custom webhook

### Log Levels

| Level | Usage | Alert? |
|-------|-------|--------|
| `error` | Unhandled exceptions, failed critical operations | Yes — immediate |
| `warn` | Degraded service, retry succeeded, rate limit approached | Yes — review daily |
| `info` | Audit trail, key business events | No |
| `debug` | Detailed execution flow, variable state | No — dev only |

### Log Hygiene
- Never log PII (emails, passwords, tokens) in plain text
- Mask sensitive fields: `email: "j***@example.com"`
- Rotate/expire logs: 30 days for info, 90 days for error/warn
- Correlate logs across services using `requestId`

---

## Monitoring

### Supabase Built-in Metrics
- Database connections (active, idle, max)
- API request count and latency
- Storage usage and bandwidth
- Auth events (signups, logins, failures)
- Realtime connections and messages

### Custom Business Metrics

Track these application-specific metrics:

| Metric | Query/Method | Alert Threshold |
|--------|-------------|-----------------|
| Active users (DAU/WAU/MAU) | Count distinct `auth.users` with activity | DAU drop > 30% |
| Documents uploaded/day | Count `storage.objects` created | Spike > 5x average |
| Flashcard reviews/day | Count from `review_logs` table | Drop > 50% (possible bug) |
| AI API calls per user | Count from `ai_usage` table | > 100/user/day (abuse) |
| Error rate per endpoint | 5xx responses / total responses | > 1% on any endpoint |
| Queue depth (if applicable) | Pending background jobs | > 1000 items |

### Implementation

```sql
-- Example: Daily active users materialized view
CREATE MATERIALIZED VIEW daily_active_users AS
SELECT
  date_trunc('day', last_sign_in_at) AS day,
  count(DISTINCT id) AS active_users
FROM auth.users
WHERE last_sign_in_at > now() - interval '90 days'
GROUP BY 1;
```

### Uptime Monitoring
- **Better Uptime** or **Checkly**: HTTP endpoint health checks
- Check endpoints every 60 seconds:
  - `GET /health` — API availability
  - `GET /api/v1/status` — Authenticated service health
  - Supabase REST endpoint — Database connectivity
- Alert channels: Slack, PagerDuty, email

### Database Monitoring
- Enable `pg_stat_statements` for query performance tracking
- Monitor slow queries (> 500ms)
- Track connection pool utilization (alert at 80%)
- Watch for lock contention and long-running transactions

```sql
-- Find slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## Error Tracking

### Frontend (Web) — Sentry
- Install `@sentry/nextjs` or `@sentry/react`
- Upload source maps during build for readable stack traces
- Configure environment tags: `production`, `staging`, `development`
- Set sample rate: 1.0 for errors, 0.1 for transactions (adjust with scale)

### Frontend (Mobile) — Sentry React Native
- Install `@sentry/react-native`
- Configure native crash reporting (iOS + Android)
- Track navigation breadcrumbs
- Monitor app start time and frame drops

### Backend (NestJS) — Sentry
- Install `@sentry/nestjs` or `@sentry/node`
- Global exception filter integration
- Capture unhandled promise rejections
- Attach user context and request metadata

### Edge Functions — Manual Reporting
```typescript
import * as Sentry from "https://deno.land/x/sentry/mod.ts";

try {
  // function logic
} catch (error) {
  Sentry.captureException(error, {
    extra: { functionName: "process-document", userId },
  });
  throw error;
}
```

### Error Budget
- **Target**: 99.9% availability (43 minutes downtime/month max)
- **Measurement**: (successful requests) / (total requests) over 30-day window
- **Budget burn rate**: Alert when burning > 2x normal rate
- **Response**: If budget is exhausted, freeze deployments and focus on stability

---

## Performance Tracking

### Web — Vercel Analytics
- Core Web Vitals: LCP, INP, CLS
- Real User Monitoring (RUM) for actual user experience
- Track by route, device type, and geography
- Alert on LCP > 2.5s or CLS > 0.1

### Mobile — Expo/React Native
- Track app launch time (cold start, warm start)
- Monitor Expo Updates download and apply time
- Custom performance marks for key flows:
  - Time to first flashcard displayed
  - Document upload to processing complete
  - AI response latency

### Backend — Response Time
- Track percentiles, not averages:
  - **P50**: Median experience (target: < 200ms)
  - **P95**: Most users (target: < 500ms)
  - **P99**: Worst case (target: < 2000ms)
- Break down by endpoint and method
- Track separately: auth, CRUD, AI-powered endpoints

### Database — Query Performance
- Query execution time by category
- Connection pool utilization (target: < 70% steady state)
- Index hit rate (target: > 99%)
- Cache hit rate for repeated queries

---

## Audit Logging

### What to Track
- User login and logout events
- Document access (view, download, share)
- Data export requests
- Admin actions (user management, config changes)
- Permission changes (role updates, RLS policy modifications)
- Billing events (subscription changes, payment failures)

### Implementation

```sql
CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text
);

-- Append-only: no UPDATE or DELETE allowed
REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON audit_logs FROM service_role;

-- Index for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
```

### Retention Policy
- Minimum retention: 90 days
- Recommended: 1 year for compliance readiness
- Archive to cold storage (S3 Glacier) after active retention period
- Required for SOC 2 Type II if pursuing enterprise customers

### Access Controls
- Only service_role can INSERT audit logs
- Read access limited to admin users
- No user can modify or delete their own audit trail
