# Unipocket — design bundle index

Built 2026-11-09. Dates are each file's last-modified date in the design project.

## How to read this

Status values:
- **CURRENT**: build against this.
- **CURRENT\***: current, but a later revision overrides some rules. The ids in brackets point to `OVERRIDES.json`. Apply those overrides before you diff.
- **SUPERSEDED**: kept in `archive/` for the record. Never diff against it.
- **EXPLORATION**: options that led to a decision. Kept in `archive/`. Not a spec.
- **DERIVED**: a bundled or print copy of a source file. Diff against the source, not this.
- **REVIEW**: an audit or critique. It describes problems; it is not a spec.
- **INPUT**: material you supplied (build screenshots, logos, notes).

Order of precedence: Round 2 Spec, then the screen spec, then the prototype, then the screenshots. When two sources disagree, the newer date wins.

**Known gap.** Round 2 changed component rules but none of the source CSS was updated: `login-screen.css`, `app.css` and `prototype-v1` still have the old values. `tokens/pwa/*` does include Round 2. Every screenshot named `__pre-round2` shows the old gradient and old "Seuil" styling.

There are three products, each with its own token set:
- **PWA**: the web app at `/`.
- **Mobile**: React Native / Expo, called "UDJ" in the file names.
- **Admin**: the admin portal.

---

## Tokens — `tokens/`

| File | What | Date | Status |
|---|---|---|---|
| `tokens/pwa/tokens.css` | PWA light + dark custom properties. Taken verbatim from `app.css`, plus the Round 2 additions (`--warning-text`, `--danger-text`, `--hero-start/end`) | 2026-10-27 | CURRENT |
| `tokens/pwa/tokens.json` | Same values as JSON, plus on-hero colours and the band→colour map | 2026-10-27 | CURRENT |
| `tokens/mobile/tokens.json` | Mobile LIGHT/DARK palettes and the 12 course colours, extracted from `app/udj-core.jsx`. Font sizes get × 0.92 | 2026-06-12 | CURRENT |
| `archive/pwa/login/tokens-login-only/tokens.css` | Login-package tokens. Its label says "light + dark" but it **only contains light** | 2026-10-27 | SUPERSEDED by `tokens/pwa/tokens.css` |
| `archive/pwa/login/tokens-login-only/tokens.json` | Login-package tokens from before Round 2: old gradient, tagline .82, chip 16% white, no warning or exam tokens | 2026-10-27 | SUPERSEDED by `tokens/pwa/tokens.json` |

PWA and mobile palettes differ on purpose (for example, bg `#F7F4EE` vs `#F2F5F3`). Never cross-check one against the other.

---

## Brand & app icon

| File | What | Date | Status |
|---|---|---|---|
| `assets/brand/unipocket-u-mark.svg` | U-only mark, `currentColor` | 2026-10-27 | CURRENT |
| `assets/brand/unipocket-u-tile.svg` | U mark on a jade tile | 2026-10-27 | CURRENT |
| `assets/brand/unipocket-icon.png`, `unipocket-sidebar-mark.png` | White U on a jade gradient tile, 1024² (PWA sidebar, manifest) | 2026-10-27 | CURRENT |
| `assets/brand/unipocket-icon-foreground.png` | White U on transparent (login hero, 64 px) | 2026-10-27 | CURRENT |
| `assets/app-icon/*` + `specs/mobile/app-icon/HANDOFF.md` | Android/iOS launcher set: icon, adaptive foreground/background, Play Store icon, plus the `app.json` change | 2026-06-01 | CURRENT |
| `archive/brand/Logo-with-mortarboard.svg` | Repo logo: mortarboard over an outlined U | 2026-08-26 | SUPERSEDED by the U mark. Decision of 2026-10-27: the U replaces the mortarboard everywhere, including the mobile splash and login |
| `archive/brand/assets-icons-pre-handoff/` | Old launcher icons with the mortarboard (plus copies of the onboarding PNGs) | before 2026-06-01 | SUPERSEDED by `assets/app-icon/` |
| `archive/brand/Frame 60.svg` | Original Figma frame of the U | input | INPUT |
| `archive/mobile/explorations/Unipocket Android Icon.html`, `Unipocket U Icon Looks.html` | Icon options: cap-forward, bold U, etc. | 2026-06-01 | EXPLORATION, decided in HANDOFF.md |

