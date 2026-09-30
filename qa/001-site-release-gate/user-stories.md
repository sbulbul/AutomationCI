# User Stories — Site release gate (AutomationCI marketing site)

Generated on 2026-09-30. Source: requirements doc `docs/requirements.md` (journeys J1-J5, I1-I4, S1-S4) combined with source analysis of `dist/index.html`, `dist/animation.js`, `dist/*.css`. Feature area: the whole single-page site. No forms and no API exist, so there are no API or input-validation stories.

Severity mapping used by the gate: **Critical** = failure blocks merge (`@critical`). **Important** = raises a bug and warns (`@important`). **Release** = blocks the live deploy only (`@release`).

---

## Critical

### US-01: Page loads completely
**Source:** requirements J1
As a visitor, I want the site to load with all of its files, so that I see the intended page.

**Acceptance criteria:**
- `index.html`, `style.css`, `editorial.css` and `animation.js` each return HTTP 200
- The page title contains "Test automation"
- The page produces no console errors
- No request to the site's own origin fails

### US-02: Explore the release-system demo
**Source:** requirements J2 / source `animation.js`
As a visitor, I want to switch the demo between Before and After and replay it, so that I understand what the service changes.

**Acceptance criteria:**
- Clicking "After" sets the demo phase to `after`: index "03 / AFTER", status "SYSTEM OPERATIONAL", `aria-pressed` true on After and false on Before
- Clicking "Before" sets the phase to `before`: index "01 / BEFORE", status "ATTENTION REQUIRED", `aria-pressed` true on Before and false on After
- Clicking "Replay" restarts from `before`, passes through `repair` ("02 / REBUILD", "AUTOMATION IN PROGRESS") and ends in `after`, without page errors

### US-03: Navigate to sections
**Source:** requirements J3
As a visitor, I want the header links to take me to their sections, so that I can find services, approach, ways to work and contact.

**Acceptance criteria:**
- "Services", "Approach", "Ways to work" and "Let's talk" each point to `#services`, `#approach`, `#engagement`, `#contact`
- Each target element exists and is brought into view when its link is clicked
- Every in-page `#anchor` link on the page resolves to an element that exists (excluding the bare `#` "back to top" brand links)

### US-04: Contact call to action
**Source:** requirements J4
As a visitor, I want a working contact link, so that I can email the consultant.

**Acceptance criteria:**
- `#contact` contains a `mailto:` link with a non-empty address and a non-empty subject

### US-05: Outcome metrics show the stated figures
**Source:** requirements J5 / source `animation.js`
As a visitor, I want to see the illustrative outcome figures, so that I can judge the value of the service.

**Acceptance criteria:**
- After scrolling the metrics into view and letting the animation finish, the three counters show 86, 12 and 3

### US-07: The site ships no secrets
**Source:** requirements S2
As the site owner, I want to be sure no secret ever gets published, so that credentials cannot leak through the deployed files.

**Acceptance criteria:**
- No file in `dist/` contains a private key block, a GitHub token (`ghp_`, `github_pat_`), an Anthropic key (`sk-ant-`), or an AWS access key (`AKIA...`)

---

## Important

### US-06: Usable on any device and accessible
**Source:** requirements I1-I3
As a visitor on a phone, a desktop or with assistive technology, I want the page to fit my screen and be navigable, so that I can use it.

**Acceptance criteria:**
- No horizontal scrolling at 375px and 1280px viewport widths
- `<html>` has a `lang` attribute, the page has exactly one `<h1>`, the skip link targets `#main` and `#main` exists, and every button has an accessible name
- With `prefers-reduced-motion: reduce`, the demo shows the `after` phase immediately and the counters show their final values

---

## Release (blocks the live deploy, not the merge)

### US-08: Deployed site is secure and uses a real contact address
**Source:** requirements S1, S3, and the "Known content issue"
As the site owner, I want the deployed site served over HTTPS, loading only known third parties and showing a real contact address, so that nothing unfinished or unexpected goes live.

**Acceptance criteria:**
- On a deployed URL (staging or live) the page is served over HTTPS
- The page only loads resources from its own origin, `fonts.googleapis.com` and `fonts.gstatic.com`
- The contact `mailto:` address is not on `example.com`

---

## Assumptions / unverified

- The two bare `href="#"` links (brand logo in header and footer) are treated as intentional "back to top" links, not empty links.
- The 375px layout has not been observed; only 1280px was measured (page width 1265px, no overflow). US-06 may fail at 375px, which would be a real finding.
- The reduced-motion counters are assumed to keep the HTML's final values (86, 12, 3) since the script skips the animation when the media query matches.
- S4 (security headers) is excluded: GitHub Pages does not let the site set headers, so a test could never pass (documented in `docs/requirements.md`).
