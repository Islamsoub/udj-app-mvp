# PWA: justification form states, and no letter-spacing on Arabic text

## Goal
The justification upload form on the attendance page has every state that Foundations §3 and §5 define:
- the submit button hovers to `--jade-hover` and presses to `scale(0.97)`;
- the drop zone has a hover state, and its transition uses one of §2's two easings instead of `linear`;
- a file error marks the drop zone itself (`--danger` border, `--danger-bg` fill), with an inline message that slides down beneath it;
- the note input has an error state of its own;
- a failure that is not about either field stays out of both fields.

Separately, no translated label or heading under `pwa/` applies letter-spacing when `<html lang="ar">`, so Arabic letters join. Text that is always Latin (figures in `.num`, course-type codes, the language code, the student ID, the brand wordmark) keeps its tracking in both languages.

## Product
pwa

## Source
- `.claude/reports/2026-11-09-pwa-design-audit.md`: "1. Attendance" (High and the Medium `linear` finding) and "Cross-cutting" item 1.
- Foundations: `design/spec-pack/specs/pwa/foundations/Unipocket PWA - Design & Interaction Spec.html`, §2 (motion tokens), §3 (hover, press, cursor), §5 (Buttons, Inputs & forms, File drop zone).

## Verified facts (planner, 2026-11-11, against `origin/develop` at 5e10463)
**The audit's line numbers for `attendance.module.css` are stale** (milestone 7 of the attendance-bands mission rewrote it). The `dashboard.module.css` line the audit cites (`:98`) is still correct. Every line below is on `origin/develop` at 5e10463. A builder cuts from current `develop` and re-checks them before editing.

### The justification form
In `pwa/components/attendance/attendance.module.css`:

| Rule | Lines now | Audit said | State today |
|---|---|---|---|
| `.dropZone` | 783-795 | 731-748 | `transition: … var(--dur-instant) linear` at 793-794. No `:hover`. |
| `.dropZoneLive` | 798-800 | | `cursor: pointer` |
| `.dropZoneDragging` | 804-807 | | `--jade` border, `--jade-faint` fill |
| `.dropZoneBusy` | 809-812 | | opacity 0.5, `not-allowed` |
| `.disabledReason` | 867-876 | 815-824 | dead CSS (audit, Low). **Not in scope.** |
| `.submit` | 878-895 | 826-848 | no transition, no `:hover`, no `:active` |
| `.submit:disabled` | 897-900 | | correct |
| `.noteInput` (+ `:focus-visible`, `:disabled`) | 904-931 | 852-879 | focus state correct, no error state |
| `.formError` | 938-949 | 886-895 | a separate bordered box |
| focus ring block | 1178-1185 | | includes `.dropZone:has(.fileInput:focus-visible)` and `.submit` |
| reduced-motion block | 1202-1243 | | collapses `.dropZone` and `.noteInput` transitions, removes `:active` transforms on other controls |

In `pwa/components/attendance/JustificationForm.tsx`:
- the drop zone is at 230-279;
- the error box is at 292-296 (the audit said 329-333);
- the note label and input are at 298-308;
- the submit button is at 324-337;
- `errorKey` is at 372-423.

How the form behaves today:
- **One `error` state holds two kinds of error.** It holds both file problems (`type`, `too_large`, `empty`, `multiple`) and request failures (`network`, `deadline`, `not_absent`, `conflict`, `rate_limited`, `storage`, `unavailable`, `not_found`, `rejected`), and all of them render in the same box under the drop zone. Painting the drop zone red for "every error" would mark the file wrong after a network failure. **The error has to be split by what it is about.**
- **The note can only fail on the server.** The input has `maxLength={80}` (NOTE_MAX), which equals the backend's limit (`backend/src/routes/student.ts` ~1028-1037). The backend answers 400 with `Note must be 80 characters or fewer` or `Invalid note`. Today `errorKey` matches neither sentence, so the student gets `attendance.upload.error.rejected`: "Le serveur a refusé ce justificatif. Réessayez avec un autre fichier." That tells them to change the *file* when the *note* was refused.
- **The note input has no accessible name.** Its label is a `<p>`, not linked to the input, and its hint is not linked either. An error state on it would be announced against nothing.
- **Precedents to copy, not reinvent**, all in `pwa/components/login/login.module.css`:
  - the submit's hover and press: `.submit`, `:hover:not(:disabled)`, `:active:not(:disabled)`, ~625-651;
  - the field error: `.inputError`, ~259-262;
  - the error that slides down: the `errorCardIn` max-height keyframes, ~347-375. They do not fill forwards, so long Arabic text cannot clip.
