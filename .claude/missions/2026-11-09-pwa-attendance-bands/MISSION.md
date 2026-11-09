# PWA attendance: show the server's three bands, not a local two-state guess

## Goal
The PWA shows the attendance state the server computed: `band` (`ok` | `near` | `below`) and `absencesLeft`, on the overall figure and on every subject of `GET /student/attendance`.

There is no `percentage < threshold` verdict anywhere under `pwa/`. `attendanceThreshold` is still displayed (the "Seuil" sentence, the tick on each bar), but it is never compared against.

A response without the band never reaches a component and never overwrites the offline copy. This holds for both consumers: the attendance page and the dashboard card.

The dashboard card's line under the ring follows `design/spec-pack/ROUND2-CLOSEOUT.md` §3, in French and Arabic, with all six Arabic plural categories. The i18n layer can do this with no new dependency.

## Product
pwa

## Revision, 2026-11-09 (after ROUND2-CLOSEOUT.md third pass)
- **Milestones 1–5 are merged** to `develop` (last at 7a8ba20). They are kept below as the record.
- **The close-out answers Flags 1, 2, 3 and 5** (decisions A1–A4, §3–§5). Milestones 6 and 7 are no longer blocked. Each one now carries its own copy, so it touches its own locale subtree.
- **Milestones 6 and 7 are independent.** Both read only merged code (milestones 4 and 5), so both are cut from current `develop`; neither waits for the other. This replaces the "cut after the previous one has merged" rule for these two. The rule still holds wherever a milestone reads another's unmerged code.
- **Flag 4 stays open but does not block.** The close-out does not address it.

## Verified facts (planner, 2026-11-09)
Read these before building. They correct or extend the task as briefed.

- **Backend.** The response is built in `backend/src/routes/student.ts` (~lines 480–770). The contract is `backend/src/types/studentAttendance.ts`, and the rules are `attendanceBand` and `attendanceRecovery` in `backend/src/utils/attendance.ts`.
  - `band` is never null. `absencesLeft` is `number | null`: per subject it is null exactly when the semester has ended.
  - With no current semester, `overall` is null and `subjects` is `[]`, so there is no band to read. That is by design.
  - `below` implies `percentage < T`. `near` covers both "under T but recoverable" and "in [T, T+M)". After term end, `near` means T ≤ rate < T+M.
- **Who §3 is for.** It is titled "Attendance card: the line under the ring". Its preview is `specs/pwa/dashboard/dashboard.html?att=ok|near|below|ended`. That makes it the **dashboard** card, `pwa/components/dashboard/AttendanceCard.tsx`, a third consumer the brief did not name.
  - The card shows no Seuil label and no band today.
  - It never runs the contract check.
  - Design gives **no** band copy for the attendance page itself (Hero, SubjectBreakdown).
- **Validation order.** `apiFetch` writes the response to IndexedDB *before* the caller's `checkAttendanceContract` runs. A response that fails the contract therefore still overwrites the last good offline copy.
- **i18n.** `lib/i18n.tsx` has no plural support: `t()` is plain `{{name}}` interpolation. `lib/i18n-types.ts` forces fr.json and ar.json to have identical shapes in both directions, so Arabic's six categories force the same six keys in French.
- **French plurals.** `Intl.PluralRules('fr').select(0)` is `"one"`. French cannot pick Design's zero row through Intl.
- **Interpolated.** `components/dashboard/Interpolated.tsx` wraps every value in `.num`, the Latin face. An Arabic subject name passed through it renders in the wrong font. §3 wants `{subject}` in `<bdi>`. `lib/bidi.tsx` `fmtPhrase` already isolates each value in a `<bdi>` without forcing a direction.
- **Native reference.** Use the native app for semantics, not copy. Its relevant files are `components/attendance/verdict.ts`, `services/attendanceContract.ts` and `services/db.ts`.
  - It validates before writing to the cache, and throws when band is missing.
  - Its subject sentences use older Round 2 copy and are marked PROVISIONAL.
  - Its comment says the PWA's `model.ts` has the same no-fallback rule for band. That is not true yet.

## Decision: payloads without `band`
Apply the no-local-fallback rule that `model.ts` already applies to `attendanceThreshold`. A missing or invalid `band` / `absencesLeft` is a contract failure:
- log the missing fields by name;
- throw;
- show the screen's or card's existing error state.

The PWA never derives a band from `percentage` and `threshold`. Showing a neutral state with no band is also rejected: the PWA has no SQLite rows from before band existed, so the native app's reason for it does not apply here.

