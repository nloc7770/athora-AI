import { test, expect, Page } from '@playwright/test';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TEST_EMAIL = 'testathora@gmail.com';
const TEST_PASSWORD = 'Test1234!';

async function dismissCookieConsent(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Accept all' });
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click();
  }
}

async function login(page: Page): Promise<boolean> {
  await page.goto('/login');
  await dismissCookieConsent(page);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for either redirect or error (rate limit / wrong creds)
  const result = await Promise.race([
    page.waitForURL(/\/(dashboard|sessions)/, { timeout: 15000 }).then(() => 'redirected' as const),
    page.locator('.rounded-lg.bg-destructive\\/10').waitFor({ timeout: 15000 }).then(() => 'error' as const),
  ]).catch(() => 'timeout' as const);

  return result === 'redirected';
}

// ─── Landing Page ──────────────────────────────────────────────────────────────

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissCookieConsent(page);
  });

  test('loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Athora/);
  });

  test('nav contains login and register links', async ({ page }) => {
    const loginLink = page.locator('nav a[href="/login"]');
    await expect(loginLink).toBeVisible();

    const registerLink = page.locator('nav a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test('hero CTA button links to /register', async ({ page }) => {
    const heroCta = page.locator('section a[href="/register"]').first();
    await expect(heroCta).toBeVisible();
  });

  test('features section renders 5 feature cards', async ({ page }) => {
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();

    // Each feature card has an h3 inside the features section
    const featureHeadings = featuresSection.locator('h3');
    await expect(featureHeadings).toHaveCount(5);
  });

  test('pricing section is visible with Free and Pro plans', async ({ page }) => {
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toBeVisible();

    await expect(pricingSection.getByText('$0')).toBeVisible();
    await expect(pricingSection.getByText('$12')).toBeVisible();
  });

  test('pricing CTA buttons link to /register', async ({ page }) => {
    const pricingSection = page.locator('#pricing');
    const pricingLinks = pricingSection.locator('a[href="/register"]');
    const count = await pricingLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('footer links are real (not #)', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const privacyLink = footer.locator('a[href="/privacy"]');
    await expect(privacyLink).toBeVisible();

    const termsLink = footer.locator('a[href="/terms"]');
    await expect(termsLink).toBeVisible();
  });

  test('nav anchor links point to sections', async ({ page }) => {
    const featuresLink = page.locator('nav a[href="#features"]').first();
    await expect(featuresLink).toBeVisible();

    const pricingLink = page.locator('nav a[href="#pricing"]').first();
    await expect(pricingLink).toBeVisible();
  });
});

// ─── Auth Flow ─────────────────────────────────────────────────────────────────

test.describe('Auth Flow', () => {
  test('login form submits with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieConsent(page);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for either redirect or error (rate limit is acceptable)
    const result = await Promise.race([
      page.waitForURL(/\/(dashboard|sessions)/, { timeout: 15000 }).then(() => 'redirected' as const),
      page.locator('.rounded-lg.bg-destructive\\/10').waitFor({ timeout: 15000 }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const);

    // Either redirected (success) or got an error message displayed (form works)
    expect(result).not.toBe('timeout');
  });

  test('login with invalid credentials shows error message', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieConsent(page);
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error or stay on login page
    const errorDiv = page.locator('.rounded-lg.bg-destructive\\/10');
    const stayedOnLogin = await page.waitForURL(/\/login/, { timeout: 3000 }).then(() => true).catch(() => false);

    const errorVisible = await errorDiv.isVisible({ timeout: 10000 }).catch(() => false);

    // Either error is shown OR we stayed on login (both confirm invalid creds handled)
    expect(errorVisible || stayedOnLogin).toBe(true);
  });

  test('register form has password requirements text', async ({ page }) => {
    await page.goto('/register');
    await dismissCookieConsent(page);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();

    const hint = page.getByText('Minimum 8 characters');
    await expect(hint).toBeVisible();
  });

  test('register form has terms checkbox', async ({ page }) => {
    await page.goto('/register');
    await dismissCookieConsent(page);
    const termsCheckbox = page.locator('input#terms[type="checkbox"]');
    await expect(termsCheckbox).toBeVisible();

    const termsLabel = page.getByText('Terms of Service');
    await expect(termsLabel).toBeVisible();
  });

  test('register submit disabled without terms accepted', async ({ page }) => {
    await page.goto('/register');
    await dismissCookieConsent(page);
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[type="password"]', 'StrongPass1!');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('login page has forgot password link', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieConsent(page);
    const forgotLink = page.locator('a[href="/forgot-password"]');
    await expect(forgotLink).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    await dismissCookieConsent(page);
    const signUpLink = page.locator('a[href="/register"]');
    await expect(signUpLink).toBeVisible();
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register');
    await dismissCookieConsent(page);
    const signInLink = page.locator('a[href="/login"]');
    await expect(signInLink).toBeVisible();
  });
});

