# Playwright Audit Report

Generated: 2026-06-25

## Test Results Summary

- Total tests: 24
- Passed: 6 (Section 1: Public Pages)
- Failed: 1 (Section 2: Auth Flow - login redirect)
- Skipped/Not Reached: 17 (Section 3+ blocked by serial auth failure)
- Screenshots captured: 7 (6 audit + 1 failure)

## Failures Analysis

### 1. Login and redirect to dashboard

| Field | Detail |
|-------|--------|
| **Test** | `Section 2: Auth Flow >> Login and redirect to dashboard` |
| **Location** | `tests/full-audit.spec.ts:102:7` |
| **Error** | `TimeoutError: page.waitForURL: Timeout 15000ms exceeded` |
| **Expected** | Navigation to `**/dashboard**` after login |
| **Actual** | Page stays on `/login` after form submission |
| **Priority** | **Critical** |

**Root Cause:**

The test fills email/password and clicks "Sign in", then waits for a redirect to `/dashboard`. The page never navigates away from `/login`. Possible causes:

1. **Invalid test credentials** - The default credentials (`loc@athora.app` / `Test123456!`) may not exist in the local/test Supabase instance, causing silent auth failure.
2. **Cookie consent dialog blocking interaction** - The cookie consent banner is visible and may intercept focus or overlay the form, though the form inputs appear filled.
3. **Missing error feedback** - The login page shows no visible error message after failed auth (the `alert` element in the DOM snapshot is empty), making it hard to diagnose whether auth was attempted.
4. **No `type="submit"` on button** - The test locates `button[type="submit"]` but the page snapshot shows `button "Sign in"` without explicit type attribute visible. If the button lacks `type="submit"`, the click may not trigger form submission properly.

**Fix Recommendation:**

```ts
// 1. Dismiss cookie consent before interacting with forms
const cookieDialog = page.locator('dialog[aria-label="Cookie consent"]');
if (await cookieDialog.isVisible()) {
  await page.locator('button:has-text("Essential only")').click();
}

// 2. Use more resilient selectors and wait for network response
await page.locator('button:has-text("Sign in")').click();

// 3. Wait for either success redirect OR error message
await Promise.race([
  page.waitForURL('**/dashboard**', { timeout: 15000 }),
  page.locator('[role="alert"]:not(:empty), [class*="error"]').waitFor({ timeout: 15000 }),
]);

// 4. Assert redirect happened
expect(page.url()).toContain('/dashboard');
```

Also ensure test credentials exist in the Supabase test environment, or seed them in a `globalSetup`.

## Evidence

### Screenshot Files

| File | Page | Status |
|------|------|--------|
| `test-results/audit/01-landing.png` | Landing `/` | Pass |
| `test-results/audit/02-login.png` | Login `/login` | Pass |
| `test-results/audit/03-register.png` | Register `/register` | Pass |
| `test-results/audit/04-forgot-password.png` | Forgot Password `/forgot-password` | Pass |
| `test-results/audit/05-privacy.png` | Privacy Policy `/privacy` | Pass |
| `test-results/audit/06-terms.png` | Terms of Service `/terms` | Pass |
| `test-results/full-audit-Section-2-Auth--74947-.../test-failed-1.png` | Login (failure state) | Fail |

### Visual Issues Observed

1. **Cookie consent banner overlap** - On every page, the cookie consent dialog overlaps the bottom-left corner. The "Accept all" button is partially hidden behind the Next.js dev tools "1 Issue" badge.
2. **Landing page content gaps** - The landing page screenshot (01-landing.png) shows large empty white/cream sections between content blocks, suggesting missing images, lazy-loaded content that did not render, or incomplete sections.
3. **Dark sections with no visible content** - Multiple dark-background sections on the landing page appear completely empty (no text, no images rendered).
4. **Testimonial section empty** - The testimonial/review area shows "Trusted by happy ??? learners" placeholder text with empty carousel.
5. **"1 Issue" Next.js dev tools badge** - Visible on all screenshots, indicating an unresolved dev-time issue (likely a React hydration warning or similar).

## Recommendations

### Top 5 Issues to Fix Immediately

1. **[Critical] Fix authentication flow or seed test credentials** - The login test failure blocks all 17 protected-page tests. Either seed a known user in the test DB, or use Supabase auth admin API in `globalSetup` to create a test user before the suite runs.

2. **[Critical] Dismiss cookie consent in test setup** - Add a `test.beforeEach` or global fixture that dismisses the cookie consent dialog. It overlaps UI and may block interactions.

3. **[High] Fix landing page empty sections** - Multiple sections render as blank space. This is likely due to images/animations not loading during the test (no network or lazy-load never triggers). Ensure fallback content or SSR for above-the-fold content.

4. **[High] Investigate Next.js "1 Issue" badge** - This indicates a runtime issue (hydration mismatch, missing key, etc.). Check the browser console during local dev.

5. **[Medium] Add visible auth error feedback** - When login fails, the user sees no error message. The `alert` role element exists but is empty. Show "Invalid email or password" on auth failure.

### UX Problems Detected

- No loading indicator visible after clicking "Sign in" (user gets no feedback)
- Cookie consent "Accept all" button partially obscured by dev tools badge
- Register page "Create account" button appears disabled/muted (low contrast orange on white) - unclear if this is intentional until checkbox is ticked
- Landing page has no social proof or testimonials rendering (empty carousel area)

### Missing States/Flows Not Tested

- Error states (invalid credentials, network failure)
- Loading/spinner states during auth
- Password visibility toggle behavior
- Form validation messages (empty email, short password)
- Successful registration flow
- OAuth/social login (if applicable)
- Mobile viewport (tests run at default 1280px only)
- Dark mode variant (if supported)
