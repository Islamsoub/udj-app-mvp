
## 2026-11-21 — Milestones 1 and 2 (Design)

Done. No code changed; nothing from the harness is in git.

- **Harness** (outside the repo): `/home/agents/rooms/unipocket/reports/pwa-attendance-pass/harness/`, a copy of the Notes one with attendance fixtures that pass `attendance-contract.ts` (bands ok, near, below; ended semester with `absencesLeft` null; partial > 0; 7 subjects with long French and Arabic names; 12 absences covering none, expired, pending, approved, excused, rejected, with and without a note; no absences; nothing recorded). One browser tab, one copy of the app at a time, no real account, no backend.
- **Before shots**, 1280 FR light, taken from `develop` 26d1c89: `shots/before/` holds ours (loaded, filter all, band ok, band below, ended, no absences, nothing recorded, loading, error, offline, session expired, panel in each of none, expired, pending, pending without note, approved, approved without note, excused, rejected, rejected without note, file chosen, wrong type, uploading, success, offline) and the prototype (default, filter all, panel none, pending, approved, rejected). Measurements at 800 and 400, AR and dark are in `shots/measure/` and `shots/sweep/`.
- **Lists**: `FIX.md` (14 items, under 25), `ASK.md` (13 items, top five ranked), `DIVERGENCES.md` (3 rows). Full inventory in the work folder.
- Plan's guesses: P1 to P5 confirmed as FIX, P6 written as F4. A to G confirmed as ASK (A4, A6, A7, A8, A5, A10, A11 in ASK.md).
- New findings: a refused absence has no upload form yet sits under "À justifier" (A1); band colours cannot stay readable on the green hero (F4, A2); skeletons are 22, 7 and 20px off the loaded sizes (F5, F8, F12).
- Prototype quirk: below 640 wide its "Par matière" card is empty (table hidden, cards never shown).
- Milestone 8 (states): not needed, all six states render.
- The browser never failed.

## 2026-11-21 — Step 3, F1 and F2 (Builder)

Commit d5f619f.
- F1: one h1 ("Présence" / "الحضور"), 1×1 and clipped, at 1280, 800 and 400, FR and AR. The first block's top is at y 139.44 / 119.44 / 107.44 in both the loaded page and the skeleton (AR: 147.44 / 115.44, because the Arabic topbar is taller). The skeleton never held the title, so nothing jumps.
- F2: the filter is `SegmentedControl size="compact"`: 157×40, options 34 (168×40 in AR), the same height as the schedule's compact strip. It is the shared component, so the tablist, arrow keys and `aria-controls` are unchanged. The skeleton strip block is 157×40.
- `npm run typecheck`: exit 0. `npm run build`: "✓ Compiled successfully", "✓ Generating static pages (12/12)", exit 0.
