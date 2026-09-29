import { test, expect } from '@playwright/test'

// Regression guard. The mobile nav sheet lives in a portal outside the
// `lg:hidden` header that owns its trigger, so when it defaulted to open it
// covered the viewport with its backdrop on desktop — every click landed on
// that backdrop, and "Settings" in the user menu did nothing. The session
// comes from tests/auth.setup.ts.
test('clicking Settings from the user menu navigates and renders', async ({ page }) => {
  test.setTimeout(120_000)

  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`${e.name}: ${e.message}`))
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()} ${r.request().method()} ${r.url()}`)
  })

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[aria-label="User menu"]', { timeout: 30000 })

  // Nothing may cover the app shell. /dashboard renders the brain HUD rather
  // than AppLayout, so the shell's navigation here is the HUD rail.
  const blocked = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Brain navigation"] button[aria-label="Settings"]')
    if (!nav) return 'no settings link'
    const r = nav.getBoundingClientRect()
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return nav.contains(top) ? null : (top?.getAttribute('data-slot') ?? top?.tagName ?? 'unknown')
  })
  expect(blocked, `the Settings link is covered by: ${blocked}`).toBeNull()

  await page.click('[aria-label="User menu"]')
  await page.click('[role="menuitem"]:has-text("Settings")')
  await page.waitForURL((u) => new URL(u).pathname === '/settings', { timeout: 20000 })

  await expect(page.getByText('Manage your account and preferences')).toBeVisible()
  expect(errors).toEqual([])
})
