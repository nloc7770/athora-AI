import { test as setup } from '@playwright/test'
import { login, STORAGE_STATE } from './helpers'

// POST /auth/login is throttled to 5/min per IP, so every spec logging in for
// itself makes the suite unrunnable twice in a row. Log in once, reuse the
// cookies.
setup('authenticate', async ({ page }) => {
  await login(page)
  await page.context().storageState({ path: STORAGE_STATE })
})
