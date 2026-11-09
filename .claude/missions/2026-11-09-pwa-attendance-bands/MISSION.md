# PWA attendance: show the server's three bands, not a local two-state guess

## Goal
The PWA shows the attendance state the server computed: `band` (`ok` | `near` | `below`) and `absencesLeft`, on the overall figure and on every subject of `GET /student/attendance`.

There is no `percentage < threshold` verdict anywhere under `pwa/`. `attendanceThreshold` is still displayed (the "Seuil" sentence, the tick on each bar), but it is never compared against.

A response without the band never reaches a component and never overwrites the offline copy. This holds for both consumers: the attendance page and the dashboard card.

The dashboard card's line under the ring follows `design/spec-pack/ROUND2-CLOSEOUT.md` §3, in French and Arabic, with all six Arabic plural categories. The i18n layer can do this with no new dependency.

## Product
pwa

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
Each milestone is one feature branch cut from `develop` *after the previous one has merged* (they are sequential). One PR each.

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

### 6. Dashboard card shows the band — blocked on Flags 2 and 3
- Goal: the dashboard attendance card shows §3's line, coloured per §3. Its ring stroke and Seuil label follow the overall band.
- Paths:
  - `pwa/components/dashboard/AttendanceCard.tsx`
  - `pwa/components/dashboard/Ring.tsx`
  - `pwa/components/dashboard/dashboard.module.css`
- Notes:
  - **Colours.**
    - Line: `--ink2` for ok and ended-ok, `--warning-ink` for near, `--danger-ink` for below and ended-below.
    - Seuil label: `--jade-text`, `--warning-ink` or `--danger-ink`, following the overall band.
    - Ring stroke: `--jade`, `--warning` or `--danger`, following the overall band.

    All of these are existing tokens: add none, and touch no token in globals.css.
  - **Rendering the line.**
    - `{{subject}}` goes in a `<bdi>` and is **not** in `.num`. `fmtPhrase` does this; `Interpolated` alone is wrong.
    - `{{n}}` and `{{k}}` are `.num`, Western digits.
    - Use logical properties only, and no `[dir="rtl"]`.
  - **Not colour alone.** The line's words carry the state. Check this against the §10 rule the attendance CSS already cites.
  - **Empty state.** Unchanged: null `overall` or null `percentage` still shows it.
- Done when:
  - Screenshots of the card in `ok`, `near` (n = 0, 1, 2 and 5), `below` and both term-over states, light and dark, FR and AR, are attached to PROGRESS.md. Use a stubbed response, then revert the stub.
  - Typecheck and build pass.

### 7. Attendance page reads the band — blocked on Flag 1
- Goal: Hero, SubjectBreakdown and PresenceRing take their state from `band`. `percentage < threshold` is gone from `pwa/`.
- Paths:
  - `pwa/components/attendance/Hero.tsx`
  - `pwa/components/attendance/SubjectBreakdown.tsx`
  - `pwa/components/attendance/PresenceRing.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `pwa/locales/fr.json` and `pwa/locales/ar.json`, only if Flag 1's answer brings new copy
- Notes:
  - **Delete the boolean.** Remove the local `below` boolean from both components. Do not keep it beside the band.
  - **Threshold, kept for display.** `threshold` stays a prop. It is still shown in the Hero sentence and the section note, and still positions `--bar-threshold`.
  - **Tones.** `below` is danger: `--danger-ink` text, `--danger` border and fill, `--danger-bg` tint. `near` is warning, which is today's styling. `ok` is neutral. The existing CSS comments about which token is text-safe must stay true. Re-read them, because danger is new on this page.
  - **Not colour alone.** Every non-ok state keeps an icon *and* words, never the tint alone. Which words depends on Flag 1.
  - **Null `absencesLeft`.** Render nothing for it.
- Done when:
  - `grep -rnE "percentage\s*<|<\s*threshold" pwa/components pwa/lib` returns nothing.
  - Screenshots of the page with subjects in each band, light and dark, FR and AR, are attached to PROGRESS.md.
  - Typecheck and build pass.

## Flags
1. **Attendance page copy and mapping for `near` (blocks milestone 7).** Design gave no band copy for the Hero or the subject rows. Today's strings are `attendance.hero.threshold`, `attendance.hero.below` "Sous le seuil requis de {{threshold}}" and `attendance.subjects.below` "Sous le seuil".
   - **Planner's proposal, for confirmation only, not decided:** `below` uses the existing "below" strings with danger tone. `near` uses the threshold sentence with warning tone and the triangle. `ok` is neutral.
   - **The open question:** a `near` subject that is under T but recoverable loses the words "Sous le seuil". Should the page show `absencesLeft` at all? If so, Design writes that copy; the native app's PROVISIONAL sentences are not to be reused.
   - **Also confirm:** PresenceRing on this page should take the overall band's stroke, as §3 says for the dashboard ring.
2. **Seuil label copy (blocks milestone 6).** §3 specifies the label's colour, but its text appears only in the prototype HTML: "Seuil : 75 %" / "الحد الأدنى: 75٪", with a space before `%`. The PWA writes percentages as "75%" via `percentText`, and the attendance page says "Seuil requis : …". Which string does the dashboard use, and is the percent form changing?
3. **Light `near` ring stroke fails 3:1 (blocks milestone 6).** §3 says the ring stroke is `--warning` for near. Light `--warning` `#F59E0B` is 2.15:1 on white `--surface`, under the 3:1 that WCAG 1.4.11 requires for a graphic. attendance.module.css already records this and avoids `--warning` for icons for that reason. `--danger` `#EF4444` is 3.76:1, which passes. Accept `--warning` because the line's text carries the state, or ask Design for a stroke colour? A new colour would need its measured ratio in its comment.
4. **Term over with band `near`.** This means T ≤ rate < T+M at term end. §3 then gives the "toutes les matières au-dessus du seuil" line in `--ink2`, while the Seuil label and ring take the overall `near` warning colour. Is a mixed card intended? The native app collapses this case to ok, provisionally.
5. **"+ {k} autre(s)" / "+ {k} أخرى".** Neither form is pluralised, although Arabic would normally need one. Design must also say:
   - whether the suffix applies in the term-over-below state;
   - where it attaches, at the end of the sentence or after `{subject}`.

   Milestone 5 copies the strings as given.
6. **Native code comment is out of date (out of scope here).** `services/attendanceContract.ts` says the PWA's `model.ts` rejects a missing band. After milestone 2 the rule is real, but it lives in `pwa/lib/attendance-contract.ts`. The comment's path needs a one-line fix in a native-app PR. Do not touch it from this mission.
7. **Design export inconsistency, to report rather than fix.** Round 2 Spec §1's near sentence ends "avant le seuil", with ties broken by lowest rate. The close-out ends it "avant la limite", with ties broken by absencesLeft first. This mission follows the close-out. Do not edit `design/spec-pack/`.

## Schema
No. The backend already sends `band` and `absencesLeft` (7c929ec, on `develop`). No backend change.