How each source is handled:
- **Old cached payloads.** Bump `SCHEMA_VERSION` from 1 to 2. Every stored database is then emptied on open, so no cached attendance from before band can be read back.
- **Old or rolled-back server.** The check runs *inside* `apiFetch`, before `rememberResponse`. A bad response is never cached and the last good copy survives.
- **Cached payload that fails the check.** Treated as "no cache": `apiFetch` rethrows the original network error. This is defence in depth.

Cost, accepted: the version bump drops the other three cached endpoints too. A student who is offline right after the deploy has no offline copy until their next online load.

## Milestones
Each milestone is one feature branch cut from `develop`, one PR each. A milestone that reads another's code is cut only after that one has merged. 6 and 7 read only merged code; see the revision note.

`pwa/` has no CI job. Every milestone runs `npm run typecheck` and `npm run build` inside `pwa/` by hand and pastes both outputs into PROGRESS.md.

### 1. Types, contract and cache version
- Goal: the PWA's types carry `band` / `absencesLeft`, the contract check refuses a response without them, and the offline cache is at version 2.
- Paths:
  - `pwa/lib/api-types.ts`
  - `pwa/lib/attendance-contract.ts` (new)
  - `pwa/lib/offline-cache.ts`: only the `SCHEMA_VERSION` line and its comment
  - `pwa/components/attendance/model.ts`
  - `pwa/components/attendance/Attendance.tsx`
- Notes:
  - **Types.** Add `export type AttendanceBand = 'ok' | 'near' | 'below'`. Add `band: AttendanceBand` and `absencesLeft: number | null` to `AttendanceOverall` and to `AttendanceSubject`. Each field gets a doc comment that says what the backend contract says: null is not 0, render nothing for null.
  - **Contract.** Move `checkAttendanceContract` out of `model.ts` into `lib/attendance-contract.ts`, because `lib/` must not import from `components/`. Extend it the way `services/attendanceContract.ts` does natively:
    - `overall.band` and `overall.absencesLeft` are checked only when `overall !== null`;
    - every `subjects[].band` is one of the three values;
    - every `subjects[].absencesLeft` is null or a non-negative integer.

    Keep the existing threshold, deadline and `canSubmitJustification` checks and the "NO LOCAL FALLBACK" comment.
  - `Attendance.tsx` imports the check from its new home. No other change.
  - **Version comment.** The `SCHEMA_VERSION` comment names the reason: the attendance payload gained band / absencesLeft.
- Done when:
  - The `api-types.ts` diff is only the band type and the two fields on two interfaces.
  - A response missing `band` on any subject fails the check and names `subjects[].band`.
  - `SCHEMA_VERSION = 2`.
  - Typecheck and build pass.

### 2. Validate before caching, for every consumer
- Goal: `getAttendance()` itself rejects a response that fails the contract, before it is cached, so the dashboard card is covered as well as the page.
- Paths:
  - `pwa/lib/api-client.ts`
  - `pwa/components/attendance/Attendance.tsx`
- Notes:
  - `apiFetch` takes an optional validator, `(data: unknown) => T`, which throws on failure. It runs in two places:
    1. **Fresh response.** After `request` succeeds and before `markFresh` / `rememberResponse`. If it throws, nothing is written and the error propagates.
    2. **Cached payload.** Before it is returned. If it throws, the entry is treated as absent and the *original* error is rethrown. Do not throw the validation error here.
  - The rest of offline-cache.ts and its silent-failure rule are untouched.
  - `getAttendance` passes `checkAttendanceContract`.
  - `Attendance.tsx`'s `loadAttendance` drops its own `.then(checkAttendanceContract)`, so the check is not run twice. Update the comment above it.
- Done when:
  - `grep -rn checkAttendanceContract pwa/` shows exactly the definition in `lib/attendance-contract.ts` and its use in `api-client.ts`.
  - PROGRESS.md records a manual check, made by temporarily stubbing a response with the band removed and then reverting the stub:
    - the attendance page and the dashboard card both show their error state;
    - the IndexedDB `/student/attendance` entry is unchanged.
  - Typecheck and build pass.

### 3. Plural support in the hand-written i18n layer
- Goal: a component can pick a message by count, with all six CLDR categories, using `Intl.PluralRules` and no new dependency.
- Paths:
  - `pwa/lib/i18n.tsx`
  - `pwa/lib/i18n-types.ts`
  - `pwa/lib/i18n-shared.ts`, only if the pure category selector lives there
