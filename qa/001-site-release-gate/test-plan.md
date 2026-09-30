# Test Plan — Site release gate (AutomationCI marketing site)

Derived from `user-stories.md` on 2026-09-30. Scope: UI plus static-file and network checks (no API exists). Automation target: Playwright in TypeScript, plain style.

Legend — **Priority**: Critical / Important / Release (Release = blocks the live deploy only). **Type**: UI (Functional) / UI (State) / UI (Validation) / Static analysis / Security (lite). **Automate now?**: Yes / Later.

Gate tags: `@critical` blocks merge, `@important` warns and opens a bug, `@release` blocks the live deploy.

Environment: every test uses `baseURL` from the `BASE_URL` env var (default: local `http://127.0.0.1:8123`). No test data is required; the site is static.

---

## Page load (`tests/page-load.spec.ts`)

### TC-01: All site files load with HTTP 200
**Story:** US-01
**Type:** UI (Functional)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** Site is being served.

**Steps:**
1. Request each file directly.
2. Open the site root in a browser.

**Expected result:**
- Every file in the Conditions table returns the listed status.
- The page title contains "Test automation".

**Conditions:**
| Input | Expected |
|---|---|
| `/` (index.html) | 200 |
| `/style.css` | 200 |
| `/editorial.css` | 200 |
| `/animation.js` | 200 |

### TC-02: No console errors or failed own-origin requests on load
**Story:** US-01
**Type:** UI (State)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** None.

**Steps:**
1. Attach listeners for console errors, uncaught page errors and failed requests.
2. Open `/` and wait for the network to settle.
3. Scroll to the bottom of the page.

**Expected result:**
- Zero console errors, zero uncaught page errors.
- Zero failed or 4xx/5xx responses from the site's own origin. (Third-party font requests are ignored here; TC-13 covers them.)

---

## Release demo (`tests/demo.spec.ts`)

### TC-03: Before/After buttons switch the demo phase
**Story:** US-02
**Type:** UI (Functional)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** Page loaded; demo scrolled into view.

**Steps:**
1. Click the button in the Conditions table.
2. Read the demo state.

**Expected result:** the demo shows the values in the Conditions table, and `#system-demo` has the matching `data-phase`.

**Conditions:**
| Click | `data-phase` | Index | Status | Before pressed | After pressed |
|---|---|---|---|---|---|
| Before | `before` | 01 / BEFORE | ATTENTION REQUIRED | true | false |
| After | `after` | 03 / AFTER | SYSTEM OPERATIONAL | false | true |

### TC-04: Replay runs Before → Rebuild → After
**Story:** US-02
**Type:** UI (State)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** Page loaded; demo in view; animations enabled.

**Steps:**
1. Click "After" so the demo starts from a known end state.
2. Click "Replay".
3. Immediately read the phase.
4. Wait for the phase to change to `repair`, then to `after` (script timers: 1.6 s and 4.3 s).

**Expected result:**
- Phase is `before` right after Replay.
- Phase becomes `repair` with index "02 / REBUILD" and status "AUTOMATION IN PROGRESS".
- Phase ends as `after` with status "SYSTEM OPERATIONAL".
- No page errors during the sequence.

---

## Navigation and contact (`tests/navigation.spec.ts`)

### TC-05: Header links scroll to their sections
**Story:** US-03
**Type:** UI (Functional)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** Page loaded at 1280px width.

**Steps:**
1. Click the header link named in the Conditions table.
2. Read the URL hash and the target element.

**Expected result:** the link's `href` and the resulting URL hash equal the target id, the target exists and is in the viewport.

**Conditions:**
| Link | Target |
|---|---|
| Services | `#services` |
| Approach | `#approach` |
| Ways to work | `#engagement` |
| Let's talk | `#contact` |

### TC-06: Every in-page anchor has a target
**Story:** US-03
**Type:** Static analysis (in browser)
**Priority:** Important (`@important`)
**Automate now?:** Yes
**Preconditions:** Page loaded.

**Steps:**
1. Collect every `a[href^="#"]` except bare `#`.
2. Check each target id exists.

**Expected result:** every collected anchor resolves; the list of unresolved anchors is empty, and the assertion message names any missing target.

### TC-07: Contact link is a usable mailto
**Story:** US-04
**Type:** UI (Functional)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** Page loaded.

**Steps:**
1. Find the `mailto:` link inside `#contact`.
2. Parse its address and query.

**Expected result:**
- Exactly one `mailto:` link is in `#contact`.
- The address is a syntactically valid email (contains one `@`, non-empty local part and a dotted domain).
- The `subject` parameter is non-empty.

---

## Outcome metrics (`tests/metrics.spec.ts`)

### TC-08: Counters settle at 86, 12 and 3
**Story:** US-05
**Type:** UI (State)
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** Page loaded; animations enabled. Note: the counters replay from their start values once scrolled into view, so the test must scroll first.

**Steps:**
1. Scroll `.metric-grid` into view.
2. Wait for the animation (1.5 s) to finish.
3. Read the three `[data-count]` elements.

