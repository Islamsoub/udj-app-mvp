# INVENTORY — Notes screen, ours vs prototype

Measured 2026-11-19 with the harness (`harness/run.js`), FR light, 1280 / 800 / 400 wide (height 900), from `getBoundingClientRect` and `getComputedStyle`. Raw data: `/tmp/pwa-grades-pass/*.json` (66 shots, PNG beside each). "Ours" = `/grades`. "Proto" = `view-grades` + `#calc-panel` in `specs/pwa/prototype-v1`. Sample data, not real data: text content differences are ignored.

Topbar, sidebar and dashboard are out of scope. Entries in `.claude/design-known-divergences.md` are not listed.
Last column: the F or D id each difference lands on. "=" means measured equal or equivalent, no id needed.

Harness notes. (1) Full-page PNGs of the prototype at 400 show its closed bottom sheets in the flow below the cards, and the fixed tab bar mid-page: capture artefacts, not faults. (2) The prototype has data for S1 and S2 only and no loading, error, empty or offline state for Notes. Those states have nothing to compare against; ours renders all of them (see "States" below).

## 1. Page head

| # | Element | Ours | Proto | Id |
|---|---|---|---|---|
| 1.1 | In-page title | visible `h1` "Notes", 944×36 at 1280 (352×36 at 400), 24px/800, ls -0.3px, margin-bottom 20; the topbar already shows "Notes" | none; the only title is the topbar's. Proto has a hidden "Bonjour, Amina" h1 | F1 |
| 1.2 | Top of first control | strip top at y 195.4 (1280) / 163.4 (400), 56px below the h1 | head top at y 138.4 (1280) / 106.4 (400). Ours without the h1 would sit at 139.4 / 107.4 | = (once F1 is done) |

## 2. Semester switch

| # | Property | Ours | Proto | Id |
|---|---|---|---|---|
| 2.1 | Component | own tablist `SemesterTabs` (sliding pill) | `.segmented` | F2 |
| 2.2 | Option height | 44 | 34 | F2 |
| 2.3 | Track height / padding / gap | 52 / 4px / 4px | 40 / 3px / 2px | F2 |
| 2.4 | Option padding-inline, font | 20px, 13.5/700 | 16px, 13/700 | F2 |
| 2.5 | Option width ("S1") | 57 | 45 | F2 |
| 2.6 | Track colour | `--sunken` rgb(239,234,224) | `--surface2` rgb(248,245,239) | F2 (compact variant owns it) |
| 2.7 | Strip width, 5 semesters | 309 (1280, 800, 400 alike) | 101 for 2 | = |
| 2.8 | 8+ semesters at 400 | not measurable with 5; 6 options would be 366 > 352 available | none | D8 |
| 2.9 | Single semester | a one-option strip, 65×52 | n/a | D9 |
| 2.10 | Selected colour | `--jade-text` on `--surface` with shadow | same | = |

## 3. Head actions

| # | Property | Ours | Proto | Id |
|---|---|---|---|---|
| 3.1 | "Calculatrice" placement | own row below the hero, right-aligned: 944×44 row at y 444.2 (1280), then 16px gap | in the head row, end side, on the switch's line (y 141.4). At 400 it wraps under the switch (y 158.4), left-aligned, 12px gap, head 86 tall | F6 |
| 3.2 | "Calculatrice" box | 131×44, radius 8, pad 0 14, 13/600, `--jade-text`, border `--hair2`, icon 16, gap 8 | 124×34, radius 9999, pad 0 14, 12.5/700, `--ink2`, border `--hair2`, icon 14, gap 6 | F6 |
| 3.3 | "Exporter PDF" button | absent | 129×34 `.btn-ghost`, next to Calculatrice | D3 |

## 4. GPA hero

