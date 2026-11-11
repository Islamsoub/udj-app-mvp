# Progress — PWA justification form states and Arabic tracking

## Milestone 4 — Arabic: no negative tracking on translated headings

Branch `feature/pwa-arabic-heading-tracking`, cut from `origin/develop` at 5e10463.

### What was done
- I re-checked every line in the mission's heading table against 5e10463. All of them matched.
- I added 11 `letter-spacing: normal` resets keyed on `html[lang="ar"]`. Each sits directly after the rule it overrides. No existing line changed: the diff is additions only.
  - `attendance.module.css` `.heading`
  - `dashboard.module.css` `.heading`
  - `grades.module.css` `.heading`
  - `schedule.module.css` `.heading`
  - `news.module.css` `.heading` and `.readerTitle`
  - `profile.module.css` `.heading`
  - `shell.module.css` `.title` and `.pageHeading`
  - `login.module.css` `.brand`
  - `public/offline.html` `.brand`, in the inline `<style>`, beside its existing `html[lang="ar"]` rules
- Comments follow the Decision section:
  - the full verbatim sentence goes on the first reset in each module;
  - the second reset in news and shell carries the pointer (`see the note at .heading` / `.title`);
  - offline.html has one line.
- Unchanged: `.brandName`, `.heroNumber`, `.subjectValue`, `.unreadCount`, `.calcCurrentValue`, `.calcResultValue`, `.langCode`, `.inputId`. sw.js and globals.css are not touched either.
- `git diff | grep 'dir='`: the only hits are the verbatim comment text `[dir="rtl"]`, which the mission requires. There is no `dir=` selector.
- The build emitted all 10 module resets as pure local selectors, without `:global()`. From `.next/static`:
  ```
  html[lang=ar] .attendance-module__x3Sz0G__heading{letter-spacing:normal}
  html[lang=ar] .dashboard-module__TLbDmW__heading{letter-spacing:normal}
  html[lang=ar] .grades-module__gHKvdW__heading{letter-spacing:normal}
  html[lang=ar] .login-module__r9bFSG__brand{letter-spacing:normal}
  html[lang=ar] .news-module__fX7sZa__heading{letter-spacing:normal}
  html[lang=ar] .news-module__fX7sZa__readerTitle{letter-spacing:normal}
  html[lang=ar] .profile-module__rFBM0W__heading{letter-spacing:normal}
  html[lang=ar] .schedule-module__Z3P5OW__heading{letter-spacing:normal}
  html[lang=ar] .shell-module___5GqhW__pageHeading{letter-spacing:normal}
  html[lang=ar] .shell-module___5GqhW__title{letter-spacing:normal}
  ```

### Service worker (sw.js read, not touched)
`public/sw.js` ~62-106: the page registers the worker as `/sw.js?build=<NEXT_PUBLIC_BUILD_ID>` (`components/pwa/service-worker.ts:23`).
- `VERSION = unipocket-v${CACHE_SCHEMA}-${BUILD}`, and `STATIC_CACHE` is derived from it.
- `/offline.html` is in `PRECACHE_URLS` (line 133), fetched with `cache: 'reload'` on install (line 161).
- `activate` deletes every cache not in `CURRENT_CACHES` (line 186).

So a deploy installs a new worker, which caches a fresh `offline.html` under a new per-build cache name and drops the old one once the student accepts the update. **No `CACHE_SCHEMA` bump is needed**, and sw.js is unchanged.

### Checks (pwa/)
`npm run typecheck`:
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit

EXIT 0
```
`npm run build` (env value lines omitted; none were printed):
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 2.3s

  Creating an optimized production build ...
✓ Compiled successfully in 25.6s
  Running TypeScript ...
  Finished TypeScript in 28.2s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/12) ...
✓ Generating static pages using 7 workers (12/12) in 1447ms
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

EXIT 0
```

### Computed letter-spacing (Playwright, `next start -p 3104`, real test account, read-only)
Language is set with the `unipocket_lang` cookie. Values are `getComputedStyle(el).letterSpacing`, and the element's `<html lang>` was confirmed for each row. **Everything is real data. Nothing is stubbed.** No form was submitted, apart from the login.

