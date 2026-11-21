# FIX — what the team does (Présence pass)

Measured 2026-11-21 with the harness (FR light, 1280 / 800 / 400; AR and dark at 1280 and 400), against `develop` 26d1c89. Full numbers: `INVENTORY.md` in the work folder (outside the repo). 14 items, under the limit of 25. Tick a box when the Reviewer has re-measured it.

Backing: SD = standing decision in MISSION.md; P = prototype CSS or markup in `Unipocket PWA - Design System & Prototype v1.html`; N = consistency with Notes, Planning or the dashboard.

Plan's guesses P1 to P6: P1, P2, P3, P4, P5 confirmed as FIX (F1, F2, F3, F6 and F9, F7 and F10). P6 confirmed as a real risk and written as F4. The shadow rule (SD6): no ancestor clips a shadow today (no overflow on any ancestor of the rows or cards at 1280 or 400), so no F item; QA re-checks after the card change.

## Milestone 3 — title and filter switch

- [ ] **F1. Visible page title.** Ours: `h1` "Présence" 24/800, 944×36 at 1280 (352×36 at 400), margin-bottom 20, under a topbar that already says "Présence". Proto: none. Backing: SD1. Owner 3. Target: one `h1`, not visible (`styles.srOnly`, as `Schedule.tsx:62` and `Grades.tsx:68`); first block's top at y 139.4 (1280) and 107.4 (400); the skeleton keeps no title height.
- [ ] **F2. Absences filter is the regular switch.** Ours: tablist 181×52, option 44 tall, track padding 4, gap 4, option padding-inline 20, 13.5/700, options 100 and 69 wide. Proto `.segmented` (P line 237-239): 157×40, option 34, padding 3, gap 2, 13/700. Backing: SD3, N (`ScheduleView.tsx:141`). Owner 3. Target: `SegmentedControl size="compact"`, option 34, track 40, behaviour unchanged (tablist, arrows, `aria-controls`, crossfade).

## Milestone 4 — green hero

- [ ] **F3. White hero, prototype's is green.** Ours (1280): white card 944×196.5, padding 20, radius 16, 1px `--hair`, shadow; ring 132 beside the text, gap 24. At 400: 352×368.5, ring on its own row above the text. Proto `#pres-hero` (P 405-421): 944×140, jade gradient, padding 22, radius 22, depth circle 160, ring 96 scaled 1.15, gap 32, white text. Backing: SD4 (the Notes/dashboard hero: `--hero-card-bg`, `--hero-ink`, `--hero-badge` in `globals.css`), N. Owner 4. Target: the same hero chrome as Notes at the same widths (padding, radius, shadow, depth circle kept out of the text), ring about 96 to 110 on the left, text beside it. Every data line stays: figure and "%", sessions line, threshold sentence with its icon, absences, justified, partial. The ring still animates once and respects reduced motion. At 400 the ring sits beside the text if it fits, else above, with no half-empty row.
- [ ] **F4. Band colours on the green hero.** Ours: near is `--warning-ink` rgb(138,82,0) (ring stroke, threshold line, icon); below is `--danger` / `--danger-ink` rgb(179,38,30). On a green gradient those are under 3:1. Backing: SD4 plus the contrast rule. Owner 4. Target: text and icons in `--hero-ink`, at least 4.5:1 for text and 3:1 for icons in both themes, measured; the band stays said in words and icon, which exist (for example "marge faible", the warning icon, "Semestre terminé sous le seuil requis"). No new colour is invented. Whether the band also gets a colour cue is A2.
- [ ] **F5. Hero skeleton.** Ours: 944×174 (loaded 196.5) with a 132 ring and three lines. Backing: mobile rule "skeleton mirrors the loaded layout" (CLAUDE.md), N (Notes F11). Owner 4. Target: skeleton hero height equals the loaded hero's within 1px at 1280, 800, 400.

## Milestone 5 — "Par matière"