- **Contrast.** `--on-jade` on `--jade-hover` is 5.8:1 in light (comment in globals.css ~178-180). In dark, `#0F1713` on `#3FCB9A` is well above AA.
- **`--danger-ink` is documented as "Status TEXT on its own tint — chips only"** (globals.css ~236-240). `--danger` on its own is under AA for text. See milestone 2.

### Letter-spacing
**Positive tracking.** The audit lists 13 rules in the four modules, and that count is correct. The user's "twelve" is most likely the 12 that carry translated text: one of the 13, `.blockType`, never does.

| # | File | Rule (lines now) | `letter-spacing` line | Renders | Reset in Arabic? |
|---|---|---|---|---|---|
| 1 | attendance | `.heroLabel` 51-58 | 55 | `t('attendance.hero.label')` | yes |
| 2 | attendance | `.panelDateLabel` 607-613 | 610 (audit: 558) | `t('attendance.panel.session')` | yes |
| 3 | attendance | `.noteLabel` 683-690 | 687 (audit: 635) | panel note labels (translated) | yes |
| 4 | attendance | `.formLabel` 763-770 | 767 (audit: 715) | `file_label`, `note_label` | yes |
| 5 | dashboard | `.cardTitle` 94-101 | 98 | every card title (`Card.tsx:64`) | yes |
| 6 | grades | `.heroLabel` 206-213 | 210 | `t('grades.hero.label')` | yes |
| 7 | grades | `.sortButton` 381-399 | 394 | column labels | yes |
| 8 | grades | `.cardLabel` 563-570 | 567 | column labels (phone cards) | yes |
| 9 | grades | `.calcLabel` 868-875 | 872 | calculator labels | yes |
| 10 | schedule | `.dayName` 205-211 | 208 | `t(DAY_SHORT_KEYS[day])` | yes |
| 11 | schedule | `.detailLabel` 638-648 | 645 | detail row labels | yes |
| 12 | schedule | `.typePill` 387-398 | 396 | **mixed**: `CourseDetail.tsx:41` renders `t(typeLabelKey(type))`; `DayList.tsx:73` renders the raw code `CM`/`TD`/`TP`/`EXAM` | **only inside `.detailType`** (621-623) |
| 13 | schedule | `.blockType` 327-331 | 330 | raw code `{type}` (`WeekGrid.tsx:132-134`) | **no**: always Latin |

**Positive tracking outside the four modules: always Latin, keep.**
- `login.module.css` `.langCode` (192): "FR" / "AR", and its own comment says so.
- `login.module.css` `.inputId` (249): the student ID, in mono.

**Negative tracking on headings.** The audit does not list these. Every one under `pwa/`:

| File | Rule (lines now) | `letter-spacing` line | Renders | Reset in Arabic? |
|---|---|---|---|---|
| attendance | `.heading` 16-22 | 20 | `t('attendance.heading')` | yes |
| dashboard | `.heading` 11-17 | 15 | `t('dashboard.heading')` | yes |
| grades | `.heading` 16-22 | 20 | `t('grades.heading')` | yes |
| schedule | `.heading` 18-24 | 22 | `t('schedule.heading')` | yes |
| news | `.heading` 14-20 | 18 | `t('news.heading')` (two call sites) | yes |
| news | `.readerTitle` 391-398 | 396 | `head.titleAr` in Arabic (`Reader.tsx:108-110`) | yes |
| profile | `.heading` 13-19 | 17 | `t('profile.heading')` | yes |
| shell | `.title` 368-378 | 373 | topbar page title (`PageTitle.tsx`) | yes |
| shell | `.pageHeading` 947-953 | 951 | `RoutePlaceholder.tsx`, translated | yes |
| login | `.brand` 121-127 | 126 | `t('app.university')`, which is "جامعة جيبوتي" in ar (LoginCard, SessionWaiting) | yes |
| `pwa/public/offline.html` | inline `<style>` `.brand` | 102 | bilingual spans, Arabic "جامعة جيبوتي" | yes |
| shell | `.brandName` | 200 | `t('app.name')`, which is "Unipocket" in **both** locales | **no**: the Latin wordmark |