| Rule | Where | FR | AR | Expected |
|---|---|---|---|---|
| attendance `.heading` | /attendance | -0.3px | normal | reset |
| dashboard `.heading` | / | -0.3px | normal | reset |
| grades `.heading` | /grades | -0.3px | normal | reset |
| schedule `.heading` | /schedule | -0.3px | normal | reset |
| news `.heading` | /news | -0.3px | normal | reset |
| news `.readerTitle` | /news?article=… | -0.3px | normal | reset |
| profile `.heading` | /profile | -0.3px | normal | reset |
| shell `.title` (topbar) | every page, at 1280 and 390 | -0.2px | normal | reset |
| shell `.pageHeading` | not rendered: `RoutePlaceholder` is imported nowhere now | n/a | n/a | checked in the build CSS (above): `html[lang=ar] .shell-module___5GqhW__pageHeading{letter-spacing:normal}` |
| login `.brand` | /login | -0.3px | normal | reset |
| offline.html `.brand` | /offline.html, `lang` set by Playwright | -0.3px | normal | reset |
| shell `.brandName` "Unipocket" | / @1280 (the sidebar is hidden at 390) | -0.2px | -0.2px | keep |
| attendance `.heroNumber` | /attendance | -1.32px | -1.32px | keep |
| attendance `.subjectValue` | /attendance | -0.34px | -0.34px | keep |
| dashboard `.unreadCount` | / | -1.02px | -1.02px | keep |
| login `.langCode` | /login | 0.22px | 0.22px | keep |
| login `.inputId` | /login | 0.29px | 0.29px | keep |
| dashboard / grades `.heroNumber` | not rendered: the test account has no published GPA ("results not published") | n/a | n/a | unchanged by the diff |

### Screenshots (`screenshots/m4/`, AR, light, 1280 unless noted)
- `ar-attendance.png`, `ar-dashboard.png`, `ar-grades.png`, `ar-schedule.png`, `ar-news.png`, `ar-profile.png`: page headings, with the topbar title also visible at 1280.
- `ar-news-article.png`: an article title.
- `ar-topbar-title-390.png`: the topbar title at phone width.
- `ar-login-brand.png`: "جامعة جيبوتي".
- `ar-offline.png`: offline.html.

### Flagged
- **Comment collision with milestone 3 (for whoever merges second).**
  - In attendance, dashboard, grades and schedule, this branch's `.heading` reset is the first `html[lang="ar"]` rule in the file, so it carries the full verbatim comment.
  - Milestone 3 also puts the full comment on *its* first reset in those four files.
  - After both merge, each of those files has the full sentence twice. Taken literally, the Decision section wants the later one (milestone 3's, lower in the file) reduced to `/* Arabic: no tracking — see the note at .heading. */`.
  - This is a one-line follow-up for whoever merges second. I did not do it, because it is outside this milestone's paths.
- **`.pageHeading` is dead in practice.** `RoutePlaceholder.tsx` is not imported anywhere, so the reset is verified only in the built CSS. That is not in scope here.
- No user-facing copy was added.

### Could not do
- **No PR opened.** `gh` is not installed. The branch is pushed, and the PR text is below.
- **Dashboard and grades `.heroNumber` not read live.** The test account has no published GPA. The attendance `.heroNumber` stands in, and the diff does not touch any figure rule.

### PR (ready to paste)
**Title:** `fix(pwa): no negative letter-spacing on Arabic headings`

**Description:**
```
Does not touch backend/prisma/schema.prisma.

Mission 2026-11-11-pwa-justification-form-arabic-tracking, milestone 4.

In Arabic (`<html lang="ar">`), the 11 translated headings no longer apply negative letter-spacing. Tracking pulls apart Arabic letters, which join. French is unchanged.

- Each reset is `html[lang="ar"] .<rule> { letter-spacing: normal; }`, placed directly after the rule it overrides. The diff is additions only.
- Files: attendance, dashboard, grades, schedule and profile `.heading`; news `.heading` and `.readerTitle`; shell `.title` (topbar) and `.pageHeading`; login `.brand`; `public/offline.html` `.brand`.
- The selectors are keyed on language, not direction. They are not `[dir="rtl"]` selectors, and the comment beside each one says why. Do not remove them as a breach of the no-`[dir="rtl"]` rule.
- Kept, because the text is always Latin: `.brandName` ("Unipocket"), the `.num` figures, `.langCode` and `.inputId`.
- sw.js is unchanged. The offline cache is per build (`?build=` drives VERSION), so a deploy refreshes offline.html.

Checks, by hand, since pwa/ has no CI:
- `npm run typecheck` and `npm run build` pass.
- Computed letter-spacing was read with Playwright in FR and AR. The table and screenshots are in the mission's PROGRESS.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