- [ ] **F6. Section is not a card; title 16/700.** Ours: bare `section`, `h2` 16/700 (24 tall), note under it 12.5 with a 2px bar, then a list. Proto: `.card` padding 20, radius 16, 1px `--hair`, shadow, `h3` 14/700 with 14 below (P 181, 188). Backing: SD4, N (dashboard cards). Owner 5. Target: one card with 20 padding, heading 14/700, 14 below it, the threshold note kept inside the card.
- [ ] **F7. Each subject is its own shadowed, outlined card.** Ours: `li` 944×98.8 (118-165 at 400), padding 14/16, radius 12, 1px border in the band colour (red rgb(239,68,68), amber rgb(138,82,0), else `--hair`) and a shadow, 10 between. Proto: rows inside one card, hairline between, no per-row shadow. Backing: SD4, SD6, N. Owner 5. Target: rows inside the F6 card, inset, hairline-divided, no shadow and no coloured outline (the bar, percentage and flag already carry the band). Bars, threshold mark, code, "Encore n absence(s)" flag stay; `absencesLeft: null` renders nothing; at 400 nothing clipped (`scrollWidth <= clientWidth`).
- [ ] **F8. Subject skeleton.** Ours: four 92-tall blocks (loaded 98.8, seven rows) with a 180×20 title. Backing: same as F5. Owner 5. Target: skeleton card = F6 card; row heights equal the loaded rows within 1px.

## Milestone 6 — "Absences"

- [ ] **F9. Section is not a card; head wraps at 400.** Ours: bare section, `h2` 16/700; head 944×52 (title + switch); at 400 the head stacks, the switch under the title (flex column). Proto: `.card` padding 20, `.card-head` title 14/700 + switch on one line, margin-bottom 14, at 1280 and at 400 (P 190, 191). Backing: SD4, SD5, N. Owner 6. Target: one card; heading 14/700; title and the F2 switch on one line at 400 (352 wide; the switch is 157) with no jump.
- [ ] **F10. Rows are separate shadowed cards.** Ours: `li` button 944×66.3, padding 12/14, radius 12, 1px `--hair`, shadow, 8 between; 12 rows. Proto `.absence-row` (P 334-339): hairline-divided inside the card, no shadow. Backing: SD4, SD6. Owner 6. Target: rows inset in the F9 card, hairline-divided, a hover response (`--surface2`), still a button, still opens its panel; icon, code, date, chip and chevron stay; the keyboard focus ring fully visible, not clipped by the card.
- [ ] **F11. Empty and count lines.** Ours: `filterEmpty` is a bordered 20-padding box inside the section, left-aligned; the count line is 11.5 `--ink2`, 12px below the list. Proto: centred 13px text, 20 padding, no box. Backing: SD5, N. Owner 6. Target: centred text, 20 padding, no extra border, inside the card; count line spaced at least 14 from the list. Words unchanged.
- [ ] **F12. Absences skeleton.** Ours: head 944×44 with a 200×44 switch block (loaded: 181×52, F2 makes it 157×40), three 66-tall rows. Owner 6. Target: skeleton head and rows equal the loaded ones within 1px.

## Milestone 7 — justification panel

- [ ] **F13. Panel label size and button height.** Ours: field labels 10/700 uppercase ls .6px (`SÉANCE`, `JUSTIFICATIF`, `MOTIF`), submit 380×48, the file input 44 tall. Proto `.dp-section-lbl`: 11.5/700 ls .5px, submit `btn-save` 46 tall. Backing: P (colour stays `--ink2`, see DIVERGENCES). Owner 7. Target: labels 11.5/700 ls .5px, submit 46 tall, nothing touching or cut at 400 in every sub-state (none, file chosen, bad type, uploading, success, offline, expired, pending, approved, excused, rejected).

## Cross-cutting

- [ ] **F14. Divergence rows.** Owner: each milestone adds its rows to `DIVERGENCES.md` (this mission folder), ready to paste. The rows I know about are already in that file. The guard blocks `.claude/design-known-divergences.md`; do not work around it.

## Checked, nothing to fix (so QA does not re-open it)

- Text contrast, every text colour on its real background, 16 shots (light, dark, Arabic, bands, all panel states): lowest 4.58:1 light, 5.48:1 dark. Nothing under 4.5:1 (3:1 large text). Icons: chevron and panel icons are `--ink3` rgb(128,134,122), about 3.7:1 on white. Nothing under 3:1.
- Arabic and dark at 1280 and 400: mirrored, no broken colour.
- `absencesLeft: null` (ended semester) renders no "Encore n" text. No "0" for missing data anywhere on the screen (the only "0" is the real count "Affichées : 0 sur 0").
- State boxes (error, offline, "nothing recorded") use padding 24, title 15/700: identical to Planning and Notes, consistent; the 24-or-20 question is A9.
- Six states render: loaded, loading, error, offline, nothing recorded, session expired (the shell's modal over the error card). Milestone 8: not needed for states.
- Upload flow in the harness: file chosen, wrong type message, uploading, success (the row panel turns to "En cours d'examen"), offline ("Connexion requise" disabled with the hint). All work.