**Negative tracking on figures: always Latin, keep.** Each of these carries `.num`, or contains only `.num` spans:
- attendance: `.heroNumber` 78, `.subjectValue` 295;
- dashboard: `.heroNumber` 377, `.unreadCount` 546;
- grades: `.heroNumber` 226, `.calcCurrentValue` 947, `.calcResultValue` 1000.

### Selector facts
- **`html[lang="ar"]` is already in use.** `pwa/app/globals.css:377` has `html[lang="ar"] body` for the Arabic face, and `pwa/public/offline.html:88,91` use the same form. `lang` is set before first paint by `app/layout.tsx:52,71` and kept in step by `lib/i18n.tsx:171`.
- **Anchor on `html`, not a bare `[lang="ar"]`.** `components/login/LanguageChip.tsx:32` sets `lang` on a descendant element. `html[lang="ar"] .x` matches the page's language only, as the existing rules do.
- **Specificity.** `html[lang="ar"] .heroLabel` is (0,2,1) against `.heroLabel` (0,1,0), so it wins regardless of source order with no `!important`.
- **CSS Modules.** It is a "pure" selector because it contains a local class, and element and attribute selectors are not hashed, so no `:global()` is needed. `npm run build` is the proof.

## Decision: where the Arabic reset lives — in each module, beside the rule it overrides
Not in `globals.css`. Three reasons:
1. **globals.css cannot name the rules.** CSS Modules hash `.heroLabel` and the rest. From globals.css the only options are a universal `html[lang="ar"] *` or a new utility class threaded through every TSX file.
2. **A universal reset is wrong.** `html[lang="ar"] *` is (0,1,1). It beats every module class and would strip the tracking that must stay: the `.heroNumber` figures, `.blockType`, the DayList code pill, `.langCode`, `.inputId` and `.brandName`. Carving those back out from globals.css means naming hashed classes, which is impossible, or reaching for `!important`.
3. **Beside the rule is where the next author looks.** Someone who adds or changes tracking on a label sees the Arabic override directly under it. In globals.css it would be invisible from the module.

globals.css gets a **comment only** (milestone 3), in its existing "Bilingual FR / AR" block, beside `html[lang="ar"] body`. The comment states the convention and the reason below. That block is where a reader of "There is no RTL stylesheet" will look.

**The value is `letter-spacing: normal`.** This means no tracking, not a different amount. The mobile spec's Arabic type scale (CLAUDE.md, Typography) gives no letter-spacing for any AR style, and "Label… AR uses Caption", which has none.

### Why `[lang="ar"]` is not a breach of the no-`[dir="rtl"]` rule — read this before reverting anything
CLAUDE.md's PWA rule says there is no `[dir="rtl"]` selector and none should be added. That rule is about **direction**: mirroring is the job of logical properties, and a direction selector duplicates layout. Letter-spacing is a property of the **language's script**, not of the writing direction. Arabic letters join, and tracking pulls them apart, whichever way the line runs. So the selector is keyed on `lang`, the same way `html[lang="ar"] body` already swaps the font. **This mission adds `html[lang="ar"]` selectors on purpose. They are not `[dir="rtl"]` selectors and must not be removed as if they were.**

Every builder puts this comment, verbatim, beside the **first** `html[lang="ar"]` reset in each file it touches, and in the globals.css block:

```css
/* Keyed on language, not direction. CLAUDE.md forbids [dir="rtl"] selectors
   because mirroring belongs to logical properties; letter-spacing belongs to
   the script. Arabic letters join, and tracking pulls them apart in either
   direction. This is not a breach of that rule, so do not remove it as one. */
```

Later resets in the same file carry a one-line pointer instead: `/* Arabic: no tracking — see the note at .<first rule>. */`

## Milestones
Each milestone is one branch from `develop` and one PR.

