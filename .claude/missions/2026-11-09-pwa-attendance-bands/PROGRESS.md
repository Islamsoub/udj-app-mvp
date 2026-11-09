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


## Milestone 7: Attendance page reads the band (2026-11-09)

**Branch:** `feature/pwa-attendance-page-band`, cut from origin/develop at 9a11de0. Commit e09d37d has been pushed to origin. Built in parallel with milestone 6; it touches none of 6's files or locale subtrees.

**PR: not opened** (`gh` is not available). Open it by hand against `develop`: https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-attendance-page-band?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."

### What was done
- **Hero.tsx.** The local `below` boolean is gone. A private `heroLine(overall)` returns `{ key, tone }` from `overall.band` / `overall.absencesLeft` only:
  - term over (`absencesLeft === null`) is checked first: `ended_below` (danger) if the band is `below`, otherwise `ended_ok` (neutral);
  - otherwise `ok` → `attendance.hero.threshold` (neutral), `near` → `attendance.hero.near` (warning), `below` → `attendance.hero.below` (danger).
  - `WarningIcon` is shown for every non-neutral tone, in the text's colour (currentColor). `overall.absencesLeft` is never shown (§4). `threshold` stays a prop, displayed only.
- **PresenceRing.tsx.** A new `band: AttendanceBand` prop; the Hero passes `overall.band`. The stroke is `--jade` / `--warning-ink` / `--danger`. Track and `aria-label` are unchanged.
- **SubjectBreakdown.tsx.** The local `below` boolean is gone. A private `subjectRow(entry)` returns `{ tone, flag }`:
  - term over first: `below` gives the below tone with `attendance.subjects.ended_below`; any other band gives no flag and no tone;
  - `near` → `plural('attendance.subjects.near', absencesLeft)`, rendered with `Interpolated`, so `{{n}}` is `.num`;
  - `below` → `attendance.subjects.below`; `ok` → no flag.
  - Every flag keeps `WarningIcon` in the text's colour. The §10 doc comment at the top was rewritten: it no longer mentions "Sous le seuil" or the tint. `threshold` is still used for the note and `--bar-threshold`.
- **attendance.module.css.**
  - `.heroThresholdNear` is `--warning-ink`. `.heroThresholdBelow` is now `--danger-ink`; before, it was the only below class and used `--warning-ink`.
  - `.ringValueNear` / `.ringValueBelow`.
  - `.subjectNear` (border, fill and figure all `--warning-ink`) and `.subjectBelow` (border and fill `--danger`, figure `--danger-ink`). `.subjectValueBelow` was removed, because the figure colour now hangs off the row class.
  - `.subjectFlagBelow` is `--danger-ink`.
  - `--warning` and `--warning-bg` are no longer used on these rows. No token was added and globals.css was not touched.
  - The comments carry the measured ratios. I recomputed them with WCAG 2.x from the globals.css hex values, and they agree with §3/§4 wherever §3/§4 quote one:

    | Token | Light, on `--surface` | Dark, on `--surface` | Light, on `--sunken` | Dark, on `--sunken` |
    |---|---|---|---|---|
    | `--jade` | 3.39 | 6.17 | | |
    | `--warning-ink` | 6.39 | 8.36 | 5.33 | 9.88 |
    | `--danger` | 3.76 | 5.56 | 3.14 | 6.57 |
    | `--danger-ink` | 6.54 | 7.59 | | |
    | `--warning` | 2.15 | | | |
- **Locales.** Only `attendance.hero` and `attendance.subjects` change, in both files:
  - hero: `near`, `ended_below` and `ended_ok` are new, `below` is rewritten, and `threshold` is unchanged;
  - subjects: `near` is new (a plural object with exactly the six keys), `below` is rewritten, and `ended_below` is new.
  - The strings were not retyped. A script parsed §4's two tables and wrote them.

### Verification
**Locales against §4, by script.** Check 1 compares each JSON value with its parsed §4 cell. Check 2, which is independent of the parser, finds each value as a raw `| value |` substring of §4. Both FR and AR gave:
```
MATCH attendance.hero.{threshold,near,below,ended_below,ended_ok}
MATCH attendance.subjects.near.{zero,one,two,few,many,other}  (keys exactly the six, in order)
MATCH attendance.subjects.{below,ended_below}
substring checks: all True
ALL MATCH
```
- `git diff` on the locale files shows hunks only inside `attendance.hero` and `attendance.subjects`.
- The JSON round-trip (`json.dumps(indent=2, ensure_ascii=False)`) was confirmed byte-identical before writing, so there is no formatting churn.

