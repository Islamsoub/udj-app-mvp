# FIX — what the team does (r3: Islam's rules, command 30)

Each item: element, ours vs prototype (numbers), what backs it, owner milestone, target to re-measure. Source rows are in INVENTORY.md. Check a box when the Reviewer has re-measured it.

Re-sorted 2026-11-19 with the plan's FIX / ASK rules. F12 (state-card padding) moved to ASK as A11: Planning's state cards are identical to ours (24px padding, 15px title), so the two are consistent and only a standing decision says 20. The contrast sweep, Arabic and dark theme were added (F13). 13 items in total, under the limit of 25. Divergence rows are F14.

Backing: SD = standing decision (MISSION.md), P = prototype CSS line in `Unipocket PWA - Design System & Prototype v1.html`.

## Milestone 3 — title and switch

- [x] **F1. Duplicate visible page title.** Ours: visible `h1` "Notes", 24/800, 36px tall, margin-bottom 20, under a topbar that already says "Notes" (INV 1.1). Proto: no in-page title. Backing: SD1. Owner: 3 (also the skeleton, `skeletons.tsx`, INV 9). Target: exactly one `h1` on the page, not visible (clip/sr-only, as `Schedule.tsx:62` `styles.srOnly`); first control top at y 139.4 / 107.4 (1280 / 400), within 1px of the prototype's 138.4 / 106.4; skeleton carries no title block.
  - Builder: 8246a5f. One h1, 1×1 and clipped. First control at y 139.44 / 107.44 (1280 / 400).
- [x] **F2. Semester switch is the 44px pill, not the compact switch.** Ours: option 44 tall, track 52, padding 4, gap 4, option padding-inline 20, 13.5/700 (INV 2.2-2.5). Proto `.segmented` (P 237-239): option 34, track 40, padding 3, gap 2, padding-inline 16, 13/700. Backing: SD3, and consistency with Planning (`SegmentedControl size="compact"`: padding 3, gap 2). Owner: 3 (reuse `SegmentedControl size="compact"` if it takes ids, labels and `aria-controls`; else match the numbers). Target: option 34 tall, track 40 (34 + 2×3), gap 2, selected pill `--surface` + `--shadow-card`, tablist roles and arrow keys unchanged; the skeleton strip is 34-tall options too.
  - Builder: 8246a5f. Options 34, track 40, gap 2, padding 3. Tap target 44 through ::before. Arrow keys and Home/End unchanged (FR and AR).

## Milestone 4 — hero, cards and spacing

