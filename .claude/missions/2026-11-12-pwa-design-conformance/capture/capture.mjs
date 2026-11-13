#!/usr/bin/env node
/**
 * PWA capture harness (mission 2026-11-12-pwa-design-conformance, M0).
 *
 * Renders PWA screens from a production build with every /api request answered
 * from fixtures/ — no backend, no database, no credential — and renders the
 * design spec pack's reference pages the same way. See README.md.
 *
 * Fail-closed rules (MISSION.md D3):
 *   - every /api/** request without a fixture is answered 599, logged, and the
 *     run exits non-zero;
 *   - every request to any origin other than the local server is aborted;
 *     from a PWA page that also fails the run;
 *   - the server is built and started with NEXT_PUBLIC_API_URL pointing at a
 *     dead local port and PWA_PROXY_SECRET empty, so a leaked server-side call
 *     goes nowhere. No .env file is ever read by this script.
 *
 * Memory (added 2026-11-13, after two runs were killed at 0.07 GB free):
 *   - before the build, before Chrome starts and before every shot, free
 *     physical memory is checked against --min-free-mb. Below it the run stops
 *     cleanly: Chrome and the server are closed, the shots not taken are
 *     listed, and the exit code is 3. Rerun the same command to resume.
 *   - every shot taken is recorded in <out>/.capture-manifest.json with a key
 *     made of the build ID, the fixtures and the shot's options. A rerun skips
 *     a shot whose file exists and whose key is unchanged, so a run stopped at
 *     22 of 24 takes only the last 2. A rebuild changes the key, so stale files
 *     are retaken, never kept. --overwrite retakes everything.
 *   - Chrome runs with CHROME_LOW_MEMORY_ARGS.
 *
 * Subcommands:
 *   shoot      (default) capture PWA screens
 *   reference  render the spec pack's reference pages
 *   index      write index.html for a screenshots folder
 */

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURES = path.join(HERE, 'fixtures');
const DEFAULT_PLAYWRIGHT =
  'C:/Users/urohe/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const CHROME_CHANNEL = 'chrome';

/**
 * Headless Chrome flags that cut its footprint (measured 2026-11-13, README
 * "Memory"). --disable-gpu gives almost all of the saving (private memory
 * ~560 → ~390 MB per shot) and changes anti-aliasing: 5–15% of pixels differ
 * by up to 135/255 against a capture without it, layout unchanged. So a
 * before/after pair must come from the same flags; RENDER_VERSION makes the
 * manifest retake anything shot without them. The other flags are
 * pixel-identical and save ~20–30 MB.
 */
const CHROME_LOW_MEMORY_ARGS = [
  '--disable-gpu',
  '--renderer-process-limit=1',
  '--disable-features=site-per-process,IsolateOrigins,Translate,OptimizationHints,MediaRouter,AutofillServerCommunication',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-sync',
  '--no-first-run',
];

/** Part of every manifest key: bump it when capture behaviour changes what a shot looks like. */
const RENDER_VERSION = 1;

/**
 * Below this many MB of free physical memory (os.freemem) a run stops before
 * its next step: build, server, Chrome, or shot. On the 5.8 GB machine
 * (2026-11-13) the lowest free memory seen during normal runs was 439 MB, and
 * the two runs killed on 2026-11-12 died at ~70 MB. 300 sits between the two.
 * It is not "free ≥ the step's size": Windows trims other processes rather
 * than letting free memory fall by the harness's footprint, so that rule would
 * refuse to start on this machine at all. Override with --min-free-mb.
 */
const DEFAULT_MIN_FREE_MB = 300;

const FIXED_TIME = '2026-11-10T09:15:00+03:00';
const TIMEZONE = 'Africa/Djibouti';
const VIEWPORT_HEIGHT = 900;
const DEAD_API_URL = 'http://127.0.0.1:9';
const THEME_COOKIE = 'unipocket_theme';
const LANG_COOKIE = 'unipocket_lang';
const FAKE_STUDENT_ID = 'fixture-student';

/** Unsigned JWT. lib/auth-token.ts tokenStudentId only decodes it. */
const FAKE_ACCESS_TOKEN = [
  b64url(JSON.stringify({ alg: 'none', typ: 'JWT' })),
  b64url(JSON.stringify({ studentId: FAKE_STUDENT_ID })),
  '',
].join('.');

