import { test, expect } from '@playwright/test';

const files = [
  { path: './', status: 200 },
  { path: 'style.css', status: 200 },
  { path: 'editorial.css', status: 200 },
  { path: 'animation.js', status: 200 },
];

test.describe('US-01: Page loads completely', () => {
  // TC-01: All site files load with HTTP 200 (US-01)
  test('TC-01: all site files load with HTTP 200', { tag: '@critical' }, async ({ request, page }) => {
    for (const f of files) {
      const res = await request.get(f.path);
      expect(res.status(), f.path).toBe(f.status);
    }
    await page.goto('./');
    await expect(page).toHaveTitle(/Test automation/);
  });

  // TC-02: No console errors or failed own-origin requests on load (US-01)
  test('TC-02: no console errors or failed own-origin requests', { tag: '@critical' }, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const problems: string[] = [];

    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      // Third-party failures (fonts) are covered by TC-13; only judge our own origin here.
      if (m.type() === 'error' && m.location().url.startsWith(origin)) problems.push(`console: ${m.text()}`);
    });
    page.on('requestfailed', (r) => {
      if (r.url().startsWith(origin)) problems.push(`requestfailed: ${r.url()}`);
    });
    page.on('response', (r) => {
      if (r.url().startsWith(origin) && r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`);
    });

    await page.goto('./', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    expect(problems, problems.join('\n')).toEqual([]);
  });
});
