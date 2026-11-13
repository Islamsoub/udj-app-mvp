# Run report — PWA design conformance (2026-11-12)

Mission: `.claude/missions/2026-11-12-pwa-design-conformance/`
Outcome: **stopped after milestone 3**, before M4. Two reasons:
1. M3's Done-when needs a decision the mission doesn't settle: skeleton matching for content that wraps.
2. The machine is out of memory. Free RAM was 0.07 GB of 5.8. Claude Code stopped two capture jobs and said not to restart them unattended.

M0–M3 are built and M1–M3 are reviewed. Nothing merged.

**Start here:** `<mission>/screenshots/m1/index.html`, `m2/index.html`, `m3/index.html` (before/after, light/dark × FR/AR). Baseline of develop: `screenshots/baseline/index.html`.

## Run shape
These were the lead's decisions:
- Stacked branches, one PR per milestone, each PR targeting the previous milestone's branch. You can merge any prefix of the stack, in order.
- Screenshots come from a harness that answers every API call with fixture data in the browser. There is no backend and no credential, and any off-localhost request is aborted.

## Milestones

| # | What | Branch / PR | Review | Goal met? |
|---|---|---|---|---|
| 0 | Capture harness and baseline | none (mission folder only) | n/a | Yes. 76 baseline PNGs. 97 of 116 spec reference renders; 19 missing (memory), first needed by M10 |
| 1 | Dashboard type | `feature/pwa-dc-01-dashboard-type`, **PR #5** → develop | no defects | Yes. 9 of 10 audit items changed. "Before" style values read from CSS, not measured: my memory instruction |
| 2 | Grid and card structure | `feature/pwa-dc-02-dashboard-grid`, **PR #6** → M1 | met after 1 fix round, plus plan amendments | Yes, under the amended Done-when. Skeleton matching moved to M3/M4 |
| 3 | Card internals | `feature/pwa-dc-03-dashboard-card-internals`, **PR #7** → M2 | no code defects; **Done-when not met** | **No.** Two items open (below) |
| 4–15 | GPA hero, shell, states, toasts, login, schedule, grades, news, profile | not started | | |

### M1: dashboard type
Card titles are 14/700 ink, sentence case. The heading is 28/24 with −0.4 tracking. Times use DM Mono, and the next-class, ring, notification, quick-link and news type match §5.

### M2: grid
Columns are 1/2/3 at 640/1024. GPA sits over Assiduité, Notifications spans both columns on tablet, and padding and header gaps are per spec. The card-title icons are gone, and the collapsed-sidebar 4-column hole is fixed.
- **How the review was resolved:** the code was right and the handoff wasn't. The short skeletons belonged to M3/M4's files, and nothing gated them.
  - The lead amended MISSION.md: M3 matches Prochain cours, Notifications and À la une, M4 matches GPA, and M3 gets `Card.tsx` and the GpaCard `icon` line.
  - **README deviation:** one re-review finding stayed open after the fix round, the sixth `icon` call site being in M4's file. I did not stop, because it was a planning gap resolved by amendment, with no M2 code change. Overrule this if you disagree.

### M3: card internals
Done:
- the 88 px ring with "TAUX"/"النسبة" (verbatim from §8, in both locales)
- bordered quick-link tiles with 36 px icon tiles
- notification rows with type-coloured chips and hairlines
- next class as pill above a railed row with a two-line DM Mono time column
- the `icon` prop and its six call sites deleted

Skeletons match exactly for Prochain cours (169/171) and Assiduité.

**Open:**
1. **Skeleton matching for wrapped text: needs your decision.** Notifications is 3.09 px short at 1440 and 390, and À la une is 58.69 px short at 390 FR.
   Each gap is exactly one wrapped title line. A skeleton can't know line counts. The reviewer ruled that every fix either fits the fixtures or changes the loaded card
   (clamping titles, or reserving two lines).
