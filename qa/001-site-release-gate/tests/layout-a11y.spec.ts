import { test, expect } from '@playwright/test';

const widths = [375, 1280];

test.describe('US-06: Usable on any device and accessible', () => {
  // TC-09: No horizontal scroll on phone and desktop (US-06)
  test('TC-09: no horizontal scroll at phone and desktop widths', { tag: '@important' }, async ({ page }) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('./');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `scrollWidth at ${width}px`).toBeLessThanOrEqual(width);
    }
  });

  // TC-10: Basic accessibility structure (US-06)
  test('TC-10: basic accessibility structure', { tag: '@important' }, async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
    await expect(page.locator('h1')).toHaveCount(1);

    await expect(page.locator('a.skip')).toHaveAttribute('href', '#main');
    await expect(page.locator('#main')).toHaveCount(1);

    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count, 'buttons found').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i), `button #${i}`).toHaveAccessibleName(/.+/);
    }
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    // TC-11: Reduced motion lands on the final state (US-06)
    test('TC-11: reduced motion shows the final state immediately', { tag: '@important' }, async ({ page }) => {
      await page.goto('./');
      await page.locator('#system-demo').scrollIntoViewIfNeeded();
      await expect(page.locator('#system-demo')).toHaveAttribute('data-phase', 'after');
      await expect(page.locator('#system-status')).toHaveText('SYSTEM OPERATIONAL');

      await page.locator('.metric-grid').scrollIntoViewIfNeeded();
      await expect(page.locator('[data-count]')).toHaveText(['86', '12', '3']);
    });
  });
});