**PluralKey.** A temporary `pwa/lib/__m7_pluralkey_check.ts`, deleted and never committed, compiled under `tsc --noEmit` with exit 0:
- `Equals<PluralKey, 'dashboard.attendance.near' | 'attendance.subjects.near'>` is `true`. On develop that is milestone 5's key plus exactly `'attendance.subjects.near'`.
- The five new or rewritten plain keys are `TranslationKey`s.
- `@ts-expect-error` holds for `'attendance.subjects.near'` and `'attendance.subjects.near.zero'` as `TranslationKey`.

Negative control: asserting `Equals<PluralKey, 'dashboard.attendance.near'>` fails (`Type 'true' is not assignable to type 'false'`). When milestone 6 merges, `dashboard.attendance.others` joins the union; that is expected.

**Grep gate.** `grep -rnE "percentage\s*<|<\s*threshold" pwa/components pwa/lib` returns nothing (exit 1).

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit

exit 0
```

`npm run build` (pwa/):
```
  Creating an optimized production build ...
✓ Compiled successfully in 6.4s
  Running TypeScript ...
  Finished TypeScript in 4.9s ...
  Collecting page data using 3 workers ...
✓ Generating static pages using 3 workers (12/12) in 288ms
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
- No copy was invented. Every §4 row mapped onto a key, so no placeholder was needed.
- **Flag 8 (row tint), Design to confirm.** The rows now carry no background tint, because §4's treatment table has no background column. Near rows are signalled by border, fill and figure in `--warning-ink`; below rows by a `--danger` border and fill with a `--danger-ink` figure. Every non-ok row also carries the icon and a sentence.
- **Flag 4 (term over, overall band `near`), Design to confirm.** On this page, following §4 literally:
  - the Hero line is `ended_ok`, "Semestre terminé · seuil requis : 75%", in `--ink2` with no icon;
  - the PresenceRing stroke beside it is `--warning-ink`, because the ring follows `overall.band`.
- **Term-over subject rows.** These are my reading of §4: "Row treatment" is keyed by band, and "Subject rows" by term-over state.
  - A term-over `below` subject keeps the below row treatment (danger border and fill, `--danger-ink` figure) and the `ended_below` sentence.
  - A term-over `near` subject gets the ok treatment, with no flag and no near tone, as the mission says.
- **`.heroThresholdBelow` changed colour.** It was `--warning-ink` and is now `--danger-ink`, per §4. This is the hero's below state, not a new class.

### Could not do
- **Screenshots.** Agents have no PWA login, so this run could not render the attendance page. These states are a human check before merge, using a stubbed `/student/attendance` response that is reverted afterwards: subjects in each band, `near` at n = 0, 1, 2 and 5, and a term-over page with one subject below; each in light and dark, FR and AR. No stub was made or committed.
- Open the PR (`gh` is not available).


## Milestone 6: Dashboard card shows the band (2026-11-09)

**Branch:** `feature/pwa-attendance-dashboard-band`, cut from origin/develop at 9a11de0. Commit 3cd4a06 has been pushed to origin.

**PR: not opened** (`gh` is not available). Open it by hand against `develop`: https://github.com/Islamsoub/udj-app-mvp/compare/develop...feature/pwa-attendance-dashboard-band?expand=1
- The description's first line should be "No change to backend/prisma/schema.prisma."
- The rest can be copied from the commit message.

### What was done
Five files, all inside milestone 6's declared paths.
- **pwa/components/dashboard/AttendanceCard.tsx.**
  - The line under the ring comes from `attendanceLine(data.subjects, lang)`. `null` (no subjects) shows the existing empty state, and so do a null `overall` or a null `percentage`, as before.
  - `near` uses `plural('dashboard.attendance.near', n)`. `ok`, `below`, `ended_below` and `ended_ok` use `t()`.
  - Rendering uses `fmtPhrase`, not `Interpolated`: `{{subject}}` sits in a `<bdi>` with no `.num`. `{{n}}` and `{{k}}` are `<span class="num">` inside their own `<bdi>`, with Western digits.
  - **Suffix (§5).** It is rendered as `" · "` followed by `plural('dashboard.attendance.others', others)`, and only for `near`, `below` and `ended-below` when `others > 0`. It sits inside the line's own `<span>`, after the sentence (so after the subject's `<bdi>`), and inherits the line's colour. " · " is a named component constant, `SUFFIX_SEPARATOR`.
  - **Seuil label.** `<strong>` containing `Interpolated(t('dashboard.attendance.threshold'), { threshold: fmtPercent(data.attendanceThreshold) })`. The colour follows `overall.band`. The threshold is displayed only and never compared.
  - **Layout.** The ring is on one side. Beside it is a column: the existing sessions sentence, then one `<p>` that holds the Seuil `<strong>` with the line below it as a block `<span>`. This follows the prototype's `.attend-note` markup (`dashboard.html`). The prototype has no sessions sentence; the shipped card has one and keeps it on top. Design to confirm the order.