---

## PWA

### Login
| File | What | Date | Status |
|---|---|---|---|
| `specs/pwa/login/Login Screen Spec.html` | Login implementation spec. Offline hint reads "Déconseillé" | 2026-10-27 | CURRENT\* [R2-hero-gradient, R2-on-green-text] |
| `specs/pwa/login/source/login-screen.html` + `.css` | Login source HTML/CSS | 2026-10-27 | CURRENT\* (same overrides) |
| `specs/pwa/login/icons/`, `assets/` | globe, shield, wifi, gear (demo only); U assets | 2026-10-27 | CURRENT |
| `screenshots/pwa-login/0[1-5]-*__pre-round2.png` | light-default, error-credentials, error-rate-limit, dark-offline-on, arabic-rtl | 2026-10-27 | CURRENT for layout and copy; gradient and chip are pre-Round 2 |
| `archive/pwa/login/Login Screen Spec-print.html` | Print copy, older than the spec. **Still says "Recommandé"** | 2026-10-27 (earlier) | SUPERSEDED |
| `archive/pwa/login/Unipocket PWA - Login Options.html` | Offline, language and network-error options. "Recommandé" | 2026-09-17 | EXPLORATION / SUPERSEDED [login-offline-hint] |
| `archive/pwa/login/Unipocket PWA - Login Additions Spec.html` | First spec of the offline toggle. "Recommandé" | 2026-09-17 | SUPERSEDED [login-offline-hint] |
| `archive/pwa/login/…Login Screen (root duplicate).html` | Identical to `source/login-screen.html` apart from asset paths | 2026-10-27 | DERIVED |

### Dashboard (+ Round 2: attendance, print, contrast, notifications, bell)
| File | What | Date | Status |
|---|---|---|---|
| `specs/pwa/dashboard/Round 2 Spec.html` | Round 2: attendance bands (server-computed), schedule print, tagline contrast, notification template, bell states | 2026-10-27 (latest) | CURRENT. Overrides the Dashboard Spec and login CSS |
| `specs/pwa/dashboard/Dashboard Spec.html` | Dashboard spec: breakpoints, tokens, type, icons, copy, hardening | 2026-10-27 | CURRENT\* [R2-band, R2-text-colours, R2-hero-gradient, R2-on-green-text, R2-notif-template, R2-bell, R2-print] |
| `specs/pwa/dashboard/dashboard.html` + `css/app.css`, `css/hardening.css`, `css/fonts.css`, `fonts/` | Dashboard source | 2026-10-27 | CURRENT\* (same overrides) |
| `specs/pwa/dashboard/bell-states.html` | Bell popover, states 1–8. Accepts `?theme=dark` and `?lang=ar`. Its CSS block is the source to copy | 2026-10-27 | CURRENT |
| `specs/pwa/dashboard/schedule-print.html` | A4 landscape print sheet. Accepts `?only=fr|ar|empty`. Its print CSS block is the source to copy | 2026-10-27 | CURRENT |
| `specs/pwa/dashboard/icons/` (= `assets/icons/pwa/`) | 18 icons: nav, bell, menu, notification, quick tiles | 2026-10-27 | CURRENT |
| `screenshots/pwa-dashboard/0[1-5]-*__pre-round2.png` | Renders of `dashboard.html`: light-fr expanded and collapsed, dark-fr, dark-ar, bell open | rendered 2026-11-09 | CURRENT for layout; band colours, gradient and bell are pre-Round 2 |
| `screenshots/pwa-dashboard/user-reference-*.png` | Your two screenshots at about 1.35× DPR | input | INPUT |
| `screenshots/pwa-bell/states-1-8__light-fr.png` | Render of `bell-states.html` | 2026-11-09 | CURRENT |
| `screenshots/pwa-schedule-print/sheets__fr-ar-empty.png` | Render of `schedule-print.html`. The preview width crops it, so open the HTML to see the full sheet | 2026-11-09 | CURRENT |
| `archive/pwa/dashboard/Dashboard Spec-print.html` | Print copy, older than the spec (written before the U-mark asset note) | 2026-10-27 (earlier) | SUPERSEDED |

