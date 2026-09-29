import { test, expect, type ConsoleMessage, type Page } from '@playwright/test'

// Routes with no sidebar entry, and reachable without a session.
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/privacy', '/terms']

// Routes a signed-in user reaches by clicking the sidebar. Clicking (soft
// navigation) is the path that matters — a hard `goto` on every route missed a
// full-viewport sheet backdrop that swallowed every click in the app shell.
const NAV_ROUTES = ['/dashboard', '/sessions', '/library', '/flashcards', '/exam', '/tutor', '/analytics', '/settings']

// Signed-in routes with no sidebar entry.
const DIRECT_ROUTES = ['/onboarding', '/paywall']

// /dashboard renders the brain HUD instead of AppLayout, so its own rail is the
// navigation there. Each entry is the rail button's accessible name.
const RAIL_LABEL: Record<string, string> = {
  '/dashboard': 'Brain',
  '/sessions': 'Study Spaces',
  '/library': 'Library',
  '/flashcards': 'Flashcards',
  '/exam': 'Exam Mode',
  '/tutor': 'AI Tutor',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

// Network failures that are environmental, not app defects.
const IGNORED_REQUEST = [/posthog/i, /favicon/i, /google-analytics/i, /supabase\.co\/auth\/v1\/token/]

type Problem = { route: string; kind: string; detail: string }

function attach(page: Page, route: string, out: Problem[]) {
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return
    const text = msg.text()
    // Dev noise that is not an app defect. "GPU stall due to ReadPixels" is a
    // Chromium GL driver performance hint: the dashboard's 3D brain graph reads
    // pixels for node picking, which this driver reports as a stall on every
    // pointer move. It is a warning, not a failure, and no app code controls it.
    if (
      /Download the React DevTools|Fast Refresh|scroll-behavior: smooth|GL Driver Message|GPU stall due to ReadPixels/.test(
        text,
      )
    )
      return
    out.push({ route, kind: `console.${msg.type()}`, detail: text.slice(0, 400) })
  })
  page.on('pageerror', (err) => {
    out.push({ route, kind: 'pageerror', detail: `${err.name}: ${err.message}`.slice(0, 400) })
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (IGNORED_REQUEST.some((re) => re.test(url))) return
    // ERR_ABORTED is a cancelled in-flight fetch (navigation away, React
    // strict-mode double effect), not a failed request.
    if (/ERR_ABORTED/.test(req.failure()?.errorText ?? '')) return
    out.push({ route, kind: 'requestfailed', detail: `${req.method()} ${url} — ${req.failure()?.errorText}`.slice(0, 400) })
  })
  page.on('response', (r) => {
    if (r.status() < 400) return
    out.push({ route, kind: `http ${r.status()}`, detail: `${r.request().method()} ${r.url()}`.slice(0, 400) })
  })
}

function makeReport(problems: Problem[]) {
  let failed = 0
  return {
    failed: () => failed,
    report(route: string, extra = '') {
      console.log(`\n=== ${route}${extra}`)
      if (problems.length === 0) {
        console.log('   clean')
        return
      }
      failed++
      for (const p of problems) console.log(`   [${p.kind}] ${p.detail}`)
    },
  }
}

test('public routes render without a session', async ({ browser }) => {
  test.setTimeout(180_000)
  // A fresh context: the default one carries the signed-in cookie jar, which
  // can bounce /login away.
  const context = await browser.newContext()
  const page = await context.newPage()
  const problems: Problem[] = []
  const { failed, report } = makeReport(problems)

  for (const route of PUBLIC_ROUTES) {
    problems.length = 0
    attach(page, route, problems)
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    report(route, page.url() === `http://localhost:3000${route}` ? '' : ` -> ${page.url()}`)
    page.removeAllListeners()
  }

  await context.close()
  expect(failed(), `${failed()} route(s) reported problems`).toBe(0)
})

test('every brain rail link resolves to its route without errors', async ({ page }) => {
  test.setTimeout(300_000)
  const problems: Problem[] = []
  const { failed, report } = makeReport(problems)

  // Entry route is /dashboard, because its rail is the only place the brain
  // link exists. From there every route is reached by SOFT navigation: every
  // route in NAV_ROUTES now renders the same rail (AppLayout is no longer used
  // anywhere signed-in), so the rail is the only link locator needed.
  // Hard-loading between iterations instead would double the request rate and
  // trip the API's per-route throttle — a property of the scan, not the app.
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('nav[aria-label="Brain navigation"]', { timeout: 30000 })

  for (const route of NAV_ROUTES) {
    problems.length = 0
    attach(page, route, problems)

    try {
      const link = page.locator(
        `nav[aria-label="Brain navigation"] button[aria-label="${RAIL_LABEL[route]}"]`
      )

      await link.click({ timeout: 10000 })
      await page.waitForURL((u) => new URL(u).pathname === route, { timeout: 20000 })
    } catch (e) {
      problems.push({ route, kind: 'navigation', detail: String(e).split('\n')[0] })
    }
    await page.waitForTimeout(1500)

    const landed = new URL(page.url()).pathname
    report(route, landed === route ? '' : ` -> ${landed}`)
    page.removeAllListeners()
  }

  for (const route of DIRECT_ROUTES) {
    problems.length = 0
    attach(page, route, problems)
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    report(route, ` -> ${new URL(page.url()).pathname}`)
    page.removeAllListeners()
  }

  expect(failed(), `${failed()} route(s) reported problems`).toBe(0)
})
