import { test, expect } from '@playwright/test';

test.describe('US-05: Outcome metrics show the stated figures', () => {
  // TC-08: Counters settle at 86, 12 and 3 (US-05)
  test('TC-08: counters settle at 86, 12 and 3', { tag: '@critical' }, async ({ page }) => {
    await page.goto('./');
    const grid = page.locator('.metric-grid');
    await grid.scrollIntoViewIfNeeded();
    await expect(grid).toHaveClass(/in-view/);

    // The HTML already contains the final numbers, so asserting straight away could pass before the
    // count-up even starts. Let the 1.5 s animation finish, then check the settled values.
    await page.waitForTimeout(1_800);

    await expect(page.locator('[data-count]')).toHaveText(['86', '12', '3']);
  });
});
