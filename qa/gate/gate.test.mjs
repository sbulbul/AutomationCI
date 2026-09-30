import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './gate.mjs';
import { toMarkdown } from './report.mjs';

// Build a minimal Playwright-shaped report. Each entry: [id, tag, status]
const spec = (id, tag, status = 'expected') => ({
  title: `${id}: something`,
  tags: tag ? [tag] : [],
  tests: [{ status }],
});
const report = (specs, extra = {}) => ({ suites: [{ specs }], errors: [], ...extra });

const IDS = ['TC-01', 'TC-02', 'TC-03', 'TC-04'];
const base = () => [
  spec('TC-01', 'critical'),
  spec('TC-02', 'critical'),
  spec('TC-03', 'important'),
  spec('TC-04', 'release'),
];
const run = (r, mode = 'pr', requiredIds = IDS) => evaluate(r, { mode, requiredIds });

test('all green -> PASS', () => {
  assert.equal(run(report(base())).decision, 'PASS');
});

test('a failed critical test blocks', () => {
  const specs = base();
  specs[0] = spec('TC-01', 'critical', 'unexpected');
  const r = run(report(specs));
  assert.equal(r.decision, 'BLOCK');
  assert.match(r.reasons[0], /TC-01 \(critical\) failed/);
});

test('a failed important test only warns', () => {
  const specs = base();
  specs[2] = spec('TC-03', 'important', 'unexpected');
  assert.equal(run(report(specs)).decision, 'WARN');
});

test('a failed release test warns on a PR but blocks a release', () => {
  const specs = base();
  specs[3] = spec('TC-04', 'release', 'unexpected');
  assert.equal(run(report(specs), 'pr').decision, 'WARN');
  assert.equal(run(report(specs), 'release').decision, 'BLOCK');
});

test('a skipped release test is fine on a PR but blocks a release', () => {
  const specs = base();
  specs[3] = spec('TC-04', 'release', 'skipped');
  assert.equal(run(report(specs), 'pr').decision, 'WARN');
  assert.equal(run(report(specs), 'release').decision, 'BLOCK');
});

test('a skipped critical test blocks (a skip hides a check)', () => {
  const specs = base();
  specs[1] = spec('TC-02', 'critical', 'skipped');
  assert.equal(run(report(specs)).decision, 'BLOCK');
});

test('a flaky test warns', () => {
  const specs = base();
  specs[0] = spec('TC-01', 'critical', 'flaky');
  assert.equal(run(report(specs)).decision, 'WARN');
});

test('missing results file fails closed', () => {
  const r = evaluate(null, { mode: 'pr', requiredIds: IDS, readError: 'ENOENT' });
  assert.equal(r.decision, 'BLOCK');
  assert.match(r.reasons[0], /ENOENT/);
});

test('malformed results fail closed', () => {
  assert.equal(run({ nope: true }).decision, 'BLOCK');
  assert.equal(run('a string').decision, 'BLOCK');
});

test('zero tests executed fails closed', () => {
  const r = run(report([]), 'pr', []);
  assert.equal(r.decision, 'BLOCK');
  assert.match(r.reasons.join(), /No tests were executed/);
});

test('a deleted required test blocks (cannot go green by removing a failing test)', () => {
  const r = run(report(base().slice(1)));
  assert.equal(r.decision, 'BLOCK');
  assert.match(r.reasons.join(), /missing.*TC-01/);
});

test('an untagged test is treated as critical', () => {
  const specs = base();
  specs[2] = spec('TC-03', null, 'unexpected');
  assert.equal(run(report(specs)).decision, 'BLOCK');
});

test('run-level errors (e.g. a compile failure) block', () => {
  assert.equal(run(report(base(), { errors: [{ message: 'boom' }] })).decision, 'BLOCK');
});

test('an unrecognised status blocks', () => {
  const specs = base();
  specs[0] = spec('TC-01', 'critical', 'mystery');
  assert.equal(run(report(specs)).decision, 'BLOCK');
});

test('tags are read with or without the leading @, and nested suites are walked', () => {
  const nested = { suites: [{ suites: [{ specs: [spec('TC-01', '@critical', 'unexpected'), spec('TC-02', 'critical'), spec('TC-03', 'important'), spec('TC-04', 'release')] }] }] };
  const r = run(nested);
  assert.equal(r.decision, 'BLOCK');
  assert.equal(r.counts.total, 4);
});

test('the PR comment names the decision and the blocking reason', () => {
  const specs = base();
  specs[0] = spec('TC-01', 'critical', 'unexpected');
  const md = toMarkdown({ sha: 'abcdef1234', mode: 'pr', ...run(report(specs)) });
  assert.match(md, /QA gate: BLOCK/);
  assert.match(md, /TC-01 \(critical\) failed/);
  assert.match(md, /qa-gate-report/);
});
