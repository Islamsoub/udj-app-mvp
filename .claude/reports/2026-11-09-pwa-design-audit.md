# PWA design audit (2026-11-09)

Read-only. No code was changed and no branch was opened. This file is the only output.

## How this was done
- **Method.** One `design-checker` agent per page. Values pass only: the CSS and TSX were read against the references as text, and nothing was rendered.
- **What was audited.** `pwa/` as it is on `develop` (9a11de0). The attendance band work (milestones 6 and 7) sits on unmerged branches. Anything it changes is marked *pending* and is not counted here.
- **Authorities.**
  - `design/spec-pack/tokens/pwa/` for colours, radii, shadows and motion.
  - The foundations spec, `specs/pwa/foundations/`, for motion, states, interaction, offline and accessibility.
  - For the dashboard and the shell: the current dashboard specs, which are the Dashboard Spec plus its overrides, the Round 2 Spec, `ROUND2-CLOSEOUT.md` and the dashboard source CSS.
- **Prototype.** `specs/pwa/prototype-v1/` is context only. It is the only visual reference for schedule, grades, attendance (outside §4), news and profile. Every difference against it is a **question**, not a defect.
- **Excluded.** Nothing listed in `.claude/design-known-divergences.md` or in close-out §6 is reported.

**Three things to know before reading:**
1. **Spacing and type scales.** Neither the token files nor the foundations spec has one. The only stated scales are the dashboard's, so "off the 8px grid" findings outside the dashboard are measured against the grid you asked for, not against any spec. 2 and 4 px are counted as half-steps on the grid.
2. **No hardcoded colours.** All six checkers grepped every CSS and TSX file in scope for hex, rgb, hsl and named colours, and found none. Every colour goes through a token. Category B findings are about tokens used against their rule, or about a spec'd treatment that was not built.
3. **Severity was adjusted in places.** I re-rated some checker findings where "a feature is missing" had been scored as "a state rule is broken". Each case is noted.

Labels: **[A]** state rule · **[B]** colour · **[C]** type · **[D]** spacing off the 8px grid. Each finding is a DEFECT (it exists and is wrong, measured against a current spec), a QUESTION, or **specified, not built** (a spec describes it and the build does not have it yet: scope, not a defect, so it carries no severity and sits in its own block per page).

---

## 1. Attendance (worst)

*Pending milestone 7, not counted:* the Hero band line, the subject-row band treatment and the ring stroke (close-out §4). These are built on `feature/pwa-attendance-page-band`.

### High
- **[A] DEFECT: submit button has no interaction states.** `attendance.module.css:826-848`: no `:hover` (jade → `--jade-hover` over `--dur-fast`), no `:active` scale 0.97 over `--dur-instant`, and no transition (Foundations §5, Buttons). The disabled state is correct.
- **[A] DEFECT: drop zone has no hover.** `attendance.module.css:731-748`: the zone has `cursor: pointer` but no `:hover` (Foundations §3). The prototype hovers it to a jade border and `--jade-faint` fill.
- **[A] DEFECT: file error is not shown on the field.**
  - Where: `attendance.module.css:886-895`, `JustificationForm.tsx:329-333`.
  - Built: the error is a separate box under the drop zone. The zone itself never turns `--danger` / `--danger-bg`, and the message appears without the `max-height` + fade over `--dur-fast` (Foundations §5, Inputs).
  - The note input (`:852-879`) has no error state at all.

### Medium
- **[A] DEFECT: drop-zone transition uses `linear`.** `attendance.module.css:741-742`. §2 allows only `--ease-out` and `--ease-in-out`. The duration, `--dur-instant`, is right.

