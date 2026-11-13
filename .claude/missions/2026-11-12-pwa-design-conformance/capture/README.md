# PWA capture harness

Renders any PWA screen from a **production build** (`next build` + `next start`)
with every `/api/**` request answered in the browser from `fixtures/`. No
backend, no database, no credential. Also renders the spec pack's reference
pages and writes side-by-side `index.html` pages. Implements MISSION.md D3/D6.

Everything here is untracked (MISSION.md D2). Nothing is added to `pwa/`.

## Requirements (already on this machine)

- Google Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`
  (launched as `channel: 'chrome'`, headless).
- Playwright 1.65.0, resolved from `$PLAYWRIGHT_MODULE`, else from the npx cache
  `C:/Users/urohe/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright`.
  If neither exists: `npx -y playwright@1.65.0 --version`, then point
  `PLAYWRIGHT_MODULE` at the new `.../_npx/<hash>/node_modules/playwright`.
  No `playwright install` is needed.
- `pwa/node_modules` installed in the worktree you capture
  (`npm ci --legacy-peer-deps` in `pwa/`).

## Paths used below

```sh
MISSION=C:/Users/urohe/documents/udj-app-mvp/.claude/missions/2026-11-12-pwa-design-conformance
CAP=$MISSION/capture/capture.mjs
PWA=<your worktree>/pwa          # e.g. C:/Users/urohe/Documents/udj-wt-dc-m1/pwa
```

## Capture a milestone (before / after)

`--pwa` builds the worktree, starts `next start` on 127.0.0.1:3199, captures,
and stops the server, all in one command. The build and server run with
`NEXT_PUBLIC_API_URL=http://127.0.0.1:9 PWA_PROXY_SECRET=` in the process env,
which beats `.env.local`, so a leaked server-side call hits a dead port. The
harness never reads any `.env` file.

Before the first edit, in a worktree checked out at the base branch:

```sh
node $CAP --pwa $PWA --out $MISSION/screenshots/mN/before --screens dashboard
```

After the last edit, in the milestone worktree:

```sh
node $CAP --pwa $PWA --out $MISSION/screenshots/mN/after --screens dashboard
node $CAP index --dir $MISSION/screenshots/mN
```

Defaults: `--themes light,dark --langs fr,ar --widths 1440 --scenario default`,
i.e. all four light/dark × FR/AR combinations at 1440. Add what the milestone
lists, e.g. `--widths 1440,834,390 --scenario default,loading`. Lists are
comma-separated. Add `--no-build` to reuse the last build of the same tree
(only if that build was made by this harness — it sets the safe env).

Several jobs in one server lifetime: `--plan <file.json>`, an array of option
objects (same keys as the flags, without `--`). Relative paths inside a plan
resolve against the plan file's folder. See `plans/baseline.json`.

Exit code: 0 only if every capture succeeded with no unanswered `/api` request
and no blocked off-origin request. Anything else exits 1 and prints `FAILURES:`.

## Options

| Flag | Meaning |
|---|---|
| `--pwa <dir>` | Build + serve that `pwa/` (port `--port`, default 3199). Or `--base-url http://127.0.0.1:<port>` for a server you started yourself with the safe env. |
| `--out <dir>` | Output folder. |
| `--screens` | `login, dashboard, schedule-week, schedule-day, grades, attendance, news, news-article, profile, offline-page` (default: all). |
| `--themes`, `--langs`, `--widths` | Set by cookie (`unipocket_theme`, `unipocket_lang`) before the first navigation; viewport height 900, DPR 1. |
| `--scenario` | `default`, `empty`, `error` (500 on every data route), `loading` (data routes never answered: skeletons), `offline` (`context.setOffline(true)` after load). Login only: `error-credentials` (401, attemptsLeft 2), `locked` (423), `rate-limit` (429, `RateLimit-Reset: 47`); the form is filled and submitted. A scenario that does not apply to a screen is skipped and logged. |
| `--full-page` | Full-page screenshot. |
| `--click <sel>` | Click before capture. Repeatable. E.g. collapse the sidebar: `--click '[class*="collapseButton"]' --label collapsed`; open the avatar menu: `--click '[aria-haspopup="menu"]' --label menu`. |
| `--hover <sel>`, `--press <sel>`, `--focus <sel>` | Interaction state at capture time. Press holds the mouse down over the element's centre. Focus presses Tab first so `:focus-visible` matches. Class names are hashed, so match with `[class*="name"]`. |
| `--scroll <y>` | `window.scrollTo(0, y)` before capture. |
| `--hook <module.mjs>` | `export default async ({ page, context, screen, theme, lang, width, scenario, settle }) => {}` — runs before capture, for anything the flags do not cover (e.g. firing toasts). |
| `--label <state>` | Overrides the state part of the file name. |
| `--fixtures <dir>`, `--omit <file.json>` | Use another fixture root / pretend one fixture file is missing (used to prove fail-closed). |

File names follow D6: `<screen>--<theme>--<lang>[--<width>][--<state>].png`.
Width is omitted at 1440; state is omitted for `default`. With no `--label`,
state is the scenario plus `hover`/`press`/`focus`, joined with `-`.

Note: below 640 px the schedule has no Day/Week toggle and always shows the day
view, so `schedule-week` at 390 is the day view.

## How a capture runs (D3)

1. New browser context per image: viewport, `timezoneId: 'Africa/Djibouti'`,
   `serviceWorkers: 'block'`, theme and language cookies,
   `clock.setFixedTime('2026-11-10T09:15:00+03:00')` (a Tuesday; timers still
   run, so entrance animations and the 400 ms skeleton minimum play out).
