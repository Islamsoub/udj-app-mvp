# Global Claude Instructions

These rules apply to every project.

## Root Cause

No quick fixes. Always diagnose to the root cause and devise proper solutions. Never apply patches or workarounds unless the user explicitly asks.

---

## Security & Secrets

- Never hardcode secrets or commit them to git
- Use separate API tokens/credentials for dev, staging, and prod environments
- Validate all input server-side — never trust client data
- Add rate limiting on auth and write operations

## Architecture & Code Quality

- Design architecture before building — do not let it emerge from spaghetti
- Break up large view controllers/components early
- Wrap external API calls in a clean service layer (easier to cache, swap, or extend later)
- Version database schema changes through proper migrations
- Use real feature flags, not commented-out code

## Observability

- Add crash reporting from day one
- Implement persistent logging (not just console output)
- Include a /health endpoint for every service

## Environments & Deployment

- Maintain a real staging environment that mirrors production
- Set CORS to specific origins, never *
- Set up CI/CD early — deploys come from the pipeline, not a laptop
- Document how to run, build, and deploy the project

## Testing & Resilience

- Test unhappy paths: network failures, unexpected API responses, malformed data
- Test backup restores at least once — do not wait for an emergency
- Do not assume the happy path is sufficient

## Time Handling

- Store all timestamps in UTC
- Convert to local time only on display

## Discipline

- Fix hacky code now or create a tracked ticket with a deadline — later never comes
- Do not skip fundamentals just because the code compiles and runs

---

# UDJ App MVP — Project Rules

## Project overview
Offline-first student mobile app for Universite de Djibouti.
Stack: React Native + Expo (TypeScript), expo-router, expo-sqlite, expo-secure-store, Zustand, TanStack Query, axios, i18next/react-i18next, Node.js backend, PostgreSQL (Supabase), Prisma.
Platforms: Android-first. iOS secondary (no announcement until Phase 2).
Languages: French (LTR, default) + Arabic (RTL).

## Critical rules
- ALWAYS use --legacy-peer-deps for every npm install. No exceptions.
- NEVER use AsyncStorage for tokens. JWT and refresh token go in expo-secure-store only.
- NEVER hardcode hex colors. Always reference constants/theme.ts tokens.
- NEVER use arbitrary spacing values (5px, 7px, 11px etc). Use the 8px grid from theme.ts.
- NEVER use FlatList. Always use @shopify/flash-list for all lists.
- Numbers, times, and student IDs always render in Plus Jakarta Sans regardless of active language (even in Arabic mode).
- All layouts use start/end instead of left/right in StyleSheet for RTL compatibility.
- Always use SafeAreaView from react-native-safe-area-context. Never the RN built-in.
- Minimum touch target: 44x44px on all tappable elements. Use hitSlop to extend small elements.
- Never show a blank screen. Always render cached SQLite data behind skeletons or error states.
- Every user-facing string goes through i18next — never hardcode text in components.
- RTL layout must be tested for every UI change. A feature is not done until it works in both FR and AR.

## Branch workflow
- main: protected, release only. Never commit directly.
- develop: integration branch. Feature branches merge here.
- feature/screen-name: one per screen or task. Always branch from develop.

## Design system — Sagal handoff (source of truth)

### Primary color: JADE GREEN (not blue — training round is discarded)
- jade50:  #E6F7F1  (tag backgrounds, tints)
- jade100: #B3E4D3  (border on jade backgrounds)
- jade200: #7FCEAF  (light accent)
- jade300: #3FB88E  (light interactive)
- jade400: #1D9E75  (PRIMARY — all CTAs, active tabs, brand accents)
- jade600: #0F6E56  (hover, pressed state)
- jade900: #0A3D2E  (splash screen background ONLY)
- jadeDM:  #2ECC96  (dark mode primary)

### Semantic colors
- warning:  #F59E0B  (attendance alerts, at-risk)
- danger:   #EF4444  (errors, lockout, grade risk)
- info:     #3B82F6  (news, announcements, loading)
- exam:     #8B5CF6  (exam slots, session expired)
- offline:  #F97316  (offline banner dot)
- success:  #1D9E75  (same as jade400)

### Surface colors (light mode)
- background:    #F5F7F6
- surface:       #FFFFFF  (cards, modals, inputs)
- border:        #E8ECE9
- textPrimary:   #1C2320
- textSecondary: #6B7B74
- textTertiary:  #9EADA7  (placeholder, disabled)

### Dark mode surfaces
- dmBgDeep:    #0D1512
- dmBgPrimary: #141E1A
- dmSurface:   #1C2B26
- dmCard:      #243328

### Fonts (all bundled locally in assets/fonts/ — never load from Google Fonts at runtime)
- Body/UI: Plus Jakarta Sans (weights: 300, 400, 500, 600, 700, 800)
- Arabic:  Noto Naskh Arabic
- Mono:    DM Mono (student IDs, times, version numbers)

### Typography scale
- H1:       FR 28px/800, lh 1.15, ls -0.02em | AR 30px/700, lh 1.3
- H2:       FR 22px/700, lh 1.2              | AR 24px/700, lh 1.35
- H3:       FR 18px/600, lh 1.3              | AR 19px/600, lh 1.4
- Body:     FR 14px/400, lh 1.6              | AR 15px/400, lh 1.8
- BodySM:   FR 12px/400, lh 1.6              | AR 13px/400, lh 1.7
- Caption:  FR 11px/500, ls 0.02em           | AR uses BodySM
- Label:    FR 10px/600 UPPERCASE ls 0.1em   | AR uses Caption
- NumberGPA: 36px/800, lh 1, ls -0.03em     | ALWAYS Plus Jakarta Sans
- Mono:     DM Mono 12px/400                | ALWAYS Plus Jakarta Sans in AR mode

