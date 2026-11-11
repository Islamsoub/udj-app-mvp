# Run report: PWA justification form and Arabic tracking (2026-11-11)

Mission: `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/`

**Where the run stopped:** after milestones 1, 3 and 4, all built, pushed and reviewed clean. This is a planned stop, not a failure. Milestone 2 depends on milestone 1 being merged (mission: "1 → 2"), and no agent merges.

**No PRs are open.** `gh` is not installed on this machine. Each branch is pushed to origin, and a ready-to-paste PR title and description sit at the end of that milestone's section in the branch's PROGRESS.md.

## Milestones

| # | Goal met? | Branch | Head | Review |
|---|---|---|---|---|
| 1 | Yes | `feature/pwa-justification-submit-dropzone-states` | c474baf | No findings |
| 2 | Not started: waits on 1 being merged | — | — | — |
| 3 | Yes, after one fix round | `feature/pwa-arabic-label-tracking` | d91fb8e | Round 1: screenshots missing. Round 2: no findings |
| 4 | Yes | `feature/pwa-arabic-heading-tracking` | bc923ee | No findings |

All three branches were cut from develop at 5e10463. In `pwa/`, `npm run typecheck` and `npm run build` pass on each one, and the output is in PROGRESS.md.

### 1. Submit button and drop zone: hover, press, easing
- **Code:** CSS only, in `pwa/components/attendance/attendance.module.css`.
  - The submit button hovers to `--jade-hover` and presses to `scale(0.97)`, both behind `:not(:disabled)`.
  - The drop zone's transition changes from `linear` to `--ease-out` over `--dur-fast`, and it gains a hover (jade border and fill) that is off while an upload is running.
  - Dragging keeps `--dur-instant`.
  - Under reduced motion, `.submit` is added to the existing lists.
- **Other files:** PROGRESS.md (`## Milestone 1`), and `screenshots/m1/` with 25 PNGs, all generated.
- **Departure from the mission's wording, confirmed by the reviewer:** the reduced-motion override is `.submit:active:not(:disabled)`, not `.submit:active`. The plain selector loses on specificity, so the button would still shrink under reduced motion.
- **Test data:** the upload request was stubbed and never reached the server. GET attendance was also stubbed: it is the live response, with `canSubmitJustification` set to true on four ABSENT records, because the account has none that can still be justified.
- **Could not do:** a real drag-and-drop in Playwright. The drag duration is confirmed in the built CSS only.

### 3. Arabic: no tracking on translated labels
- **Code:** 12 additive resets, `html[lang="ar"] .X { letter-spacing: normal; }`, in these files:
  - attendance ×4
  - dashboard ×1
  - grades ×4
  - schedule ×3, one of them scoped to `.detailType .typePill`

  `globals.css` gets a comment only.
- **Other files:** PROGRESS.md (`## Milestone 3`), and `screenshots/m3/` with 11 PNGs, generated.
- **Fix round.** The first review found that the grades screenshots showed only the "not published" empty state, and that there was no Arabic render of the upload form. The builder stubbed GET grades and attendance in Playwright, re-took the screenshots and re-read the five affected labels live. The re-review found nothing.
- **Kept tracking:** `.blockType` and the DayList `.typePill`, which show Latin codes, keep it (0.76px and 0.72px).
- **Departure, disclosed:** the pointer comment on `.detailType .typePill` runs to three lines and says why it is scoped. The aim is that nobody widens it to every pill.

### 4. Arabic: no negative tracking on translated headings
- **Code:** 11 additive resets in these files:
  - attendance, dashboard, grades, schedule and profile: `.heading`
  - news: `.heading` and `.readerTitle`
  - shell: `.title` and `.pageHeading`
  - login: `.brand`
  - `public/offline.html`: `.brand`
- **Other files:** PROGRESS.md (`## Milestone 4`), and `screenshots/m4/` with 10 PNGs, generated.
- **Live check, nothing stubbed:** every reachable heading reads `normal` in Arabic and keeps its original value in French. The always-Latin text keeps its tracking: `.brandName`, `.heroNumber`, `.subjectValue`, `.unreadCount`, `.langCode` and `.inputId`.
- **sw.js:** read and not changed. Its cache name comes from the build id, so a deploy refreshes `offline.html` without a schema bump.
- **Could not check live:**
  - `.pageHeading`, because `RoutePlaceholder.tsx` is imported nowhere, so it was checked in the built CSS.
  - The dashboard and grades `.heroNumber`, because the account has no published GPA. Those rules are untouched.