### Low
- **[A] DEFECT: focus offset.** `attendance.module.css:371-375`: `.absencesPanel:focus-visible` uses a 4 px outline offset; §3 says 2 px.
- **[A] DEFECT: dead CSS.** `attendance.module.css:815-824`: `.disabledReason` is used by no component.
- **[A] QUESTION: shimmer angle.** `attendance.module.css:1014-1024`: the shimmer is a horizontal 90° gradient where §5 says "a lighter diagonal band". The 900 ms duration matches.
- **[C] QUESTION (prototype only):**
  - Hero number: 44/800 Jakarta (`:74-80`) vs prototype 42/500 DM Mono.
  - Status chip: 12/700, padding 3 10 (`:490-494`) vs prototype 11.5/700, padding 4 10.
  - Pending chip: `--info` (`:508-511`, `:592-595`) vs prototype `--warning-bg`.
  - Heading: 24/800 (`:16-22`) vs prototype 19/800. It matches the grades and schedule headings.
  - Subject name and figure: 13.5 and 17/800 vs prototype 14 and 16 DM Mono/500.
  - Drop zone: 1 px dashed with `--r-md` vs prototype 1.5 px with `--r-lg`.
  - Absence rows: bordered cards vs prototype flat rows on hairlines.
  - Hero: `--surface` card vs prototype jade gradient card.
  - Track: 8 px vs prototype 6 px.
- **[D] Off-grid spacing, no spec value for any:**
  - 10 px: `:89, 125, 205, 279, 490, 572, 656, 817, 888, 927, 961, 1058, 1091`
  - 12 px: `:183, 233, 337, 364, 389, 392, 574, 625, 658, 855, 888, 929, 1064, 1069`
  - 14 px: `:124, 212, 392, 574, 625, 658, 817, 929, 989`, and icons at `:326, 353-354`
  - 20 px: `:40, 474, 1040`, and icons at `:421-422, 583-584, 680-681, 950-951`
  - 6 px: `:62, 97, 124, 337`
  - 3 and 5 px: `:315, 490, 346`
  - 18 and 28 px: `:456-457, 799-800`
  - Skeleton heights: 66, 92, 140 px
  - Ring: 132 px (`:137-138`)

---

## 2. Dashboard and app shell

The dashboard is the only page with a current, detailed spec, so it is also the only page where type and spacing differences count as defects. The shell (sidebar, topbar, tab bar, toasts) is shared by every page and is reported here.

*Pending milestone 6, not counted:* the attendance card's band line, Seuil label, "+ {k}" suffix and band ring colour.

### Specified, not built
Planned scope that a current spec describes and the build does not have yet. These are not design defects, so they carry no severity. The detail is kept for whoever builds them.
- **[A] Notification bell.**
  - Where it would go: `pwa/components/shell/Topbar.tsx:11-27`, `shell.module.css:398-403`.
  - Spec: the topbar has a 38 px bell with an 8 px `--danger` badge and a popover (Dashboard Spec §6, Round 2 §5, `bell-states.html`). Foundations §3's focus order is "bell, avatar".
  - Depends on it: the bell's states, and the Notifications card's "Tout voir", which opens it.
- **[B] Jade GPA hero card.**
  - Where: `dashboard.module.css:33-43`, `GpaCard.tsx`.
  - Spec (Dashboard Spec §4/§6, close-out §1 "Scope", `app.css:379-388`): `linear-gradient(150deg, #168666, #0F6E56)`, white ink, radius 22, the jade shadow, a 7% depth circle, and a mention badge on `rgba(0,0,0,.16)`.
  - Built today: a plain `--surface` card with ink text and a `--jade-faint` mention (`:393-403`).
  - The hero's own type comes with it, built vs spec:

    | Element | Lines | Built | Spec |
    |---|---|---|---|
    | GPA figure | 373-379 | 34/800 Jakarta, `--ink` | DM Mono 500, lh 1, white; 32 in the doc text, 42 in `app.css:382` (the spec contradicts itself) |
    | "/20" | 381-385 | 14/600 `--ink2` | 17/400 white |
    | Mention | 393-403 | 12/700, padding 3 10 | 13/700, padding 5 12, gap 7 |