- **pwa/components/dashboard/Ring.tsx.** A new required `band: AttendanceBand` prop maps to `.ringValueOk` / `.ringValueNear` / `.ringValueBelow`. The track, the `aria-label`, the fill animation and the label inside the ring are unchanged.
- **pwa/components/dashboard/dashboard.module.css.**
  - `.ringValue` loses its fixed `--jade` stroke. Three band classes (`--jade` / `--warning-ink` / `--danger`) replace it, with a comment carrying §3's measured figures (3.39/6.17, 6.39/8.36, 3.76/5.56) and why `--warning` (2.15) is not used.
  - Also added: `.attendanceText`, `.attendanceThreshold{Ok,Near,Below}` (`--jade-text` / `--warning-ink` / `--danger-ink`), `.attendanceLine{Ok,Near,Below}` (`--ink2` / `--warning-ink` / `--danger-ink`; near and below are weight 600, as in the prototype), and `.attendanceOthers` (nowrap, as in the prototype).
  - No new tokens, and globals.css is untouched. Logical properties only, with no `[dir="rtl"]`.
- **pwa/locales/fr.json, pwa/locales/ar.json.** These change only under `dashboard.attendance`:
  - new `threshold`;
  - `others` reshaped from a string into the six-form plural object.

  Nothing else changed.