function b64url(s) {
  return Buffer.from(s, 'utf8').toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ── Screens ───────────────────────────────────────────────────────────────────

/**
 * `prepare` runs after the page has loaded and settled, before interactions.
 * Login is the only screen whose session refresh answers 401.
 */
const SCREENS = {
  login: { path: '/login', login: true },
  dashboard: { path: '/' },
  'schedule-week': { path: '/schedule' },
  'schedule-day': {
    path: '/schedule',
    // The Day/Week toggle is [week, day]. Below 640px it is absent and the day
    // view is forced, so there is nothing to click.
    prepare: async (page) => {
      const tabs = page.locator('[role="tablist"] [role="tab"]');
      if ((await tabs.count()) >= 2) await tabs.nth(1).click();
    },
  },
  grades: { path: '/grades' },
  attendance: { path: '/attendance' },
  news: { path: '/news' },
  'news-article': { path: '/news?article=news-exams-s2' },
  profile: { path: '/profile' },
  'offline-page': { path: '/offline.html', static: true },
};

const DATA_SCENARIOS = ['default', 'empty', 'error', 'loading', 'offline'];
const LOGIN_SCENARIOS = ['default', 'offline', 'error-credentials', 'locked', 'rate-limit'];

function scenarioApplies(screen, scenario) {
  const def = SCREENS[screen];
  if (def.static) return scenario === 'default';
  if (def.login) return LOGIN_SCENARIOS.includes(scenario);
  return DATA_SCENARIOS.includes(scenario);
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const REPEATABLE = new Set(['click']);
const FLAGS = new Set(['full-page', 'no-build', 'help', 'overwrite']);

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    const eq = a.indexOf('=');
    const key = eq === -1 ? a.slice(2) : a.slice(2, eq);
    let value;
    if (FLAGS.has(key)) value = eq === -1 ? true : a.slice(eq + 1) !== 'false';
    else if (eq !== -1) value = a.slice(eq + 1);
    else {
      value = argv[++i];
      if (value === undefined) die(`--${key} needs a value`);
    }
    if (REPEATABLE.has(key)) (out[key] ??= []).push(value);
    else out[key] = value;
  }
  return out;
}

const list = (v, dflt) => (v === undefined ? dflt : String(v).split(',').map((s) => s.trim()).filter(Boolean));

function die(msg) {
  console.error(`capture: ${msg}`);
  process.exit(2);
}

const USAGE = `Usage:
  node capture.mjs [shoot] (--pwa <pwa dir> [--port 3199] [--no-build] | --base-url <http://127.0.0.1:port>)
                   --out <dir> [--screens a,b] [--themes light,dark] [--langs fr,ar] [--widths 1440]
                   [--scenario default[,loading,...]] [--full-page] [--click <sel>]... [--hover <sel>]
                   [--press <sel>] [--focus <sel>] [--scroll <y>] [--hook <module.mjs>] [--label <state>]
                   [--fixtures <dir>] [--omit <fixture file>] [--plan <plan.json>]
                   [--min-free-mb ${DEFAULT_MIN_FREE_MB}] [--overwrite]
  node capture.mjs reference --spec-pack <design/spec-pack dir> --out <dir> [--only <regex>]
                   [--min-free-mb ${DEFAULT_MIN_FREE_MB}] [--overwrite]

  Shots already taken with the same build and options are skipped; --overwrite retakes them.
  Under --min-free-mb MB of free memory the run stops cleanly with exit code 3; rerun to resume.
  node capture.mjs index --dir <screenshots/mN dir> [--reference <screenshots/reference dir>]

Screens: ${Object.keys(SCREENS).join(', ')}
Scenarios: ${[...new Set([...DATA_SCENARIOS, ...LOGIN_SCENARIOS])].join(', ')}`;

// ── Memory guard ──────────────────────────────────────────────────────────────

/** Thrown when free memory is under the threshold. Caught by the subcommand, which closes everything and exits 3. */
class LowMemoryStop extends Error {}

const freeMb = () => Math.round(os.freemem() / 1048576);

function minFreeMb(args) {
  const v = args['min-free-mb'] === undefined ? DEFAULT_MIN_FREE_MB : Number(args['min-free-mb']);
  if (!Number.isFinite(v) || v < 0) die(`--min-free-mb must be a number of MB, got "${args['min-free-mb']}"`);
  return v;
}

function checkMemory(threshold, before) {
  const free = freeMb();
  if (free < threshold) {
    throw new LowMemoryStop(`free memory is ${free} MB, under --min-free-mb ${threshold}; stopped before ${before}`);
  }
}

/** Exit path for a low-memory stop: says what was not taken and how to resume. */
function reportLowMemory(err, report, remaining) {
  console.error(`\nSTOPPED (low memory): ${err.message}`);
  if (remaining.length) {
    console.error(`${remaining.length} shot(s) not taken:`);
    for (const r of remaining) console.error(`  - ${r}`);
  }
  console.error('Free some memory and rerun the same command. Shots already taken are skipped.');
  report.stopped = true;
}

// ── Resume manifest ───────────────────────────────────────────────────────────

const MANIFEST = '.capture-manifest.json';
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

function hashDir(dir) {
  if (!existsSync(dir)) return 'none';
  const h = createHash('sha256');
  const walk = (d) => {
    for (const f of readdirSync(d).sort()) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(path.relative(dir, p)).update(readFileSync(p));
    }
  };
  walk(dir);
  return h.digest('hex').slice(0, 16);
}

function hashFile(file) {
  return existsSync(file) ? sha(readFileSync(file)) : 'none';
}

function loadManifest(dir) {
  const file = path.join(dir, MANIFEST);
  try {
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  } catch {
    return {}; // a corrupt manifest only means nothing is skipped
  }
}

function recordShot(dir, name, key) {
  const m = loadManifest(dir);
  m[name] = key;
  writeFileSync(path.join(dir, MANIFEST), JSON.stringify(m, null, 1));
}

/** True when `name` was taken before with the same key and the file is still there. */
function alreadyTaken(dir, name, key) {
  return existsSync(path.join(dir, name)) && loadManifest(dir)[name] === key;
}

