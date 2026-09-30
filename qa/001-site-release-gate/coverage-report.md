# Coverage Report — Site release gate (AutomationCI marketing site)

Generated on 2026-09-30. Reflects `user-stories.md` and `test-plan.md` as of this run. The suite has been type-checked and its 13 tests listed by Playwright, but **not executed** (Stage 6 was not requested), so no status below claims a pass.

| Requirement | Story | Priority | Test cases | Automated? | Status |
|---|---|---|---|---|---|
| J1 | US-01: Page loads completely | Critical | TC-01, TC-02 | Yes (Playwright/TS) | Automated, not yet run |
| J2 | US-02: Explore the release-system demo | Critical | TC-03, TC-04 | Yes (Playwright/TS) | Automated, not yet run |
| J3 | US-03: Navigate to sections | Critical | TC-05, TC-06 | Yes (Playwright/TS) | Automated, not yet run |
| J4 | US-04: Contact call to action | Critical | TC-07 | Yes (Playwright/TS) | Automated, not yet run |
| J5 | US-05: Outcome metrics show the stated figures | Critical | TC-08 | Yes (Playwright/TS) | Automated, not yet run |
| I1-I3 | US-06: Usable on any device and accessible | Important | TC-09, TC-10, TC-11 | Yes (Playwright/TS) | Automated, not yet run |
| S2 | US-07: The site ships no secrets | Critical | TC-12 | Yes (Playwright/TS) | Automated, not yet run |
| S3 | US-08: Deployed site loads only known third parties | Release | TC-13 | Yes (Playwright/TS) | Automated, not yet run |

## Summary

- **8** stories, **13** test cases, **13** automated (100%)
- Critical stories: **100%** automated (US-01 to US-05, US-07)
- Important stories: **100%** automated (US-06)
- Release-only checks: **100%** automated (US-08)

## Gate mapping

| Tag | Tests | Effect |
|---|---|---|
| `@critical` | TC-01, 02, 03, 04, 05, 07, 08, 12 | failure blocks merge |
| `@important` | TC-06, 09, 10, 11 | failure raises a bug and a warning |
| `@release` | TC-13 | failure blocks the live deploy only |

## Not covered (by design)

- Security headers (S4): GitHub Pages cannot set them.
- Visual regression, cross-browser: out of V1 scope.
- HTTPS on deployed URLs (S1) and the placeholder contact address: TC-14 and TC-15 were removed on request.
- Requirements P1-P8 (the pipeline itself) are tested separately when the gate is built.