### Other PWA screens (Schedule, Grades, Attendance, News, Profile)
| File | What | Date | Status |
|---|---|---|---|
| `specs/pwa/prototype-v1/Unipocket PWA - Design System & Prototype v1.html` | Single-file prototype of the whole PWA. It is the **only source** for Schedule, Grades, Attendance, News and Profile | 2026-09-17 | CURRENT\* for those screens. Its Login is SUPERSEDED [login-offline-hint, R2-hero-gradient]. Its Dashboard is SUPERSEDED by `specs/pwa/dashboard/` |
| `specs/pwa/foundations/Unipocket PWA - Design & Interaction Spec.html` | Motion durations, button states, offline banner, interaction rules | 2026-08-26 | CURRENT (foundation; newer screen specs take precedence) |
| `archive/pwa/prototype/Unipocket PWA - Standalone.html` | Prototype v1 as first bundled | 2026-08-26 | SUPERSEDED by prototype-v1 |
| `archive/pwa/review/Unipocket PWA - Design Review.html` (+ standalone copy dated 2026-09-25) | Critique of the built PWA: offline hint, Arabic numerals, and more | 2026-10-01 | REVIEW. Findings for login and dashboard are resolved in the Oct 27 specs; the others are unverified |

---

## Mobile (UDJ, React Native)

**Type scale.** Mobile specs dated before 2026-06-12 list font sizes before the × 0.92 scale. The shipped code already applies it: `constants/theme.ts` on `develop` has `TYPE_SCALE = 0.92`, and every typography token goes through `fz()`. A search of `components/` found no raw numeric `fontSize`; `app/_layout.tsx` has two (the error fallback). A checker should compare spec sizes × 0.92 against the source, or compare rendered output, not compare literals.

| Area | File | Date | Status |
|---|---|---|---|
| Prototype (all screens) | `specs/mobile/prototype/UDJ - Polished Prototype.html` + `app/*.jsx` | 2026-06-12. `udj-login.jsx` and `udj-presence.jsx` changed 2026-11-09 | CURRENT\*. Login now uses the U mark. `udj-presence.jsx` (06-05) predates the Présence and Mes Absences specs, so the specs win [mobile-presence-absences, R2-band]. 2026-11-09 fix: Présence crashed because its `SubjectCard` collided with the one in Grades; it is renamed `PresenceSubjectCard`, with no visual change |
| Type scale | `specs/mobile/type-scale/handoff-font-scale.md` | 2026-06-12 | CURRENT, already shipped |
| Splash | in `specs/mobile/login/UDJ - Login Spec.html` (Brand mark card) | 2026-11-09 | CURRENT: white U centred on flat #0A3D2E. The prototype has no splash screen |
| Interaction | `specs/mobile/interaction/UDJ - Press Interaction Spec.html` | 2026-06-20 | CURRENT |
| Interaction | `specs/mobile/interaction/UDJ - Press System Demo.html` | 2026-06-19 | CURRENT (demo of the above) |
| Login | `specs/mobile/login/UDJ - Login Spec.html` | 2026-11-09 (logo revised) | CURRENT. U mark 64×69, splash note |
| Login | `archive/mobile/login-mortarboard/*` | 2026-06-11 | SUPERSEDED: spec and `udj-login.jsx` as they were with the mortarboard |
| Home & notifications | `specs/mobile/home-notifications/UDJ - Home & Notifications Spec.html` | 2026-06-09 | CURRENT\* [R2-band for the attendance stat] |
| Schedule | `specs/mobile/schedule/UDJ - Schedule Spec.html` | 2026-06-10 | CURRENT\* [mobile-schedule-gutter] |
| Schedule | `specs/mobile/schedule/handoff-schedule-card-option4.md` + `UDJ - Schedule Option 4 (live).html` | 2026-06-12 | CURRENT |
| Grades | `specs/mobile/grades/UDJ - Grades Spec.html` | 2026-06-10 | CURRENT |
| News | `specs/mobile/news/UDJ - News Spec.html` | 2026-06-10 | CURRENT |
| Présence | `specs/mobile/presence/UDJ - Présence Spec.html` | 2026-06-08 | CURRENT\* [mobile-presence-absences, R2-band] |
| Présence | `specs/mobile/presence/UDJ - Mes Absences Spec.html` + `(preview).html` | 2026-06-21 | CURRENT |
| Navbar | `specs/mobile/navbar/UDJ - Navbar Spec.html` | 2026-06-11 | CURRENT\* [mobile-nav-icon-size] |
| Navbar | `specs/mobile/navbar/handoff-navbar-icons.md`, `assets/icons/mobile-nav/*.svg` | 2026-06-12 | CURRENT |
| Profile & settings | `specs/mobile/profile-settings/UDJ - Polish Spec.html` | 2026-06-05 | CURRENT |
| Profile & settings | `…/UDJ - Account Info Spec.html`, `Info Center Spec.html`, `Storage Detail Spec.html` | 2026-06-08 | CURRENT |
| Onboarding | `specs/mobile/onboarding/Unipocket Onboarding.html` + `Onboarding.jsx`, `assets/onboarding/*.png` | 2026-05-15 | CURRENT\* (only source; never revised). Its logo is SUPERSEDED [brand-mark] |
| Reference renders | `screenshots/mobile-<screen>/{light,dark}-{fr,ar}.png`: login, home, notifications, schedule, grades, news, profile, settings, account, storage, info, presence (48 files) | rendered 2026-11-09 from the prototype | CURRENT for layout; Présence follows the prototype, not the newer specs. In the html-to-image renders the Agenda time pill wraps onto two lines; check that on a device before treating it as a defect |
| Misc assets | `assets/misc/key-icon.png`, `no-internet.png`, `wrench.png` | — | CURRENT? Not referenced by any spec in this bundle; check whether the app uses them |