// ── Playwright ────────────────────────────────────────────────────────────────

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, DEFAULT_PLAYWRIGHT].filter(Boolean);
  for (const dir of candidates) {
    if (!existsSync(path.join(dir, 'package.json'))) continue;
    const require = createRequire(path.join(dir, 'package.json'));
    return require(dir);
  }
  die(
    `Playwright not found (PLAYWRIGHT_MODULE=${process.env.PLAYWRIGHT_MODULE ?? '<unset>'}, fallback ${DEFAULT_PLAYWRIGHT}).\n` +
      `Repopulate the npx cache with:  npx -y playwright@1.65.0 --version\n` +
      `then set PLAYWRIGHT_MODULE to <npm-cache>/_npx/<hash>/node_modules/playwright if the hash changed.`
  );
}

// ── Server lifecycle (--pwa) ──────────────────────────────────────────────────

function safeEnv() {
  // Process env beats .env.local in Next, so these win over anything on disk.
  return { ...process.env, NEXT_PUBLIC_API_URL: DEAD_API_URL, PWA_PROXY_SECRET: '', NEXT_TELEMETRY_DISABLED: '1' };
}

function nextBin(pwaDir) {
  const bin = path.join(pwaDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!existsSync(bin)) die(`${bin} not found. Run "npm ci --legacy-peer-deps" in ${pwaDir} first.`);
  return bin;
}

function build(pwaDir) {
  console.log(`[build] next build in ${pwaDir}`);
  const r = spawnSync(process.execPath, [nextBin(pwaDir), 'build'], { cwd: pwaDir, env: safeEnv(), stdio: 'inherit' });
  if (r.status !== 0) die(`next build failed (exit ${r.status})`);
}

async function startServer(pwaDir, port) {
  if (!existsSync(path.join(pwaDir, '.next', 'BUILD_ID'))) die(`no build in ${pwaDir}/.next — drop --no-build`);
  const child = spawn(process.execPath, [nextBin(pwaDir), 'start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: pwaDir,
    env: safeEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.env.CAPTURE_VERBOSE && process.stdout.write(`[next] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[next] ${d}`));
  const baseUrl = `http://127.0.0.1:${port}`;
  const stop = () => stopServer(child);
  process.on('exit', stop);
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stop(); process.exit(130); });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) die(`next start exited early (${child.exitCode}) — is port ${port} taken?`);
    try {
      const res = await fetch(`${baseUrl}/offline.html`);
      if (res.ok) return { baseUrl, stop };
    } catch {
      /* not up yet */
    }
    await sleep(300);
  }
  stop();
  die('next start did not answer within 60s');
}

function stopServer(child) {
  if (child.exitCode !== null || child.killed) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * GET /api/backend/<a>/<b>?k=v  ->  "<a>-<b>[--k-v...].json"
 *   /student/grades                     student-grades.json
 *   /student/grades?allSemesters=true   student-grades--allSemesters-true.json
 *   /student/grades?semesterId=sem-s3   student-grades--semesterId-sem-s3.json
 *   /news/news-exams-s2                 news--news-exams-s2.json  (article detail)
 * `limit`, `offset` and `category` are not part of the name: the harness pages
 * and filters list payloads itself, as the backend would.
 */
const PAGING_PARAMS = new Set(['limit', 'offset', 'category']);

function fixtureName(backendPath, search) {
  const segs = backendPath.split('/').filter(Boolean).map(decodeURIComponent);
  let name = segs[0] === 'news' && segs.length === 2 ? `news--${segs[1]}` : segs.join('-');
  const params = [...search.entries()].filter(([k]) => !PAGING_PARAMS.has(k)).sort(([a], [b]) => a.localeCompare(b));
  for (const [k, v] of params) name += `--${k}-${v}`;
  return `${name}.json`.replace(/[^\w.\-]/g, '_');
}

function loadFixture(job, name) {
  if (job.omit.includes(name)) return null;
  for (const dir of [job.scenario, 'default']) {
    const file = path.join(job.fixtures, dir, name);
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  }
  return null;
}

function paginate(payload, key, search) {
  if (!payload || !Array.isArray(payload[key])) return payload;
  let items = payload[key];
  const category = search.get('category');
  if (category) items = items.filter((x) => x.category === category);
  const offset = Number(search.get('offset') ?? 0) || 0;
  const limit = search.has('limit') ? Number(search.get('limit')) : items.length;
  return { ...payload, [key]: items.slice(offset, offset + limit) };
}

const json = (status, body, headers = {}) => ({
  status,
  contentType: 'application/json',
  headers,
  body: JSON.stringify(body),
});

// ── Request routing ───────────────────────────────────────────────────────────

function installRoutes(context, { origin, job, report, label }) {
  const fail = (msg) => {
    report.failures.push(`${label}: ${msg}`);
    console.error(`  ! ${label}: ${msg}`);
  };

  return context.route('**/*', async (route) => {
    const req = route.request();
    let url;
    try {
      url = new URL(req.url());
    } catch {
      return route.continue();
    }

    if (url.origin !== origin) {
      fail(`blocked request to another origin: ${url.origin}${url.pathname}`);
      return route.abort('blockedbyclient');
    }

    if (url.pathname.startsWith('/__fixtures/')) {
      const file = path.join(job.fixtures, 'assets', path.basename(url.pathname));
      if (!existsSync(file)) {
        fail(`no fixture asset for ${url.pathname}`);
        return route.fulfill({ status: 599, body: '' });
      }
      return route.fulfill({ status: 200, path: file });
    }

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const res = apiResponse(req.method(), url, job, label);
      if (res === 'hold') return; // loading: never answered
      if (res.missing) {
        fail(`no fixture for ${req.method()} ${url.pathname}${url.search}${res.missing === true ? '' : ` (${res.missing})`}`);
        return route.fulfill(json(599, { error: 'capture harness: no fixture' }));
      }
      return route.fulfill(res);
    }

    return route.continue();
  });
}

