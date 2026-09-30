import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const distDir = path.resolve(__dirname, '../../../dist');

const secretPatterns = [
  { name: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'GitHub classic token', re: /ghp_[A-Za-z0-9]{36}/ },
  { name: 'GitHub fine-grained token', re: /github_pat_[A-Za-z0-9_]{22,}/ },
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'AWS access key id', re: /AKIA[0-9A-Z]{16}/ },
];

const allowedOrigins = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

function filesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? filesUnder(full) : [full];
  });
}

const isLocal = (url: string) => /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);

test.describe('US-07: The site ships no secrets', () => {
  // TC-12: No secrets in the published files (US-07)
  test('TC-12: no secrets in the published files', { tag: '@critical' }, async () => {
    const hits: string[] = [];
    for (const file of filesUnder(distDir)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const p of secretPatterns) {
        // Report the file and pattern name only; never print the matched text.
        if (p.re.test(text)) hits.push(`${path.relative(distDir, file)}: ${p.name}`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });
});

test.describe('US-08: Deployed site is secure and uses a real contact address', () => {
  // TC-13: Only known third-party origins are loaded (US-08)
  test('TC-13: only known third-party origins are loaded', { tag: '@release' }, async ({ page, baseURL }) => {
    const ownOrigin = new URL(baseURL!).origin;
    const origins = new Set<string>();
    page.on('request', (r) => {
      if (!r.url().startsWith('data:')) origins.add(new URL(r.url()).origin);
    });

    await page.goto('./', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const unexpected = [...origins].filter((o) => o !== ownOrigin && !allowedOrigins.includes(o));
    expect(unexpected, `unexpected origins: ${unexpected.join(', ')}`).toEqual([]);
  });

  // TC-14: Deployed URL is served over HTTPS (US-08)
  test('TC-14: deployed URL is served over HTTPS', { tag: '@release' }, async ({ request, baseURL }) => {
    test.skip(isLocal(baseURL!), 'HTTPS is only verifiable on a deployed URL');

    expect(baseURL).toMatch(/^https:\/\//);

    let safe = false;
    try {
      const res = await request.get(baseURL!.replace(/^https:/, 'http:'), { maxRedirects: 0 });
      safe = res.status() >= 300 && res.status() < 400 && (res.headers()['location'] ?? '').startsWith('https://');
    } catch {
      safe = true; // plain http refused entirely
    }
    expect(safe, 'http:// must redirect to https:// or be refused').toBe(true);
  });

  // TC-15: Contact address is not the placeholder (US-08)
  // Expected to be red until hello@example.com is replaced. The gate treats @release failures as blocking the
  // live deploy only, not the merge.
  test('TC-15: contact address is not the placeholder', { tag: '@release' }, async ({ page }) => {
    await page.goto('./');
    const href = await page.locator('#contact a[href^="mailto:"]').getAttribute('href');
    const domain = decodeURIComponent(new URL(href!).pathname).split('@')[1] ?? '';
    expect(domain.toLowerCase(), 'mailto domain').not.toMatch(/(^|\.)example\.(com|org|net)$/);
  });
});