Archived mobile material:
- **Early canvases:** `Unipocket Settings`, `Final Screens`, `Detail Screens` (+ jsx). Dated 05-07 to 05-15. SUPERSEDED by the June specs and the prototype. Final Screens uses the mortarboard.
- **Profile & settings polish v0:** `Profile & Settings - Polish.html`, `polish/`, Polish Spec standalone, audit prompt. Dated 06-05. SUPERSEDED by `app/` and the per-screen specs.
- **Derived bundles:** Polished Prototype standalone (06-19) and its print copy (06-20). DERIVED from `app/` as of 06-12.
- **Explorations:** Card Press Options (06-19), Schedule Card Time Options (06-12), Font & Schedule Comparison (06-12), Attendance - Absence Justification (06-21, the prototype behind Mes Absences).

---

## Admin portal

| File | What | Date | Status |
|---|---|---|---|
| `specs/admin/Unipocket Admin Portal.html` + `admin/*.jsx` | Prototype source | 2026-07-09 | CURRENT |
| `specs/admin/Unipocket Admin Portal - Implementation Spec.html` | Full spec, §1–30 | 2026-07-09 | CURRENT\* [admin-uxupdate: §30 overrides earlier sections] |
| `specs/admin/audits/Admin Portal - Rendered Audit v3.html` | Audit of the rendered build | 2026-08-07 | REVIEW, current |
| `specs/admin/audits/Admin Portal - Sizing Audit.html` | Sizing audit | 2026-07-27 | REVIEW, current (typography and layout: v3 wins) |
| `archive/admin/Admin Portal - Design Audit.html`, `…v2.html` | Source-to-source audits | 07-23 / 07-27 | REVIEW. Typography and layout SUPERSEDED by v3 [admin-audit-v3] |
| `archive/admin/…Full Source (single file).html`, `…OFFLINE (send this).html` | Bundled copies | 2026-07-09 | DERIVED |

The admin portal has no separate token file; its tokens are the `C` object in `admin/admin-core.jsx`.

---

## Other

- `archive/working-captures/`: about 150 screenshots I took while checking my own work. They are unlabelled and many show intermediate states. Not reference renders.
- `archive/github.md`: link to the repo (`Islamsoub/udj-app-mvp`, branch `develop`; last sync 2026-08-26).
- `inputs/uploads/`: everything you uploaded (build screenshots, Figma SVGs, architecture notes, `udj-handoff.html`). INPUT.

## Resolved

1. **Mobile logo (resolved 2026-11-09).** Decision of 2026-10-27: the U replaces the mortarboard everywhere, including the mobile splash and login. The splash is a white U on #0A3D2E. The mobile Login Spec and `udj-login.jsx` are updated; the earlier versions are in `archive/mobile/login-mortarboard/`. The Round 1 answer that made this decision is not among the project files, so this index is now its record.
2. **Mobile reference renders (done 2026-11-09).** See `screenshots/mobile-*`.