function apiResponse(method, url, job, label) {
  const p = url.pathname;
  const isLoginScreen = SCREENS[job.screen].login;

  if (p === '/api/auth/refresh' && method === 'POST') {
    if (isLoginScreen) return json(401, { error: 'No session' });
    return json(200, { accessToken: FAKE_ACCESS_TOKEN });
  }

  if (p === '/api/auth/login' && method === 'POST') {
    switch (job.scenario) {
      case 'error-credentials':
        return json(401, { error: 'Invalid credentials', attemptsLeft: 2 });
      case 'locked':
        return json(423, { error: 'Locked', lockedUntil: new Date(Date.parse(FIXED_TIME) + 5 * 60_000).toISOString() });
      case 'rate-limit':
        return json(429, { error: 'Too many requests' }, { 'RateLimit-Reset': '47' });
      default:
        return { missing: `scenario "${job.scenario}" defines no login answer` };
    }
  }

  if (p === '/api/auth/logout' && method === 'POST') return json(200, { success: true });

  if (p.startsWith('/api/backend/')) {
    if (job.scenario === 'loading') return 'hold';
    if (job.scenario === 'error') return json(500, { error: 'capture harness: scenario error' });
    if (method !== 'GET') return { missing: `${method} has no fixture support` };

    const backendPath = p.slice('/api/backend'.length);
    const name = fixtureName(backendPath, url.searchParams);
    const payload = loadFixture(job, name);
    if (payload === null) return { missing: name };
    const key = Array.isArray(payload.articles) ? 'articles' : Array.isArray(payload.notifications) ? 'notifications' : null;
    return json(200, key ? paginate(payload, key, url.searchParams) : payload);
  }

  return { missing: true };
}

// ── Settling ──────────────────────────────────────────────────────────────────

/** Fonts loaded, then every finite animation finished (infinite ones — the
 *  shimmer, spinners — are ignored). */
async function settle(page, timeout = 15_000) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const deadline = Date.now() + timeout;
  let quietPasses = 0;
  while (Date.now() < deadline) {
    const running = await page.evaluate(
      () =>
        document.getAnimations().filter((a) => {
          const t = a.effect && a.effect.getComputedTiming();
          if (!t || !Number.isFinite(t.endTime)) return false;
          return a.playState === 'running' || a.pending;
        }).length
    );
    quietPasses = running === 0 ? quietPasses + 1 : 0;
    if (quietPasses >= 2) return;
    await page.waitForTimeout(120);
  }
  throw new Error('animations did not settle');
}

async function waitLoaded(page) {
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle').catch(() => {});
  // Skeletons have a 400ms minimum and fade out; wait until none is left.
  await page
    .waitForFunction(() => !document.querySelector('[class*="skeleton" i]'), null, { timeout: 15_000 })
    .catch(() => {
      throw new Error('skeletons still on screen after 15s');
    });
}

// ── Shoot ─────────────────────────────────────────────────────────────────────

function fileName(screen, theme, lang, width, state) {
  return [screen, theme, lang, width === 1440 ? null : String(width), state === 'default' ? null : state]
    .filter(Boolean)
    .join('--') + '.png';
}

/** Paths inside a plan file resolve against the plan file's folder; on the command line, against the cwd. */
function normaliseJob(o, defaults = {}, baseDir = process.cwd()) {
  const j = { ...defaults, ...o };
  const abs = (p) => path.resolve(baseDir, p);
  const screens = list(j.screens, Object.keys(SCREENS));
  for (const s of screens) if (!SCREENS[s]) die(`unknown screen "${s}"`);
  return {
    out: j.out ? abs(j.out) : die('--out is required'),
    screens,
    themes: list(j.themes, ['light', 'dark']),
    langs: list(j.langs, ['fr', 'ar']),
    widths: list(j.widths, ['1440']).map(Number),
    scenarios: list(j.scenario, ['default']),
    fullPage: Boolean(j['full-page'] ?? j.fullPage),
    click: [].concat(j.click ?? []),
    hover: j.hover,
    press: j.press,
    focus: j.focus,
    scroll: j.scroll === undefined ? undefined : Number(j.scroll),
    hook: j.hook ? abs(j.hook) : undefined,
    label: j.label,
    fixtures: j.fixtures ? abs(j.fixtures) : DEFAULT_FIXTURES,
    omit: list(j.omit, []),
  };
}

/** Every shot a job asks for, in the order they are taken. */
function planShots(job) {
  const shots = [];
  for (const screen of job.screens)
    for (const scenario of job.scenarios) {
      if (!scenarioApplies(screen, scenario)) {
        console.log(`  - skip ${screen} / ${scenario} (not applicable)`);
        continue;
      }
      for (const width of job.widths)
        for (const theme of job.themes)
          for (const lang of job.langs) {
            const state = job.label ?? autoState(job, scenario);
            const name = fileName(screen, theme, lang, width, state);
            shots.push({ job, screen, scenario, theme, lang, width, name, label: `${path.basename(job.out)}/${name}` });
          }
    }
  return shots;
}