**Dependencies:**
- **1 → 2.** Milestone 2 is cut only after milestone 1 has merged, because its drop-zone error state has to sit in the precedence order with the hover that milestone 1 adds.
- **3 and 4 are independent** of each other and of 1 and 2. They can be cut from `develop` in parallel with milestone 1.
- **Shared files.** 3 and 4 touch the same four module files, and 3 touches the same attendance file as 1 and 2. Each reset is placed **immediately after the rule it overrides**, so the edits land in different places in the file. If a rebase still conflicts, resolve it by keeping both sides.

**Checks for every milestone.** `pwa/` has no CI job, so in `pwa/` the builder runs, by hand:
- `npm run typecheck`
- `npm run build`

Both outputs are pasted into PROGRESS.md.

**Rendering.** Set `NEXT_PUBLIC_API_URL=https://udj-api.onrender.com` in a gitignored `pwa/.env.local`. Log in with the test account the orchestrator provides, driven by Playwright. No credential is written to any file in the repo, PROGRESS.md included.
- Screenshots go in `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/screenshots/mN/`.
- **Language.** To render Arabic, set the `unipocket_lang=ar` cookie, or use the in-app switch.
- **Theme.** Use the app's own theme control.

**Rules for milestones 1 and 2. Never upload a real justification.**
- **Stub the upload.** Before the form is opened, register a `page.route` for `**/api/backend/student/attendance/*/justification` that fulfils the request and never continues it to the server. A real upload changes the test student's live record, and only an admin can undo it.
- **Stub the record if needed.** If the test account has no absence where `canSubmitJustification` is true, also stub `GET **/api/backend/student/attendance` with a fixture that satisfies `lib/attendance-contract.ts`, including `band` and `absencesLeft`. Say in PROGRESS.md which of the two was used.

### 1. Submit button and drop zone: hover, press, easing
- Goal: the submit button has §5's hover and press states, and the drop zone has §3's hover with a §2 easing. All of it is in CSS.
- Paths:
  - `pwa/components/attendance/attendance.module.css`: only `.dropZone`, the new hover rule, `.dropZoneDragging`, `.submit` and its new `:hover` / `:active` rules, and the reduced-motion block
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/PROGRESS.md`
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/screenshots/m1/`
- Notes:
  - **`.submit`.** Add `transition: background var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out)`. Add `.submit:hover:not(:disabled) { background: var(--jade-hover); }` and `.submit:active:not(:disabled) { transform: scale(0.97); }`. This mirrors `login.module.css` ~640-651. The `:not(:disabled)` guards are what keep §5's "hover/press disabled" true, so `.submit:disabled` is unchanged.
  - **The `linear` easing (audit, Medium).** It is in scope: it is the same declaration this milestone rewrites for the hover. Replace `linear` with `var(--ease-out)` on both properties. Reduced motion keeps its own `linear` override. That one is §2's "no easing curve", and the module already writes it that way.
  - **Drop-zone hover.** `.dropZoneLive:not(.dropZoneBusy):hover`: `--jade` border, `--jade-faint` fill. These are the prototype's hover and the same values as `.dropZoneDragging`: "this zone takes a file" is one signal.
    - Base transition duration becomes `--dur-fast` (§3 hover).
    - `.dropZoneDragging` gets `transition-duration: var(--dur-instant)`, because §5 says dragover happens over `--dur-instant`. A transition takes its duration from the state being entered, so the two coexist on one element.
    - While uploading (`.dropZoneBusy`) there is no hover.
  - **Reduced motion.** Add `.submit` to the list that collapses to `--dur-instant` linear, and `.submit:active` to the list whose transform is `none`. That is the module's existing convention for `.retryButton`.
  - No TSX change. Nothing else in the file moves.
- Done when:
  - The diff is confined to the rules listed under Paths.
  - `grep -n "linear" attendance.module.css` shows no `linear` outside the reduced-motion block and the shimmer.
  - typecheck and build both pass, and their output is in PROGRESS.md.
  - Screenshots, FR and AR, light and dark, with a valid file selected:
    - the submit button at rest and hovered;
    - the drop zone at rest and hovered;
    - the submit button with no file selected, hovered. It must look identical to the same button at rest, with no hover colour.