- Notes:
  - **Leaf shape.** A plural message is an object with exactly the keys `zero`, `one`, `two`, `few`, `many` and `other`, all strings, in *both* locale files. That way the bidirectional shape guard in `i18n-types.ts` stays strict. French will carry entries Intl never selects for it; that is the price of the guard, and it is accepted.
  - **Types.** Add a `PluralKey` type: the dotted paths whose value is a plural object. `t()` must not accept a `PluralKey` and the plural function accepts only a `PluralKey`, so `t('x.near.zero')` does not type-check. Adjust `LeafPaths` accordingly.
  - **Selection.** `n === 0` selects `zero` in both languages, because Design's zero row is a distinct sentence and French's `one` covers 0. Every other `n` uses `new Intl.PluralRules(lang).select(n)`, with one instance per language, memoised.
  - The function returns the raw template with its `{{placeholders}}` intact, the way `t(key)` without params does, so callers can render it with `fmtPhrase` / `Interpolated`.
  - Nothing outside these files changes. No locale keys in this milestone.
- Done when:
  - Typecheck and build pass.
  - PROGRESS.md has the selector's output for:
    - `ar` at n = 0, 1, 2, 3, 10, 11, 99, 100, 101, 102, 200, which must be zero, one, two, few, few, many, many, other, other, other, other;
    - `fr` at n = 0, 1, 2, which must be zero, one, other.

### 4. One definition of "worst subject"
- Goal: `model.ts` sorts subjects by §3's order and derives the dashboard line's state, as pure functions with no copy and no threshold comparison.
- Paths: `pwa/components/attendance/model.ts`
- Notes:
  - **Sort.** Replace `sortSubjects` with §3's comparator:
    1. band, worst first: below, then near, then ok;
    2. fewest `absencesLeft`, with null last;
    3. lowest `percentage` (§3 calls it "rate");
    4. subject name in the display language, `localeCompare(b, lang)`.

    It takes `lang`. SubjectBreakdown keeps calling it, so the attendance page's order changes to match. That is intended.
  - **Line state.** Add a function that returns a discriminated union and no strings:
    - `{ kind: 'ok' }`
    - `{ kind: 'near', subject, n, others }`
    - `{ kind: 'below', subject, others }`
    - `{ kind: 'ended-below', subject, others }`
    - `{ kind: 'ended-ok' }`
  - **Rules for the line state:**
    - The first subject after the sort is the candidate.
    - If its `absencesLeft` is null, the term-over states apply whatever the band: `ended-below` if its band is `below`, otherwise `ended-ok`.
    - If the worst band is `ok`, the result is `ok` and names no subject.
    - `others` is the count of other subjects in the same worst band.
    - `n` is the candidate's `absencesLeft`.
  - **Pure.** No `threshold` parameter at all.
- Done when:
  - Neither function reads `percentage` against any threshold.
  - The diff is confined to `model.ts`, apart from the `lang` argument at SubjectBreakdown's call site. That one line is allowed in `pwa/components/attendance/SubjectBreakdown.tsx`.
  - Typecheck and build pass.

### 5. Dashboard line copy, both locales
- Goal: fr.json and ar.json contain §3's rows verbatim, in the plural shape from milestone 3.
- Paths:
  - `pwa/locales/fr.json`
  - `pwa/locales/ar.json`
- Notes:
  - **Where.** All new keys go under `dashboard.attendance`. The `near` message is a plural object. The others are plain strings: `ok`, `below`, `ended_below`, `ended_ok` and the "+ {k}" suffix.
  - **Text.** Copy the table text character for character, apart from converting placeholders: `{subject}` → `{{subject}}`, `{n}` → `{{n}}`, `{k}` → `{{k}}`. The Arabic `two` row has no numeral (غيابان), so keep it that way.
  - **French rows.** Design's French rows map onto the categories by n: `zero` is "plus aucune absence possible", `one` is "encore 1 absence…", and `two`, `few`, `many` and `other` are "encore {{n}} absences…". Keep the literal "1" and "2" in the one and two rows exactly as Design wrote them.
  - **Seuil label.** Not added here; it is blocked on Flag 2.
- Done when:
  - Every new string can be matched against the §3 table row by row.
  - Both files have identical key shapes, which the typecheck enforces.
  - Typecheck and build pass.

