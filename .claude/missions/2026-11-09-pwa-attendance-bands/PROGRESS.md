## Milestone 1: Types, contract and cache version (2026-11-09)

**Branch:** `feature/pwa-attendance-band-types`, cut from develop at af7dfb1. Commit 70972d7 has been pushed to origin.

**PR: not opened.** The `gh` CLI is not installed on this machine, so the PR could not be created. Someone needs to open it by hand against `develop` from https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-attendance-band-types?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."
- The rest of the description can be copied from the commit message and from this section.

### What was done
- **pwa/lib/api-types.ts.** Added `export type AttendanceBand = 'ok' | 'near' | 'below'`, and `band: AttendanceBand` and `absencesLeft: number | null` on `AttendanceOverall` and `AttendanceSubject`. Each field has a doc comment that matches the backend contract: null is not 0, render nothing for null. The diff contains nothing else.
- **pwa/lib/attendance-contract.ts (new).** `checkAttendanceContract(data: AttendanceResponse)` moved here from model.ts and was extended the way the native `services/attendanceContract.ts` does it:
  - `overall.band` and `overall.absencesLeft` are checked only when `overall !== null`;
  - every `subjects[].band` must be one of the three values;
  - every `subjects[].absencesLeft` must be null or a non-negative integer.

  The threshold, deadline and `canSubmitJustification` checks are kept, and so is the NO LOCAL FALLBACK comment.
  The signature still takes `AttendanceResponse`, not `unknown`. Milestone 2's `(data: unknown) => T` validator will need it widened, or will need a cast at the call site.
- **pwa/components/attendance/model.ts.** The function was removed, along with the now-unused `AttendanceResponse` import. The header comment points to the new location.
- **pwa/components/attendance/Attendance.tsx.** The import now comes from `@/lib/attendance-contract`. Nothing else changed: `.then(checkAttendanceContract)` is still there, and milestone 2 removes it.
- **pwa/lib/offline-cache.ts.** `SCHEMA_VERSION = 2`. The comment names the reason: the attendance payload gained band / absencesLeft.

### Verification
The check was run under Node 25 (`--experimental-strip-types`) on a scratch copy against sample payloads:
```
valid: passes
subject[1] missing band: throws "GET /student/attendance is missing subjects[].band"
subject band invalid: throws "GET /student/attendance is missing subjects[].band"
subject absencesLeft missing: throws "GET /student/attendance is missing subjects[].absencesLeft"
subject absencesLeft null (ended): passes
subject absencesLeft -1: throws "GET /student/attendance is missing subjects[].absencesLeft"
subject absencesLeft 1.5: throws "GET /student/attendance is missing subjects[].absencesLeft"
overall missing band: throws "GET /student/attendance is missing overall.band, overall.absencesLeft"
overall null, subjects []: passes
```

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```
(no errors)

`npm run build` (pwa/):
```
▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 162ms
  Creating an optimized production build ...
✓ Compiled successfully in 1979ms
  Running TypeScript ...
  Finished TypeScript in 6.7s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 574ms
  Finalizing page optimization ...
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule
ƒ  (Dynamic)  server-rendered on demand
```

### Flagged
- No new user-facing copy.
- The PR was not opened because `gh` is missing; see above.

### Could not do
- Open the PR.
- The mission folder stays untracked, as the orchestrator asked.


## Milestone 3: Plural support in the hand-written i18n layer (2026-11-09)

**Branch:** `feature/pwa-i18n-plurals`, cut from develop at af7dfb1, as the orchestrator asked: it does not depend on milestones 1 or 2, and milestone 1 is not merged. Commit 0113b5a has been pushed to origin.

**PR: not opened.** `gh` is not installed. Open it by hand against `develop`: https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-i18n-plurals?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."
- The rest of the description can be copied from the commit message.

### What was done
- **pwa/lib/i18n-shared.ts.** Added `PLURAL_CATEGORIES`, `PluralCategory` and `pluralCategory(lang, n)`. The function is pure, with no React and no DOM, so it can run on the server and under Node.
  - `n === 0` returns `zero` in both languages.
  - Any other `n` uses `Intl.PluralRules(lang).select(n)`, with one instance per language, built lazily and memoised.
- **pwa/lib/i18n-types.ts.**
  - `PluralForms = Record<PluralCategory, string>`.
  - A private `IsPluralForms<V>` that is true only when the keys are exactly the six categories. An object with the six keys plus another key is treated as an ordinary subtree.
  - `LeafPaths` neither returns a plural object nor descends into one.
  - New `PluralPaths` / exported `PluralKey`, which by construction share no key with `TranslationKey`. It is `never` today, because no locale file has a plural message yet.
- **pwa/lib/i18n.tsx.** `I18nValue` gains `plural: (key: PluralKey, n: number) => string`. It returns the raw template with its `{{placeholders}}` intact.
  - It is backed by `lookupPlural`. If a path or category is missing, it returns the key and logs a dev-only warning, the way `t()` does.
  - It is memoised on `lang` and included in the context value.
- No locale keys and no callers were added. No other file changed, and there is no new dependency.

### Verification
**Selector**, from the real `pwa/lib/i18n-shared.ts` (a scratch copy), run under Node 25 with type stripping:
```
ar:
  n=0   -> zero
  n=1   -> one
  n=2   -> two
  n=3   -> few
  n=10  -> few
  n=11  -> many
  n=99  -> many
  n=100 -> other
  n=101 -> other
  n=102 -> other
  n=200 -> other
