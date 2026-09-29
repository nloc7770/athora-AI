import { test, expect } from '@playwright/test'

// Proves the veronica-style brain card actually mounts in a real browser —
// jsdom has no WebGL, so unit tests cannot answer this.
test.setTimeout(150_000)

test('dashboard renders the brain card inside the app shell', async ({ page }) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

  // This route renders the HUD instead of AppLayout, so the HUD owns the User
  // menu the shared login helper waits on. Its absence was what made every
  // Playwright spec report "could not log in".
  await page.waitForSelector('[aria-label="User menu"]', { timeout: 30000 })

  const hero = page.locator('section[aria-label="Knowledge brain"]')
  await expect(hero).toBeVisible({ timeout: 15000 })

  const rail = page.locator('nav[aria-label="Brain navigation"]')
  await expect(rail).toBeVisible()

  // Everything AppLayout used to give this route has to be here, because the
  // route no longer renders AppLayout at all: greeting, bell, account menu.
  await expect(page.locator('.br-top-title')).toContainText(',')
  await expect(page.getByLabel('Notifications')).toBeVisible()
  await expect(page.getByLabel('User menu')).toBeVisible()

  const canvas = hero.locator('canvas')
  const hasCanvas = await canvas
    .first()
    .waitFor({ state: 'attached', timeout: 25000 })
    .then(() => true)
    .catch(() => false)

  // The rail must sit inside the CARD box — it used to be position:fixed, so
  // it floated over page content. Measure against `.athora-brain` itself: the
  // hero sits 68px right and 64px down inside it, so measuring against the
  // hero would just measure that padding.
  const cardBox = await page.locator('.athora-brain').boundingBox()
  const railBox = await rail.boundingBox()

  // The vault starts OPEN — it is the way into everything else, and starting
  // it hidden left a first-time user with nothing to click. So the toggle now
  // CLOSES it, and a second press brings it back.
  const vault = page.getByText('VAULT', { exact: true })
  const vaultBefore = await vault.isVisible().catch(() => false)
  await page.getByRole('button', { name: 'Toggle vault column' }).click()
  await page.waitForTimeout(300)
  const vaultAfterClose = await vault.isVisible().catch(() => false)
  await page.getByRole('button', { name: 'Toggle vault column' }).click()
  await page.waitForTimeout(400)
  const vaultAfter = await vault.isVisible().catch(() => false)

  // Guard against the grid-template/child-count mismatch that made the brain
  // wrap to a second row: with VAULT open the brain must sit BESIDE the column,
  // not below it at the column's width.
  const heroBox = await hero.boundingBox()
  const vaultBox = await page.locator('.br-column').first().boundingBox()
  const brainBesideVault =
    !!heroBox && !!vaultBox && heroBox.x >= vaultBox.x + vaultBox.width - 8
  const brainWidth = heroBox ? Math.round(heroBox.width) : null

  await page.screenshot({ path: 'tests/.artifacts/dashboard-brain.png', fullPage: true })

  console.log(
    JSON.stringify(
      {
        hasCanvas,
        railItems: await rail.locator('button').count(),
        railInsideCard:
          !!railBox && !!cardBox && railBox.y >= cardBox.y - 2 && railBox.x >= cardBox.x - 2,
        vaultOpenByDefault: vaultBefore === true,
        vaultClosesOnToggle: vaultAfterClose === false,
        vaultReopensOnToggle: vaultAfter === true,
        brainBesideVault,
        brainWidth,
        consoleErrors: consoleErrors.slice(0, 8),
        pageErrors: pageErrors.slice(0, 8),
      },
      null,
      2,
    ),
  )

  expect(hasCanvas).toBe(true)
  expect(vaultBefore).toBe(true)
  expect(vaultAfterClose).toBe(false)
  expect(vaultAfter).toBe(true)
  expect(brainBesideVault).toBe(true)
  // The blank-canvas regression ("...reading 'tick'") surfaced here as a
  // page-level error while the canvas itself still reported a size.
  expect(pageErrors).toEqual([])
})

test('mobile docks the rail along the bottom edge', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('section[aria-label="Knowledge brain"]', { timeout: 40000 })

  // Dismiss consent first. The banner docks at the bottom and legitimately
  // reserves ~141px via --consent-h, so the shell — and therefore the dock —
  // stops above it. Measuring the dock against the raw viewport bottom while
  // the banner is up tests a first-paint state, not the layout users live in.
  for (const name of ['Accept all', 'Essential only']) {
    const btn = page.getByRole('button', { name })
    if (await btn.isVisible().catch(() => false)) {
      await btn.click()
      break
    }
  }
  await page.waitForTimeout(400)

  // This route renders no AppLayout chrome, so the rail is the ONLY navigation
  // and it must stay reachable on a phone — docked along the bottom edge, the
  // way the tab bar it replaced used to be.
  const rail = page.locator('nav[aria-label="Brain navigation"]')

  const railVisible = await rail.isVisible().catch(() => false)
  const railBox = await rail.boundingBox()
  const viewport = page.viewportSize()

  await page.screenshot({ path: 'tests/.artifacts/dashboard-brain-mobile.png', fullPage: false })

  console.log(JSON.stringify({ railVisibleOnMobile: railVisible, railBox }, null, 2))

  expect(railVisible).toBe(true)
  expect(railBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  // Spans the viewport width and sits against its bottom edge.
  expect(railBox!.width).toBeGreaterThan(viewport!.width * 0.9)
  expect(railBox!.y + railBox!.height).toBeGreaterThan(viewport!.height - 4)
})