### Spacing (8px base grid — no arbitrary values ever)
- sp2:  2px   (icon-text tight gap)
- sp4:  4px   (badge padding vertical)
- sp6:  6px   (label-value gap in grade cells)
- sp8:  8px   (BASE UNIT)
- sp12: 12px  (card padding vertical)
- sp16: 16px  (card padding, list item padding)
- sp20: 20px  (section gaps within screen)
- sp24: 24px  (screen horizontal padding)
- sp32: 32px  (between sections on same screen)
- sp48: 48px  (header bar height, bottom nav height)
- sp64: 64px  (scroll padding-bottom above nav)

### Border radius
- rSm:   6px    (small buttons)
- rMd:   8px    (inputs, chips)
- rLg:   12px   (buttons, cards)
- rXl:   16px   (large cards)
- r2xl:  20px   (modals, bottom sheets)
- rFull: 9999px (pills, tags, avatars)

### Bottom navigation bar
- Height: 56px + safe area inset
- Background: #FFFFFF, top border: 1px solid #E8ECE9
- Icon: 24x24px SVG stroke-only
- Inactive stroke: #9EADA7 | Active stroke: #1D9E75
- Active icon background: #E6F7F1 pill (12px radius)
- Label: 10px / 500 inactive / 700 active
- AR mode: tab order mirrors — Profil leftmost, Accueil rightmost

### Skeleton shimmer
- Colors: #E8ECE9 to #D4EDE5 (jade tint) to #E8ECE9
- Animation: 1.6s ease-in-out infinite
- Must mirror exact layout of loaded state — same heights, same positions

### Offline banner
- Background: #FFEDD5, border: #FBD38D, dot: #F97316, text: #9A3412
- Full-width below header, non-dismissable, shows last sync timestamp
- Auto-appears on network drop, auto-dismisses on reconnect

## SQLite schema (5 tables — exact, do not modify without a migration)
- schedules: id, student_id, subject_name, subject_code, lecturer_name, room, day_of_week, start_time, end_time, semester, is_exam DEFAULT 0, cached_at
- grades: id, student_id, subject_code, semester, cc_score, exam_score, final_score, coefficient, passed, cached_at
- news_cache: id, title, body, category, published_at, bookmarked DEFAULT 0, read DEFAULT 0, cached_at
- student_profile: student_id PK, name, programme, faculty, year, photo_url, cached_at
- attendance: id, student_id, subject_code, sessions_total, sessions_present, threshold DEFAULT 0.75, cached_at

## API
- Base URL from .env EXPO_PUBLIC_API_URL — never hardcode
- All requests use HTTPS. HTTP rejected.
- JWT access token: 15min TTL. Refresh token: 30 days. Both in expo-secure-store.
- 401 response: trigger SessionExpiredSheet via Zustand flag — never navigate away from current screen.
- Rate limit on /auth/login: 10 req/min per IP.

## 13 screens in MVP scope
01. Splash                 — W6,      2 states, no nav, dark bg #0A3D2E only
02. Login                  — W6,      5 states, no nav, RTL required, biometric
03. Onboarding             — W6,      3 steps, no nav, RTL required
04. Home/Agenda            — W8,      6 states, Tab 1, RTL, full offline
05. Schedule               — W8,      6 states, Tab 2, RTL, full offline
06. Grades                 — W9,      6 states, Tab 3, RTL, full offline
07. News                   — W11,     6 states, Tab 4, RTL, partial offline
08. Profile/QR             — W10+W12, 6 states, Tab 5, RTL, QR offline
09. Attendance             — W11,     6 states, stack from Home, RTL
10. Article Reader         — W11,     push onto NewsStack, RTL
11. Course Detail Sheet    — W8,      bottom sheet modal, RTL
12. Grade Calculator Sheet — W9,      bottom sheet modal, offline
13. Settings               — W12,     stack from Profile, RTL

## Out of scope for MVP
- Moodle LMS integration
- QR attendance check-in for lecturers
- Student-lecturer messaging
- Tuition fee payment
- Digital library
- AI study assistant
- iOS App Store announcement
- Self-service password reset (admin-assisted only in MVP)

## Performance targets (all must pass before launch)
- Screen load on 3G: < 3s to full content
- Skeleton appearance: < 500ms from tap
- SQLite reads: < 200ms
- APK installed size: < 30MB
- List scroll: 60fps minimum
- QR generation: < 100ms local
- Push notification delivery: < 30s end-to-end
- Backend P95: < 500ms all GET endpoints
- Crash-free sessions: > 99.5% (Sentry)

## Security rules (all P0)
- Student A JWT must return 403 on Student B resources — test with 2 accounts before every release
- bcrypt cost factor 12. Never plaintext passwords.
- No PII in logs — strip student ID, name, grades from all error reports
- QR: HMAC-SHA256 signed, 60s expiry, signing key never leaves server
- Auth lockout: 3 failed attempts, 5-minute countdown, auto-unlock

## Keyboard Handling Rules (learned from beta testing)

1. Every action button in a bottom sheet with a TextInput must
   call Keyboard.dismiss() as the first line of its onPress handler.

2. Never use paddingBottom: keyboardHeight in bottom sheets —
   it creates huge empty gaps. Instead use a small fixed spacer
   (40-80px) at the bottom of the ScrollView content +
   scrollToEnd triggered by a keyboardDidShow listener.

3. onFocus alone is unreliable for repeat TextInput interactions.
   Always use Keyboard.addListener('keyboardDidShow') for scroll
   behavior — it fires every time, not just first focus.

4. Every ScrollView that contains a TextInput + action button
   must have keyboardShouldPersistTaps="handled". Without this,
   tapping the button dismisses the keyboard instead of firing
   the button's onPress.
