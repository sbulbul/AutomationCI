// The QA gate. Plain code, no model: it decides PASS / WARN / BLOCK from Playwright's JSON results.
// Design rule: anything unexpected (missing file, bad JSON, zero tests, an untagged test) fails closed.
//
// Usage: node qa/gate/gate.mjs --results test-results/results.json --mode pr|release [--out gate-result.json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KNOWN_TAGS = ['critical', 'important', 'release'];

const normalizeTag = (t) => String(t).replace(/^@/, '').toLowerCase();

/** Flatten Playwright's nested JSON report into one row per test. */
export function flatten(report) {
  const rows = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const tags = new Set((spec.tags ?? []).map(normalizeTag));
      // Belt and braces: some Playwright versions also append tags to the title.
      for (const m of spec.title.matchAll(/@(\w+)/g)) tags.add(normalizeTag(m[1]));
      const id = spec.title.match(/TC-\d+/)?.[0] ?? null;
      for (const t of spec.tests ?? []) {
        rows.push({ id, title: spec.title.replace(/\s@\w+/g, '').trim(), tags: [...tags], status: t.status });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const s of report.suites ?? []) walk(s);
  return rows;
}

/** Severity of a test: its known tag, or "critical" when it has none (unknown means strict). */
export function severityOf(row) {
  return KNOWN_TAGS.find((k) => row.tags.includes(k)) ?? 'critical';
}

/** Map Playwright's status to a plain outcome. */
export function outcomeOf(row) {
  switch (row.status) {
    case 'expected': return 'passed';
    case 'unexpected': return 'failed';
    case 'flaky': return 'flaky';
    case 'skipped': return 'skipped';
    default: return 'unknown';
  }
}

/**
 * @param {object|null} report  parsed Playwright JSON report (null if it could not be read)
 * @param {{mode: 'pr'|'release', requiredIds: string[], readError?: string}} opts
 */
export function evaluate(report, { mode, requiredIds = [], readError }) {
  const reasons = [];
  const warnings = [];

  if (!report) {
    return finish('BLOCK', [readError ?? 'Results file is missing or unreadable'], warnings, []);
  }
  if (typeof report !== 'object' || !Array.isArray(report.suites)) {
    return finish('BLOCK', ['Results file is not a valid Playwright JSON report'], warnings, []);
  }
  if ((report.errors ?? []).length > 0) {
    reasons.push(`Playwright reported ${report.errors.length} run-level error(s) (config, setup or compile failure)`);
  }

  const rows = flatten(report).map((r) => ({ ...r, severity: severityOf(r), outcome: outcomeOf(r) }));

  if (rows.length === 0) reasons.push('No tests were executed');

  // Guard against deleting a failing test to make the gate green.
  const seen = new Set(rows.map((r) => r.id).filter(Boolean));
  const missing = requiredIds.filter((id) => !seen.has(id));
  if (missing.length) reasons.push(`Required tests are missing from the results: ${missing.join(', ')}`);

  for (const r of rows) {
    const label = `${r.id ?? r.title} (${r.severity})`;
    if (r.outcome === 'unknown') {
      reasons.push(`${label}: unrecognised result status "${r.status}"`);
    } else if (r.outcome === 'failed') {
      if (r.severity === 'critical') reasons.push(`${label} failed`);
      else if (r.severity === 'release' && mode === 'release') reasons.push(`${label} failed`);
      else if (r.severity === 'release') warnings.push(`${label} failed: would block the live deploy`);
      else warnings.push(`${label} failed`);
    } else if (r.outcome === 'flaky') {
      warnings.push(`${label} passed only after a retry (flaky)`);
    } else if (r.outcome === 'skipped') {
      if (r.severity === 'critical') reasons.push(`${label} was skipped; a skipped critical test hides a check`);
      else if (r.severity === 'release' && mode === 'release') reasons.push(`${label} was skipped; release checks must run against the deployed URL`);
      else warnings.push(`${label} was skipped`);
    }
  }

  const decision = reasons.length ? 'BLOCK' : warnings.length ? 'WARN' : 'PASS';
  return finish(decision, reasons, warnings, rows);
}

function finish(decision, reasons, warnings, rows) {
  const count = (o) => rows.filter((r) => r.outcome === o).length;
  return {
    decision,
    reasons,
    warnings,
    counts: { total: rows.length, passed: count('passed'), failed: count('failed'), flaky: count('flaky'), skipped: count('skipped') },
    tests: rows.map((r) => ({ id: r.id, title: r.title, severity: r.severity, outcome: r.outcome })),
  };
}

// ---- CLI ---------------------------------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const resultsPath = arg('results', 'test-results/results.json');
  const mode = arg('mode', 'pr');
  const out = arg('out', 'gate-result.json');
  const requiredIds = JSON.parse(fs.readFileSync(path.join(here, 'required-tests.json'), 'utf8'));

  if (!['pr', 'release'].includes(mode)) {
    console.error(`Unknown mode "${mode}"`);
    process.exit(2);
  }

  let report = null;
  let readError;
  try {
    report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  } catch (e) {
    readError = `Could not read ${resultsPath}: ${e.message}`;
  }

  const result = {
    sha: process.env.GITHUB_SHA ?? 'local',
    mode,
    generatedAt: new Date().toISOString(),
    ...evaluate(report, { mode, requiredIds, readError }),
  };
  fs.writeFileSync(out, JSON.stringify(result, null, 2));

  console.log(`Gate (${mode}): ${result.decision}`);
  for (const r of result.reasons) console.log(`  BLOCK: ${r}`);
  for (const w of result.warnings) console.log(`  warn:  ${w}`);
  process.exit(result.decision === 'BLOCK' ? 1 : 0);
}
