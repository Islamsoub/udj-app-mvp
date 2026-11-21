
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

## 2026-11-21 — Step 4, F3 to F5 (Builder)

Commit 8f9764a.
- F3: green hero. Radius 22, padding 22, `--hero-card-bg`, `--shadow-hero`, text `--hero-ink`, and the depth circle (160, top inline-end, -48). Ring 110 with a 9px stroke, white on `--hero-track`, left of the text, gap 24 (16 below 640). At 400 the ring stays beside the text, which gets 182px. Measured hero: 944×201.5 (1280), 664×201.5 (800), 352×270.5 (400, the sample's sentence on 2 lines and counts on 3). Every line stays: figure, sessions, threshold sentence with icon, absences, justified, partial. Ring animation unchanged (`takeOnce`, reduced-motion rule kept).
- Depth circle and text: a script tested every text line box against the circle's geometry. Nothing is under it at 1280 and 800 (FR, AR, all bands). Under a 520px content box (400, and narrow tablets) the circle is not drawn, as on Notes.
- Bug fixed on the way: the threshold sentence was direct flex children (Interpolated returns siblings), so at 400 it split into three columns. It is now wrapped in one span: 39 tall on two lines in FR, 41 in AR.
- F4: on the green, the ring stroke, sentence and icon are `--hero-ink` in every band. Near, below and ended-below keep bold weight and the warning icon. Contrast: white on `--hero-card-bg` is 4.53:1 at the lighter stop and 6.20:1 at the darker, the same in light and dark (the variable does not change by theme). Icons are the same white: ≥4.53:1, above 3:1. No new colour. A2 (a colour cue) is untouched.
- F5: the skeleton hero has the same box (radius 22, padding 22, ring 110) and one block per text line at its loaded height. Skeleton = loaded: 201.5 / 201.5 / 270.5 at 1280 / 800 / 400. At 400 that matches the sample data (sentence 2 lines, counts 3 lines). A student with no partial sessions has 2 count lines, so their hero is 18.75 shorter than the skeleton on a phone.
- DIVERGENCES.md: row 1 narrowed to the panel labels. Two rows added: solid white hero text, and the band not coloured on the green.
- `npm run typecheck`: exit 0. `npm run build`: "✓ Compiled successfully", "✓ Generating static pages (12/12)", exit 0.

## 2026-11-21 — Step 5, F6 to F8 (Builder)

Commit 6d59637.
- F6: "Par matière" is one card: padding 20, radius 16, 1px `--hair`, `--shadow-card`. The h2 is 14/700 (21 tall) with exactly 14 below it; the threshold note stays inside the card.
- F7: the 7 subjects are rows inside the card: padding 14 top and bottom, a hairline between them, no border, shadow or coloured outline. Rows are 96.75 / 97.75 / … / 83.75 at 1280, and taller at 400 where long names and flags wrap (up to 164.5). `scrollWidth > clientWidth` on no element in the card, at 1280 and 400, FR and AR. The ended-semester fixture shows no "Encore n" and no 0. The band stays on the bar, the figure and the flag with its icon, in the same colours as before.
- F8: the skeleton is the same card, with blocks for the title (21 + 14) and note (18.75), and 4 rows on the loaded `.subject` class (68.75 content). At 1280 and 800 the rows match the loaded single-line rows exactly (96.75 / 97.75 / 97.75 / 83.75), and the card's top is the same (360.94 at 1280). At 400 the loaded rows wrap to the names' lengths, so they are taller than the skeleton rows there.
- No divergence row: the table-or-bars question is in ASK.md and untouched.
- `npm run typecheck`: exit 0. `npm run build`: "✓ Compiled successfully", "✓ Generating static pages (12/12)", exit 0.

## 2026-11-21 — Step 6, F9 to F12 (Builder)

Commit 2ff8607.
- F9: "Absences" is the same card as "Par matière". The head (h2 14/700 plus the compact filter) is one line, 40 tall, at 1280 and 400, FR and AR, with 14 to the list.
- F10: 12 rows inside the card, a hairline between two, no own border or shadow. Hover is `--surface2` with radius 12. The text inset is 21 from the card edge (1 border + 20), and the row padding is 12px 10px inside a list pulled 10px into the card padding. The overflow this creates on the list wrappers is visible, not clipped (overflow: visible on the panel and the crossfade, checked). Rows are 64.25 / 65.25 at 1280; at 400 long names wrap (up to 130.25), with nothing clipped. Keyboard focus: `:focus-visible` 2px jade at -2px offset, so the ring sits inside the row and no hairline or neighbour covers it (checked by focusing a row). The hover lift and the 0.97 press are gone (a list row, as in the prototype).
- Chips are unchanged; Design measured them at ≥4.58:1 light and ≥5.48:1 dark in milestone 2.
- F11: the empty line is centred, 20 padding, no border; with no absences it sits inside the card. The count line is 14 below the list.
- F12: skeleton card head 40 (title block 21 + strip 157×40); rows on the loaded `.absences` list (12px 10px padding plus a 40.25 block): 64.25 / 65.25 / 65.25, equal to the loaded single-line rows.
- Removed the now-unused `.section`, `.sectionTitle`, `.skeletonHeading` and `.skeletonRows` rules.
- No divergence row needed.
- `npm run typecheck`: exit 0. `npm run build`: "✓ Compiled successfully", "✓ Generating static pages (12/12)", exit 0.