## Safety
- Nothing was submitted to the live account. The only uploads were stubbed requests.
- The test credentials were passed only as environment variables. A scan of all three branch diffs and the Playwright scripts finds them nowhere.
- No servers were left running on 3101, 3103 or 3104.

## Generated or orchestrator files
- **On `chore/pwa-justification-arabic-mission`:** MISSION.md, `diff-1.patch`, `diff-3.patch`, `diff-4.patch`, and this report.
- **Branch-local PROGRESS.md:** each feature branch adds its own PROGRESS.md section. All three add the same file, so merging the second and third will conflict. Resolve it by keeping both sides.

## Questions for a human
1. **Will you open the three PRs by hand, or install `gh` so the next run can?** The text for each PR is at the end of that milestone's PROGRESS.md section. Merge `chore/pwa-justification-arabic-mission` too, or MISSION.md never reaches develop.
2. **Once milestone 1 is merged, should the next run build milestone 2?** It is the error-split change: file, note and form errors. It also measures `--danger-ink` against the panel background and stops if either theme is under 4.5:1.
3. **Who trims the duplicate comment when 3 and 4 are both merged?** Both put the full "Keyed on language…" comment on their first reset in attendance, dashboard, grades and schedule. Whichever merges second should cut milestone 3's copy in those four files down to `/* Arabic: no tracking — see the note at .heading. */`. Should that be done during the merge, or as a small follow-up branch?
4. **Should "KB 1" get a ticket?** In Arabic the drop zone shows the file size as "KB 1": `JustificationForm.tsx:276` renders `formatSize(file.size)` without `fmtLtr`. This was found by the milestone 1 builder, confirmed by the reviewer, and is out of this mission's scope.
5. **Is the credits line in the Arabic grades hero a bidi bug?** In `screenshots/m3/ar-grades-hero-table-header.png` it reads "32 / 0 وحدة مكتسبة", with stubbed data. Its order may be reversed in the same way. Not diagnosed.
6. **Flag 1, for Design:** is the note-error text the existing "80 caractères maximum." hint, or should there be a dedicated `attendance.upload.error.note` key? This is milestone 2 and does not block it.
7. **Flag 2:** will you add the proposed `html[lang="ar"]` wording to CLAUDE.md's PWA section? No agent may edit CLAUDE.md.
8. **Could the test account get a published grade and an absence that can still be justified?** Then milestone 2 and later runs could check these states without stubs.
9. **May the leftover worktrees be removed?**
   - `.claude/worktrees/agent-*` (three, locked): created by a failed automatic-isolation attempt. The tool refused because of the `documents` / `Documents` path case. My attempt to remove them was blocked by the permission check. They are untouched checkouts at e4c03bb.
   - `../udj-wt-m1`, `../udj-wt-m3`, `../udj-wt-m4`: the builders' worktrees. Keep them until the PRs are merged, then run `git worktree remove` on each.

---

# Run 2 (same day): milestone 4 rebased, milestone 2 built

Islam merged milestones 1 and 3 into develop (bd64f1d) and asked for three things:
- rebase milestone 4 onto develop;
- de-duplicate the comment, keeping milestone 3's copy;
- continue with milestone 2.

**Where the run stopped:** every milestone in the mission is now built and reviewed with no findings. Nothing is merged, and no PR is open, because `gh` is still missing.

| # | Goal met? | Branch | Head | Review |
|---|---|---|---|---|
| 2 | Yes, after one fix round | `feature/pwa-justification-field-errors` | 5cb22f0 | Round 1: no code defects, but the long-Arabic-message screenshot did not wrap. Round 2: no findings |
| 4 | Yes | `feature/pwa-arabic-heading-tracking-rebased` (see below) | d539ab4 | No findings after the rebase |

## Milestone 4: rebase
- **Rebase.** It rebased onto bd64f1d. Only PROGRESS.md conflicted, and the fix keeps the Milestone 1 and 3 sections and appends Milestone 4's. The CSS merged cleanly.
- **Comment.** In attendance, dashboard, grades and schedule, the comment above `.heading` is now the one-line pointer, naming milestone 3's rule:
  - attendance: `.heroLabel`
  - dashboard: `.cardTitle`
  - grades: `.heroLabel`
  - schedule: `.dayName`

  Each of those files carries the full comment once. This departs from the mission's "full comment on the first reset", as directed, and PROGRESS.md records it.