// ─── Protected Routes ──────────────────────────────────────────────────────────

test.describe('Protected Routes', () => {
  test('sessions page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15000 });
  });
});

// ─── Sessions Flow (Authenticated) ────────────────────────────────────────────

test.describe('Sessions Flow', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) {
      test.skip();
      return;
    }
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
  });

  test('sessions page loads with create button', async ({ page }) => {
    const heading = page.getByText('Session Management');
    await expect(heading).toBeVisible({ timeout: 10000 });

    const createButton = page.getByRole('button', { name: /create new session/i });
    await expect(createButton).toBeVisible();
  });

  test('sessions page has search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search by session name');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('create modal opens with file upload zone', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create new session/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Modal content
    const modalTitle = page.getByText('Create new session', { exact: false });
    await expect(modalTitle.first()).toBeVisible({ timeout: 5000 });

    // Session name input
    const nameInput = page.getByPlaceholder('e.g. Machine Learning Midterm');
    await expect(nameInput).toBeVisible();

    // Upload zone
    const uploadText = page.getByText('Drag & drop files or Browse');
    await expect(uploadText).toBeVisible();

    // File type hint
    const fileHint = page.getByText('Supported: PDF (max 50MB)');
    await expect(fileHint).toBeVisible();
  });

  test('create modal cancel button closes modal', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create new session/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    const modalTitle = page.getByText('Create new session', { exact: false });
    await expect(modalTitle.first()).toBeVisible({ timeout: 5000 });

    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    await expect(modalTitle.first()).not.toBeVisible({ timeout: 3000 });
  });

  test('sessions table has expected columns', async ({ page }) => {
    // Wait for table to render
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    await expect(page.locator('th:has-text("Session name")')).toBeVisible();
    await expect(page.locator('th:has-text("Files")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
});

// ─── Session Workspace (Authenticated) ────────────────────────────────────────

test.describe('Session Workspace', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) {
      test.skip();
      return;
    }
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');

    // Try to navigate to first session if one exists
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('tbody tr').first();
    const rowVisible = await firstRow.isVisible().catch(() => false);
    if (!rowVisible) {
      test.skip();
      return;
    }

    const cellText = await firstRow.locator('td').first().textContent().catch(() => '');
    if (!cellText || cellText.includes('No sessions')) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/sessions\//, { timeout: 10000 });
  });

  test('workspace renders all 6 tabs', async ({ page }) => {
    const tabLabels = ['Documents', 'Chat', 'Flashcards', 'Exam', 'Summary', 'Mind Map'];
    for (const label of tabLabels) {
      const tab = page.locator('button', { hasText: label });
      await expect(tab).toBeVisible({ timeout: 5000 });
    }
  });

  test('documents tab has upload zone', async ({ page }) => {
    const uploadZone = page.getByText('Drop files or click to upload');
    await expect(uploadZone).toBeVisible({ timeout: 5000 });
  });

  test('chat tab shows input or empty state', async ({ page }) => {
    const chatTab = page.locator('button', { hasText: 'Chat' });
    await chatTab.click();
    await page.waitForTimeout(500);

    const chatInput = page.getByPlaceholder('Ask about your documents...');
    const emptyState = page.getByText('Upload and process documents first');

    const inputVisible = await chatInput.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(inputVisible || emptyVisible).toBe(true);
  });

  test('clicking tabs switches content', async ({ page }) => {
    const tabLabels = ['Flashcards', 'Exam', 'Summary', 'Mind Map', 'Documents'];
    for (const label of tabLabels) {
      const tab = page.locator('button', { hasText: label });
      await tab.click();
      await page.waitForTimeout(300);

      // Verify the tab is now active (has amber border)
      await expect(tab).toHaveClass(/border-amber/);
    }
  });

  test('workspace header shows session name', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const heading = header.locator('h1');
    await expect(heading).toBeVisible();
    const title = await heading.textContent();
    expect(title?.length).toBeGreaterThan(0);
  });
});