- **[C] Greeting programme line.** A 14/400 `--ink2` line under the heading (`app.css:165-168`).
- **[C] Ring "TAUX" caption.** 9.5/600 (`app.css:188`).
- **[C] Notification time.** DM Mono 11.5 (`app.css:131-135`).
- **[C] Quick-link subtitle.** 11/600 (`app.css:202-207`).
- **[C] News category pill and thumbnail.** The pill is 11/700 (Dashboard Spec §5).
- **Card links.** "Tout voir" and "Voir tout" on the Notifications and Actualités cards.

### Medium
- **[B] DEFECT: wrong sidebar logo.**
  - Where: `pwa/components/shell/shell.module.css:162-170` masks `pwa/public/logo.svg`. That file is the mortarboard-over-U artwork.
  - Spec: INDEX.md, Brand: "the U replaces the mortarboard everywhere" (decision of 2026-10-27). It names `unipocket-sidebar-mark` (34×34, r10, on the jade gradient) for the sidebar.
  - Found by the orchestrator, not the checker.
- **[C] DEFECT: type does not match the Dashboard Spec §5 / `app.css`.** Built vs spec, all in `dashboard.module.css`:

  | Element | Lines | Built | Spec |
  |---|---|---|---|
  | Card title | 94-101 | 12/700 uppercase, ls .04em, `--ink2`, with icon | 14/700 `--ink`, no uppercase, no icon |
  | Greeting heading | 11-17 | 24/800 | 28/800 at ≥1024 px (24 below), ls -0.4px |
  | Next-class subject | 314-320 | 15/700 | 13.5/700 |
  | Next-class meta | 338-345 | 12.5, Jakarta | room 12/400; times DM Mono 12 (`NextClassCard.tsx:55` uses `.num`, which is Jakarta) |
  | Ring label | 451-457 | 17/800 | 18/800 |
  | Notification item | 478-485 | 12.5 | 13/600 lh 1.35 |
  | Unread count | 461-467 | 34/800 | not in spec |
  | Quick link | 518-519 | 12.5/600 | 13/700 |
  | News title / meta | 561-571 | 13/600, meta 11.5 | 14.5/700 |

- **[C] DEFECT: shell type does not match the spec.** All in `pwa/components/shell/shell.module.css`:

  | Element | Lines | Built | Spec |
  |---|---|---|---|
  | Topbar title | 368-378 | 18/700 | 19/800, ls -0.3px |
  | Nav item | 217-234 | 13.5/600, icon 20 | 14/600, icon 19 |
  | Collapse button | 293-313 | 13/600, chevron 20, 44 tall, no fill | 12/600, chevron 14, 38 tall, `--surface2` r12 |
  | Tab bar | 847-880 | 10/500 (700 active), icon 22, 56 tall | 10.5/600, icon 21, 64 tall |

  The tab bar's default colour is `--ink2` where the spec says `--ink3`. The build's choice is the AA-safe one, so it is not counted.