**Expected result:**
- `.metric-grid` gains the `in-view` class.
- Counters read 86, 12 and 3 (in that order).

---

## Layout and accessibility (`tests/layout-a11y.spec.ts`)

### TC-09: No horizontal scroll on phone and desktop
**Story:** US-06
**Type:** UI (Validation)
**Priority:** Important (`@important`)
**Automate now?:** Yes
**Preconditions:** None.

**Steps:**
1. Set the viewport to the width in the Conditions table.
2. Open `/` and scroll to the bottom.
3. Compare `document.documentElement.scrollWidth` with the viewport width.

**Expected result:** `scrollWidth` is at most the viewport width.

**Conditions:**
| Viewport width | Expected |
|---|---|
| 375 | no overflow |
| 1280 | no overflow |

### TC-10: Basic accessibility structure
**Story:** US-06
**Type:** UI (Validation)
**Priority:** Important (`@important`)
**Automate now?:** Yes
**Preconditions:** Page loaded.

**Steps:**
1. Read `<html lang>`, count `<h1>`, inspect the skip link and buttons.

**Expected result:**
- `<html>` has a non-empty `lang`.
- Exactly one `<h1>`.
- The skip link points to `#main` and `#main` exists.
- Every `<button>` has a non-empty accessible name.

### TC-11: Reduced motion lands on the final state
**Story:** US-06
**Type:** UI (State)
**Priority:** Important (`@important`)
**Automate now?:** Yes
**Preconditions:** Browser emulates `prefers-reduced-motion: reduce`.

**Steps:**
1. Open `/` with reduced motion emulated.
2. Scroll the demo and the metrics into view.
3. Read the demo phase and the counters.

**Expected result:**
- Demo phase is `after` with status "SYSTEM OPERATIONAL" without waiting for timers.
- Counters read 86, 12 and 3.

---

## Security and release checks (`tests/security-release.spec.ts`)

### TC-12: No secrets in the published files
**Story:** US-07
**Type:** Security (lite) / Static analysis
**Priority:** Critical (`@critical`)
**Automate now?:** Yes
**Preconditions:** `dist/` exists in the repo checkout.

**Steps:**
1. Read every file under `dist/`.
2. Match each against the patterns in the Conditions table.

**Expected result:** no file matches any pattern; a failure message names the file and pattern but never prints the matched text.

**Conditions:**
| Pattern | Expected |
|---|---|
| `-----BEGIN ... PRIVATE KEY-----` | no match |
| `ghp_` + 36 alphanumerics | no match |
| `github_pat_` + 22+ alphanumerics/underscores | no match |
| `sk-ant-` + 20+ characters | no match |
| `AKIA` + 16 uppercase alphanumerics | no match |

### TC-13: Only known third-party origins are loaded
**Story:** US-08
**Type:** Security (lite)
**Priority:** Release (`@release`)
**Automate now?:** Yes
**Preconditions:** None.

**Steps:**
1. Record the origin of every request made while loading `/` and scrolling.
2. Compare against the allowlist.

**Expected result:** every request origin is the site's own origin, `https://fonts.googleapis.com` or `https://fonts.gstatic.com` (and `data:` URLs); any other origin fails the test and is named in the message.

### TC-14: Deployed URL is served over HTTPS
**Story:** US-08
**Type:** Security (lite)
**Priority:** Release (`@release`)
**Automate now?:** Yes (skipped on localhost with an explicit reason)
**Preconditions:** `BASE_URL` points at a deployed site.

**Steps:**
1. Read the protocol of `BASE_URL`.
2. Request the `http://` version of the same host.

**Expected result:**
- `BASE_URL` starts with `https://`.
- The `http://` request either redirects to `https://` or is refused.
- Skipped with reason "HTTPS is only verifiable on a deployed URL" when `BASE_URL` is a localhost address.

### TC-15: Contact address is not the placeholder
**Story:** US-08
**Type:** UI (Validation)
**Priority:** Release (`@release`)
**Automate now?:** Yes
**Preconditions:** Page loaded.

**Steps:**
1. Read the `mailto:` address in `#contact`.

**Expected result:** the address's domain is not `example.com`. This test is **expected to be red until the address is replaced**; the gate treats it as blocking the live deploy only, not the merge.

---

## Coverage summary

| Story | Test cases | Automated now |
|---|---|---|
| US-01 | TC-01, TC-02 | Yes |
| US-02 | TC-03, TC-04 | Yes |
| US-03 | TC-05, TC-06 | Yes |
| US-04 | TC-07 | Yes |
| US-05 | TC-08 | Yes |
| US-06 | TC-09, TC-10, TC-11 | Yes |
| US-07 | TC-12 | Yes |
| US-08 | TC-13, TC-14, TC-15 | Yes |

## Out of scope / not automated

- Security headers (S4): GitHub Pages cannot set headers, so a test could never pass.
- Visual regression: no baseline exists yet and animations make screenshots unstable.
- Cross-browser: V1 runs Chromium only.
- API, form validation, authentication: the site has none.