### 6. Dashboard card shows the band
- Goal: the dashboard attendance card shows §3's line with the §5 suffix, a Seuil label, and a ring stroke, all coloured per §3 and driven by the server's band.
- Paths:
  - `pwa/components/dashboard/AttendanceCard.tsx`
  - `pwa/components/dashboard/Ring.tsx`
  - `pwa/components/dashboard/dashboard.module.css`
  - `pwa/locales/fr.json` and `pwa/locales/ar.json`, **only under `dashboard.attendance`**
- Copy (from ROUND2-CLOSEOUT §3 and §5; copy character for character, converting `{k}` → `{{k}}` where Design wrote single braces):
  - **New key `dashboard.attendance.threshold`** (A2): FR `Seuil : {{threshold}}`, AR `الحد الأدنى: {{threshold}}`. The value is `fmtPercent(T)`, which gives "75%". No space before `%`, Latin sign in both languages. `percentText` / `fmtPercent` do not change.
  - **`dashboard.attendance.others` becomes a plural object** (A4), replacing milestone 5's string "+ {{k}} autre(s)" / "+ {{k}} أخرى". Exactly the six keys, in both files:

    | Key | FR | AR |
    |---|---|---|
    | zero | `+ {{k}} autres matières` (never rendered; see below) | `+ {{k}} مادة أخرى` |
    | one | `+ 1 autre matière` | `+ مادة أخرى` |
    | two | `+ {{k}} autres matières` (never selected in French) | `+ مادتان أخريان` |
    | few | `+ {{k}} autres matières` (never selected in French) | `+ {{k}} مواد أخرى` |
    | many | `+ {{k}} autres matières` | `+ {{k}} مادة أخرى` |
    | other | `+ {{k}} autres matières` | `+ {{k}} مادة أخرى` |

    §5 leaves French zero, two and few as "—". The shape guard from milestone 3 forces a string there, so they carry the `other` form. This is the same accepted cost as `near`'s French rows, and it is not new copy: k = 0 is never rendered, and French Intl never selects two or few.
  - No other `dashboard.attendance` key changes. The §3 line rows from milestone 5 stay as they are.
- Notes:
  - **Line.** `attendanceLine(subjects, lang)` (model.ts, milestone 4) gives the state. `null` means no subjects: show the card's existing empty state.
    - `near` uses `plural('dashboard.attendance.near', n)`. The others use `t()`.
    - Render with `fmtPhrase`: `{{subject}}` goes in a `<bdi>` and is **not** in `.num`. `{{n}}` and `{{k}}` are `.num`, Western digits. `Interpolated` alone is wrong for this line.
  - **Suffix (§5).** Appended for `near`, `below` and `ended-below` only, and only when `others` > 0. Never for `ok` or `ended-ok`.
    - It goes at the end of the sentence, after " · ", never after `{subject}`.
    - It sits inside the sentence's own element, after the subject's `<bdi>`, in the sentence's colour.
    - k = `others` from `attendanceLine`. Pick the form with `plural('dashboard.attendance.others', k)`.
    - The " · " separator is punctuation, not copy. Write it in the component as in §5's example: "Statistiques L2 : limite d'absences dépassée · + 1 autre matière".
  - **Colours.** All are existing tokens. Add none, and touch no token in globals.css.
    - Line: `--ink2` for ok and ended-ok, `--warning-ink` for near, `--danger-ink` for below and ended-below.
    - Seuil label: `--jade-text` / `--warning-ink` / `--danger-ink`, following `overall.band`.
    - Ring stroke (A3): `--jade` / **`--warning-ink`** / `--danger`, following `overall.band`. `--warning` is not used: it is 2.15 : 1.
    - Leave a CSS comment beside the ring rule with §3's measured figures (6.39 light, 8.36 dark for `--warning-ink` on `--surface`). That keeps the pwa/ rule that colour comments carry a measured ratio.
  - **Term over with overall band `near` (Flag 4, still open, does not block).** Follow the tables literally: the line is `ended_ok` in `--ink2`, while the Seuil label and ring take the `near` colour. Record what the card looks like in PROGRESS.md so Design can confirm.
  - **Not colour alone.** The line's words carry the state. Check this against the §10 rule the attendance CSS already cites.
  - Logical properties only; no `[dir="rtl"]`.
  - **Empty state.** Unchanged: null `overall` or null `percentage` still shows it.
