# FIX — objective faults, with targets

Each item: element, ours vs prototype (numbers), what backs it, owner milestone, target to re-measure. Source rows are in INVENTORY.md. Check a box when the Reviewer has re-measured it.

Backing: SD = standing decision (MISSION.md), P = prototype CSS line in `Unipocket PWA - Design System & Prototype v1.html`.

## Milestone 3 — title and switch

- [ ] **F1. Duplicate visible page title.** Ours: visible `h1` "Notes", 24/800, 36px tall, margin-bottom 20, under a topbar that already says "Notes" (INV 1.1). Proto: no in-page title. Backing: SD1. Owner: 3 (also the skeleton, `skeletons.tsx`, INV 9). Target: exactly one `h1` on the page, not visible (clip/sr-only, as `Schedule.tsx:62` `styles.srOnly`); first control top at y 139.4 / 107.4 (1280 / 400), within 1px of the prototype's 138.4 / 106.4; skeleton carries no title block.
- [ ] **F2. Semester switch is the 44px pill, not the compact switch.** Ours: option 44 tall, track 52, padding 4, gap 4, option padding-inline 20, 13.5/700 (INV 2.2-2.5). Proto `.segmented` (P 237-239): option 34, track 40, padding 3, gap 2, padding-inline 16, 13/700. Backing: SD3. Owner: 3 (reuse `SegmentedControl size="compact"` if it takes ids, labels and `aria-controls`; else match the numbers). Target: option 34 tall, track 40 (34 + 2×3), gap 2, selected pill `--surface` + `--shadow-card`, tablist roles and arrow keys unchanged; the skeleton strip is 34-tall options too.

## Milestone 4 — hero, cards and spacing

