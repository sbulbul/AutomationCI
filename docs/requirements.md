# Requirements: QA gate and release pipeline (V1)

Status: DRAFT for approval. Nothing here is implemented yet.

## 1. Pipeline requirements

| ID | Requirement | Enforced by |
|----|-------------|-------------|
| P1 | Every pull request runs the automated test suite against a locally served build. | CI workflow |
| P2 | A gate decides PASS or FAIL from test results. The decision is made by code, never by a model. | `qa/gate` |
| P3 | A FAIL blocks merging into `main`. | Branch protection: required status check `qa-gate` |
| P4 | A FAIL opens a bug (GitHub Issue) with test name, evidence and suspected cause. Repeat failures update the existing open issue instead of creating a new one. | Workflow step |
| P5 | A PASS on `main` deploys the built `dist/` to staging, then re-runs smoke tests against the staging URL. | Workflow |
| P6 | Live deploy needs (a) a fresh PASS for the exact commit SHA and (b) manual human approval. | Deploy script + GitHub Environment `production` |
| P7 | Missing, stale, malformed or unreadable gate results count as FAIL (fail closed). | `qa/gate` |
| P8 | Every run writes a log of what was tested, the gate decision and the reasons. | `logs/` JSONL, uploaded as CI artifact |

## 2. Site requirements (what the tests protect)

The site is a static, single-page marketing site (`dist/index.html`, two stylesheets, one script). No forms, no API. Contact is a `mailto:` link.

### Critical journeys (a failure blocks merge)

| ID | Journey | Expected |
|----|---------|----------|
| J1 | Page loads | HTTP 200, title contains "Test automation", all four assets (html, 2 css, js) return 200, no console errors, no failed network requests to our own origin |
| J2 | Hero interactive demo | "After" switches the phase to `after`, status becomes "SYSTEM OPERATIONAL"; "Before" returns to `before`; "Replay" restarts without error |
| J3 | Navigation anchors | Services, Approach, Ways to work, Let's talk each scroll to an element that exists (`#services`, `#approach`, `#engagement`, `#contact`) |
| J4 | Contact call to action | A `mailto:` link exists in `#contact`, has a non-empty address and subject |
| J5 | Outcome metrics | The three counters end at 86, 12 and 3 |

### Important (a failure raises a bug and a warning, does not block merge)

| ID | Item | Expected |
|----|------|----------|
| I1 | Responsive layout | No horizontal scroll at 375px and 1280px widths |
| I2 | Accessibility basics | Skip link works, one `h1`, buttons have accessible names, `lang` is set |
| I3 | Reduced motion | With `prefers-reduced-motion`, the page is usable and counters show final values |
| I4 | Internal links | Every `#anchor` resolves; no empty `href` |

### Security requirements (checked on staging, where the real host sends headers)

| ID | Item | Severity | Blocks |
|----|------|----------|--------|
| S1 | Served over HTTPS | Critical | live deploy |
| S2 | No secrets, tokens or private keys in `dist/` | Critical | merge |
| S3 | External resources are limited to the known list (Google Fonts) | High | live deploy |
| S4 | Security headers (CSP, X-Content-Type-Options) | Medium | warning only; GitHub Pages does not let us set headers, so this is a documented known limit |

### Known content issue (flagged, not a test failure)

The contact address is the placeholder `hello@example.com`. A check will warn while it is `example.com` and fail the **live** deploy (not the merge), so it cannot go out unnoticed.

## 3. Gate rules (draft)

- BLOCK merge: any J1-J5 failure, any S2 finding, malformed or missing results.
- BLOCK live deploy: everything above, plus S1, S3, placeholder contact address, staging smoke failure, or no fresh PASS for the commit SHA.
- WARN only: I1-I4, S4.
- Overrides: not supported in V1.

## 4. Human approval points

- Live deploy: the reviewer approves the `production` environment after seeing the staging URL.
- Changing gate rules, the deploy script or the workflow files: goes through a normal pull request (which itself must pass the gate).

## 5. Out of scope for V1

Email drafting and `send_email`, the security subagent, MCP, Claude-written triage. They come after the core pipeline works.

## 6. Open items

1. Staging repo name (proposed: `AutomationCI-staging`).
2. Token for pushing to the staging repo, created by the repo owner and stored as an Actions secret.
3. Confirm the "warn vs block" split above.