- Done when:
  - Every new or changed string can be matched against §3 / §5 row by row, and fr.json / ar.json still have identical shapes (typecheck enforces it).
  - `PluralKey` is exactly `'dashboard.attendance.near' | 'dashboard.attendance.others'`.
  - The `dashboard.attendance` diff in each locale file is the new `threshold` key and the reshaped `others` key, nothing else.
  - Typecheck and build pass.
  - Screenshots of the card in `ok`, `near` (n = 0, 1, 2 and 5), `below`, `below` with k = 1 and k = 2, and both term-over states, light and dark, FR and AR, are attached to PROGRESS.md, using a stubbed response that is then reverted. **If the builder cannot render the PWA** (no login; see README "Known gaps"), it says so under "Could not do", and the screenshots become a human check before merge. That alone is not a reason to stop the run.

### 7. Attendance page reads the band
- Goal: Hero, SubjectBreakdown and PresenceRing take their state from `band` and `absencesLeft`, with §4's copy and row treatment. `percentage < threshold` is gone from `pwa/`.
- Paths:
  - `pwa/components/attendance/Hero.tsx`
  - `pwa/components/attendance/SubjectBreakdown.tsx`
  - `pwa/components/attendance/PresenceRing.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `pwa/locales/fr.json` and `pwa/locales/ar.json`, **only under `attendance.hero` and `attendance.subjects`**
- Copy (ROUND2-CLOSEOUT §4, character for character):
  - Hero, keyed by the overall state. "Term over" means `overall.absencesLeft === null`.
    - `attendance.hero.threshold`: unchanged.
    - `attendance.hero.near` (new): FR `Seuil requis : {{threshold}} · marge faible`, AR `الحد الأدنى المطلوب: {{threshold}} · هامش ضيق`.
    - `attendance.hero.below` (rewritten): FR `Seuil requis de {{threshold}} hors d'atteinte ce semestre`, AR `لم يعد بلوغ الحد الأدنى المطلوب {{threshold}} ممكنًا هذا الفصل`.
    - `attendance.hero.ended_below` (new): FR `Semestre terminé sous le seuil requis de {{threshold}}`, AR `انتهى الفصل دون بلوغ الحد الأدنى المطلوب {{threshold}}`.
    - `attendance.hero.ended_ok` (new): FR `Semestre terminé · seuil requis : {{threshold}}`, AR `انتهى الفصل · الحد الأدنى المطلوب: {{threshold}}`.
  - Subject rows, keyed by each subject's own state:
    - `attendance.subjects.near` (new): a plural object with the six keys, as in §4's table. FR zero `Plus aucune absence possible`, one `Encore 1 absence avant la limite`, two `Encore 2 absences avant la limite`, few / many / other `Encore {{n}} absences avant la limite`. AR zero `لا يُسمح بأي غياب إضافي`, one `يتبقّى غياب واحد قبل بلوغ الحد`, two `يتبقّى غيابان قبل بلوغ الحد`, few `يتبقّى {{n}} غيابات قبل بلوغ الحد`, many `يتبقّى {{n}} غيابًا قبل بلوغ الحد`, other `يتبقّى {{n}} غياب قبل بلوغ الحد`.
    - `attendance.subjects.below` (rewritten): FR `Limite d'absences dépassée`, AR `تم تجاوز حد الغياب`.
    - `attendance.subjects.ended_below` (new): FR `Semestre terminé sous le seuil`, AR `انتهى الفصل دون بلوغ الحد الأدنى`.
  - Verify against §4 by script, the way milestone 5 did. The lists above are a convenience; §4 is the authority.