### 2. Field errors: on the drop zone, on the note, and the rest kept apart
- Goal:
  - a file problem marks the drop zone itself, with an inline message sliding down beneath it;
  - a refused note marks the note input;
  - any other failure appears once, above the submit button, and marks neither field.
- Paths:
  - `pwa/components/attendance/JustificationForm.tsx`
  - `pwa/components/attendance/attendance.module.css`: only the `.dropZone*` family, `.noteInput*`, `.formError`, new field-error rules and keyframes, and the reduced-motion block
  - `pwa/app/globals.css`: only the `--danger-ink` comment, in both theme blocks, if the measurement below calls for it
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/PROGRESS.md`
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/screenshots/m2/`
- Notes:
  - **Classify, don't guess.** Replace the single `error` state with three: `fileError`, `noteError` and `formError`.
    - **File errors:** `type`, `too_large`, `empty`, `multiple`, from the client. From the server: a 400 that `errorKey` already maps to `type` or `too_large`, and the 413.
    - **Note error:** a 400 whose message matches `/note/i`. Test it first in the `case 400` branch: neither backend note sentence contains "type", "large" or "size", but put it first anyway so the order is explicit. Add a comment beside the existing "STILL BY SENTENCE" note that names the two backend sentences.
    - **Form errors:** everything else, **including `rejected`**. `rejected` is also the `default:` for statuses nobody has mapped (403, 422 and so on). Painting the file red for an unknown cause would claim to know what is wrong.
    - A clean way to do this: `errorKey` returns `{ field: 'file' | 'note' | 'form', key }`.
  - **When each error clears.**
    - `fileError`: when a new file is accepted.
    - `noteError`: on the note's `onChange`.
    - `formError`: when a new file is accepted.
    - All three: on submit.
    - `accept()` keeps refusing a bad file exactly as now (`setFile(null)`).
  - **Drop zone in error.**
    - Add a `.dropZoneError` class: `--danger` border and `--danger-bg` fill, as login `.inputError` does.
    - The hidden input gets `aria-invalid` while `fileError` is set. `aria-describedby` keeps pointing at the hint and the error.
    - **Precedence**, highest first: busy, then dragging, then error, then hover, then rest. Dragging beats error because the student is dropping the replacement. Hover does not repaint an errored zone.
  - **The inline file message.**
    - It sits **directly beneath the drop zone**, above the formats hint, with `role="alert"`.
    - It is plain text, not a box: `--danger-ink`, 12.5px, matching `.formHint`.
    - It enters on a keyframe: `max-height` 0 → a ceiling larger than it can ever be, plus `opacity` 0 → 1, over `--dur-fast` with `--ease-out`, and **no forwards fill**. This is login's `errorCardIn` technique; cite it in the comment.
    - Under reduced motion it runs over `--dur-instant` linear, as `.confirmChipEntering` does.
  - **The note field.**
    - Link the note label to the input. Give the label `<p>` an id and set `aria-labelledby` on the input, as the file label already has `${inputId}-label`.
    - Link the hint through `aria-describedby`.
    - In error: `aria-invalid`, and `.noteInputError` with the same `--danger` border and `--danger-bg` fill. `:focus-visible` keeps its jade ring.
    - The hint is **replaced** by an inline message of the same kind as the file one, with the same animation, and `aria-describedby` follows it.
    - The message text is Flag 1.
  - **Form-level errors** keep a box, the existing `.formError`, moved to sit **immediately above the submit button**, so that a network or deadline failure reads as being about sending, not about the file. Keep `role="alert"`. Its `Interpolated` call is unchanged.
  - **Contrast.** The inline messages put `--danger-ink` on the panel's surface, not on its own tint. That goes beyond the token's "chips only" comment.
    - Measure `--danger-ink` on the panel background in both themes (WCAG 2.x).
    - If both are at or above 4.5:1, update the token comment in both theme blocks of globals.css to name this use and the two ratios. CLAUDE.md requires the measured ratio to be in the comment.
    - If either is under 4.5:1, **stop and flag it.** Do not pick another colour.
  - No change to `upload.ts`, locales, or any other file.