- **Layout: structure differs from Dashboard Spec §1/§6.** These are not strictly A–D, but each one is a difference from a current spec:
  - **Grid.** The spec is 1/2/3 columns at 640/1024 px, GPA stacked over Assiduité, Notifications spanning two columns at tablet width. Built is six equal `auto-fit` cards at `minmax(280px)` (`:27`).
  - **Content padding.** Spec is 24 / 32 / 48 px with `max-width: 1200px`, centred. Built is 24 px at every width, with no max-width (`shell.module.css:44`).
  - **Topbar.** Spec padding is 16/24 → 18/32 → 20/48, and the bar is sticky and blurred. Built is a fixed 64 px tall with `--surface`, not sticky (`:345-355`).
  - **Avatar.** Spec is a 36 px `--jade-faint` circle with initials at 13/700, plus a chevron. Built is a 44 px icon button with a generic icon (`:437-465`).
  - **Quick-link tiles.** Spec is `--surface`, 1 px `--hair` border, r16, a 36 px icon tile, and a jade hover. Built is `--surface2`, `--r-sm`, no border, a bare 16 px icon, and a lift on hover (`:509-531`).
  - **Card padding.** Spec is 20 (16 on Assiduité, 18 on GPA). Built is 16 on every card (`:38`).
  - **Gaps.** Spec quick-link gap is 12 and news gap is 10. Built is 8 (`:506`) and 12 (`:549`).
  - **Ring.** Spec gauge is 88 px with a 9 px stroke. Built is 84 px with an 8 px stroke (`Ring.tsx:8-9`).
  - **Menu.** Spec is min-width 220 and radius r16. Built is 200 and `--r-md` (`shell.module.css:483,486`).
  - **Nav and collapse radius.** Spec is r12. Built is `--r-sm` (8).
  - **Sidebar foot.** The spec's 1 px top border is missing (`:287-290`).

### Low
- **[A] DEFECT: quick links press like buttons.** `dashboard.module.css:533-535` scales `.quickLink` to 0.97 on `:active`, with the transform over `--dur-fast` (`:522-524`). Foundations §3: the press is for buttons only, at `--dur-instant`. Clickable cards lift.
- **[A] DEFECT: focus ring covers less than the click target.** `dashboard.module.css:575-580` puts the focus ring on the title link only, while the click area is the whole card via `::after` (Foundations §3).
- **[A] DEFECT: toasts don't stack.** `Toast.tsx:7-66` shows one toast at a time. Foundations §5 asks for stacking with an 8 px gap, at most 2 visible.
- **[A] QUESTION: sidebar collapse timing.** `shell.module.css:116` uses `--dur-base --ease-in-out` (Foundations §7). Dashboard Spec §1 says `.18s ease`, and the screen spec outranks the foundations. Neither value maps onto the other through the tokens.
- **[A] QUESTION: offline banner uses `--warning` for graphics.** `shell.module.css:557,580` use `--warning` for the banner's icon and border. That is 2.15 : 1, under 3 : 1 for graphics, the reason close-out A3 dropped it. Text sits beside them, so colour is not the only signal.
- **[A] QUESTION: offline banner shape.** The build is full width (`:549-560`). The dashboard CSS draws `.offline-banner` as a card, but `dashboard.html` never shows it.
- **[C] DEFECT: countdown pill and menu item sizes.**
  - Countdown pill padding is 4 10; spec is 5 11 (`dashboard.module.css:327-336`).
  - Menu item is min 44 tall with an 18 px `--ink2` icon; spec is 40 tall with a 16 px `--ink3` icon (`shell.module.css:500-520`). The 44 px height is the touch target.
