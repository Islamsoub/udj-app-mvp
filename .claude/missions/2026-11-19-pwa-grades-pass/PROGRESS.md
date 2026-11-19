
## 2026-11-19 — Milestone 1, harness (Design)

Done. `.claude/missions/2026-11-19-pwa-grades-pass/harness/` holds `run.js`, `fixtures.js` and `README.md`. One command, from the repo root: `node .claude/missions/2026-11-19-pwa-grades-pass/harness/run.js`. Output goes to `/tmp/pwa-grades-pass/`.

- No login and no repo change: Playwright answers the session refresh and the `/student/*` calls from fixtures. The session-refresh field name is read from `pwa/app/api/auth/refresh/route.ts` at run time. The shape was enough; milestone 1 is not blocked.
- `npm ci` was run in `pwa/` once (packages only, gitignored).
- 17 states for our screen and 5 for the prototype, at 1280, 800 and 400 (FR light). The fixtures hold five semesters (full, CC-only, nothing published, no rows), eight subjects with long French and Arabic names, and a single-semester case.
- The prototype is photographed from the spec pack file; its Google Fonts requests are served from the bundle's own font files.
- `git diff develop --stat` shows only the mission folder (checked before commit).
- The prototype has no loading, error, empty or offline state for Notes, and no semester beyond S1 and S2.

## 2026-11-19 — Milestone 2, inventory and classification (Design)

Done. `INVENTORY.md`, `FIX.md`, `DECIDE.md` written from the full harness run (66 shots, FR light, 1280 / 800 / 400; data in `/tmp/pwa-grades-pass/`, not in the repo).

- 12 fix items: F1, F2 (milestone 3); F7, F11, F12 (4); F3, F4, F5, F8, F9 (5); F6, F10 (6). 16 questions for Islam: D1 to D16.
- Every differing INVENTORY row carries one F or D id. Nothing from `design-known-divergences.md` is listed.
- Already holds, no fix: no grade renders as 0 in any of the 10 states checked; the calculator target is disabled with an explanation when a subject has no CC; every screen state renders.
- **Milestone 7: not needed.** No state is missing. The one state that cannot be reached (calculator with no subjects) is unreachable by design, the trigger is not mounted without a row.
- Notable findings: Statut column cut off at 1280 (table 989.5 in a 942 card); sort labels 18px off their numbers; subject-name colour never applies (CSS specificity); skeleton and loaded layout differ by up to 79px.
- Harness limits: F3's root cause was not isolated. Proto full-page shots at 400 show closed bottom sheets and the tab bar mid-page (artefact).
- Not done here: no code changed; no reference render written.