- [ ] **F7. Gap between head, hero and table is 16, prototype 20.** Ours: flex gap 16 between strip, hero and the calc/table block (INV 4.10). Proto: head `margin-bottom:20`, grid `margin-bottom:20` (P 325, 182). Backing: P, SD5 (16 already clears SD5's 14, this is conformity, low risk). Owner: 4. Target: 20 between strip and hero, and between hero and the next block, at all widths.
  - Builder: afe48cd. 20 between head, hero and table block, at every width. Awaiting the Reviewer's re-measure.
- [ ] **F11. Skeleton does not match the loaded layout.** Ours at 1280: skeleton hero 944×146 vs loaded 164.8; skeleton rows begin at y 425, loaded table card at y 504 (the "Calculatrice" row, 44 + gap, is not in the skeleton). Backing: SD7 (mobile CLAUDE rule: skeleton mirrors the loaded state); same crossfade grid cell, so the shift is visible. Owner: 4 (`skeletons.tsx` also in 3 for the strip). Target: skeleton hero height = loaded hero height at each width within 1px; first skeleton table element top = loaded table card top within 1px.
  - Builder: afe48cd and 049da19. Skeleton = loaded: head 40/40/86, hero 164.75/164.75/282.75, table or cards top 384.19/364.19/516.19 (1280/800/400, FR). AR 1280: loaded hero 166.75, skeleton 164.75 (the Arabic year line is 2px taller). Awaiting the Reviewer's re-measure.
## Milestone 5 — table and values

- [ ] **F3. Statut column cut off at 1280.** Ours: table 989.5 wide in a 942 card, scroll width 990 > 942, "Statut" pill reads "Val…" (INV 6.2); unpublished semester 960 > 942. Proto: 902 in 902. The 5 non-subject columns after Code sum to 637.5, so a subject column of 180 would fit; the subject column is laid out at 352. The cause was not isolated (likely min-content of the header sort buttons plus the nowrap cells). Backing: SD5 (nothing cut off), milestone 5 "done when". Owner: 5. Target: at 1280, `scrollWidth <= clientWidth` on the table wrapper for default, cc-only and unpublished fixtures, all 8 columns fully visible, long subject names wrap inside their cell.
  - Builder: 957081f. Cause: `.table td` (0,1,1) `nowrap` beat `.tdSubject` (0,1,0) `white-space: normal`. Now 942 = 942 (default, CC-only, unpublished). No cell clipped; long names wrap. Awaiting the Reviewer's re-measure.
- [ ] **F9. Table touches the card edges.** Ours: no card padding; header band and cell text 12px from the card edge and the band touches the top and side borders (INV 6.1). Proto: `.card` padding 20 (P 181). Backing: SD4, SD5. Owner: 5. Target: wrapper padding 20 (table at card x + 21 incl. border), radius 16, 1px `--hair`, `--shadow-card`. Do F9 with F3: the table then has 902px, as the prototype.
  - Builder: 957081f. Padding 20, radius 16. Table at card x + 21, 902 wide. Awaiting the Reviewer's re-measure.
- [ ] **F4. Sort-header labels sit 18px off their numbers.** Ours: caret (14px + 4px gap) is trailing, so right-aligned labels end at 954.5 / 1045.5 / 1136.6 while the numbers end at 972.5 / 1063.5 / 1154.5 (INV 6.6). Backing: SD5 (misaligned). Owner: 5. Target: label and number edges equal within 1px for every right-aligned column, at 1280 (caret before the label, or out of flow); Arabic mirrors.
  - Builder: 957081f. Label and figure edges 0px apart on every column, FR and AR. Awaiting the Reviewer's re-measure.
- [ ] **F5. Table type and pills.** Ours vs proto, INV 6.5, 6.7, 6.8, 6.11:
  - Builder: 957081f. th 11/700 uppercase .4px, no band, 44.5 tall. td 13.5, single-line rows 46. Subject rgb(30,35,31). Pill 11/700 uppercase .3px, 4px 10px, 21 tall. Awaiting the Reviewer's re-measure.
  - header 11.5/700 ls .03em on a `--surface2` band, vs 11/700 ls .4px, no band (P 308);
  - cell 13px, row 49 tall, vs 13.5px, row 46 (P 311);
  - subject name colour `--ink2` instead of `--ink`: `.table td` (0,1,1) beats `.tdSubject` (0,1,0). A specificity bug; the intended colour never applies;
  - pill 12/700 sentence case, pad 3 10 (24 tall), vs 11/700 UPPERCASE ls .3px, pad 4 10 (21 tall) (P 441-444, `.hug-pill`);
  Backing: P. Owner: 5. Header colour (`--ink2` vs `--ink3`), the 44px sort-button height and the pill `--danger-ink` are kept on purpose and each gets a divergence row (F14), not changed here. Target: th 11/700 uppercase ls .4px; td 13.5px; subject name computed colour rgb(30,35,31); pill 11/700 uppercase ls .3px, height 21, pad 4 10. If the 44px sort buttons are kept, th height stays 44.5 (F14).
- [ ] **F8. Cards at ≤639.** Ours: radius 12, padding 14, gap 12, name 14/700 (INV 7.1-7.3). Proto: radius 16, padding 16, gap 14, name 15/700 lh 19.5 (P 423, 425). Backing: P, which is the stated exception to SD4 for this screen. Owner: 5. Target at 400: card radius 16, padding 16, 14 between cards, name 15/700. Border and the metric strip are A6.
  - Builder: 957081f. Radius 16, padding 16, 14 apart, name 15/700 lh 19.5 (at 400). Awaiting the Reviewer's re-measure.

## Milestone 6 — calculator

- [ ] **F6. Calculator trigger.** Ours: own right-aligned row under the hero, 131×44, radius 8, 13/600 `--jade-text`, icon 16, gap 8 (INV 3.1-3.2). Proto `.btn-ghost` (P 245-247): in the head row on the switch's line, end side, 124×34, pill radius, pad 0 14, 12.5/700 `--ink2`, icon 14, gap 6; at 400 it wraps under the switch with a 12px gap, left-aligned. Backing: P, SD3, and consistency with Planning: its "Cette semaine" button (`.todayButton`, `schedule.module.css:168`) is already exactly this, 34 tall, pill, 12.5/700, `--ink2`, hover `--jade`. Owner: 6, which touches the head row's placement with 3's strip: do 3 first. Target: 34 tall, radius 9999, 12.5/700, same row as the strip at 1280 and 800, wrapped under it at 400; 44px hit area through padding-free means (hit slop) not by inflating the box. Hidden where there is no table, as now. Hover `--jade` border, `--jade-text` text (P 246).
  - Builder: 049da19. 124×34, radius 9999, 12.5/700 --ink2. Same row as the switch at 1280 and 800; at 400 under the switch, 12 below, at the start. Tap area 44 (::before -6px from the padding edge). Awaiting the Reviewer's re-measure.
- [ ] **F10. Panel body.** Ours vs proto (INV 8.5-8.10), `GradeCalculator.tsx` and `grades.module.css` only:
  - Builder: 049da19. 18 before the first label. Labels 11.5/700 .5px. Select and target 46 tall on --surface2 (the 1.5px border renders as 1px at DPR 1, because Chrome snaps borders). CC row 48. Result 16 above, --jade-faint, radius 12, padding 14, centred, value 26/800 --jade-text. Both fixtures at 1280/800/400; nothing clipped, FR and AR at 400. Awaiting the Reviewer's re-measure.
  - space before the first label: 40 (note margin 20 + label margin-top 20) vs 18 (P 299);
  - section labels 11/700 ls .06em, margin 20 0 8, vs 11.5/700 ls .5px, margin 18 0 8;
  - select 48 tall on `--surface`, 1px, vs 46 on `--surface2`, 1.5px `--hair2` (P 448);
  - current CC bare 26/800 `--ink` vs a boxed row 48 tall, `--surface2`, radius 12, pad 12 14, 18/600 `--jade-text`, suffix 13/400 (P 449-450);
  - target input 48 on `--surface`, 1px vs 46 on `--surface2`, 1.5px (P 451);
  - result card margin-top 24, `--surface2` radius 16 pad 16, value 30/800 `--ink` vs margin-top 16, `--jade-faint` radius 12 pad 14, centred, value 26/800 `--jade-text` (P 330-331).
  Backing: P. The extra note and hint copy stay (INV 8.4). The "Calculer" button is A5; the numeral face in the input is A12; the label colour is kept, see F14. Owner: 6. Target: the numbers above, at 1280, 800 and 400, both fixtures (g11 with CC, g18 without), with nothing touching or cut off at 400.

## Cross-cutting

- [ ] **F13. Inactive sort carets are under 3:1.** Ours: every sort caret is `--ink2` at opacity 0.35 on the `--surface2` header band, about 1.6:1 in light (computed from rgb(101,107,96) blended over rgb(248,245,239)); dark not yet measured. Backing: icons under 3:1 are FIX. Owner: 5. Target: inactive caret at least 3:1 on its background in light and dark (about opacity 0.75, or a solid colour variable); the active caret stays `--jade-text`. Nothing on Planning uses this caret, so no consistency conflict.
  - Builder: 66baeec. Inactive caret is solid --ink3: 3.74:1 light, 4.05:1 dark on the table card (it was 1.63 / 2.03). Active caret is --jade-text. Awaiting the Reviewer's re-measure.
- [ ] **F14. Divergence rows for what stays different.** Owner: whoever changes the nearby code (3, 4, 5, 6), in `.claude/design-known-divergences.md`, in the file's format, "Product owner, 2026-11-19" or "Code wins, 2026-11-19" with the measured ratio, "Last reviewed" bumped. Rows needed:
  - Builder: BLOCKED. The guard and the runner rules do not let the Builder write `.claude/design-known-divergences.md`. Rows 1-4 are for the Lead or Islam to add; see PROGRESS.md.
  1. Table header and calculator labels are `--ink2`, the prototype `--ink3` (`.data-table th`, `.dp-section-lbl`). `--ink3` is under 4.5:1 as text; code wins.
  2. Sort buttons and semester options keep a 44px hit area (header band 44.5 tall, prototype 34.5), where the prototype is 34. Touch target. The compact switch is the exception (decision 3).
  3. "Non validée" pill is `--danger-ink`, the prototype `--danger` (`.pill-lvl-risque`). Same reason as the existing "Événement" row.
  4. Extra copy the prototype lacks: table legend, calculator note and hint.
  5. No "Calculer" button, if Islam keeps the live result (A5).
  If the guard blocks the file, report blocked to the Lead with these rows. Do not work around it.

## Checked, nothing to fix (so QA does not re-open it)

- Text contrast, every text colour on its real background, 7 shots in light, dark and Arabic: lowest 4.58:1 (light), 6.06:1 (dark). Nothing under 4.5:1 (3:1 for large text).
- Arabic at 1280 and 400, table, hero, switch, calculator panel and sheet: mirrored; numbers stay left-to-right (hero "12.74 / 20", credits "22 / 33"); Arabic face on names.
- Dark theme at 1280 and 400: no broken colours. The table's cut-off Statut column (F3) shows in dark too.
- No `0` for an unpublished grade in any of the 10 states checked.
- Calculator with no CC: the target input is disabled and a note says why, in existing copy.
- Six states render: loaded, loading, empty, error, offline, session expired (the shell's modal sits over the error card). Milestone 7: not needed.