- Done when:
  - Each item in the classification list is visible in the diff of `errorKey` and its callers. Reading it, a reviewer can say which field every one of the 16 error keys lands on.
  - A stubbed `400 {"error":"Network Error"}`-style failure (use a 502) shows the box above the submit button, with neither field red.
  - A stubbed `400 {"error":"Note must be 80 characters or fewer"}` marks the note, not the drop zone, and no longer shows the "autre fichier" sentence.
  - A wrong-type file, picked through `setInputFiles`, so no network is involved, marks the drop zone.
  - Typing in the note clears the note error. Choosing a valid file clears the file error.
  - typecheck and build both pass, and their output is in PROGRESS.md. The `--danger-ink` ratios are recorded there.
  - Screenshots, FR and AR, light and dark:
    - file error;
    - note error;
    - form error;
    - file error with the zone hovered, which must still read as the error;
    - a form error with a long Arabic message, which must not clip.

### 3. Arabic: no tracking on translated labels
- Goal: in Arabic, the 12 translated label rules in the table have `letter-spacing: normal`. In French they are unchanged. `.blockType` and the DayList `.typePill` keep their tracking in both languages.
- Paths:
  - `pwa/components/attendance/attendance.module.css`: new rules only, each directly after `.heroLabel`, `.panelDateLabel`, `.noteLabel` or `.formLabel`
  - `pwa/components/dashboard/dashboard.module.css`: a new rule directly after `.cardTitle`
  - `pwa/components/grades/grades.module.css`: new rules directly after `.heroLabel`, `.sortButton`, `.cardLabel` and `.calcLabel`
  - `pwa/components/schedule/schedule.module.css`: new rules directly after `.dayName` and `.detailLabel`, and `html[lang="ar"] .detailType .typePill` directly after `.typePill`
  - `pwa/app/globals.css`: comment only, in the "Bilingual FR / AR" block
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/PROGRESS.md`
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/screenshots/m3/`
- Notes:
  - Each reset is `html[lang="ar"] .<rule> { letter-spacing: normal; }` and nothing else. The original declarations are not edited.
  - Comment each one as the Decision section says: the full verbatim sentence on the first reset in each file, the pointer on the others.
  - The globals.css comment states the convention: Arabic letter-spacing resets live in each module, beside the rule they override, under `html[lang="ar"]`, for the three reasons in the Decision section, briefly. It also carries the verbatim sentence. It goes beside `html[lang="ar"] body`.
  - `.blockType` is untouched. Its comment-free state is fine: nothing changes there.
- Done when:
  - The diff adds 12 reset rules (11 plain and 1 scoped to `.detailType .typePill`) plus comments, and changes no existing line.
  - `git diff` shows no `dir=` selector.
  - **Computed check.** Playwright reads `getComputedStyle(el).letterSpacing` in FR and AR for each class it can reach on the test account, matching hashed names with `[class*="heroLabel"]` and similar.
    - AR: `normal` for the 12.
    - AR: the original value for `.blockType` and the DayList `.typePill`.
    - FR: the original value for all 13.
    - The table goes into PROGRESS.md.
    - Any class that does not render for the test account (for example `.noteLabel`, which needs a record with a note) is checked instead by finding its rule in `.next/static/css` after the build, and is marked that way.
  - typecheck and build both pass, and their output is in PROGRESS.md.
  - Screenshots in AR of:
    - the attendance hero and the justification panel;
    - a dashboard card title;
    - the grades hero and the table header;
    - the schedule week header and the course detail.