- Notes:
  - **Delete the boolean.** Remove the local `below` boolean from Hero and SubjectBreakdown. Do not keep it beside the band.
  - **Threshold, kept for display.** `threshold` stays a prop. It is still shown in the Hero sentence and the section note, and still positions `--bar-threshold`.
  - **Hero line (§4).**
    - `ok` and term-over-ok: `--ink2`, no icon.
    - `near`: `--warning-ink`, with `WarningIcon`.
    - `below` and term-over-below: `--danger-ink`, with `WarningIcon`.
    - The icon takes the text's colour.
    - The Hero does **not** show `absencesLeft` (§4 explains why: the pooled figure misleads).
  - **Subject rows (§4).**
    - `ok` and term-over-not-below: no flag.
    - `near`: `plural('attendance.subjects.near', n)`, where n = `absencesLeft`, rendered with `Interpolated` so `{{n}}` is `.num`.
    - `below`: `attendance.subjects.below`. Term over and `below`: `attendance.subjects.ended_below`.
    - Every flag keeps its `WarningIcon` in the text's colour.
    - A term-over `near` subject (`absencesLeft === null`) gets no flag and no `near` tone. §4's term-over rows apply whatever the band.
  - **Row treatment (§4, replacing `.subjectBelow`).**
    - `near`: border, bar fill and `.subjectValue` all `--warning-ink`.
    - `below`: border and bar fill `--danger`, `.subjectValue` `--danger-ink`.
    - `ok`: unchanged.
    - `--warning` and `--warning-bg` are no longer used on these rows. §4's table has no background column, so the rows carry **no tint**. This is the mission's reading; the builder records it in PROGRESS.md for Design to confirm.
    - Rewrite the CSS comments about which token is text-safe so they stay true. Cite §4's 5.33 : 1 for `--warning-ink` against the `--sunken` track.
  - **Ring (§4).** PresenceRing's stroke follows `overall.band` with §3's three colours: `--jade`, `--warning-ink`, `--danger`. Its track and `aria-label` do not change.
  - **Order.** Already the §3 sort (milestone 4). No change.
  - **Not colour alone.** Every non-ok state keeps an icon *and* words, never the tint alone.
  - Update the §10 doc comment at the top of SubjectBreakdown, which still names "Sous le seuil" and the warning tint.
- Done when:
  - `grep -rnE "percentage\s*<|<\s*threshold" pwa/components pwa/lib` returns nothing.
  - Every new or rewritten string matches §4 row by row. The locale diff touches only `attendance.hero` and `attendance.subjects`. Both files have identical shapes.
  - `PluralKey` gains exactly `'attendance.subjects.near'`.
  - Typecheck and build pass.
  - Screenshots of the page with subjects in each band (`near` at n = 0, 1, 2, 5), a term-over page with one subject below, light and dark, FR and AR, are attached to PROGRESS.md. The same fallback as milestone 6 applies if the builder cannot render the PWA.

## Flags
**Resolved by ROUND2-CLOSEOUT.md, third pass (2026-11-09):**
1. ~~Attendance page copy and mapping for `near`~~ → **A1 / §4.** Folded into milestone 7. The page does show `absencesLeft`, on subject rows only, never in the Hero. PresenceRing takes the overall band's stroke.
2. ~~Seuil label copy~~ → **A2.** "Seuil : 75%" / "الحد الأدنى: 75%", via `fmtPercent`. The percent form does not change anywhere. Folded into milestone 6.
3. ~~Light `near` ring stroke fails 3:1~~ → **A3.** The ring uses `--warning-ink` in both themes (6.39 / 8.36). This applies to the dashboard ring (milestone 6) and PresenceRing (milestone 7).
5. ~~"+ {k} autre(s)"~~ → **A4 / §5.** It becomes a six-form plural object naming "matière". It goes at the end after " · ", for near, below and term-over-below, and is not rendered at k = 0. Folded into milestone 6.

**Still open:**

4. **Term over with band `near` (does not block).** This is T ≤ rate < T+M at term end. The close-out does not address it. §3 and §4 read literally give a mixed card: an `ended_ok` line in `--ink2` next to a `near`-coloured Seuil label and ring. Milestones 6 and 7 follow the tables literally and record the result. Design to confirm.
6. **Native code comment is out of date (out of scope here).** `services/attendanceContract.ts` says the PWA's `model.ts` rejects a missing band. The rule now lives in `pwa/lib/attendance-contract.ts`. This is a one-line fix in a native-app PR; do not touch it from this mission.
7. **Design export inconsistency, to report rather than fix.** The close-out's pass notes say `Round 2 Spec.html` §1 now agrees with this file. Whether it also agrees on the near sentence ("avant le seuil" vs "avant la limite") and the tie-break order was not re-checked. This mission follows the close-out. Do not edit `design/spec-pack/`.
8. **Row tint on the attendance page (new, does not block).** §4's row-treatment table has no background column. Milestone 7 drops the tint. Design to confirm.
9. **Milestone 2's browser check is still owed** (from run 2). A human with a test account confirms the page and the card show their error state on a band-less stub, and that IndexedDB is unchanged.

**Not this mission's concern.** §6 of the close-out lists three login-prototype differences: the password field fill, the rate-limit button and the logo mark. Code wins for all three, and they belong in `.claude/design-known-divergences.md`. That is the login-hero mission's concern, not this one's.

## Schema
No. The backend already sends `band` and `absencesLeft` (7c929ec, on `develop`). No backend change.