- **Checks.** typecheck exits 0 and build exits 0. The built CSS has 22 Arabic reset rules (12 + 10), and the 11th milestone 4 rule is in `offline.html`.
- **Branch name.** The original branch, `feature/pwa-arabic-heading-tracking`, still points at the pre-rebase commit bc923ee. Updating it needs a force push, which the permission check blocked. The rebased work was pushed as a new branch, **`feature/pwa-arabic-heading-tracking-rebased`**.
- **Reviewer note, fixed.** The original Milestone 4 notes in PROGRESS.md still described the old comment placement. They are now annotated as superseded.

## Milestone 2: field errors
- **Error state.** `JustificationForm.tsx` replaces the single `error` with `fileError`, `noteError` and `formError`. `errorKey` returns `{ field, key }`, and the note check runs first in the 400 branch.
- **Where each error lands:**
  - **Drop zone:** the client checks `type`, `too_large`, `empty` and `multiple`; server 400s that read as type or size; and 413.
  - **Note:** any 400 whose message matches `/note/i`, which covers both backend sentences.
  - **Form box, now directly above the submit button:** everything else, including `rejected`, `network`, `deadline`, `conflict`, 429, 5xx, and unmapped statuses.
- **Note field.** The input is now labelled and described, and in error its hint is replaced by the message.
- **Drop zone precedence:** busy, then dragging, then error, then hover, then rest. Hover does not repaint an errored zone.
- **`--danger-ink` gate: passed.** Measured on `--surface`, it is 6.54:1 in light and 7.59:1 in dark. The reviewer recomputed both, and both theme comments in globals.css now carry them.
- **Error keys.** The mission said 16. The builder and reviewer both count 13 `upload.error.*` keys plus `note_hint`. The reviewer confirmed that every key that can be produced lands on exactly one field.
- **Fix round.** No Arabic form error wraps at 390px, including the longest, `conflict`. The wrap and no-clip check was done at 360px with `conflict`: 58px, 2 lines, `scrollHeight == clientHeight`. French wraps at 390px.
- **Test data.** Every upload was stubbed and never reached the server. GET attendance was the live response with `canSubmitJustification` set to true on the 4 absences that had nothing filed. Credentials are in no file.
- **Files:**
  - `JustificationForm.tsx`
  - `attendance.module.css`
  - `globals.css` (comment only)
  - PROGRESS.md
  - `screenshots/m2/`: 20 PNGs, generated

## New questions for a human
1. **How should milestone 4 be merged?** Merge `feature/pwa-arabic-heading-tracking-rebased`, or force-push it over the original name yourself:
   `git -C ../udj-wt-m4 push --force-with-lease=feature/pwa-arabic-heading-tracking:bc923ee origin feature/pwa-arabic-heading-tracking`
2. **Design: should the `rejected` text change?** It still says "Réessayez avec un autre fichier", but it now appears in the form box and the file is not marked. Should it get new text?
3. **Should a refused file clear the old form error?** For example, a 502 box followed by picking a `.txt` shows both the red zone and the box. This matches the mission's clearing rules ("when a new file is *accepted*"). Is that what you want, or should any file choice clear the form error?
4. **Should a server-side file error unselect the file?** Today it stays selected, so resending fails the same way. This was already the behaviour before milestone 2.
5. **Flag 1 is still open:** is the note error text final, or should there be a dedicated `attendance.upload.error.note` key?
6. **Process check:** a Node process, PID 24456, held a closing socket on port 3101 (milestone 1's port) after the builders finished. I could not read its command line, so I did not kill it. Is it yours?
7. **Builder mistake, harmless:** the milestone 2 builder once ran `taskkill /T /F` on PID 0 by misreading netstat. Windows refused it and nothing was terminated. The builder then stopped only its own verified server.
8. **Still open from run 1:** the "KB 1" ticket, the credits-line bidi question, Flag 2 (the CLAUDE.md wording), the test account's data, and the leftover worktrees: `.claude/worktrees/agent-*` and `../udj-wt-m1` through `../udj-wt-m4`.
