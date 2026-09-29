import { type Page } from '@playwright/test'

export const EMAIL = process.env.SCAN_EMAIL ?? 'smoke-test@athora.local'
export const PASSWORD = process.env.SCAN_PASSWORD ?? 'SmokeTest123!'

export const STORAGE_STATE = 'tests/.auth/user.json'

// Supabase (auth backend) drops connections intermittently — an SSL EOF on
// roughly one call in three — and POST /auth/login is throttled to 5/min, so
// retries have to be few and spaced out or the limiter answers instead.
export async function login(page: Page) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await page.waitForTimeout(22_000)
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.fill('#email', EMAIL)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')
    try {
      // The URL alone is not proof: ProtectedRoute can bounce back to /login
      // after a transient auth failure. Wait for the real app shell.
      await page.waitForSelector('[aria-label="User menu"]', { timeout: 20000 })
      return
    } catch {}
  }
  throw new Error('could not log in after 3 attempts')
}