### Verification
**Copy vs the close-out, by script.** The script parsed §3's Seuil template row and §5's suffix table from `design/spec-pack/ROUND2-CLOSEOUT.md`, then compared each against the JSON:
```
threshold fr MATCH 'Seuil : {{threshold}}'
others fr zero  MATCH mission (FR "—" -> other form) '+ {{k}} autres matières'
others fr one   MATCH §5 '+ 1 autre matière'
others fr two   MATCH mission (FR "—" -> other form) '+ {{k}} autres matières'
others fr few   MATCH mission (FR "—" -> other form) '+ {{k}} autres matières'
others fr many  MATCH §5 '+ {{k}} autres matières'
others fr other MATCH §5 '+ {{k}} autres matières'
threshold ar MATCH 'الحد الأدنى: {{threshold}}'
others ar zero  MATCH §5 '+ {{k}} مادة أخرى'
others ar one   MATCH §5 '+ مادة أخرى'
others ar two   MATCH §5 '+ مادتان أخريان'
others ar few   MATCH §5 '+ {{k}} مواد أخرى'
others ar many  MATCH §5 '+ {{k}} مادة أخرى'
others ar other MATCH §5 '+ {{k}} مادة أخرى'
ALL MATCH
```
(The script removed the AR zero cell's "(never rendered)" annotation before comparing. §5 already writes `{{k}}` with double braces.)

**PluralKey.** A temporary `pwa/lib/__m6_pluralkey_check.ts` was compiled under the project's `tsc --noEmit` (exit 0) and then deleted; it was never committed.
- `Equals<PluralKey, 'dashboard.attendance.near' | 'dashboard.attendance.others'>` is `true`.
- `'dashboard.attendance.threshold'` is a `TranslationKey`.
- `@ts-expect-error` holds for `TranslationKey = 'dashboard.attendance.others'` and `'…others.one'`.

Negative control: `Equals<PluralKey, 'dashboard.attendance.near'> = true` fails with TS2322.

**Contrast, re-measured** (WCAG, on `--surface`, light #FFFFFF / dark #1C2721):
- `--warning-ink`: 6.39 / 8.36
- `--danger-ink`: 6.54 / 7.59
- `--jade`: 3.39 (light)
- `--danger`: 3.76 (light)

These match §3. `--jade-text` 6.20 / 8.34 and `--ink2` 5.49 / 6.78 were measured for the new comments.

**Line states (string-level substitute for screenshots).** This ran the real `attendanceLine` (model.ts) and `pluralCategory` (i18n-shared.ts), plus both locale files, under Node 22 `--experimental-strip-types`. It used a harness that mirrors `LineText`'s composition. `⟨…⟩` marks a fmtPhrase `<bdi>` and `[..]` a `.num` span.
```
--- fr
ok                          ok          --ink2        Toutes les matières au-dessus du seuil
near n=0                    near        --warning-ink ⟨Statistiques L2⟩ : plus aucune absence possible
near n=1                    near        --warning-ink ⟨Statistiques L2⟩ : encore 1 absence avant la limite
near n=2                    near        --warning-ink ⟨Statistiques L2⟩ : encore ⟨[2]⟩ absences avant la limite
near n=5                    near        --warning-ink ⟨Statistiques L2⟩ : encore ⟨[5]⟩ absences avant la limite
near n=11                   near        --warning-ink ⟨Statistiques L2⟩ : encore ⟨[11]⟩ absences avant la limite
below k=0                   below       --danger-ink  ⟨Statistiques L2⟩ : limite d'absences dépassée
below k=1                   below       --danger-ink  ⟨Chimie⟩ : limite d'absences dépassée · + 1 autre matière
below k=2                   below       --danger-ink  ⟨Chimie⟩ : limite d'absences dépassée · + ⟨[2]⟩ autres matières
below k=3                   below       --danger-ink  ⟨Chimie⟩ : limite d'absences dépassée · + ⟨[3]⟩ autres matières
near k=1                    near        --warning-ink ⟨Statistiques L2⟩ : encore 1 absence avant la limite · + 1 autre matière
ended-below k=0             ended-below --danger-ink  ⟨Statistiques L2⟩ : semestre terminé sous le seuil
ended-below k=1             ended-below --danger-ink  ⟨Chimie⟩ : semestre terminé sous le seuil · + 1 autre matière
ended-ok                    ended-ok    --ink2        Semestre terminé — toutes les matières au-dessus du seuil
ended, worst near (Flag 4)  ended-ok    --ink2        Semestre terminé — toutes les matières au-dessus du seuil
no subjects                 EMPTY STATE
--- ar
ok                          ok          --ink2        جميع المواد فوق الحد الأدنى
near n=0                    near        --warning-ink ⟨الإحصاء L2⟩: لا يُسمح بأي غياب إضافي
near n=1                    near        --warning-ink ⟨الإحصاء L2⟩: يتبقّى غياب واحد قبل بلوغ الحد
near n=2                    near        --warning-ink ⟨الإحصاء L2⟩: يتبقّى غيابان قبل بلوغ الحد
near n=5                    near        --warning-ink ⟨الإحصاء L2⟩: يتبقّى ⟨[5]⟩ غيابات قبل بلوغ الحد
near n=11                   near        --warning-ink ⟨الإحصاء L2⟩: يتبقّى ⟨[11]⟩ غيابًا قبل بلوغ الحد
below k=0                   below       --danger-ink  ⟨الإحصاء L2⟩: تم تجاوز حد الغياب
below k=1                   below       --danger-ink  ⟨الكيمياء⟩: تم تجاوز حد الغياب · + مادة أخرى
below k=2                   below       --danger-ink  ⟨الفيزياء⟩: تم تجاوز حد الغياب · + مادتان أخريان
below k=3                   below       --danger-ink  ⟨الإعلام⟩: تم تجاوز حد الغياب · + ⟨[3]⟩ مواد أخرى
near k=1                    near        --warning-ink ⟨الإحصاء L2⟩: يتبقّى غياب واحد قبل بلوغ الحد · + مادة أخرى
ended-below k=0             ended-below --danger-ink  ⟨الإحصاء L2⟩: انتهى الفصل دون بلوغ الحد الأدنى
ended-below k=1             ended-below --danger-ink  ⟨الإحصاء L2⟩: انتهى الفصل دون بلوغ الحد الأدنى · + مادة أخرى
ended-ok                    ended-ok    --ink2        انتهى الفصل — جميع المواد فوق الحد الأدنى
ended, worst near (Flag 4)  ended-ok    --ink2        انتهى الفصل — جميع المواد فوق الحد الأدنى
no subjects                 EMPTY STATE
```
- French n = 2 selects `other` through Intl, so Design's literal-"2" `two` row is never used. The output is identical anyway.
- The named subject changes between rows (Chimie, الفيزياء) because of §3's name tie-break among equal below subjects. That is expected.

`grep -nE "percentage\s*<|<\s*threshold" ` over the three changed component files returns nothing.

`npm run typecheck` (pwa/):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```
(no errors, exit 0)

`npm run build` (pwa/):
```
  Creating an optimized production build ...
✓ Compiled successfully in 7.3s
  Running TypeScript ...
  Finished TypeScript in 5.4s ...
  Collecting page data using 3 workers ...
✓ Generating static pages using 3 workers (12/12) in 257ms
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

### Flag 4: what the card looks like (term over, overall band `near`)
The tables were followed literally:
- the line reads `ended_ok` ("Semestre terminé — toutes les matières au-dessus du seuil" / "انتهى الفصل — جميع المواد فوق الحد الأدنى") in `--ink2`, regular weight;
- the Seuil label above it is `--warning-ink` and bold;
- the ring stroke is `--warning-ink`.

So an amber ring and label sit beside a neutral sentence saying everything is fine. The same mixed card occurs whenever the worst subject has ended in `near`, because `attendanceLine` maps every non-below term-over candidate to `ended-ok`. Design to confirm.

### Flagged
- **No copy was invented.** Every new string matches §3 / §5, and the French "—" cells carry the `other` form as the mission directs.
- **Flag 4** (above): the mixed card, as recorded.
- **Order inside the card.** The sessions sentence comes first, then the Seuil label, then the line. The prototype has no sessions sentence; Design to confirm.
- **Weight.** The near and below lines are 600 and the Seuil label is 700, following the prototype's `app.css`. §3 specifies colour only.
- **Line colour vs overall band can differ** even outside term-over. The prototype's own `?att=below` preview has overall `ok` and line `below`, so the Seuil and ring are jade while the line is danger. This is §3 as written, not a bug.
- The PR was not opened because `gh` is missing.

### Could not do
- **Screenshots.** No PWA login is available to agents, so the card could not be rendered in a browser. No TSX transpiler is installed outside Next, so a server render harness was not possible either. Nothing was stubbed in the repo.

  The string-level harness above covers the copy, the plural selection, the suffix rule and the tone per state. A human with a test account still owes these screenshots before merge, using a stubbed response that is then reverted:
  - `ok`, `near` (n = 0, 1, 2, 5), `below`, `below` with k = 1 and k = 2, both term-over states;
  - each in light and dark, FR and AR.

  The check should also confirm the Arabic subject name renders in the Arabic face (not `.num`) and that " · + مادة أخرى" stays at the sentence end in RTL.
- Open the PR.


## Orchestrator note: screenshots, fix round, container restart (2026-11-09)

The user supplied a non-real test student account, and the session's network was opened to the API host only, so both builders were resumed to take screenshots. The account's details are recorded nowhere in the repo. The container restarted before either builder could write up its results. What survived:

- **Fix round, both pushed.** The first review of each milestone found no defects. Each found one thing left worse: a new `STROKE_CLASS` constant had split the ring component from its doc comment. Both fixes are on origin:
  - milestone 6: `66f0305` (`Ring.tsx` only);
  - milestone 7: `ca8f820` (`PresenceRing.tsx` only).

  `diff-6.patch` and `diff-7.patch` are regenerated to include them.
- **Screenshots.** Taken against the live API with the test account. The attendance response was stubbed in the browser (Playwright route interception); nothing was stubbed in source. All at 1440 px wide, DPR 1.
  - `screenshots/m6/`: 48 card crops. ok, near n = 0/1/2/5, below, below k = 1 and k = 2, ended-below, ended-ok, and the Flag 4 case (`ended-near-flag4`). Each in light/dark × FR/AR. The four `_dashboard-below-k1--*` files are full-page context shots.
  - `screenshots/m7/`: 20 full pages. ok, near (one page carries n = 0, 1, 2 and 5 on four subjects), below, ended_below, and `ended_real` (the account's real, unstubbed data). Each in light/dark × FR/AR.
  - The orchestrator looked at a sample: m6 `below-k2--light--fr`, `near-n2--dark--ar`; m7 `near-fr-light`, `ended_below-ar-dark`. Each matches §3 / §4: copy, suffix placement after " · ", band colours on ring, label and rows, no row tint, RTL bar direction, and the Arabic dual with no numeral.
  - **For a human to look at:** in French, the number in "Encore 2 absences avant la limite" and in "Seuil requis : 75%" appears to sit in wider gaps than the words around it. This is visible in `m7-near-fr-light.png`. Not diagnosed.
- **Milestone 2 browser check, half done.** `screenshots/m2/` shows that, with `band` removed from the stubbed response, the attendance page shows its error state ("Impossible de charger votre assiduité." + Réessayer) and the dashboard card shows its own ("Impossible de charger cette section."). Whether the IndexedDB `/student/attendance` entry stayed unchanged was **not recorded** before the restart and is still owed.