/** The manifest key: changes when the build, the fixtures, the hook or any option of the shot changes. */
function shotKey(buildStamp, s, fixturesHash) {
  const j = s.job;
  return sha(
    JSON.stringify({
      v: RENDER_VERSION,
      chrome: CHROME_LOW_MEMORY_ARGS,
      build: buildStamp,
      fixtures: fixturesHash,
      hook: j.hook ? hashFile(j.hook) : null,
      shot: [s.screen, s.scenario, s.theme, s.lang, s.width],
      opts: [j.fullPage, j.click, j.hover, j.press, j.focus, j.scroll, j.omit, j.label],
    })
  );
}

async function takeShot(browser, baseUrl, s, report, run) {
  const { job } = s;
  mkdirSync(job.out, { recursive: true });
  const key = run.buildStamp ? shotKey(run.buildStamp, s, run.fixturesHash(job.fixtures)) : null;
  if (key && !run.overwrite && alreadyTaken(job.out, s.name, key)) {
    console.log(`  = ${s.label} (already taken with this build; --overwrite to retake)`);
    report.skipped.push(s.label);
    return;
  }
  checkMemory(run.threshold, s.label);

  const hook = job.hook ? await run.hook(job.hook) : null;
  const failuresBefore = report.failures.length;
  try {
    await shootOne(browser, new URL(baseUrl).origin, baseUrl, { ...job, screen: s.screen, scenario: s.scenario }, { ...s, hook }, report);
    if (report.failures.length === failuresBefore) {
      console.log(`  ✓ ${s.label}`);
      // Only a clean shot is recorded, so a failed one is retaken on resume.
      if (key) recordShot(job.out, s.name, key);
    }
    report.shots.push(path.join(job.out, s.name));
  } catch (err) {
    report.failures.push(`${s.label}: ${err.message.split('\n')[0]}`);
    console.error(`  ✗ ${s.label}: ${err.message.split('\n')[0]}`);
  }
}

function autoState(job, scenario) {
  const parts = [];
  if (scenario !== 'default') parts.push(scenario);
  if (job.hover) parts.push('hover');
  if (job.press) parts.push('press');
  if (job.focus) parts.push('focus');
  return parts.length ? parts.join('-') : 'default';
}