fr:
  n=0   -> zero
  n=1   -> one
  n=2   -> other
all match
```

**Types.** The `PluralForms` / `IsPluralForms` / `LeafPaths` / `PluralPaths` definitions were copied verbatim from the file and compiled with strict tsc against a fixture tree. The run exited 0.
- These compile: `t('a.title')`, `plural('a.near', 1)`, and `t('b.extra.zero')`, where `b.extra` has the six keys plus a seventh.
- Each of these is a real error (each sits under `@ts-expect-error`): `t('a.near')`, `t('a.near.zero')`, `plural('a.title', 1)`, `plural('a.near.zero', 1)` and `plural('b.extra', 1)`.

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```
(no errors)

`npm run build` (pwa/, at commit 0113b5a):
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 41ms
  Creating an optimized production build ...
✓ Compiled successfully in 1006ms
  Running TypeScript ...
  Finished TypeScript in 6.5s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 345ms
  Finalizing page optimization ...
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule
ƒ  (Dynamic)  server-rendered on demand
```

### Notes for later milestones
- Milestone 5 must write `near` as an object with exactly the six keys in both files. If it has a seventh key, it becomes an ordinary subtree. `PluralKey` then stays `never`, and `plural('dashboard.attendance.near', n)` will not compile. That failure is the signal.
- French Intl does return `many`, for exact millions (`select(1000000)` is `"many"`). The mission's French mapping already fills `many` with the `{{n}}` row, so nothing breaks.
- `plural()` does not interpolate. Milestone 6 renders its result with `fmtPhrase`, so that `{{subject}}` goes in a `<bdi>`.

### Flagged
- No new user-facing copy.
- The PR was not opened because `gh` is missing; see above.

### Could not do
- Open the PR.


## Milestone 2: Validate before caching, for every consumer (2026-11-09)

**Branch:** `feature/pwa-attendance-validate-before-cache`, cut from develop at 6f43e4e (milestones 1 and 3 merged).

**PR: not opened.** `gh` is not installed. Open it by hand against `develop`: https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-attendance-validate-before-cache?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."

### What was done
- **pwa/lib/api-client.ts.**
  - `apiFetch<T>(path, init = {}, validate?: (data: unknown) => T)`.
  - **Fresh response:** validated after `request` succeeds and before `markFresh` / `rememberResponse`, outside the fallback `try`, so a contract failure is not mistaken for a network failure. On throw nothing is written and the validation error propagates.
  - **Cached payload:** validated before `markServedFromCache` and before it is returned. On throw the entry is treated as absent and the *original* request error is rethrown. The IndexedDB entry is not deleted; offline-cache.ts is untouched.
  - Non-cached requests (`key === null`) also run the validator if one is given.
  - `getAttendance` passes `(data) => checkAttendanceContract(data as AttendanceResponse)`.
- **pwa/components/attendance/Attendance.tsx.** `loadAttendance` no longer calls `.then(checkAttendanceContract)`; the import is gone and the comment above it says the check runs inside apiFetch.
- The dashboard card (`AttendanceCard.tsx`, unchanged) is now covered because it calls `getAttendance()`. Both consumers go through `useCardData`, whose `.catch` sets `phase: 'error'` when `navigator.onLine`, and `'offline'` otherwise.

### Validator signature: adapted at the call site, not widened
`checkAttendanceContract` still takes `AttendanceResponse`. `attendance-contract.ts` is outside this milestone's paths, so I adapted it at the call site in `getAttendance` with a cast.
- Consequence: a payload that is not an object at all (e.g. `null`) makes the check throw a `TypeError` instead of its named-field error. It still throws, so it is still never cached or served (see case 6 below). It just does not get the `[attendance] … is missing …` log line.
- **Flagged for a later PR:** widening the parameter to `unknown`, with an object / `Array.isArray(subjects)` guard at the top, is the cleaner fix. It would let the cast go and give every bad payload a named log line. That is a small change to `pwa/lib/attendance-contract.ts` only.

### Verification
`grep -rn checkAttendanceContract pwa/ --exclude-dir=.next --exclude-dir=node_modules`:
```
pwa/components/attendance/model.ts:6: * GET /student/attendance response; `checkAttendanceContract` in
pwa/lib/api-client.ts:31:import { checkAttendanceContract } from '@/lib/attendance-contract';
pwa/lib/api-client.ts:378: * The cast adapts checkAttendanceContract, which takes AttendanceResponse, to
pwa/lib/api-client.ts:385:    checkAttendanceContract(data as AttendanceResponse)
pwa/lib/attendance-contract.ts:39:export function checkAttendanceContract(data: AttendanceResponse): AttendanceResponse {
```
The only code references are the definition and its use in api-client.ts. The other hits are comments: one in api-client.ts, and the pointer milestone 1 left in model.ts's header ("…`checkAttendanceContract` in lib/attendance-contract.ts"). model.ts is outside this milestone's paths and that comment is still accurate, so I left it.

**apiFetch under Node (substitute for the browser check).** The real `api-client.ts` and `attendance-contract.ts` were copied to scratch, with imports rewritten to relative paths, and run with Node 25.9 `--experimental-strip-types`. `fetch` was faked, and so was `offline-cache` (an in-memory Map that logs `markFresh` / `rememberResponse` / `markServedFromCache`). `auth-token` was stubbed, with student `S1`.
```
1. fresh good response
  -> resolved, subjects[1].band=near
  cache calls: [markFresh /student/attendance, rememberResponse /student/attendance]
  stored entry CHANGED
2. fresh response, subjects[1].band removed
  -> rejected Error: GET /student/attendance is missing subjects[].band
  cache calls: []
  stored entry unchanged
3. network down, cached entry good
  -> resolved, subjects[1].band=near
  cache calls: [markServedFromCache /student/attendance]
  stored entry unchanged
4. network down, cached entry missing band
  -> rejected TypeError: fetch failed
  cache calls: []
  stored entry unchanged
5. 503, cached entry missing band
  -> rejected ApiError: Request failed with status 503 (status 503)
  cache calls: []
  stored entry unchanged
6. fresh null body
  -> rejected TypeError: Cannot read properties of null (reading 'attendanceThreshold')
  cache calls: []
  stored entry unchanged
```
- Case 2: nothing is written and the last good copy survives.
- Cases 4 and 5: a failing cached entry is treated as absent and the original error is rethrown, not the validation error.

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```
(no errors)

`npm run build` (pwa/):
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 46ms
  Creating an optimized production build ...
✓ Compiled successfully in 1940ms
  Running TypeScript ...
  Finished TypeScript in 5.1s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 387ms
  Finalizing page optimization ...
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule
ƒ  (Dynamic)  server-rendered on demand
```

### Flagged
- No new user-facing copy.
- Widen `checkAttendanceContract` to `(data: unknown)` in `pwa/lib/attendance-contract.ts`; see above. It is outside this milestone's paths.
- The PR was not opened because `gh` is missing.

### Could not do
- **The manual browser check in "Done when" was NOT done.** Agents have no PWA login credential, so this run did not observe either of these:
  - the attendance page and the dashboard card showing their error state with a band-less stub;
  - the IndexedDB `/student/attendance` entry being unchanged.

  The Node run above proves the apiFetch behaviour. The error-state rendering is inferred from `useCardData`'s `.catch`, not observed. A human with a test account should do the browser check before merge. No stub was committed; none was made in the repo.
- Open the PR.


## Milestone 4: One definition of "worst subject" (2026-11-09)

**Branch:** `feature/pwa-attendance-worst-subject`, cut from develop at 6f43e4e. It does not depend on milestone 2, which is still unmerged. Commit 6707f97 has been pushed to origin.

**PR: not opened.** `gh` is not installed. Open it by hand against `develop`: https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-attendance-worst-subject?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."

### What was done
- **pwa/components/attendance/model.ts.**
  - `sortSubjects(subjects, lang)` uses §3's comparator, in this order:
    1. band, worst first (`below`, `near`, `ok`);
    2. fewest `absencesLeft`, with null last;
    3. lowest `percentage`;
    4. `localeCompare(b, lang)` on `nameAr` / `nameFr`, chosen by `lang` the same way SubjectBreakdown picks the name it renders.
  - It does not mutate its input.
  - `attendanceLine(subjects, lang): AttendanceLine | null` returns the union the mission specifies, with no strings and no threshold parameter.
    - The candidate is the first subject after the sort.
    - A null `absencesLeft` gives `ended-below` if the band is `below`, and `ended-ok` otherwise. This is checked before the `ok` check.
    - `others` is the number of other subjects in the candidate's band.
    - `n` is the candidate's `absencesLeft`.
  - `percentage` is only ever compared with another subject's `percentage`. Nothing reads a threshold.
- **pwa/components/attendance/SubjectBreakdown.tsx.** One line: `sortSubjects(subjects, lang)`. `lang` comes from the component's existing `useI18n()` destructure.
- **Doc vs mission.** I read ROUND2-CLOSEOUT §3 directly. The mission's sort order and term-over rule match it, so there is nothing to flag there.

### Two choices beyond the letter of the mission (please confirm)
- **Empty list returns `null`, not `{ kind: 'ok' }`.** §3 has no row for "no subjects". `ok` would say "Toutes les matières au-dessus du seuil" about subjects that do not exist. Milestone 6 should show the card's empty state for `null`.
  - With no current semester, `overall` is null and `subjects` is `[]`, so the card already shows its empty state there.
  - The case `null` covers is a current semester with zero subjects.
- **Subject code as a fifth tie-break.** It applies only when two names are identical in the display language. It keeps the order independent of the server's send order, as the old `sortSubjects` did with code. It is not part of §3.

### Verification
This ran the real model.ts (a scratch copy, type-only imports stripped) under Node 25.9 `--experimental-strip-types`. Each row is shown as name(band, absencesLeft, percentage).
```
1. all ok [fr]
  order: Physique(ok,4,90) > Maths(ok,6,95)
  line:  {"kind":"ok"}
2. one near [fr]
  order: Physique(near,2,82) > Info(ok,5,93) > Maths(ok,6,95)
  line:  {"kind":"near","subject":"Physique","n":2,"others":0}
3. two near tied on absencesLeft, rate decides [fr]
  order: Chimie(near,1,80) > Physique(near,1,84) > Maths(ok,6,95)
  line:  {"kind":"near","subject":"Chimie","n":1,"others":1}
4a. near, absencesLeft null (term over) [fr]
  order: Physique(near,null,86) > Maths(ok,null,95)
  line:  {"kind":"ended-ok"}
4b. below, absencesLeft null (term over) [fr]
  order: Physique(below,null,70) > Chimie(below,null,72) > Maths(ok,null,95)
  line:  {"kind":"ended-below","subject":"Physique","others":1}
4c. all ok, term over [fr]
  order: Maths(ok,null,95)
  line:  {"kind":"ended-ok"}
5. below vs near (near has fewer left and lower rate) [fr]
  order: Chimie(below,3,79) > Physique(near,0,60)
  line:  {"kind":"below","subject":"Chimie","others":0}
6. mixed, others counts [fr]
  order: Biologie(below,0,65) > Algèbre(below,0,70) > Économie(below,0,74) > Chimie(near,0,84) > Physique(near,2,82) > Maths(ok,6,95)
  line:  {"kind":"below","subject":"Biologie","others":2}
6b. near only, others counts, null sorts last [fr]
  order: Chimie(near,3,81) > Info(near,3,81) > Physique(near,null,86)
  line:  {"kind":"near","subject":"Chimie","n":3,"others":2}
7. name tie-break [fr]
  order: Anatomie(near,2,80) > Écologie(near,2,80) > Zoologie(near,2,80)
  line:  {"kind":"near","subject":"Anatomie","n":2,"others":2}
7. name tie-break [ar]
  order: أحياء(near,2,80) > بيئة(near,2,80) > تشريح(near,2,80)
  line:  {"kind":"near","subject":"أحياء","n":2,"others":2}
8. empty [fr]
  order:
  line:  null
input not mutated: Z1,A1,E1
```
- Case 7 uses the same three subjects in both languages.
  - In French, "Écologie" sorts between A and Z, which is locale-aware; a raw code-unit compare would put it last.
  - In Arabic the order differs, because the Arabic names differ.
- Case 6b: the subject with null `absencesLeft` sorts last but still counts toward `others`, since it shares the band.

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```
(no errors, exit 0)

`npm run build` (pwa/):
```
  Creating an optimized production build ...
✓ Compiled successfully in 2.7s
  Running TypeScript ...
  Finished TypeScript in 7.9s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 921ms
  Finalizing page optimization ...
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule
ƒ  (Dynamic)  server-rendered on demand
```
(exit 0)

### Flagged
- No new user-facing copy.
- The empty list returns `null`, and the subject code is used as a fifth tie-break; see above.
- **The attendance page now orders by band first.** SubjectBreakdown still colours rows with its local `percentage < threshold` boolean until milestone 7. Until then, a `near` subject that is at or above T sorts above an `ok` one without being highlighted. The order is right; the highlighting catches up in milestone 7.
- The PR was not opened because `gh` is missing.

### Could not do
- Open the PR.


## Milestone 5: Dashboard line copy, both locales (2026-11-09)

**Branch:** `feature/pwa-attendance-line-copy`, cut from develop at 6f43e4e (does not depend on milestones 2 or 4). Commit 4a3dee1 has been pushed to origin.

**PR: not opened.** `gh` is not installed. Open it by hand against `develop`: https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-attendance-line-copy?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."

### What was done
Only `pwa/locales/fr.json` and `pwa/locales/ar.json` changed (+13 keys each, after `dashboard.attendance.sessions`):
- `dashboard.attendance.ok`
- `dashboard.attendance.near` — plural object with exactly `zero`, `one`, `two`, `few`, `many`, `other`
- `dashboard.attendance.below`
- `dashboard.attendance.ended_below`
- `dashboard.attendance.ended_ok`
- `dashboard.attendance.others` — the "+ {k}" suffix, plain string. The mission did not name this key; `others` matches the `others` field of milestone 4's `AttendanceLine`.

The strings were not retyped: a script parsed §3's table (and the suffix from the prose sentence "append "+ {k} autre(s)" / "+ {k} أخرى"") and wrote them, converting only `{subject}`/`{n}`/`{k}` to double braces. French one/two rows keep the literal "1" / "2"; Arabic two row keeps غيابان with no numeral.

### Verification: JSON vs §3, byte for byte
Check 1: JSON parsed fresh, `{{x}}` → `{x}`, compared with the parsed §3 cell. `special` lists combining marks / format / non-ASCII spaces found in the string.
```
MATCH fr ok           sha1=8e9ff6b8f2 len=38 special=-  [`ok`]
MATCH ar ok           sha1=33af5aaaf5 len=27 special=-  [`ok`]
MATCH fr near.zero    sha1=b9e00215af len=40 special=-  [`near`, n = 0]
MATCH ar near.zero    sha1=c1cf401125 len=34 special=U+064F  [`near`, n = 0]
MATCH fr near.one     sha1=e59253d6a7 len=44 special=-  [`near`, n = 1]
MATCH ar near.one     sha1=17a3d47c61 len=41 special=U+0651  [`near`, n = 1]
MATCH fr near.two     sha1=c6f800494a len=45 special=-  [`near`, n = 2]
MATCH ar near.two     sha1=0d9791b1e6 len=38 special=U+0651  [`near`, n = 2]
MATCH fr near.few     sha1=bc09bb3ff4 len=47 special=-  [`near`, n = 3–10]
MATCH ar near.few     sha1=9371518e50 len=42 special=U+0651  [`near`, n = 3–10]
MATCH fr near.many    sha1=bc09bb3ff4 len=47 special=-  [`near`, n = 11–99]
MATCH ar near.many    sha1=7de893335b len=42 special=U+064B,U+0651  [`near`, n = 11–99]
MATCH fr near.other   sha1=bc09bb3ff4 len=47 special=-  [`near`, n = 100+]
MATCH ar near.other   sha1=43b0ddfaab len=40 special=U+0651  [`near`, n = 100+]
MATCH fr below        sha1=8fe88a59f6 len=38 special=-  [`below`]
MATCH ar below        sha1=83ebe26420 len=29 special=-  [`below`]
MATCH fr ended_below  sha1=1fd794a2e7 len=42 special=-  [Term over, a subject below T]
MATCH ar ended_below  sha1=30a9cbc095 len=43 special=-  [Term over, a subject below T]
MATCH fr ended_ok     sha1=d4de8a15dd len=57 special=-  [Term over, all subjects at or above T]
MATCH ar ended_ok     sha1=009985766f len=41 special=-  [Term over, all subjects at or above T]
MATCH fr others       sha1=d8e4bdedbd len=14 special=-  [prose: append suffix]
MATCH ar others       sha1=6ba8c0841e len=10 special=-  [prose: append suffix]
near keys fr ['few', 'many', 'one', 'other', 'two', 'zero'] ar ['few', 'many', 'one', 'other', 'two', 'zero']
nbsp/narrow-nbsp anywhere in new strings: False
ALL MATCH
```
The U+064F / U+0651 / U+064B marks are the damma, shadda and tanwin present in Design's Arabic (يُسمح, يتبقّى, غيابًا) — they are in the doc too. Neither side has NBSP or narrow NBSP: §3's French uses a plain space before ":", and the PWA strings do the same. The apostrophe in "d'absences" is ASCII U+0027 in both.

Check 2 (independent of the table parser, since check 1 shares the parser with the writer): each unbraced JSON value searched as a raw UTF-8 byte substring of §3, delimited as `| value |` or `"value"`: all 22 found.

### Verification: `near` is a PluralKey
A temporary `pwa/lib/__m5_pluralkey_check.ts` (deleted, never committed) compiled under the project's `tsc --noEmit`, exit 0:
- `Equals<PluralKey, 'dashboard.attendance.near'>` is `true` (it is the only PluralKey);
- the five plain keys are `TranslationKey`s;
- `@ts-expect-error` holds for `TranslationKey = 'dashboard.attendance.near'` and `'dashboard.attendance.near.zero'`.

Negative control: adding a seventh key `seventh` to `near` in both files made tsc fail (`Type 'true' is not assignable to type 'false'` on the Equals line, and "Unused '@ts-expect-error'" on `near.zero`). The files were restored from backup and check 1 re-run: ALL MATCH.

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit

exit 0
```

`npm run build` (pwa/):
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 188ms
  Creating an optimized production build ...
✓ Compiled successfully in 1967ms
  Running TypeScript ...
  Finished TypeScript in 14.9s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 665ms
  Finalizing page optimization ...
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule
ƒ  (Dynamic)  server-rendered on demand

exit 0
```

### Flagged
- No copy was invented. Every row in §3 mapped onto a key; nothing missing or ambiguous, so no placeholder was needed.
- **Flag 5 is still open.** `others` is copied as Design wrote it: "+ {{k}} autre(s)" / "+ {{k}} أخرى", not pluralised. Design still has to say whether the suffix applies in the ended-below state and where it attaches. Milestone 6 needs that answer.
- The key name `others` is my choice; the mission only said "the '+ {k}' suffix".
- Seuil label not added (Flag 2).
- French `near.zero` is only reachable because `pluralCategory` maps n = 0 to `zero` (milestone 3); `two`, `few` and `other`, and `many` except for exact millions, are never selected in French. That is the accepted cost of the shape guard.

### Could not do
- Open the PR (`gh` missing).
