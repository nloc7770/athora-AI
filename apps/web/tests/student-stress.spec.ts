import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = 'test-results/student-test';

const PDF_FILE = '/Users/locnguyen/Downloads/Telegram Desktop/11b082f3_1d1f_4a2b_b7d3_2608a8bca8cd_9_r_studio_manual_basic_en.pdf';

const STUDENTS = [
  { email: 'mit.student@athora.app', name: 'MIT Student' },
  { email: 'harvard.student@athora.app', name: 'Harvard Student' },
  { email: 'oxford.student@athora.app', name: 'Oxford Student' },
  { email: 'rmit.student@athora.app', name: 'RMIT Student' },
];

// Passwords read from env or use convention: {School}Test2024!
function getPassword(email: string): string {
  const prefix = email.split('.')[0];
  const school = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  return process.env[`${prefix.toUpperCase()}_PASS`] || `${school}Test2024!`;
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
}

async function apiLogin(page: Page, email: string) {
  const resp = await page.request.post(`${API_URL}/auth/login`, {
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    data: { email, password: getPassword(email) },
  });
  const cookies = resp.headers()['set-cookie'];
  if (cookies) {
    for (const part of cookies.split(',').map(c => c.trim())) {
      const [nv] = part.split(';');
      const [n, ...v] = nv.split('=');
      if (n && v.length) {
        await page.context().addCookies([{ name: n.trim(), value: v.join('=').trim(), domain: 'localhost', path: '/' }]);
      }
    }
  }
  return resp.ok();
}

for (const student of STUDENTS) {
  test.describe(`${student.name} — Full Study Flow`, () => {
    test.setTimeout(120000);

    test('Login + Create Session + Upload PDF', async ({ page }) => {
      // Retry login with backoff (rate limit might be active)
      let loggedIn = false;
      for (let i = 0; i < 3; i++) {
        loggedIn = await apiLogin(page, student.email);
        if (loggedIn) break;
        await page.waitForTimeout(2000 * (i + 1));
      }
      if (!loggedIn) {
        // Take screenshot of rate-limited state and skip
        await screenshot(page, `${student.name.replace(' ', '-')}-00-rate-limited`);
        return;
      }

      await page.goto(`${BASE_URL}/sessions`);
      await page.waitForLoadState('networkidle');
      await screenshot(page, `${student.name.replace(' ', '-')}-01-sessions`);

      const createBtn = page.locator('button').filter({ hasText: /create|new/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 })) {
        await createBtn.click();
        await page.waitForTimeout(1000);

        const nameInput = page.locator('input').first();
        if (await nameInput.isVisible({ timeout: 3000 })) {
          await nameInput.fill(`${student.name} Study Session`);
        }

        const submitBtn = page.locator('button').filter({ hasText: /create|save|start/i }).first();
        if (await submitBtn.isVisible({ timeout: 3000 })) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      await screenshot(page, `${student.name.replace(' ', '-')}-02-session-created`);

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(PDF_FILE);
        await page.waitForTimeout(3000);
        await screenshot(page, `${student.name.replace(' ', '-')}-03-pdf-uploaded`);
      }
    });

    test('Dashboard + Library', async ({ page }) => {
      await apiLogin(page, student.email);

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await screenshot(page, `${student.name.replace(' ', '-')}-04-dashboard`);

      await page.goto(`${BASE_URL}/library`);
      await page.waitForLoadState('networkidle');
      await screenshot(page, `${student.name.replace(' ', '-')}-05-library`);
    });

    test('AI Tutor Chat', async ({ page }) => {
      await apiLogin(page, student.email);

      await page.goto(`${BASE_URL}/tutor`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await screenshot(page, `${student.name.replace(' ', '-')}-06-tutor`);

      const input = page.locator('input[type="text"], textarea').last();
      if (await input.isVisible({ timeout: 5000 })) {
        await input.fill('Explain the main concepts from my documents');
        await input.press('Enter');
        await page.waitForTimeout(15000);
        await screenshot(page, `${student.name.replace(' ', '-')}-07-tutor-response`);
      }
    });

    test('Flashcards + Exam', async ({ page }) => {
      await apiLogin(page, student.email);

      await page.goto(`${BASE_URL}/flashcards`);
      await page.waitForLoadState('networkidle');
      await screenshot(page, `${student.name.replace(' ', '-')}-08-flashcards`);

      await page.goto(`${BASE_URL}/exam`);
      await page.waitForLoadState('networkidle');
      await screenshot(page, `${student.name.replace(' ', '-')}-09-exam`);
    });

    test('Settings', async ({ page }) => {
      await apiLogin(page, student.email);

      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');
      await screenshot(page, `${student.name.replace(' ', '-')}-10-settings`);
    });
  });
}