async function shootOne(browser, origin, baseUrl, job, c, report) {
  const context = await browser.newContext({
    viewport: { width: c.width, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: 1,
    timezoneId: TIMEZONE,
    locale: c.lang === 'ar' ? 'ar-DJ' : 'fr-DJ',
    serviceWorkers: 'block',
    colorScheme: c.theme,
  });
  try {
    await context.addCookies([
      { name: THEME_COOKIE, value: c.theme, url: origin },
      { name: LANG_COOKIE, value: c.lang, url: origin },
    ]);
    await context.clock.setFixedTime(FIXED_TIME);
    await installRoutes(context, { origin, job, report, label: c.label });

    const page = await context.newPage();
    page.on('pageerror', (e) => report.warnings.push(`${c.label}: page error: ${e.message.split('\n')[0]}`));

    await page.goto(baseUrl + SCREENS[c.screen].path, { waitUntil: 'domcontentloaded' });

    if (c.scenario === 'loading') {
      await page.waitForSelector('[class*="skeleton" i]', { timeout: 15_000 });
      await page.waitForTimeout(800);
    } else {
      await waitLoaded(page);
    }
    await settle(page);

    if (SCREENS[c.screen].prepare) {
      await SCREENS[c.screen].prepare(page);
      if (c.scenario !== 'loading') await waitLoaded(page);
      await settle(page);
    }

    if (SCREENS[c.screen].login && ['error-credentials', 'locked', 'rate-limit'].includes(c.scenario)) {
      await page.fill('#student-id', 'UDJ-2024-0451');
      await page.fill('#password', 'xxxxxxxx');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(300);
      await settle(page);
    }

    if (c.scenario === 'offline') {
      await context.setOffline(true);
      await page.waitForTimeout(600);
      await settle(page);
    }

    for (const sel of job.click) {
      await page.locator(sel).first().click();
      await page.waitForTimeout(150);
      await settle(page);
    }

    if (job.scroll !== undefined) {
      await page.evaluate((y) => window.scrollTo(0, y), job.scroll);
      await page.waitForTimeout(150);
      await settle(page);
    }

    if (c.hook) {
      await c.hook({ page, context, ...c, settle: () => settle(page) });
      await settle(page);
    }

    let release = null;
    if (job.hover) {
      await page.locator(job.hover).first().hover();
    }
    if (job.focus) {
      // A Tab first puts Chrome in keyboard modality, so :focus-visible matches.
      await page.keyboard.press('Tab');
      await page.locator(job.focus).first().focus();
    }
    if (job.press) {
      const box = await page.locator(job.press).first().boundingBox();
      if (!box) throw new Error(`--press target not visible: ${job.press}`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      release = () => page.mouse.up();
    }
    if (job.hover || job.focus || job.press) await settle(page);

    await page.screenshot({ path: path.join(job.out, c.name), fullPage: job.fullPage, animations: 'allow' });
    if (release) await release();
  } finally {
    await context.close();
  }
}

async function cmdShoot(args) {
  const planPath = args.plan ? path.resolve(args.plan) : null;
  const plan = planPath ? JSON.parse(readFileSync(planPath, 'utf8')) : null;
  const { plan: _p, pwa, port, 'base-url': base, 'no-build': noBuild, _: _rest, ...common } = args;
  const jobs = plan ? plan.map((p) => normaliseJob(p, common, path.dirname(planPath))) : [normaliseJob(common)];

  const threshold = minFreeMb(common);
  const report = newReport();
  const planned = jobs.flatMap((job) => planShots(job));

  let baseUrl = base;
  let server = null;
  let browser = null;
  let i = 0;
  try {
    let buildStamp = null;
    if (pwa) {
      const pwaDir = path.resolve(pwa);
      if (existsSync(path.join(pwaDir, '.env.local'))) {
        console.log('[note] pwa/.env.local exists; it is not read, and the process env set here overrides it.');
      }
      if (!noBuild) {
        checkMemory(threshold, 'next build');
        build(pwaDir);
      }
      checkMemory(threshold, 'next start');
      server = await startServer(pwaDir, Number(port ?? 3199));
      baseUrl = server.baseUrl;
      // BUILD_ID alone is not enough: with GIT_COMMIT_SHA set it stays the same across rebuilds of edited code.
      const idFile = path.join(pwaDir, '.next', 'BUILD_ID');
      buildStamp = `${readFileSync(idFile, 'utf8').trim()}@${statSync(idFile).mtimeMs}`;
    } else {
      console.log('[note] --base-url: the build is unknown, so no shot is skipped as already taken.');
    }
    if (!baseUrl) die('give --pwa <dir> or --base-url <url>\n\n' + USAGE);
    const host = new URL(baseUrl).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') die('--base-url must be localhost or 127.0.0.1');

    const fixtureHashes = new Map();
    const hooks = new Map();
    const run = {
      threshold,
      buildStamp,
      overwrite: Boolean(common.overwrite),
      fixturesHash: (dir) => fixtureHashes.get(dir) ?? fixtureHashes.set(dir, hashDir(dir)).get(dir),
      hook: async (file) => hooks.get(file) ?? hooks.set(file, (await import(pathToFileURL(file).href)).default).get(file),
    };

    const { chromium } = loadPlaywright();
    checkMemory(threshold, 'Chrome');
    browser = await chromium.launch({ channel: CHROME_CHANNEL, headless: true, args: CHROME_LOW_MEMORY_ARGS });
    let lastJob = null;
    for (; i < planned.length; i++) {
      const s = planned[i];
      if (s.job !== lastJob) {
        lastJob = s.job;
        console.log(`[shoot] ${s.job.out}  screens=${s.job.screens.join(',')} scenario=${s.job.scenarios.join(',')} widths=${s.job.widths.join(',')}`);
      }
      await takeShot(browser, baseUrl, s, report, run);
    }
  } catch (err) {
    if (!(err instanceof LowMemoryStop)) throw err;
    reportLowMemory(err, report, planned.slice(i).map((s) => s.label));
  } finally {
    await browser?.close();
    server?.stop();
  }
  return finish(report);
}

const newReport = () => ({ shots: [], skipped: [], failures: [], warnings: [], stopped: false });

function finish(report) {
  for (const w of report.warnings) console.log(`  warn ${w}`);
  console.log(
    `\n${report.shots.length} screenshot(s), ${report.skipped.length} skipped as already taken, ${report.failures.length} failure(s).`
  );
  if (report.failures.length) {
    console.error('FAILURES:\n' + report.failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  }
  // A low-memory stop outranks failures: the run is incomplete, and the fix is to resume, not to debug.
  if (report.stopped) process.exitCode = 3;
}

// ── Reference renders ─────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

function staticServer(root) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const file = path.resolve(root, '.' + rel);
      if (!file.startsWith(path.resolve(root)) || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
      res.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

const DASH = '/specs/pwa/dashboard/dashboard.html';
const LOGIN = '/specs/pwa/login/source/login-screen.html';
const PROTO = '/specs/pwa/prototype-v1/' + encodeURIComponent('Unipocket PWA - Design System & Prototype v1.html');

/** Pack screenshots copied under the harness's names, so index pages can match them. */
const PACK_COPIES = [
  ...['light', 'dark'].flatMap((t) =>
    ['fr', 'ar'].flatMap((l) => [
      [`pwa-dashboard/${t}-${l}.png`, `dashboard--${t}--${l}.png`],
      [`pwa-login/${t}-${l}.png`, `login--${t}--${l}.png`],
    ])
  ),
  ['pwa-dashboard/light-fr-collapsed.png', 'dashboard--light--fr--collapsed.png'],
  ['pwa-login/light-fr-error-credentials.png', 'login--light--fr--error-credentials.png'],
  ['pwa-login/light-fr-error-rate-limit.png', 'login--light--fr--rate-limit.png'],
  ['pwa-login/light-fr-offline.png', 'login--light--fr--offline-switch.png'],
];

async function cmdReference(args) {
  const pack = path.resolve(args['spec-pack'] ?? die('--spec-pack is required'));
  const out = path.resolve(args.out ?? die('--out is required'));
  if (!existsSync(path.join(pack, 'INDEX.md'))) die(`${pack} is not a spec pack (no INDEX.md)`);
  const renderDir = path.join(out, 'render');
  const packDir = path.join(out, 'pack');
  mkdirSync(renderDir, { recursive: true });
  mkdirSync(packDir, { recursive: true });

  for (const [from, to] of PACK_COPIES) copyFileSync(path.join(pack, 'screenshots', from), path.join(packDir, to));
  console.log(`[reference] copied ${PACK_COPIES.length} pack screenshots to ${packDir}`);

  const { server, origin } = await staticServer(pack);
  // The login and prototype pages link a remote font stylesheet. It is never
  // fetched: any cross-origin stylesheet is answered with the pack's own local
  // font faces (dashboard/css/fonts.css), and every other cross-origin request
  // is aborted.
  const fontsCss = readFileSync(path.join(pack, 'specs/pwa/dashboard/css/fonts.css'), 'utf8').replace(
    /url\((["']?)\.\.\/fonts\//g,
    `url($1${origin}/specs/pwa/dashboard/fonts/`
  );

  const threshold = minFreeMb(args);
  const overwrite = Boolean(args.overwrite);
  const report = newReport();
  const remaining = [];
  let stop = null;
  const dirHashes = new Map();
  const pageKey = (name, width, url) => {
    // The page's own folder (HTML, CSS, JS, fonts): a change to the spec pack retakes its renders.
    const dir = path.dirname(path.join(pack, decodeURIComponent(url.split('?')[0])));
    if (!dirHashes.has(dir)) dirHashes.set(dir, hashDir(dir));
    return sha(JSON.stringify({ v: RENDER_VERSION, chrome: CHROME_LOW_MEMORY_ARGS, dir: dirHashes.get(dir), name, width, url }));
  };

  const { chromium } = loadPlaywright();
  try {
    checkMemory(threshold, 'Chrome');
  } catch (err) {
    server.close();
    if (!(err instanceof LowMemoryStop)) throw err;
    reportLowMemory(err, report, []);
    return finish(report);
  }
  const browser = await chromium.launch({ channel: CHROME_CHANNEL, headless: true, args: CHROME_LOW_MEMORY_ARGS });

  const only = args.only ? new RegExp(args.only) : null;
  const shot = async (name, width, url, after) => {
    if (only && !only.test(name)) return;
    if (stop) {
      remaining.push(`reference/render/${name}`);
      return;
    }
    const key = pageKey(name, width, url);
    if (!overwrite && alreadyTaken(renderDir, name, key)) {
      console.log(`  = reference/render/${name} (already taken; --overwrite to retake)`);
      report.skipped.push(name);
      return;
    }
    try {
      checkMemory(threshold, `reference/render/${name}`);
    } catch (err) {
      if (!(err instanceof LowMemoryStop)) throw err;
      stop = err;
      remaining.push(`reference/render/${name}`);
      return;
    }
    const context = await browser.newContext({
      viewport: { width, height: VIEWPORT_HEIGHT },
      deviceScaleFactor: 1,
      timezoneId: TIMEZONE,
      serviceWorkers: 'block',
    });
    try {
      await context.clock.setFixedTime(FIXED_TIME);
      await context.route('**/*', (route) => {
        const req = route.request();
        const u = new URL(req.url());
        if (u.origin === origin) return route.continue();
        if (req.resourceType() === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: fontsCss });
        report.warnings.push(`${name}: aborted ${u.origin}${u.pathname}`);
        return route.abort('blockedbyclient');
      });
      const page = await context.newPage();
      page.on('pageerror', (e) => report.warnings.push(`${name}: page error: ${e.message.split('\n')[0]}`));
      await page.goto(origin + url, { waitUntil: 'load' });
      await settle(page);
      if (after) {
        await after(page);
        await settle(page);
      }
      await page.screenshot({ path: path.join(renderDir, name) });
      report.shots.push(name);
      recordShot(renderDir, name, key);
      console.log(`  ✓ reference/render/${name}`);
    } catch (err) {
      report.failures.push(`${name}: ${err.message.split('\n')[0]}`);
      console.error(`  ✗ ${name}: ${err.message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
  };

  const hideDemo = (page, extra = '') =>
    page.addStyleTag({ content: `#ctl-rail,#toast-stack,.hint{display:none!important}${extra}` });
  const setLangTheme = (t, l) => `lang=${JSON.stringify(l)};applyLang();theme=${JSON.stringify(t)};applyTheme();`;

  try {
    for (const t of ['light', 'dark'])
      for (const l of ['fr', 'ar'])
        for (const w of [1440, 834, 390]) {
          const sfx = w === 1440 ? '' : `--${w}`;
          await shot(`dashboard--${t}--${l}${sfx}.png`, w, `${DASH}?theme=${t}&lang=${l}`);
          await shot(`dashboard--${t}--${l}${sfx}--collapsed.png`, w, `${DASH}?theme=${t}&lang=${l}&collapsed=1`);
        }

    const loginStates = {
      default: null,
      'error-credentials': '#btn-sim-error',
      'rate-limit': '#btn-sim-rate',
      'offline-switch': '#offline-switch',
    };
    for (const t of ['light', 'dark'])
      for (const l of ['fr', 'ar'])
        for (const [state, click] of Object.entries(loginStates))
          for (const w of state === 'default' ? [1440, 390] : [1440]) {
            const name = fileName('login', t, l, w, state);
            await shot(name, w, LOGIN, async (page) => {
              await page.evaluate(setLangTheme(t, l));
              // The sim buttons sit in the collapsed demo rail, so they are clicked
              // through the DOM rather than as a user would.
              if (click) await page.evaluate((sel) => document.querySelector(sel).click(), click);
              await hideDemo(page);
            });
          }

    const views = {
      'schedule-week': ['schedule', null],
      'schedule-day': ['schedule', '.seg-btn[data-mode="day"]'],
      grades: ['grades', null],
      attendance: ['attendance', null],
      news: ['news', null],
      profile: ['profile', null],
    };
    for (const t of ['light', 'dark'])
      for (const l of ['fr', 'ar'])
        for (const w of [1440, 834, 390])
          for (const [name, [view, click]] of Object.entries(views))
            await shot(fileName(name, t, l, w, 'default'), w, PROTO, async (page) => {
              await page.evaluate(`document.getElementById('btn-login').click();${setLangTheme(t, l)}setView(${JSON.stringify(view)});`);
              if (click) await page.locator(click).first().click();
              await hideDemo(page);
            });
  } finally {
    await browser.close();
    server.close();
  }
  if (stop) reportLowMemory(stop, report, remaining);
  return finish(report);
}

// ── Index pages ───────────────────────────────────────────────────────────────

const pngs = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')) : []);

/**
 * dashboard--light--fr--834--loading.png -> [itself, the same width without state].
 * Never another width: a 1440 render beside a 390 capture says nothing about the
 * 390 layout. (1440 names carry no width, so "without state" keeps 1440 at 1440.)
 */
function referenceCandidates(name) {
  const parts = name.replace(/\.png$/, '').split('--');
  const [screen, theme, lang, ...rest] = parts;
  const width = rest.find((r) => /^\d+$/.test(r));
  return [...new Set([name, [screen, theme, lang, width].filter(Boolean).join('--') + '.png'])];
}

function cmdIndex(args) {
  const dir = path.resolve(args.dir ?? die('--dir is required'));
  const refRoot = path.resolve(args.reference ?? path.join(dir, '..', 'reference'));
  const hasPhases = existsSync(path.join(dir, 'before')) || existsSync(path.join(dir, 'after'));
  const columns = hasPhases ? ['before', 'after'] : ['.'];
  const names = [...new Set(columns.flatMap((c) => pngs(path.join(dir, c))))].sort();

  const rel = (p) => path.relative(dir, p).replace(/\\/g, '/');
  const findRef = (sub, name) => {
    for (const cand of referenceCandidates(name)) {
      const p = path.join(refRoot, sub, cand);
      if (existsSync(p)) return p;
    }
    return null;
  };
  const cell = (p, missing = 'none', note = '') =>
    p
      ? `<td><a href="${encodeURI(rel(p))}"><img loading="lazy" src="${encodeURI(rel(p))}"></a><div class="cap">${path.basename(p)}${note}</div></td>`
      : `<td class="none">${missing}</td>`;

  // The reference is the spec page rendered by this harness at the capture's own
  // width (`reference` subcommand). The pack's own screenshots are 1440 only and
  // are no longer shown: beside a 390 or 834 capture they compared nothing.
  const refCell = (n) => {
    const p = findRef('render', n);
    if (!p) return cell(null, 'no spec render at this width');
    const note = path.basename(p) === n ? '' : ' <em>(spec in its loaded state: the spec page has no such state)</em>';
    return cell(p, '', note);
  };

  const heads = [...(hasPhases ? ['before', 'after'] : ['capture']), 'spec (rendered at the same width)'];
  const rows = names
    .map((n) => {
      const caps = columns.map((c) => {
        const p = path.join(dir, c, n);
        return cell(existsSync(p) ? p : null, 'missing');
      });
      return `<tr><th colspan="${heads.length}">${n}</th></tr><tr>${caps.join('')}${refCell(n)}</tr>`;
    })
    .join('\n');

  const html = `<!doctype html><meta charset="utf-8"><title>${path.basename(dir)} — captures</title>
<style>body{font:13px system-ui,sans-serif;margin:16px;background:#f4f4f4}table{border-collapse:collapse;width:100%}
th{text-align:start;padding:16px 4px 4px;font:600 13px ui-monospace,monospace}td{vertical-align:top;padding:4px;width:${Math.floor(100 / heads.length)}%}
img{width:100%;border:1px solid #ccc;background:#fff}.cap{font:11px ui-monospace,monospace;color:#555}.none{color:#999;text-align:center}
thead th{position:sticky;top:0;background:#f4f4f4}</style>
<h1>${path.basename(dir)}</h1><p>${names.length} capture(s). Spec column: the spec page rendered at the same width, theme and language; exact state when the spec page has it, otherwise its loaded state. Never a different width.</p>
<table><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
${rows}
</table>`;
  writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`[index] ${path.join(dir, 'index.html')} (${names.length} rows)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0] ?? 'shoot';
if (args.help) {
  console.log(USAGE);
} else if (cmd === 'shoot') {
  await cmdShoot(args);
} else if (cmd === 'reference') {
  await cmdReference(args);
} else if (cmd === 'index') {
  cmdIndex(args);
} else {
  die(`unknown command "${cmd}"\n\n${USAGE}`);
}