2. **Two captures missing:** `dashboard--dark--{fr,ar}--390--loading.png`. Claude Code stopped the run for memory. The reviewer won't accept the light-equals-dark
   inference. The command, with no rebuild, is in PROGRESS.md under M3 "Could not do".
3. Reviewer, minor: the next-class time now reads "10:00 11:30" to screen readers with no "to". A visually hidden separator would fix it without changing the visuals. Not applied.

## Flagged by builders (not decided)
- **M1:** the unread count (34/800) has no spec value. Read notification rows keep their dimmed 400/ink2, against §5's single 13/600.
- **M2:**
  - Assiduité's `flex: 1` does nothing under `align-items: start`; the reference shows the same.
  - The quick-link grid stays at 2 columns; §1 says 3 from 640, but 4 links would leave a 3+1 row.
  - `.card` keeps its 148 px min-height, which isn't in the spec.
  - The content width is 1152 at 1440, not 1104; that's M6.
  - The 1023–1024 px breakpoint seam at fractional zoom is the same as in the spec.
- **M3:**
  - The category pill restyle is blocked by paths: its styles are in M14's files. Allow M3 a `className` prop on `ArticleTags`, or let M14's change cover both?
  - The course rail is jade for every course, because the payload has no course colour.
  - GENERAL and NEWS notifications get the jade chip, since the spec has no chip for them.
  - The attendance chip uses `--warning-ink`, because the spec's `--warning` is 1.93:1, under 3:1 for graphics.
  - There is no r10 radius token, so `--r-sm` (8) is used; M5 will hit the same gap.
  - The unread dot moved to the end of the row.
- **Lead's 14 Flags** (MISSION.md §Flags):
  - The manifest icons stay mortarboard, because the native app shares the source.
  - The greeting by name, the "voir tout" links, the full "Aujourd'hui" list and the print/PDF tiles are out as content or behaviour.
  - The schedule keeps 5 days.
  - Should Design specify type and spacing for the four prototype-only pages?
  - Avatar menu items at 40 px against 44.
  - Should the capture harness become a permanent tool?

## Environment
- **Memory:** 5.8 GB of RAM, and the commit charge was 21.4 of 23.6 GB. Most of it is your own apps: 3 Claude Code sessions, Chrome and WSL.
  Each milestone does one `next build`, a server and headless Chrome. Two capture runs were stopped by Claude Code.
- **Stray dev server from the lead's planning test** (PIDs 25764, 2996, 14724, about 430 MB), still running. I wasn't permitted to stop it. Builders worked around it on port 3299.
  To stop it: `! powershell -c "Stop-Process -Id 25764,2996,14724"`.
- **Worktrees left in place,** because each is the next milestone's "before": `C:\Users\urohe\Documents\udj-wt-dc-m0` … `udj-wt-dc-m3`.
  The feature-parity worktree `udj-wt-parity` and `udj-wt-builder-ci` (PR #4) can go once you no longer need them.

## Product bug found (out of scope: behaviour)
PWA login: the 423 "locked" and 429 "rate-limited" error cards never show. A race in `pwa/components/login/LoginForm.tsx` clears the error in the
same commit, with a stale `waitSeconds = 0`. This blocks M10's after-shots for those states.

## Needs a human decision
1. **Skeleton matching (blocks M3 and M4's same item).** Which do you want?
   - (a) accept a difference caused only by wrapped lines, and define "matching" against one-line content;
   - (b) clamp preview titles on the dashboard (a visual change);
   - (c) reserve two lines in the notification text column.
2. **Resume:** free some memory (stop the stray server above; close spare sessions or Chrome), then say "continue". I'll take the two missing M3 captures, then go on from M4.
   Or should the run continue on a machine with more RAM?
3. Category pill: give M3 a `className` prop on `ArticleTags`, or leave it to M14?
4. Who fixes the login 423/429 race, and when?
5. Should I add the visually hidden "to" separator to the next-class time in M3's fix round?
6. PR #4 (builder.md CI line) is open, waiting for your merge.