| # | Property | Ours | Proto | Id |
|---|---|---|---|---|
| 4.1 | Look | white card: padding 20, radius 16, 1px `--hair`, `--shadow-card`; ring 104×104 left of the text | jade gradient (150deg `--jade`→`--jade-hover`), white text, radius 22, padding 22, shadow 0 14px 30px rgba(15,110,86,.30), 160px translucent circle top-end | card style = decision 4 ✔; jade vs white → D1 |
| 4.2 | Width | 944 / 664 / 352 (full row) | 304 / 324 / 352 (one grid column, beside the history card) | D2 |
| 4.3 | Height | 164.8 (1280, 800); 282.8 (400, ring stacked above text) | 188 at every width | D12 |
| 4.4 | Label | "MOYENNE DU SEMESTRE" 12/700 uppercase ls .04em `--ink2` | "MOYENNE GÉNÉRALE · S1" 12.5/700 uppercase ls .4px, white 78% | copy → D16; colour follows D1 |
| 4.5 | Value | 40/800, ls -0.03em, Plus Jakarta, + "/ 20" 15/600 | 42/500 DM Mono, + "/20" 17/400 | D11 |
| 4.6 | Mention pill | 81×24, 12/700, `--jade-faint`/`--jade-text`, pad 3 10, no dot | 104×26, 13/700, white 18%, pad 5 12, 6px coloured dot | follows D1 |
| 4.7 | Credits line | "22 / 33 crédits validés" 12.5/400, inline beside the pill | "Crédits : 23/23" 13/400 on its own line, margin-top 16, + 4px progress bar | D1 |
| 4.8 | Year line | "Année universitaire 2024-2025" 11.5/400 | none | = (data field stays) |
| 4.9 | No GPA | "Moyenne non publiée" 17/700 `--ink2`, card 145.5 tall | n/a | = (decision 6 holds) |
| 4.10 | Gap hero → next block | 16 (flex gap) | 20 (`margin-bottom:20`) | F7 |

## 5. GPA history card

Proto only: card 304×168 (1280), `h3` "Historique GPA" 14/700, margin-bottom 14, 4-point line chart 262×90. Ours has nothing. → D2.

## 6. Table card and table (1280 / 800)

| # | Property | Ours | Proto | Id |
|---|---|---|---|---|
| 6.1 | Card | no inner padding; table flush to the card edge; header band touches the card's top and sides | `.card`: padding 20, radius 16, 1px `--hair`, shadow; table inset by 20 | F9 |
| 6.2 | Table width vs card | 989.5 in a 942 card (1280); 989.5 in 662 (800). Last column "Statut" cut at 1280 (pill shows "Val…"). Unpublished semester: 960 > 942 | 902 in 902, nothing cut | F3 (1280), D10 (800) |
| 6.3 | Columns | Matière, Code, Coef., Crédits, CC, CF, Finale, Statut (8; Code is extra) | Matière, CC, CF, NF, Coef, Crédits, Statut (7) | order and names → D16; Code stays |
| 6.4 | Header height | 44.5 (sort buttons min 44) | 34.5 | D15 (44px target kept, proposed row) |
| 6.5 | Header type | 11.5/700 uppercase ls .03em `--ink2`, band `--surface2` | 11/700 uppercase ls .4px `--ink3`, no band, 10px 12px padding | F5 for size and tracking, band; colour → D15 |
| 6.6 | Header label vs column text | right-aligned columns: label's right edge 954.5 (CC), 1045.2 (CF), 1136.6 (Finale) while the numbers end at 972.5, 1063.5, 1154.5: the 14px caret + 4px gap sits to the right of the label, so every number column's label is 18px off its numbers | label and numbers share one edge | F4 |
| 6.7 | Row height / cell padding | 49 / 12px, 13px | 46 / 12px, 13.5px | F5 |
| 6.8 | Subject name | weight 600 but colour `--ink2` rgb(101,107,96): `.table td` (specificity 0,1,1) overrides `.tdSubject` (0,1,0), so the intended `--ink` never applies | `--ink` rgb(30,35,31), weight 400 | F5 |
| 6.9 | Numeric cells | Plus Jakarta 13/400, `--ink2` | DM Mono 13.5, `--ink` (NF coloured by level) | D11 |
| 6.10 | Unpublished marks | italic 12px "non publiée", `--ink2`; no "0" anywhere in any of the 10 shots (checked `0`, `0,00`) | n/a | = (decision 6 holds). Repetition: 5 / 12 / 15 cells per semester → D13 |
| 6.11 | Status pill | 63×24, 12/700, sentence case, pad 3 10, "Validée / En attente / Non validée", failed in `--danger-ink` | 62×21, 11/700 UPPERCASE ls .3px, pad 4 10, "Validé / Limite / Risque", failed in `--danger` | size, case F5; wording and levels D5; ink D15 |
| 6.12 | Legend under the table | "CC : contrôle continu · CF : …" 11.5/400, 17px | none | = (copy, stays) |
| 6.13 | Sort | caret on all 8 columns, sortable | sortable, no carets | = (behaviour) |

## 7. Cards (≤639 wide, 400 measured)

