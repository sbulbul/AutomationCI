import { test, expect, type Page } from '@playwright/test';

// The demo auto-plays once when it scrolls into view (about 4.3 s), and that first play can reset the
// phase. Let it finish before interacting so the clicks below are deterministic.
async function openSettledDemo(page: Page) {
  await page.goto('./');
  const demo = page.locator('#system-demo');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toHaveAttribute('data-phase', 'after', { timeout: 10_000 });
  return demo;
}

const phases = [
  { click: 'Before', phase: 'before', index: '01 / BEFORE', status: 'ATTENTION REQUIRED', beforePressed: 'true', afterPressed: 'false' },
  { click: 'After', phase: 'after', index: '03 / AFTER', status: 'SYSTEM OPERATIONAL', beforePressed: 'false', afterPressed: 'true' },
];

test.describe('US-02: Explore the release-system demo', () => {
  // TC-03: Before/After buttons switch the demo phase (US-02)
  test('TC-03: Before/After buttons switch the demo phase', { tag: '@critical' }, async ({ page }) => {
    const demo = await openSettledDemo(page);

    for (const c of phases) {
      await page.getByRole('button', { name: c.click, exact: true }).click();
      await expect(demo, c.click).toHaveAttribute('data-phase', c.phase);
      await expect(page.locator('#phase-index'), c.click).toHaveText(c.index);
      await expect(page.locator('#system-status'), c.click).toHaveText(c.status);
      await expect(page.getByRole('button', { name: 'Before', exact: true }), c.click).toHaveAttribute('aria-pressed', c.beforePressed);
      await expect(page.getByRole('button', { name: 'After', exact: true }), c.click).toHaveAttribute('aria-pressed', c.afterPressed);
    }
  });

  // TC-04: Replay runs Before -> Rebuild -> After (US-02)
  test('TC-04: Replay runs Before, Rebuild, then After', { tag: '@critical' }, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const demo = await openSettledDemo(page);

    await page.getByRole('button', { name: 'Replay system transformation' }).click();
    await expect(demo).toHaveAttribute('data-phase', 'before');

    // Script timers: rebuild at 1.6 s, after at 4.3 s.
    await expect(demo).toHaveAttribute('data-phase', 'repair', { timeout: 4_000 });
    await expect(page.locator('#phase-index')).toHaveText('02 / REBUILD');
    await expect(page.locator('#system-status')).toHaveText('AUTOMATION IN PROGRESS');

    await expect(demo).toHaveAttribute('data-phase', 'after', { timeout: 6_000 });
    await expect(page.locator('#system-status')).toHaveText('SYSTEM OPERATIONAL');

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
