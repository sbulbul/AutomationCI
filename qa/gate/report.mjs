// Turns gate-result.json into Markdown for the PR comment and the job summary.
// Usage: node qa/gate/report.mjs gate-result.json > report.md

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARKER = '<!-- qa-gate-report -->';

const ICON = { PASS: '✅', WARN: '⚠️', BLOCK: '❌' };
const OUTCOME = { passed: '✅ passed', failed: '❌ failed', flaky: '⚠️ flaky', skipped: '⏭️ skipped', unknown: '❓ unknown' };

export function toMarkdown(r, runUrl = '') {
  const lines = [MARKER, `## ${ICON[r.decision]} QA gate: ${r.decision}`, ''];
  const c = r.counts;
  lines.push(`**${c.passed}/${c.total}** passed · ${c.failed} failed · ${c.flaky} flaky · ${c.skipped} skipped · mode \`${r.mode}\` · commit \`${String(r.sha).slice(0, 7)}\``, '');

  if (r.reasons.length) {
    lines.push('**Blocking this change**', ...r.reasons.map((x) => `- ${x}`), '');
  }
  if (r.warnings.length) {
    lines.push('**Warnings**', ...r.warnings.map((x) => `- ${x}`), '');
  }

  const rows = [...r.tests].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? '', undefined, { numeric: true }));
  lines.push('<details><summary>All tests</summary>', '', '| Test | Severity | Result |', '|---|---|---|');
  for (const t of rows) lines.push(`| ${t.id ?? '—'} ${t.title.replace(/^TC-\d+:\s*/, '')} | ${t.severity} | ${OUTCOME[t.outcome]} |`);
  lines.push('', '</details>');

  if (runUrl) lines.push('', `[Full run, traces and screenshots](${runUrl})`);
  return lines.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = JSON.parse(fs.readFileSync(process.argv[2] ?? 'gate-result.json', 'utf8'));
  process.stdout.write(toMarkdown(r, process.env.RUN_URL));
}
