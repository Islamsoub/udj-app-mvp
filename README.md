<p align="center">
  <img src="assets/icons/Logo.svg" alt="Unipocket Logo" width="80" height="120" />
</p>

<h1 align="center">Unipocket</h1>

<p align="center">
  <strong>The offline-first student portal for Université de Djibouti</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

---

## Overview

Unipocket is a mobile student portal built for **Université de Djibouti (UDJ)**. It gives students instant access to their schedule, grades, attendance, news, and digital student ID — all available offline on low-end Android devices. The app supports **French (LTR)** and **Arabic (RTL)** with full right-to-left layout support.

### Key Highlights

- **Offline-first architecture** — SQLite cache with stale-while-revalidate ensures every screen works without internet
- **Encrypted local cache** — SQLCipher AES-256 on the SQLite database, key generated on-device and held in SecureStore
- **Rotating QR student ID** — 60-second JWT-signed QR code that can't be screenshot-abused
- **Bilingual** — Full French + Arabic support with RTL layout switching
- **Dark mode** — System-aware theming with manual override (light/dark/system)
- **Crash reporting** — Sentry integration (production/preview only, PII stripped)
- **Unified press system** — `PressBox` drives every tappable surface with tier-based scale, shadow, wash, and haptics
- **Low-end device targeting** — Optimized for Android API 24+ (Android 7.0), APK under 30MB

---

## Table of Contents

- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Backend](#backend)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Screens](#screens)
- [Design System](#design-system)
- [Offline Strategy](#offline-strategy)
- [Authentication](#authentication)
- [Testing](#testing)
- [Building](#building)
- [Contributing](#contributing)
- [License](#license)

---

## Screenshots

> *Screenshots coming soon — see the [Figma designs](https://figma.com) for the full screen set.*

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        React Native App                       │
│                                                                │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Screens  │  │  Stores  │  │  Hooks   │  │  Components  │  │
│  │ (Expo    │  │ (Zustand)│  │(useColors│  │  (Shared UI) │  │
│  │ Router)  │  │          │  │useOffline│  │              │  │
│  └────┬─────┘  └────┬─────┘  │  Query) │  └──────────────┘  │
│       │              │        └────┬─────┘                    │
│       └──────────────┴─────────────┘                          │
│                      │                                         │
│  ┌───────────────────┴────────────────────────────────┐       │
│  │              Services Layer                         │       │
│  │  api.ts (Axios + auto-refresh interceptor)         │       │
│  │  auth.ts (login/logout/restoreSession)             │       │
│  │  db.ts (SQLite cache — 7 tables)                   │       │
│  │  biometric.ts (expo-local-authentication)          │       │
│  │  pushNotifications.ts (Expo Push)                  │       │
│  └───────────────────┬────────────────────────────────┘       │
│                      │                                         │
│  ┌───────────────────┴────────────────────────────────┐       │
│  │           expo-secure-store (JWT tokens)            │       │
│  │           expo-sqlite (offline cache)               │       │
│  └────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
                           │
                    HTTPS / REST
                           │
┌──────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                          │
│                                                                │
│  Express + TypeScript                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │  Routes   │  │Middleware│  │    Prisma ORM             │   │
│  │ /auth     │  │ JWT auth │  │    18 models              │   │
│  │ /student  │  │ Rate     │  │                           │   │
│  │ /news     │  │ limiting │  └───────────┬───────────────┘   │
│  └──────────┘  │ CORS     │              │                    │
│                │ Helmet   │   ┌──────────┴───────────┐       │
│                └──────────┘   │  Supabase PostgreSQL  │       │
│                               │  + Storage (files)    │       │
│                               └──────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React Native + Expo (SDK 54) | Cross-platform mobile framework |
| Expo Router | File-based navigation |
| TypeScript | Type safety |
| Zustand | State management (authStore, themeStore, settingsStore) |
| expo-sqlite | Offline SQLite cache (7 tables, SQLCipher AES-256) |
| expo-secure-store | Secure JWT token + SQLCipher key storage |
| expo-crypto | On-device SQLCipher key generation |
| expo-local-authentication | Biometric login (fingerprint/face) |
| expo-image-picker | Justification photo upload |
| expo-haptics | Press feedback (PressBox tiers) |
| expo-notifications | Push notifications (Expo Push) |
| @sentry/react-native | Crash reporting (production/preview only) |
| react-native-qrcode-svg | Rotating QR student ID |
| react-native-gesture-handler | Schedule day swipe navigation |
| react-native-reanimated | Animations (PressBox, transitions) |
| react-native-svg | SVG icons and graphics |
| i18next | Internationalization (FR + AR) |
| Axios | HTTP client with auto-refresh interceptor |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| Prisma | ORM (18 models) |
| PostgreSQL (Supabase) | Production database |
| Supabase Storage | File uploads (justification documents) |
| JSON Web Tokens | Access (15min) + Refresh (30d) tokens |
| Multer | Multipart file upload handling |
| Helmet | Security headers |
| bcryptjs | Password hashing |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Render.com | Backend hosting (free tier) |
| Supabase | PostgreSQL database + file storage |
| Expo EAS Build | APK generation |
| GitHub | Version control (private repo) |

---

## Project Structure

```
udj-app-mvp/
├── app/                          # Screens (Expo Router file-based)
│   ├── (auth)/                   # Auth screens
│   │   ├── login.tsx             # Login with biometric support
│   │   ├── onboarding.tsx        # 4-step onboarding + language picker
│   │   └── splash.tsx            # Splash with 5 states
│   ├── (tabs)/                   # Main tab screens
│   │   ├── home.tsx              # Home/Agenda
│   │   ├── schedule.tsx          # Schedule with swipe + week nav
│   │   ├── grades.tsx            # Grades + Calculator + GPA History
│   │   ├── news.tsx              # News feed with filters + bookmarks
│   │   └── profile.tsx           # Profile + QR card
│   ├── article-reader.tsx        # Full article view
│   ├── attendance.tsx            # Attendance + justification upload
│   ├── notifications.tsx         # Notifications with unread dots
│   ├── settings.tsx              # All preferences
│   ├── info-center.tsx           # Campus info + FAQ
│   ├── programme-detail.tsx      # Programme info page
│   ├── faculty-detail.tsx        # Faculty info page
│   ├── storage-detail.tsx        # Cache management
│   └── account-info.tsx          # Account details
├── components/                   # Shared components by domain
│   ├── attendance/               # AttendanceHeader, AbsenceSection, JustifySheet
│   ├── grades/                   # GradesHeader, SubjectCard, GPA sheets
│   ├── news/                     # ArticleCard, HeroCard, FilterRow, NewsHeader
│   ├── notifications/            # NotificationItem
│   ├── profile/                  # ProfileHeader, StudentCard, InfoRow
│   ├── schedule/                 # CourseCard, DayStrip, TimelineRow
│   ├── settings/                 # SettingsRow, ThemePicker, LogoutConfirm
│   └── ui/                       # SessionExpiredModal, OfflineBanner, SkeletonBox
├── constants/
│   ├── theme.ts                  # Colors (light+dark), spacing, radius, fonts, withAlpha, sizing
│   ├── api.ts                    # API_BASE_URL from env var
│   └── colorMap.ts               # Subject/category color mapping
├── hooks/
│   ├── useColors.ts              # Theme-aware color hook
│   ├── useOfflineQuery.ts        # Stale-while-revalidate hook
│   └── useAuth.ts                # Auth state hook
├── services/
│   ├── api.ts                    # Axios instance + all API functions
│   ├── auth.ts                   # Login/logout/restoreSession
│   ├── biometric.ts              # Biometric auth service
│   ├── db.ts                     # SQLite cache (7 tables + course_notes)
│   ├── cacheMappers.ts           # API → SQLite mapping
│   └── pushNotifications.ts      # Expo Push registration
├── stores/
│   ├── authStore.ts              # Auth state (Zustand)
│   ├── themeStore.ts             # Theme mode (persisted)
│   ├── settingsStore.ts          # Language, RTL, notifications
│   ├── networkStore.ts           # Online/offline state
│   ├── articleStore.ts           # Article reading state
│   └── courseDetailStore.ts      # Course detail bottom sheet
├── locales/
│   ├── fr.json                   # French translations
│   └── ar.json                   # Arabic translations
├── utils/
│   ├── greeting.ts               # Dynamic greeting + isWeekend
│   ├── gradesMention.ts          # GPA mention calculation
│   └── gradesStatus.ts           # Grade status (Validé/À Risque)
├── assets/icons/                 # SVGs, fonts, logo
├── backend/                      # Express API
│   ├── prisma/
│   │   ├── schema.prisma         # 18 models
│   │   └── seed.ts               # Test data seeder
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login/refresh/logout
│   │   │   ├── student.ts        # Profile/schedule/grades/attendance/notifications
│   │   │   └── news.ts           # News articles
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── rateLimiter.ts    # Rate limiting
│   │   │   ├── errorHandler.ts   # Global error handler
│   │   │   └── logger.ts         # Request logging
│   │   └── utils/
│   │       ├── env.ts            # Environment validation
│   │       ├── prisma.ts         # Prisma singleton
│   │       ├── hash.ts           # Password hashing
│   │       └── supabase.ts       # Supabase Storage client
│   └── tests/
│       └── api-prod-test.ts      # 31 production API tests
├── app.json                      # Expo config
├── eas.json                      # EAS Build profiles
├── CLAUDE.md                     # AI coding rules
└── tsconfig.json                 # TypeScript config
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Android Studio** (for emulator) or a physical Android device
- **EAS CLI** for building APKs and the dev client: `npm install -g eas-cli`

> **Expo Go is not supported.** SQLCipher (encrypted SQLite) requires a native build, so development runs against a **custom dev client** (`expo-dev-client`), not Expo Go. Build one once with `npx eas build --platform android --profile development`, install the resulting APK, then start Metro and connect to it.

### Installation

```bash
# Clone the repo
git clone https://github.com/Islamsoub/udj-app-mvp.git
cd udj-app-mvp

# Switch to develop branch
git checkout develop

# Install frontend dependencies
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
npm install
cd ..
```

### Running the App (Development)

```bash
# Start Metro bundler (dev client)
npx expo start --dev-client

# Press 'a' to open on the Android emulator/device
# (requires the custom dev client installed — Expo Go will not load SQLCipher)
```

### Running the Backend Locally

```bash
cd backend

# Create .env file (see Environment Variables section)
cp .env.example .env
# Edit .env with your values

# Push schema to database
npx prisma db push

# Seed test data
npx prisma db seed

# Start dev server
npm run dev
```

---

## Environment Variables

### Frontend (.env in project root)

```env
EXPO_PUBLIC_API_URL=https://udj-api.onrender.com
```

### Backend (backend/.env)

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
QR_SECRET="your-qr-secret"
SUPABASE_URL="https://PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
NODE_ENV="development"
PORT=3000
```

> **Security note:** Never commit `.env` files. Both are listed in `.gitignore`.

---

## Backend

### Deployment

The backend is deployed on **Render.com** (free tier) and auto-deploys from the `develop` branch.

- **Production URL:** https://udj-api.onrender.com
- **Health check:** GET /health

> **Note:** Render free tier spins down after 15 minutes of inactivity. First request after idle may take ~50 seconds.

### Database

**Supabase PostgreSQL** (free tier, EU West — Ireland)

- 18 tables managed via Prisma ORM
- Connection pooling via PgBouncer (`?pgbouncer=true&connection_limit=1`)
- Supabase Storage bucket `justifications` for absence proof uploads

### Seeding

```bash
cd backend
npx prisma db seed
```

Seeds 7 faculties, 11 programmes, 2 semesters and 68 subjects (S1 + S2), then **6 students** across 6 programmes with their full academic record:

| Entity | Rows |
|--------|------|
| Students | 6 |
| Faculties / Programmes | 7 / 11 |
| Semesters / Subjects | 2 / 68 |
| Schedule entries | 60 |
| Grades | 68 |
| Attendance records | 580 |
| News articles / categories | 15 / 6 |
| Notifications | 33 |
| Admin accounts | 6 |

### Test Accounts

All accounts share the password **`test1234`**.

| Name | Student ID | Programme | Faculty | Level | Sem. |
|------|------------|-----------|---------|-------|------|
| Ahmed Omar Said | `UDJ-2024-0432` | Informatique | Faculté des Sciences | Licence | 4 |
| Saba Soubere Farah | `UDJ-2024-0587` | Droit | Faculté de Droit, d'Économie et de Gestion | Licence | 4 |
| Salsabila Soubere Farah | `UDJ-2024-0891` | Mathématiques | Faculté des Sciences | Licence | 4 |
| Sadeka Soubere Farah | `UDJ-2024-1045` | Économie et Gestion | Faculté de Droit, d'Économie et de Gestion | Licence | 4 |
| Ibrahim Moussa Aden | `UDJ-2024-1298` | Génie Civil | Faculté d'Ingénieurs | Master | 4 |
| Sagal Said Moussa | `UDJ-2024-1501` | Bachelor in Business Administration | Faculté de Droit, d'Économie et de Gestion | Licence | 2 |

> Ahmed carries a **rejected** absence justification and Sagal a **pending** one, so both
> review states can be exercised without touching the admin portal.

---

## Database Schema

```
Faculty (7)        → Programme (11)    → Student (6)
                                        → Grade (68)
                                        → ScheduleEntry (60)
                                        → AttendanceRecord (580)
                                        → Notification (33)
                                        → QrToken
                                        → RefreshToken
                                        → PushToken

Semester (2)       → Subject (68)

NewsArticle (15)   → NewsCategory (6)

Admin (6)          → AdminRefreshToken
                   → AuditLog
```

### Key Models

| Model | Key Fields |
|-------|------------|
| Student | studentIdDisplay, email, currentSemester, status (ACTIVE/SUSPENDED/GRADUATED) |
| Grade | cc, exam, coefficient, finale (CC×0.4 + EXAM×0.6) |
| ScheduleEntry | dayOfWeek (0-6), startTime, endTime, room, type (COURSE/TD/TP/EXAM) |
| AttendanceRecord | status (PRESENT/ABSENT/JUSTIFIED/LATE), justificationUrl, justificationStatus (PENDING/APPROVED/REJECTED) |
| Notification | type (GRADES/SCHEDULE/ATTENDANCE/NEWS/GENERAL), isRead |
| NewsArticle | category, isUrgent, heroImageUrl |

---

## API Endpoints

All endpoints require JWT authentication unless noted.

### Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login with student ID + password |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Invalidate refresh token |

### Student (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /student/me | Student profile + faculty + programme + stats |
| GET | /student/schedule | Full semester schedule |
| GET | /student/grades | Grades by semester |
| GET | /student/attendance | Attendance per subject + individual absences |
| GET | /student/notifications | Notifications list |
| PATCH | /student/notifications/read-all | Mark all notifications as read |
| PATCH | /student/preferences | Update notification/quiet hours preferences |
| GET | /student/qr-token | 60-second signed QR JWT |
| POST | /student/push-token | Register Expo push token |
| DELETE | /student/push-token | Unregister this device's push token (called on logout) |
| POST | /student/attendance/:id/justification | Upload absence justification (multipart) |

### News (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /news | All articles (with category filter) |
| GET | /news/:id | Single article |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check (public) |

---

## Screens

The app has **17 route screens** (plus a global `ErrorBoundary` in `app/_layout.tsx`), most with **6 states** (Loaded, Skeleton, Empty, Error, Offline, Session Expired):

| Screen | Tab | Key Features |
|--------|-----|-------------|
| Splash | — | JWT validation, auto-route |
| Login | — | Password + biometric auth, lockout after 3 failures |
| Onboarding | — | 4 steps + language picker |
| Home | Tab 1 | Greeting, agenda cards, news section, stats |
| Schedule | Tab 2 | Day timeline, swipe between days, week navigation |
| Grades | Tab 3 | Subject cards, GPA chart, grade calculator |
| News | Tab 4 | Category filters, bookmarks, article reader |
| Profile | Tab 5 | Digital ID, QR card, faculty/programme detail |
| Attendance ("Mes Absences") | — | Presence rate per subject, per-record absence list, justification upload with notes, and per-record review state (pending / approved / rejected) |
| Article Reader | — | Full article view, offline-cached body, bookmark toggle |
| Notifications | — | Grouped by date, unread dots, tap-to-navigate |
| Settings | — | Language, theme, notifications, cache management |
| Info Center | — | FAQ, contacts, PDF forms |
| Programme Detail | — | Programme info page |
| Faculty Detail | — | Faculty info with contact/address/hours |
| Storage Detail | — | Cache breakdown + per-table clearing |
| Account Info | — | Account details (matricule, email, status) |

---

## Design System

### Colors

| Token | Light | Dark |
|-------|-------|------|
| jadePrimary | #1D9E75 | #2ECC96 |
| jade600 | #0F6E56 | #1D9E75 |
| bgPrimary | #F5F7F6 | #141E1A |
| bgSurface | #FFFFFF | #1C2B26 |
| textPrimary | #1C2320 | #F0F5F3 |
| danger | #EF4444 | #EF4444 |
| warning | #F59E0B | #F59E0B |

Full palette in `constants/theme.ts` with `withAlpha()` helper for opacity.

### Typography

| Font | Usage |
|------|-------|
| Plus Jakarta Sans | French UI text (Regular/Medium/SemiBold/Bold/ExtraBold) |
| Noto Naskh Arabic | Arabic text (Regular/Bold) |
| DM Mono | Numbers, IDs, times, code |

### Spacing

8px base grid. All values from `spacing` constants. Touch targets minimum 44×44px.

### Radius

6px (small) → 8px (inputs) → 12px (buttons/cards) → 16px (large cards) → 20px (modals) → 9999px (pills)

---

## Offline Strategy

Every data screen uses the `useOfflineQuery` hook implementing **stale-while-revalidate**:

1. **Instant:** Show cached data from SQLite immediately
2. **Background:** Fetch fresh data from API
3. **Update:** Replace cache with fresh data, re-render
4. **Fail gracefully:** If API fails, cached data stays visible + OfflineBanner appears

### Cache Tables (SQLite)

| Table | Data | Persistence |
|-------|------|-------------|
| student_profile | Profile + faculty + programme | Until logout |
| schedules | Full semester schedule | Until logout |
| grades | Grades per semester | Until logout |
| news_cache | Articles + bookmarks + read state | Until clear cache |
| notifications | Notifications + read state | Until clear cache |
| attendance | Attendance per subject | Until logout |
| course_notes | Personal course notes (user-authored) | Permanent (never cleared) |

**User-owned columns** (bookmarks, read state) are protected from API overwrites via `ON CONFLICT DO UPDATE` that preserves these values.

---

## Authentication

### Flow

1. **Login:** Student ID + password → JWT access token (15min) + refresh token (30d)
2. **Auto-refresh:** Axios interceptor catches 401 → uses refresh token → retries original request
3. **Biometric:** After first login, opt-in to fingerprint/face → stores preference in SecureStore → subsequent logins use biometric to unlock refresh token
4. **Lockout:** 3 failed password attempts → 5-minute lockout with countdown
5. **Session expired:** Bottom sheet overlay on current screen (never navigates away)

### Token Storage

| Token | Storage | TTL |
|-------|---------|-----|
| Access token | Zustand (memory) | 15 minutes |
| Refresh token | expo-secure-store (encrypted) | 30 days |
| Biometric preference | expo-secure-store | Permanent |

> **Never** stored in AsyncStorage. **Never** stored in SQLite.

---

## Testing

### Production API Tests

31 automated tests covering all endpoints against the live Render server:

```bash
cd backend
npm run test:prod
```

Tests cover: health, login (correct/wrong/lockout), token refresh (valid/invalid), all protected endpoints, mutations, news, attendance justification edge cases, and logout.

### Pre-push Checklist

```bash
npx expo-doctor       # Expo project health
npx tsc --noEmit      # TypeScript check (zero errors required)
```

---

## Building

### Development APK (preview)

```bash
npx eas build --platform android --profile preview
```

Produces an installable `.apk` file via EAS Build.

### Production AAB (Play Store)

```bash
npx eas build --platform android --profile production
```

Produces a signed `.aab` for Google Play Store submission.

### Current Version

- **App version:** 1.0.0
- **Min Android:** API 24 (Android 7.0)
- **Target Android:** API 35

---

## Contributing

This is currently a private project developed by **Islam Soubere Farah** with design by **Sagal**. Visual specifications (colors, spacing, typography, component states) are sourced from **Claude Design**, which is the source of truth for the design system in `constants/theme.ts`.

### Development Rules

- One atomic change per commit — never batch unrelated changes
- All colors from `constants/theme.ts` via `useColors()` hook — no hardcoded hex
- All strings via `i18next` `t()` calls — no hardcoded French or Arabic
- 8px spacing grid — all spacing from `spacing` constants
- `DM Mono` font for all numbers, IDs, and times
- Flex layout only — no `position: 'absolute'` (except modals/overlays)
- `--legacy-peer-deps` for all npm installs
- Screenshot after every visual change before committing
- Pre-push: `npx expo-doctor` + `npx tsc --noEmit`

### Branch Strategy

- `develop` — active development (default push target)
- `main` — stable releases only

### Commit Convention

```
type: short description
```

Types: `feat`, `fix`, `chore`, `test`, `refactor`

---

## License

**Proprietary** — All rights reserved. This software is developed exclusively for Université de Djibouti.

---

<p align="center">
  Built with ❤️ in Djibouti 🇩🇯
</p>