### 4. Arabic: no negative tracking on translated headings
- Goal: in Arabic, the 11 translated heading rules in the heading table have `letter-spacing: normal`. In French they are unchanged. `.brandName` and every figure class keep their tracking.
- Paths:
  - `pwa/components/attendance/attendance.module.css`: a new rule directly after `.heading`
  - `pwa/components/dashboard/dashboard.module.css`: a new rule directly after `.heading`
  - `pwa/components/grades/grades.module.css`: a new rule directly after `.heading`
  - `pwa/components/schedule/schedule.module.css`: a new rule directly after `.heading`
  - `pwa/components/news/news.module.css`: new rules directly after `.heading` and `.readerTitle`
  - `pwa/components/profile/profile.module.css`: a new rule directly after `.heading`
  - `pwa/components/shell/shell.module.css`: new rules directly after `.title` and `.pageHeading`
  - `pwa/components/login/login.module.css`: a new rule directly after `.brand`
  - `pwa/public/offline.html`: one rule added to its inline `<style>`, next to its existing `html[lang="ar"]` rules
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/PROGRESS.md`
  - `.claude/missions/2026-11-11-pwa-justification-form-arabic-tracking/screenshots/m4/`
- Notes:
  - **Same form and the same comments as milestone 3.**
  - **`offline.html`.** It is a static file outside the CSS Modules pipeline. Its rule is `html[lang="ar"] .brand { letter-spacing: normal; }`. Its comment can be one line, because the full sentence is in the module files.
  - **Service worker.** `public/sw.js` derives its cache `VERSION` from the build id, so a deploy refreshes the cached `offline.html` without a `CACHE_SCHEMA` bump. Confirm that by reading sw.js ~62-106, and say so in PROGRESS.md. Do not touch sw.js.
  - **Unchanged:** `.brandName`, `.heroNumber`, `.subjectValue`, `.unreadCount`, `.calcCurrentValue`, `.calcResultValue`, `.langCode` and `.inputId`.
- Done when:
  - The diff adds 11 reset rules plus comments, and changes no existing line.
  - `git diff` shows no `dir=` selector.
  - **Computed check**, as in milestone 3:
    - AR: `normal` for each heading the test account can reach.
    - AR and FR: the original value for `.brandName` and `.heroNumber`.
    - The table goes into PROGRESS.md.
    - For `offline.html`, open `/offline.html` directly with `<html lang="ar">` set by Playwright, and read `.brand`.
  - typecheck and build both pass, and their output is in PROGRESS.md.
  - Screenshots in AR of:
    - the attendance, dashboard, grades, schedule, news and profile headings;
    - a news article title;
    - the topbar title at a width where it shows;
    - the login brand;
    - `offline.html`.

## Flags
1. **Copy: the note error message (milestone 2).** No string exists for "the note was refused". The milestone does **not** add one.
   - **What milestone 2 does instead:** it shows the existing `attendance.panel.none.note_hint` ("80 caractères maximum." / its Arabic) as the error message, in place of the hint. That text states exactly the rule the server enforced, and the only reachable note failure is that rule. ("Invalid note" means a non-string body, which this client never sends.)
   - **Question for Design:** keep that, or supply a dedicated `attendance.upload.error.note` in FR and AR? This does not block milestone 2. The reviewer should not treat the text as final.
2. **CLAUDE.md wording. A human edit, not a milestone.** The PWA "i18n and RTL" section says "There is no [dir="rtl"] selector anywhere, and none should be added."
   - **Proposed addition after it:** "Language selectors are different: `html[lang="ar"]` is used for properties of the script rather than the direction — the Arabic font face, and resetting letter-spacing, which breaks Arabic joining. Keep those beside the rule they override."
   - No agent may edit CLAUDE.md.
3. **Decided, recorded so a reviewer can disagree.** These were not handed to the builder:
   - `rejected` counts as a form error, not a file error;
   - the form error box moves above the submit button;
   - drop-zone hover uses the same values as dragover;
   - `.brandName` keeps its tracking, because "Unipocket" is Latin in both locales. If the Arabic `app.name` is ever translated, `.brandName` joins the heading list;
   - the DayList `.typePill` keeps its tracking, because it shows the Latin code.
4. **`--danger-ink` beyond chips (milestone 2).** If the measurement fails in either theme, milestone 2 stops. Choosing a different error-text colour is then a Design decision.
5. **Same elements, not in scope.** These are other audit findings on this form, left alone so the PRs stay reviewable:
   - `.disabledReason` is dead CSS (867-876);
   - the drop zone is 1px / `--r-md` where the prototype has 1.5px / `--r-lg` (a prototype-only question);
   - `.absencesPanel:focus-visible` has a 4px offset.
6. **Test data.** It is not known whether the test student has an absence that can still be justified. Milestones 1 and 2 stub the attendance response if not. Every milestone must state in PROGRESS.md what was real and what was stubbed.

## Schema
No. No milestone touches `backend/prisma/schema.prisma`, nor anything under `backend/`.