- **[D] Off-grid spacing.**
  - Dashboard: 20 (`:12`, spec says 24); 12 (`:91`, spec says 14; `:473`, `:549`, `:284` have no spec value; `:240`, `:311`, `:341` match the spec's 12); 10 (`:207`, `:342` no spec value; `:329`, `:397`, `:514` where the spec says 11, 12 and 14); 6 and 5 (`:341`, `:489-491`, `:350`); 3 (`:397`); 14 (`:354-355`); 34 (`:228`); 148 and 280 (`:37`, `:27`).
  - Shell: 10 (`:126`, which matches the spec; `:128`, `:223`, `:299`, `:503`, `:552`); 20 (`:129`, `:764`); 22 (`:462-465`, `:877-880`); 6 (`:481`, `:484`, where the spec says 8); 12 (`:221`, `:296` match the spec; `:555`, `:635`); 3 (`:854`, matches the spec); 11 and 18 (`:615`, match the spec).

---

## 3. Profile

### Specified, not built
Planned or proposed scope that a spec describes and the build does not have. Not a design defect, so no severity.
- **[A] "Vider le cache" (open decision).** §9 Profile specifies a toast plus a pulse on the last-sync label. `AccountActions.tsx:14-20` says it was removed on purpose, because the offline-data switch and sign-out already clear the store. That decision is not on the known-divergences list. Add it there, or build it?
- **[A] Change-password block (open decision).** The prototype has a "Sécurité" block, and §8 assumes a change-password form exists. The PWA has none. CLAUDE.md puts self-service password *reset* out of MVP scope; whether *changing* a password is in scope is not stated.

### Medium
- **[A] DEFECT: switch thumb and track timing.**
  - Where: `profile.module.css:369-370`, and the track at `:316-317`.
  - Built: the thumb animates over `--dur-fast` (180 ms) with `--ease-out`, and the track uses `--dur-fast` too.
  - Spec: §9 Profile wants `--dur-instant` (100 ms) with a slight overshoot; §2 lists "toggle flip" under `--dur-instant`.
  - The comment at `:373-375` declines the overshoot on purpose, but it is not on the known-divergences list.
  - Re-rated from high: it's a 80 ms timing difference.
- **[A] DEFECT: switch has no hover or press.** `profile.module.css:316-347`: `.switch` has no `:hover` (§3: every clickable element) and no press feedback.
- **[A] DEFECT: select has no hover.** `profile.module.css:402-413`.
- **[A] DEFECT: logout button states.** `profile.module.css:429-462`: `.logout` has no `:active` press, and `.logout:hover` (`:450`) is not guarded by `:not(:disabled)`. A disabled logout button still shows the danger wash on hover (§3, §5).
- **[A] DEFECT: offline hint is not on the control.**
  - Where: `NotificationPrefs.tsx:136-139`, `locales/fr.json:458`.
  - Built: offline, the switches are disabled and a separate hint reads "Connexion requise pour modifier vos notifications."
  - Spec: §8 puts "Connexion requise" on the blocked control itself. Switches have no label to replace, so this may be the closest fit. Confirm.

### Low
- **[A] DEFECT: reduced-motion inconsistency.** `profile.module.css:579-588`: the thumb gets `transition: none` while the track gets `--dur-instant` linear. §2 says to collapse both to `--dur-instant`.
- **Switch geometry vs `tokens.json` "switch":** no differences.
- **[C] QUESTION (prototype only):**
  - Heading: 24/800 (`:15`) vs prototype 19/800.
  - Section title: 16/700 (`:45`) vs 14/700.
  - Row label: 13.5/700 (`:256-257`) vs 13.5/600.
  - Row hint: 12, lh 1.5, `--ink2` (`:263-264`) vs 11.5, lh 1.3, `--ink3`. The build's colour is the AA-safe one.
  - Name: 18/800 (`:117,119`) vs 19/700.
  - Avatar: initials 22/800 on a 64 px circle (`:103-104`, `:87-88`) vs 30/700 on 84 px.
  - Half-pixel sizes 11.5, 12.5 and 13.5 at `:52, 133, 182, 193, 200, 256, 443`.
- **[D] Off-grid spacing:**
  - 20 px: `:14, 70`, no spec value. The prototype's cards use 20.
  - 12 px: `:38, 173, 386, 404`. The prototype states 12 for settings rows only.
  - 6 px: `:78, 172, 392`
  - 10 px: `:244, 432, 477, 142`
  - 14 px: `:233, 497`
  - 3 px: `:142`
  - 11 px: switch hit-area inset at `:324-325`, used to reach 44 px.
  - 18, 52 and 140 px: `:466-467, 434, 393`
  - Skeleton heights: 12, 14, 18 px
  - Radius: 2 px at `:224` is not a radius token.

---

## 4. Schedule

### Specified, not built
Planned or proposed scope that a spec describes and the build does not have. Not a design defect, so no severity.
- **[A] Schedule print sheet (open decision).** The Round 2 Spec and `schedule-print.html` make the A4 schedule print sheet **current**. The PWA has no print button and no `@media print` anywhere under `pwa/`. Is this planned, or dropped?

### Medium
- **[A] DEFECT: phone skeleton doesn't match the loaded layout.**
  - Where: `pwa/components/schedule/skeletons.tsx:35-66`, `ScheduleView.tsx:56`.
  - Built: the skeleton always draws the toggle plus a five-column week grid, 448 px tall.
  - Loaded, below 640 px: no toggle, and the day list. Foundations §5 says skeletons match each element's footprint, so phone users see the layout jump.
- **[A] QUESTION: "today" in week view shown by colour alone.**
  - Where: `schedule.module.css:199-203, 265-267`, `WeekGrid.tsx:60-68`.
  - Built: the week view marks today with a jade tint and jade text only. `aria-current="date"` helps screen readers, not sighted users. The day view does have a "today" pill.
  - §10's colour-only rule names status colours, and jade isn't one, hence a question.

### Low
- **[A] DEFECT: selected tab loses its colour on hover.** `pwa/components/segmented/segmented.module.css:71-77`: `.option:hover` (specificity 0,2,0) outranks `.optionSelected` (0,1,0). This affects every segmented control: schedule, grades and profile.
- **[A] QUESTION: segmented options don't press.** `segmented.module.css:50-69` has no press scale. §5 doesn't say whether tabs count as buttons.
- **[A] QUESTION: `linear` easing.** `schedule.module.css:434, 744` use `linear`, which is outside §2's two easings. See cross-cutting.
- **[B] NOTE: comment and token disagree.** `schedule.module.css:558`: the TD day-rule uses `--jade-text`, while its comment says bars stay on `--jade`.
- **[C] QUESTION (prototype only):**

  | Element | Lines | Built | Prototype |
  |---|---|---|---|
  | Heading | `:20-22` | 24/800 | 19/800 |
  | Segmented option | `segmented.module.css:63-64` | 13.5 | 13 |
  | Nav label | `:104-105` | 13/600 | 13.5/700 |
  | Today and retry buttons | `:121-122, 708-709` | 13/600 | 12.5/700 |
  | Day name | `:206-209` | 11/700 uppercase | 11.5/700 sentence case |
  | Day date | `:219` | 15/800 Jakarta | 15 DM Mono |
  | Gutter | `:242-243` | 11/600 Jakarta | DM Mono |
  | Block subject and meta | `:334-335, 348` | 11.5, 10 | 12, 10.5 |
  | Day-view time | `:532-533` | 14/800 | 12.5 mono |
  | Day subject and meta | `:585-586, 595` | 14, 12 | 15, 13 |
  | Pills | `:394, 481` | 12 | 11.5 |

- **[D] Off-grid spacing, no spec value for any.**
  - `schedule.module.css`:
    - 3 px: `:278, 285, 548, 774, 391, 477`
    - 5 px: `:283, 602`
    - 7 px: `:283, 640`
    - 6 px: `:572`
    - 10 px: `:148, 195, 391, 452, 477, 581, 675, 801, 802`
    - 12 px: `:52, 499, 501`
    - 14 px: `:115, 148, 452, 594, 704`
    - 20 px: `:19`
    - 21 px: `:658`
  - `panel.module.css`:
    - 12 px: `:126`
    - 20 px: `:128, 202, 255`
    - 36 px close button at `:161-162`, under the 44 px used elsewhere
    - Panel width 420 px at `:62`. The prototype uses 400: a question.
  - `segmented.module.css`: 20 px at `:57`.
  - Layout questions against the prototype:
    - Hour height: 64 px vs 56 px.
    - Controls: 44 px vs 34 px.
    - Week grid: 5 columns vs 7.
    - Day view: card list vs timeline.

---

## 5. Grades

No high-severity findings.

### Specified, not built
Planned or proposed scope that a spec describes and the build does not have. Not a design defect, so no severity.
- **[A] GPA history sparkline.** Foundations §5 specifies its draw-in, and the prototype has a "Historique GPA" card. Nothing in `pwa/components/grades/` draws one. Deliberate?

### Medium
- **[A] QUESTION: status pill doesn't fade on change.** `grades.module.css:481-490`, `GradesTable.tsx:117-121`. Foundations §5 says that when a grade is published, the pill fades in from 0 over `--dur-base`. The code reads "never animates on its own" as "never animates".

### Low
- **[A] DEFECT: calculator select has no hover.** `grades.module.css:881-899`: `.calcSelect` has `cursor: pointer` but no hover (§3).
- **[A] DEFECT: focus offset.** `grades.module.css:38-42`: the tab-panel focus ring uses a 4 px offset; §3 says 2 px.
- **[A] NOTE: literal timings.** `grades.module.css:187, 989` use a `150ms` literal and an `80ms` delay. §9 states 150 ms itself. The 80 ms delay has no spec value.
- **[C] QUESTION (prototype only):**
  - Heading: 24/800 (`:16-22`). The prototype has no in-page heading.
  - Hero number: 40/800 Jakarta (`:222-228`) vs 42/500 DM Mono; "/20" is 15/600 vs 17/400.
  - Hero label: 12 vs 12.5.
  - Mention and credits: 12 and 12.5 vs 13.
  - Table: 13, header 11.5 (`:358, 392-395`) vs 13.5 and 11.
  - Tab: 13.5 vs 13.
  - Pill: 12 vs 11.5.
  - Card: 14 / 10 / 13.5 (`:544-577`) vs 13.5 / 12.5.
  - Marks use `.num` (Jakarta) where the prototype uses DM Mono. Both are Latin in Arabic, so the rule holds either way.
- **[D] Off-grid spacing, all in `grades.module.css`:**
  - 12 px: `:387, 452` match the prototype; `:556, 587` don't (the prototype uses 10 and 14).
  - 14 px: `:525, 530, 595, 693, 821, 859, 885`. Only `:530` matches the prototype.
  - 10 px: `:249, 250, 257, 325, 485, 541, 555, 674, 777, 859`. `:485` and `:555` match the prototype.
  - 20 px: `:17, 122, 147, 158, 757, 759, 858, 878`
  - 6 px: `:218, 219, 248, 270, 939, 995, 996`
  - 3 px: `:257, 485`
  - Fixed sizes with no spec value: 46, 140×36, 76×44, 12, 14×14, 180 px, and ring stroke 9.
  - Hero radius `--r-lg` (16) vs the prototype's 22. The built hero is a surface card, not the jade card: a question.

---

## 6. News (cleanest)

No defects found.

### Specified, not built
Planned or proposed scope that a spec describes and the build does not have. Not a design defect, so no severity.
- **[A] Bookmark control.** No bookmark exists, so §9's save bounce (`scale(1→1.3→1)` over `--dur-fast`, on save only) has nothing to apply to. Out of scope for the PWA, or missing?

### Low
- **[A] QUESTION: chips don't press, and hover is instant.** `news.module.css:45-58, 68-70`. The build follows §9 ("instant colour swap"). §3 doesn't say whether chips count as buttons.
- **[A] QUESTION: hovered chip looks like a selected one.** `news.module.css:72-77`: a hovered chip and a selected chip share `--jade-faint`. `aria-pressed` carries the state.
- **[B] NOTE: stale comment.** `ArticleMeta.tsx:52` says "11px text", but `.pill` is 12 px.
- **[C] QUESTION (prototype only):**
  - Card title: 14.5/700 lh 1.4 (`:146-148`) vs 14/700 lh 1.35.
  - Category pill: 12/700 sentence case (`:230-231`) vs 10.5/700 uppercase.
  - Meta: 12 `--ink2` sans (`:278-279`) vs 11 `--ink3` mono. The build's colour is the AA-safe one.
  - Card hero: 16:9 (`:190`) vs a fixed 140 px.
  - The article reader has no reference at all: title 24/800, body 15/1.7.
- **[D] Off-grid spacing, all in `news.module.css`:**
  - 14 px: `:48, 142` match the prototype; `:403, 451` have no spec value.
  - 12 px: `:337, 383, 527`
  - 20 px: `:15, 296, 512`
  - 6 px: `:221, 277, 335, 62`
  - 10 and 3 px: `:229, 423`
  - 36 px: `:336`
  - 13 px: `:238-239`
  - Skeleton sizes

---

## Cross-cutting

These recur across pages. Fixing each one once in a shared rule would close many findings.

1. **[C] QUESTION, medium: Arabic text gets letter-spacing.**
   - Where:
     - `attendance.module.css:55, 558, 635, 715`
     - `schedule.module.css:208, 330, 396, 645`
     - `dashboard.module.css:98`
     - `grades.module.css:210, 394, 567, 872`
   - These labels carry translated text and get 0.03–0.08em of positive tracking. Nothing in `pwa/app/globals.css` resets it for `html[lang="ar"]`, so Arabic letters are pulled apart where they should join.
   - The mobile spec's rule ("Label… AR uses Caption", which has no tracking) suggests the intent. No PWA spec states it. Headings also carry -0.3px of tracking in Arabic.
   - Raised by the attendance checker and confirmed across pages by the orchestrator.
2. **[A] `linear` easing is used outside the two easing tokens.**
   - Where: `attendance.module.css:741`, `schedule.module.css:434, 744`, `grades.module.css:182, 444, 728, 984`.
   - Most are shimmer loops or exits, where §2 and §5 say "no easing", so they may be correct. Only the attendance drop zone is a clear break.
   - Worth one decision: add a `--ease-linear` token, or document the exception.
3. **[A] 4 px focus offsets where §3 says 2 px:** `grades.module.css:38-42`, `attendance.module.css:371-375`.
4. **[C] QUESTION: 24/800 page headings.** All five non-dashboard pages use 24/800 headings, where the prototype's page title is 19/800 and Dashboard Spec's greeting is 28 (24 on small screens). They are consistent with each other, so this is most likely an undocumented decision. Record it in the spec?
5. **[C] QUESTION: half-pixel font sizes.** 9.5, 11.5, 12.5 and 13.5 px appear on every page. The dashboard spec states several of these, so they are not wrong. There is just no scale to check them against.
6. **[D] 44 px controls.** These are the touch-target minimum. No PWA spec states it; the prototype draws 34 px controls. Treated as intended.
7. **[B] The prototype's `--warning` text is not repeated anywhere.** The pending pills use `--info` or neutral ink, never `--warning` text. That is correct under the token rules, and listed here only so it isn't "fixed" back to the prototype.

## Questions for you, in priority order
1. **Bell and GPA hero.** The bell (Dashboard Spec §6, `bell-states.html`) and the jade GPA hero card are fully specified and not built. Are they planned, or should the spec be marked as not shipping?
2. **Justification form.** It lacks hover/press on submit, hover on the drop zone, and the in-field error state. Fix as one ticket?
3. **Arabic tracking.** Reset `letter-spacing` under `html[lang="ar"]` for the labels listed in cross-cutting item 1?
4. **Schedule print sheet.** Round 2 makes it current, but the PWA has none. Planned?
5. **Profile omissions.** "Vider le cache" was removed on purpose and there is no change-password block. Add both to `.claude/design-known-divergences.md`, or build them?
6. **Sidebar logo.** Replace the mortarboard `logo.svg` with the U mark, per the 2026-10-27 brand decision?
7. **Prototype-only pages.** Schedule, grades, attendance (outside §4), news and profile have no current screen spec, so their type and spacing questions can't be settled. Should Design specify them, or should the built values be accepted as the spec?
