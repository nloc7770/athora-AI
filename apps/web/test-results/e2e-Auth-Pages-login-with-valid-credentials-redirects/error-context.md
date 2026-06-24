# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Auth Pages >> login with valid credentials redirects
- Location: tests/e2e.spec.ts:32:7

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /\/(dashboard|sessions)/
Received string:  "http://localhost:3000/login?"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: Athora
    - generic [ref=e6]: Welcome back
    - generic [ref=e7]: Sign in to continue your learning journey
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]: Email
      - textbox "Email" [ref=e12]:
        - /placeholder: you@example.com
    - generic [ref=e13]:
      - generic [ref=e14]: Password
      - textbox "Password" [ref=e15]:
        - /placeholder: ••••••••
    - button "Sign in" [ref=e16]
  - generic [ref=e17]:
    - text: Don't have an account?
    - link "Sign up" [ref=e18] [cursor=pointer]:
      - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing Page', () => {
  4  |   test('loads successfully', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/Athora/);
  7  |     await expect(page.locator('body')).toBeVisible();
  8  |   });
  9  | 
  10 |   test('has visible content', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     const body = page.locator('body');
  13 |     await expect(body).not.toBeEmpty();
  14 |   });
  15 | });
  16 | 
  17 | test.describe('Auth Pages', () => {
  18 |   test('login page loads with form', async ({ page }) => {
  19 |     await page.goto('/login');
  20 |     await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  21 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  22 |     await expect(page.locator('button[type="submit"]')).toBeEnabled();
  23 |   });
  24 | 
  25 |   test('register page loads with form', async ({ page }) => {
  26 |     await page.goto('/register');
  27 |     await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  28 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  29 |     await expect(page.locator('button[type="submit"]')).toBeEnabled();
  30 |   });
  31 | 
  32 |   test('login with valid credentials redirects', async ({ page }) => {
  33 |     await page.goto('/login');
  34 |     await page.fill('input[type="email"]', 'testathora@gmail.com');
  35 |     await page.fill('input[type="password"]', 'Test1234!');
  36 |     await page.click('button[type="submit"]');
  37 |     // Wait for navigation or error message
  38 |     await Promise.race([
  39 |       page.waitForURL(/\/(dashboard|sessions)/, { timeout: 15000 }),
  40 |       page.locator('.bg-destructive').waitFor({ timeout: 15000 }),
  41 |     ]).catch(() => {});
  42 |     // If we got error (rate limit), that's OK for test — verify form works
  43 |     const url = page.url();
  44 |     const hasError = await page.locator('.bg-destructive').isVisible().catch(() => false);
  45 |     if (!hasError) {
> 46 |       expect(url).toMatch(/\/(dashboard|sessions)/);
     |                   ^ Error: expect(received).toMatch(expected)
  47 |     }
  48 |   });
  49 | 
  50 |   test('login with invalid credentials shows error', async ({ page }) => {
  51 |     await page.goto('/login');
  52 |     await page.fill('input[type="email"]', 'wrong@test.com');
  53 |     await page.fill('input[type="password"]', 'wrongpass');
  54 |     await page.click('button[type="submit"]');
  55 |     // Should show error or stay on login
  56 |     await page.waitForTimeout(3000);
  57 |     expect(page.url()).toContain('/login');
  58 |   });
  59 | });
  60 | 
  61 | test.describe('Protected Routes', () => {
  62 |   test('sessions page redirects to login when not authenticated', async ({ page }) => {
  63 |     await page.goto('/sessions');
  64 |     await page.waitForURL(/\/login/, { timeout: 5000 });
  65 |   });
  66 | 
  67 |   test('dashboard redirects to login when not authenticated', async ({ page }) => {
  68 |     await page.goto('/dashboard');
  69 |     await page.waitForURL(/\/login/, { timeout: 5000 });
  70 |   });
  71 | });
  72 | 
```