| # | Property | Ours | Proto | Id |
|---|---|---|---|---|
| 7.1 | Card | `li` radius 12, padding 14, 1px `--hair`, shadow; 162.9 tall (long name, 2 lines) / 150.5 | `.subject-card` radius 16, padding 16, no border, shadow; 138 tall | F8 |
| 7.2 | Gap between cards | 12 | 14 | F8 |
| 7.3 | Name | 14/700 lh 18.2 | 15/700 lh 19.5 | F8 |
| 7.4 | Pill | as 6.11 | 11/700 uppercase, 61.8×21 | F5 |
| 7.5 | Fields | 3×2 grid: Code, Coef., Crédits, CC, CF, Finale; label 10/700 uppercase, value 13.5/600 | one `.metric-strip` (surface2, radius 12, pad 10 6): CC, CF, COEF, NF; label 10/700, value 15/500 mono | strip → D7 |
| 7.6 | Progress bar and "Sous la moyenne" hint | absent | 6px bar `--jade` / `--warning` / `--danger`, hint 12.5/600 with icon when not validated | D7 |
| 7.7 | Table → cards switch | below 640 | below 640 | = |

## 8. Calculator trigger and panel (`#calc-panel`)

Ours is the shared `SlidePanel` plus `GradeCalculator`. At 1280 and 800 it is a right-hand panel; at 400 a bottom sheet with a grabber (proto: same switch below 640).

| # | Property | Ours | Proto | Id |
|---|---|---|---|---|
| 8.1 | Panel width | 420 | 400 | D14 |
| 8.2 | Header | pad 20 20 16; title 17/700; subtitle 12.5/400; close 36×36 radius 8, no fill | pad 20 22 16; title 20/800; subtitle 13.5/400; close 34×34 round, `--surface2` fill | D14 |
| 8.3 | Body padding | 20 | 18 22 | D14 |
| 8.4 | Extra copy | an info note (12.5, 59.5 tall, own box) above the first label, and a hint under the target input | none | = (copy stays); spacing F10 |
| 8.5 | Space before first label | note margin-bottom 20 + label margin-top 20 = 40 | label margin 18 | F10 |
| 8.6 | Section labels | 11/700 uppercase ls .06em `--ink2`, margin 20 0 8 | 11.5/700 uppercase ls .5px `--ink3`, margin 18 0 8 | F10 (size, margins); colour D15 |
| 8.7 | Subject select | 48 tall, bg `--surface`, 1px `--hair2`, radius 12, 14px | 46 tall, bg `--surface2`, 1.5px `--hair2`, radius 12, 14px, margin-bottom 4 | F10 |
| 8.8 | Current CC | bare value 26/800 `--ink` + "/ 20" 13/600 `--ink2`, no box | boxed row: 48 tall, `--surface2`, radius 12, pad 12 14, value 18/600 `--jade-text` mono + "/20" 13/400 | F10 |
| 8.9 | Target input | 48 tall, `--surface`, 1px, Plus Jakarta 14 | 46 tall, `--surface2`, 1.5px, DM Mono 15 | F10 (box); face D11 |
| 8.10 | "Calculer" button and result | no button; result updates live (150 ms debounce), a card `--surface2` radius 16 pad 16 margin-top 24, value 30/800 `--ink`, verdict 12.5 | "Calculer" 52 tall `--jade` full width; result: `--jade-faint`, radius 12, pad 14, centred, value 26/800 `--jade-text`, margin-top 16 | button D4; result box F10 |
| 8.11 | CC missing | select shows the subject; current CC shows italic "non publiée"; target input disabled (opacity .5); a boxed note says the CC is not published | prototype has CC for every subject | = (already disabled and explained) |
| 8.12 | Trigger returns focus, Esc closes | not re-tested in this milestone (behaviour, QA's job) | | n/a |

## 9. States (ours; the prototype has none of these)

| State | Measured | Id |
|---|---|---|
| Loading | skeleton: strip 164×52 (two 76×44 options), hero 944×146 (loaded hero is 164.8), then six 46px rows from y 425; the loaded table card starts at y 504. So hero grows by 19 and the table starts 79 lower than the skeleton rows. Skeleton also carries the visible h1 | F1, F11 |
| Error (bundle) | `stateBox` 944×123.5, padding 24, text 13/400, "Réessayer" 97×44; no strip | F12 |
| Error (one tab) | strip stays, `stateBox` below it | = |
| Offline, no copy | `stateBox` 944×69.5 under the shell's banner | F12 |
| Empty (semester with no rows) | card 944×157, padding 24, title 15/700, 8px gap, body 13/400, jade action 205×44 | F12 |
| Single semester | renders with a 65px one-option strip | D9 |
| CC only / unpublished semester | hero "Moyenne non publiée"; table rows with "non publiée" and "En attente"; trigger still shown | = |

States named in the mission, all exist: loading, empty, error, offline, single semester, calculator with and without CC. The calculator with *no subjects* cannot be reached (the trigger is not mounted without a row). So milestone 7 has nothing missing to build.

## 10. Padding of state cards vs decision 4

`stateBox`, `empty`: padding 24 against decision 4's 20; empty title 15/700 with 8px below vs "14/700 with 14px below". → F12.
