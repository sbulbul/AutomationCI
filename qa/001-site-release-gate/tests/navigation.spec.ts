import { test, expect } from '@playwright/test';

const links = [
  { name: /Services/, target: '#services' },
  { name: /Approach/, target: '#approach' },
  { name: /Ways to work/, target: '#engagement' },
  { name: /Let.s talk/, target: '#contact' },
];

test.describe('US-03: Navigate to sections', () => {
  // TC-05: Header links scroll to their sections (US-03)
  test('TC-05: header links scroll to their sections', { tag: '@critical' }, async ({ page }) => {
    for (const l of links) {
      await page.goto('./');
      const link = page.getByRole('banner').getByRole('link', { name: l.name });
      await expect(link, String(l.name)).toHaveAttribute('href', l.target);
      await link.click();
      await expect(page, String(l.name)).toHaveURL(new RegExp(`${l.target}$`));
      await expect(page.locator(l.target), l.target).toBeInViewport();
    }
  });

  // TC-06: Every in-page anchor has a target (US-03)
  test('TC-06: every in-page anchor has a target', { tag: '@important' }, async ({ page }) => {
    await page.goto('./');
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map((a) => a.getAttribute('href')!)
        .filter((h) => h !== '#' && !document.querySelector(h)),
    );
    expect(missing, `anchors with no target: ${missing.join(', ')}`).toEqual([]);
  });
});

test.describe('US-04: Contact call to action', () => {
  // TC-07: Contact link is a usable mailto (US-04)
  test('TC-07: contact link is a usable mailto', { tag: '@critical' }, async ({ page }) => {
    await page.goto('./');
    const mailto = page.locator('#contact a[href^="mailto:"]');
    await expect(mailto).toHaveCount(1);

    const url = new URL((await mailto.getAttribute('href'))!);
    const address = decodeURIComponent(url.pathname);
    expect(address, 'mailto address').toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(url.searchParams.get('subject') ?? '', 'mailto subject').not.toBe('');
  });
});