2. Every request is routed:
   - another origin → aborted, and the run fails;
   - `/__fixtures/<file>` → `fixtures/assets/<file>` (news hero images,
     justification PDFs);
   - `POST /api/auth/refresh` → `{ accessToken }`, an unsigned JWT whose payload
     is `{"studentId":"fixture-student"}` (401 on the login screen);
   - `POST /api/auth/login` → per login scenario;
   - `GET /api/backend/<path>` → the fixture file below, or 599 and a failure;
   - any other `/api` request → 599 and a failure.
3. Wait for load, network idle, and no element matching `[class*="skeleton" i]`.
   Then settle: `document.fonts.ready`, then every finite
   `document.getAnimations()` finished (infinite ones, like the shimmer, are
   ignored).
4. Scenario steps, clicks, scroll, hook, interaction state, screenshot.

A `page error: Cannot read properties of undefined (reading 'waiting')` warning
on every PWA capture is expected and harmless: with `serviceWorkers: 'block'`,
Playwright's stub makes `navigator.serviceWorker.register()` resolve to
`undefined`, and `components/pwa/service-worker.ts` then reads `.waiting` on it.
It has no visible effect.

## Fixtures

`fixtures/<scenario>/` is searched first, then `fixtures/default/`.
`GET /api/backend/<a>/<b>?k=v` maps to `<a>-<b>--k-v.json`:

| Request | File |
|---|---|
| `/student/me` | `student-me.json` |
| `/student/schedule` | `student-schedule.json` |
| `/student/grades` | `student-grades.json` |
| `/student/grades?allSemesters=true` | `student-grades--allSemesters-true.json` |
| `/student/grades?semesterId=sem-s3` | `student-grades--semesterId-sem-s3.json` |
| `/student/attendance` | `student-attendance.json` |
| `/student/notifications?limit=3` | `student-notifications.json` (paged by the harness) |
| `/news?limit=…&offset=…` | `news.json` (paged and category-filtered by the harness) |
| `/news/<id>` | `news--<id>.json` |

The sample student is the spec's: Amina Moussa, UDJ-2024-0451, Licence
Informatique, Faculté des Sciences, semester 4, GPA 12.3 "Assez Bien",
attendance 87 %. Course names, rooms and lecturers come from prototype-v1's
`COURSES`/`GRADES`/`ATTEND`; news from its `ARTICLES`; notifications from the
dashboard spec. At the fixed time the next class is "Systèmes d'exploitation"
in 45 min, as in the spec. Payloads follow `pwa/lib/api-types.ts`;
`student-attendance.json` passes `lib/attendance-contract.ts`. Addresses use
`example.invalid`. Values invented for the fixtures are listed in PROGRESS.md.

If a later milestone's code makes a new request, the run fails with
`no fixture for GET /api/backend/...`: add the file, do not loosen the harness.

## Spec reference renders

```sh
node $CAP reference --spec-pack <worktree>/design/spec-pack --out $MISSION/screenshots/reference
```

`--only <regex>` renders only the files whose name matches (the pack copies
are always refreshed). A full run takes about 8 minutes (116 renders).

Serves the spec pack from 127.0.0.1 on a random port. The login and prototype
pages link a remote font stylesheet; it is never fetched — any cross-origin
stylesheet is answered with the pack's own `specs/pwa/dashboard/css/fonts.css`
(rewritten to the local origin), and every other cross-origin request is
aborted. Writes:

- `reference/pack/` — the pack's own `screenshots/pwa-dashboard` and
  `pwa-login` renders, copied under harness names
  (`light-fr-error-rate-limit.png` → `login--light--fr--rate-limit.png`,
  `light-fr-offline.png` → `login--light--fr--offline-switch.png`).
- `reference/render/`
  - `dashboard.html?theme=&lang=` and `&collapsed=1` at 1440, 834, 390;
  - `login-screen.html` in `default` (1440 and 390), `error-credentials`,
    `rate-limit`, `offline-switch` (demo controls and the "Démo" hint hidden,
    as in the pack renders);
  - prototype-v1 views `schedule-week`, `schedule-day`, `grades`, `attendance`,
    `news`, `profile` at 1440, 834, 390 (logged in with its demo button,
    language and theme set through its own `applyLang`/`applyTheme`).

## Index pages

```sh
node $CAP index --dir $MISSION/screenshots/mN
```

Writes `mN/index.html`: one row per file name found in `before/` or `after/`
(or in the folder itself, for `baseline/`), with before | after | pack
screenshot | M0 spec render. A reference matches on the exact name, then
without the state, then without the width.

## Baseline (M0)

```sh
node $CAP --pwa <origin/develop worktree>/pwa --plan $MISSION/capture/plans/baseline.json
node $CAP reference --spec-pack <origin/develop worktree>/design/spec-pack --out $MISSION/screenshots/reference
node $CAP index --dir $MISSION/screenshots/baseline
```

## Proving fail-closed

```sh
node $CAP --pwa $PWA --no-build --out <scratch dir> --screens dashboard --themes light --langs fr --omit student-attendance.json
echo $?   # 1, with "no fixture for GET /api/backend/student/attendance"
```

## Stopping

The harness stops the server it started, also on Ctrl-C (`taskkill /T /F` on
Windows). If a run is killed hard, check `netstat -ano | grep :3199` and end
that PID.