- [ ] **F7. Gap between head, hero and table is 16, prototype 20.** Ours: flex gap 16 between strip, hero and the calc/table block (INV 4.10). Proto: head `margin-bottom:20`, grid `margin-bottom:20` (P 325, 182). Backing: P, SD5 (16 already clears SD5's 14, this is conformity, low risk). Owner: 4. Target: 20 between strip and hero, and between hero and the next block, at all widths.
- [ ] **F11. Skeleton does not match the loaded layout.** Ours at 1280: skeleton hero 944×146 vs loaded 164.8; skeleton rows begin at y 425, loaded table card at y 504 (the "Calculatrice" row, 44 + gap, is not in the skeleton). Backing: SD7 (mobile CLAUDE rule: skeleton mirrors the loaded state); same crossfade grid cell, so the shift is visible. Owner: 4 (`skeletons.tsx` also in 3 for the strip). Target: skeleton hero height = loaded hero height at each width within 1px; first skeleton table element top = loaded table card top within 1px.
- [ ] **F12. State cards use 24px padding and a 15px title with 8px below.** Ours: `.stateBox`, `.empty` padding 24, empty title 15/700, gap 8, error `stateBox` text 13px (INV 9, 10). Backing: SD4 (20 padding, headings 14/700 with 14 below), SD5. Owner: 4 (CSS only; the files for the states are in 7's Paths but nothing is missing). Target: padding 20 on both, empty title 14/700 with ≥14 below before the body, error and offline text unchanged.

## Milestone 5 — table and values

- [ ] **F3. Statut column cut off at 1280.** Ours: table 989.5 wide in a 942 card, scroll width 990 > 942, "Statut" pill reads "Val…" (INV 6.2); unpublished semester 960 > 942. Proto: 902 in 902. The 5 non-subject columns after Code sum to 637.5, so a subject column of 180 would fit; the subject column is laid out at 352. The cause was not isolated (likely min-content of the header sort buttons plus the nowrap cells). Backing: SD5 (nothing cut off), milestone 5 "done when". Owner: 5. Target: at 1280, `scrollWidth <= clientWidth` on the table wrapper for default, cc-only and unpublished fixtures, all 8 columns fully visible, long subject names wrap inside their cell.
- [ ] **F9. Table touches the card edges.** Ours: no card padding; header band and cell text 12px from the card edge and the band touches the top and side borders (INV 6.1). Proto: `.card` padding 20 (P 181). Backing: SD4, SD5. Owner: 5. Target: wrapper padding 20 (table at card x + 21 incl. border), radius 16, 1px `--hair`, `--shadow-card`. Do F9 with F3: the table then has 902px, as the prototype.
- [ ] **F4. Sort-header labels sit 18px off their numbers.** Ours: caret (14px + 4px gap) is trailing, so right-aligned labels end at 954.5 / 1045.5 / 1136.6 while the numbers end at 972.5 / 1063.5 / 1154.5 (INV 6.6). Backing: SD5 (misaligned). Owner: 5. Target: label and number edges equal within 1px for every right-aligned column, at 1280 (caret before the label, or out of flow); Arabic mirrors.
- [ ] **F5. Table type and pills.** Ours vs proto, INV 6.5, 6.7, 6.8, 6.11:
  - header 11.5/700 ls .03em on a `--surface2` band, vs 11/700 ls .4px, no band (P 308);
  - cell 13px, row 49 tall, vs 13.5px, row 46 (P 311);
  - subject name colour `--ink2` instead of `--ink`: `.table td` (0,1,1) beats `.tdSubject` (0,1,0). A specificity bug; the intended colour never applies;
  - pill 12/700 sentence case, pad 3 10 (24 tall), vs 11/700 UPPERCASE ls .3px, pad 4 10 (21 tall) (P 441-444, `.hug-pill`);
  Backing: P. Owner: 5. Header colour (`--ink2` vs `--ink3`), the 44px sort-button height and the pill `--danger-ink` are kept and listed in D15, not changed here. Target: th 11/700 uppercase ls .4px; td 13.5px; subject name computed colour rgb(30,35,31); pill 11/700 uppercase ls .3px, height 21, pad 4 10. If the 44px sort buttons are kept, th height stays 44.5 (D15).
- [ ] **F8. Cards at ≤639.** Ours: radius 12, padding 14, gap 12, name 14/700 (INV 7.1-7.3). Proto: radius 16, padding 16, gap 14, name 15/700 lh 19.5 (P 423, 425). Backing: P, which is the stated exception to SD4 for this screen. Owner: 5. Target at 400: card radius 16, padding 16, 14 between cards, name 15/700. Border and the metric strip are D7.

## Milestone 6 — calculator

- [ ] **F6. Calculator trigger.** Ours: own right-aligned row under the hero, 131×44, radius 8, 13/600 `--jade-text`, icon 16, gap 8 (INV 3.1-3.2). Proto `.btn-ghost` (P 245-247): in the head row on the switch's line, end side, 124×34, pill radius, pad 0 14, 12.5/700 `--ink2`, icon 14, gap 6; at 400 it wraps under the switch with a 12px gap, left-aligned. Backing: P, SD3 (compact 34). Owner: 6, which touches the head row's placement with 3's strip: do 3 first. Target: 34 tall, radius 9999, 12.5/700, same row as the strip at 1280 and 800, wrapped under it at 400; 44px hit area through padding-free means (hit slop) not by inflating the box. Hidden where there is no table, as now. Hover `--jade` border, `--jade-text` text (P 246).
- [ ] **F10. Panel body.** Ours vs proto (INV 8.5-8.10), `GradeCalculator.tsx` and `grades.module.css` only:
  - space before the first label: 40 (note margin 20 + label margin-top 20) vs 18 (P 299);
  - section labels 11/700 ls .06em, margin 20 0 8, vs 11.5/700 ls .5px, margin 18 0 8;
  - select 48 tall on `--surface`, 1px, vs 46 on `--surface2`, 1.5px `--hair2` (P 448);
  - current CC bare 26/800 `--ink` vs a boxed row 48 tall, `--surface2`, radius 12, pad 12 14, 18/600 `--jade-text`, suffix 13/400 (P 449-450);
  - target input 48 on `--surface`, 1px vs 46 on `--surface2`, 1.5px (P 451);
  - result card margin-top 24, `--surface2` radius 16 pad 16, value 30/800 `--ink` vs margin-top 16, `--jade-faint` radius 12 pad 14, centred, value 26/800 `--jade-text` (P 330-331).
  Backing: P. The extra note and hint copy stay (INV 8.4). The "Calculer" button is D4; the numeral face in the input is D11; the label colour is D15. Owner: 6. Target: the numbers above, at 1280, 800 and 400, both fixtures (g11 with CC, g18 without), with nothing touching or cut off at 400.
