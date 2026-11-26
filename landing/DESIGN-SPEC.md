# Unipocket landing page: design spec

Version 1.1 (university-neutral) · 2026-11-26 · target: https://unipocket.io

Source of truth: `index.html`, `css/tokens.css`, `css/styles.css`, `i18n/strings.js`. Where this document and the code disagree, the code wins; please report the mismatch.

---

## 0. Open questions

These are not decided. The page ships with the default shown in brackets.

1. **Primary button colour.** The app uses jade-400 `#1D9E75` with white text. That is 3.39:1, which fails WCAG AA for 15px text. *[Web: buttons are jade-600 `#0F6E56` (6.20:1) and jade-900 on hover. jade-400 is kept for icons, fills and large headline accents.]* Confirm, or decide whether the app should follow.
2. **Secondary text colour.** The app's `#6B7B74` is 4.14:1 on `#F5F7F6` and fails AA. *[Web: `--text-secondary: #56665F` (5.64:1).]* Confirm.
3. **Digits in Arabic.** *[Western digits in DM Mono everywhere, as requested.]* Some old app mock-ups use Eastern Arabic digits (٠١٢). Which one does the app use in AR?
4. **Arabic URL / SEO.** *[One page; Arabic via `?lang=ar` and JS. Without JS the page is French.]* Do you want a static `/ar/` page at launch (recommended for search engines and shared links), or later?
5. **Download QR target.** *[`assets/images/qr-download-unipocket-io.svg` encodes `https://unipocket.io/`.]* Once the Play Store listing exists, should the QR point there instead? It needs regenerating (see README).
6. **Social networks.** Which ones, and their URLs? *[None shown: the footer "Nous suivre" block stays hidden while every value in `config/links.js → socials` is empty.]*
7. **App screens tour.** The original design had a second page (`ecrans.html`). *[Removed: it was tied to one university. Nav link removed.]* Rebuild it later as a neutral page?
8. **Store name and package.** Confirm the public app name ("Unipocket"), the package ID and the listing URL.
9. **Student ID format.** *[Neutral example `ETU-2024-0432` (step 2, QR card).]* Each university has its own format; keep the neutral one or change it.
10. **Fictional demo people.** Ahmed Omar Said, Pr. Abdi Hassan, Pr. Warsama and Pr. Djibril are made up. Check they don't match real staff or students, or swap in neutral names.
11. **Legal owner for the © line.** *[© Unipocket.]* Confirm the legal entity.
12. **"Fait pour les étudiants, par des étudiants"** (footer). Is this true and approved?
13. **"Nouveau" pill in the hero.** How long should it stay?
14. **`uploads/Logo.svg` (a U with a mortarboard).** Is it an official brand variant? *[Not used. Brand = the U app icon plus the "Unipocket" wordmark.]*
15. **Product claims** (§10). Each one has to be checked against the shipped app before launch.
16. **Testimonials and figures.** Is there consented, real content? *[Block hidden by default.]*
17. **University positioning.** *[The page is university-neutral: no university name or logo, "ton université" / "toute université est la bienvenue". The "Inscrire mon université" button uses `staffContact` in `config/links.js`.]* When a launch partner is confirmed, do you want its name or logo back on the page?
18. **Screenshots in the app images** still show fictional demo data from the prototypes (names, courses, rooms). Fine for launch, or replace with a dedicated demo account?

---

## 1. Tokens

All of these are defined in `css/tokens.css`. (app) = same value as in the Unipocket app.

### 1.1 Colour

| Token | Value | Use |
|---|---|---|
| `--jade-50` (app) | #E6F7F1 | tinted chips, eyebrows, icon tiles |
| `--jade-100` (app) | #B3E4D3 | – |
| `--jade-200` (app) | #7FCEAF | headline accent on dark (share image) |
| `--jade-300` (app) | #3FB88E | focus ring |
| `--jade-400` (app) | #1D9E75 | brand accent: icons, pillar discs, large headline accent, sliders, charts. **Not for text under 24px.** |
| `--jade-600` (app) | #0F6E56 | primary buttons, links, small accent text |
| `--jade-900` (app) | #0A3D2E | dark sections, button hover, h1 |
| `--bg-light` (app) | #F5F7F6 | page background |
| `--surface` / `--white` | #FFFFFF | cards |
| `--border` (app) | #E8ECE9 | 1px card borders, dividers |
| `--text-primary` (app) | #1C2320 | body text (14.9:1 on bg) |
| `--text-secondary` | #56665F | secondary text (5.6:1 on bg). App value #6B7B74; see open question 2 |
| `--text-tertiary` (app) | #9EADA7 | decoration only (dashed borders, phone mock). Never for real text (2.3:1) |
| `--text-hero` | #2F4A40 | hero lead on sky (7.7:1) |
| `--warning` / `-bg` / `-700` / `-800` | #F59E0B / #FEF3C7 / #B45309 / #92400E | exams, at-risk, calculator warning (text 800 on bg: 6.4:1) |
| `--danger` / `-bg` / `-700` | #EF4444 / #FEE2E2 / #B91C1C | "official" tag, calculator impossible (5.3:1) |
| `--info` / `-bg` / `-700` | #3B82F6 / #DBEAFE / #1E40AF | grades, "network back" state (7.2:1) |
| `--exam` / `-bg` / `-700` | #8B5CF6 / #EDE9FE / #6D28D9 | events, chemistry blocks (6.0:1) |
| `--offline` / `-bg` / `-800` | #F97316 / #FFEDD5 / #9A3412 | offline banner and state (6.4:1) |
| `--success-300` | #86EFAC | QR progress bar, "active" dot on the dark card |
| `--sky-top` · `--sky-2` · `--sky-mid` · `--sky-low` | #9FD3EE · #B7E0F1 · #CDEAF3 · #EAF7F2 | hero sky gradient (top to bottom, ending on bg-light) |
| `--panel-1` · `-2` · `-3` | #D9F2E8 · #EAF6FB · #E7F0FF | soft radial behind spotlight panels |
| `--stripe-a` · `--stripe-b` | #EEF2F0 · #F7F9F8 | placeholder stripes |
| `--device` · `--device-edge` | #0F1513 · #2B3531 | phone mock-up bezel |

Alpha overlays (glass nav, shadows, glows) are written as `rgba()` of these same colours.

### 1.2 Typography

| Token | Value |
|---|---|
| `--font-sans` | Plus Jakarta Sans (variable 400–800), system-ui fallback. All French text |
| `--font-ar` | Noto Naskh Arabic (variable 400–700), then Plus Jakarta Sans for Latin words inside Arabic. Applied to `body` when `dir="rtl"` |
| `--font-mono` | DM Mono 400/500. IDs, times, grades, percentages, version, formulas, step numbers. In RTL it falls back to Naskh for Arabic letters, so digits stay DM Mono |
| `--font-hand` | Caveat 600. **Only** the two hand-written notes beside the hero phone ("fini les captures WhatsApp !", "même sans réseau"). They are a playful, student-voice aside that echoes the original design. They are shown only at ≥1100px, so the font is never downloaded on phones. In Arabic the notes use Naskh at 0.8em |

| Style | Size | Weight | Line height | Letter spacing (FR / AR) |
|---|---|---|---|---|
| Display (hero h1) `--fs-display` | clamp(38px, 6.4vw, 74px) | 800 (AR 700) | 1.04 (AR 1.35) | −0.035em / 0 |
| Section h2 `--fs-h2` | clamp(30px, 4.2vw, 48px) | 800 (AR 700) | 1.1 (AR 1.4) | −0.03em / 0 |
| Spotlight h2 `--fs-h2-spot` | clamp(28px, 3.6vw, 42px) | 800 | 1.12 | −0.03em / 0 |
| CTA h2 | clamp(30px, 4vw, 48px) | 800 | 1.1 | −0.03em / 0 |
| Card h3 `--fs-h3` | 20px (offline/bilingual 24px, who 26px → 22px ≤600) | 700 | 1.25 | −0.01em / 0 |
| Lead `--fs-lead` | 17px (hero clamp(16px, 1.6vw, 18px)) | 400 | 1.6 | 0 |
| Body `--fs-body` | 15px | 400 | 1.6 | 0 |
| Nav link | 14px | 500 | – | 0 |
| Button | 15px (sm 14px) | 700 | – | 0 |
| Store button | label 11px/500 at 75% opacity, name 17px/700 | | 1.2 | |
| Eyebrow / meta `--fs-small` | 13px | 600 | – | 0 |
| Badge `--fs-micro` | 11px | 700 | – | 0 |
| Phone mock text | 8.5–18px | | | illustration only, not real UI text |

### 1.3 Spacing (8px grid, 4px half-step)

`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-7` 28 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48 · `--s-14` 56 · `--s-16` 64 · `--s-18` 72 · `--s-24` 96 · `--s-30` 120 (px). Every padding, margin and gap in `styles.css` is a multiple of 4px. Hairlines (1–2px) are the only exception.

Layout: `--container` 1180px max, `--gutter` 24px (16px ≤600px). Sections: 96px vertical padding (72px ≤600px); sections after the first in a group use 24px top padding. Minimum tap target `--tap` 44×44px.

### 1.4 Radii

`--r-sm` 6 · `--r-md` 8 · `--r-lg` 12 · `--r-xl` 16 · `--r-2xl` 20 (cards, panels, CTA, QR panel) · `--r-full` pills and buttons · `--r-device` 46 / `--r-device-screen` 36 (phone mock only). Nothing else is above 20px.

### 1.5 Shadows

`--shadow-sm` 0 1px 3px / .08 + 0 1px 2px / .04 · `--shadow-md` 0 4px 12px / .10 + 0 2px 4px / .05 · `--shadow-lg` 0 8px 24px / .12 + 0 4px 8px / .06 (all rgba of #1C2320) · `--shadow-xl` 0 30px 60px −12px / .28 + 0 12px 24px −8px / .14 (rgba of #0A3D2E): phone and student card.

### 1.6 Motion tokens

`--ease` cubic-bezier(.2,.7,.2,1) · `--t-fast` 150ms · `--t-base` 250ms · `--t-reveal` 700ms.

### 1.7 Breakpoints

1280+ desktop · ≤1100 nav links collapse into the menu, hand notes hidden · ≤920 floating cards pulled in · ≤900 grids go to 1–2 columns · ≤760 phone and floating cards stack, sticky download bar · ≤600 phone layout (16px gutter, no blur, clouds still) · 360 minimum supported width.

---

## 2. Sections (top to bottom)

RTL in general: `<html dir="rtl" lang="ar">`. The layout uses logical properties, so every row, grid and inline-start/end position mirrors on its own. Text is right-aligned (start). Arrows flip. IDs, formulas and URLs stay LTR. Heading letter-spacing is reset to 0 and line height opened up (1.35–1.4) for Naskh.

### 2.1 Skip link
- **Purpose:** keyboard users jump straight to the content.
- **Layout:** hidden above the viewport; on focus it slides to top: 16px, inset-inline-start: 16px, on jade-900 with white text.
- **Elements:** `a.skip` → `#main`.

### 2.2 Navigation
- **Purpose:** brand, section links, language switch, download.
- **1280:** fixed glass pill (max 1040px, 14px from the top, white 72% plus 16px blur). Brand (34px icon + "Unipocket" 17/800 + "Portail étudiant" 10/500), 5 links centred, FR/ع toggle, "Télécharger" (sm).
- **768:** links hidden; brand, toggle, "Télécharger", 44px menu button.
- **360:** brand subtitle and "Télécharger" hidden; brand, toggle, menu button. No blur (white 96%).
- **RTL:** order mirrors (brand on the right). Pill padding mirrors.
- **Elements:** `.brand`, `.nav-links` (Unipocket, Fonctionnalités, Hors-ligne, Pour qui, FAQ), `.lang-toggle`, `.nav-cta`, `.menu-btn`, `#menuSheet`.

### 2.3 Hero
- **Purpose:** say what Unipocket is in one line and offer the download.
- **1280:** sky gradient (sky-top → bg-light) with 6 drifting clouds. Centred copy (max 820px): pill ("Nouveau" + portal line), h1 in 2 lines (line 2 in a jade gradient), lead (max 580px), store row (Google Play dark, APK jade-600, App Store "soon" ghost), link to the student website, meta line (FR · العربية · Android first · version). Below that a 1000×620 stage: 300×620 phone mock centred, 4 floating cards around it (next class top-left, average top-right, QR bottom-right, offline bottom-left), 2 Caveat notes.
- **768:** floating cards pulled to the edges, notes hidden.
- **≤760:** the stage becomes a column: phone 280×580 first, then the "next class" and "QR" cards stacked (max 320px). The other two cards are hidden.
- **360:** store buttons full width, App Store button hidden (iOS is still mentioned in the meta line), pill text wraps, clouds static, 2 large clouds hidden. Top padding 120px.
- **RTL:** card positions mirror (`inset-inline-*`), the note arrow mirrors, phone mock content is Arabic and RTL.
- **Elements:** `.pill`, `h1`, `.lead`, `#heroStores`, `.web-link`, `.store-meta`, `.stage` (`.float.f-next/.f-gpa/.f-qr/.f-off`, `.annot.a1/.a2`, `.phone`).

### 2.4 Pillars
- **Purpose:** four reasons in one glance.
- **1280:** h2 18/700 centred, 4 columns (40px jade-400 disc + white icon + 15/600 label).
- **768:** 2×2, items aligned to start.
- **360:** 1 column.
- **RTL:** mirrored.
- **Elements:** offline, FR & AR, secure data, mobile & web.

### 2.5 What Unipocket is (`#unipocket`)
- **Purpose:** one portal, three ways in (app, student website, admin portal).
- **1280:** title block (eyebrow, h2 with accent, lead, max 720px), then 3 equal cards: 44px icon tile and an audience tag (Étudiants jade-50 / Personnel jade-900) on one row, h3, text, then a 16:10 screenshot.
- **768 / 360:** 1 column.
- **RTL:** mirrored. The audience tag sits on the left.
- **Elements:** 3 × `.card` with `picture.shot` (placeholders, §6).

### 2.6 Features (`#fonctionnalites`)
- **Purpose:** the six things students use every day.
- **1280:** 6-column bento: schedule and grades (3 + 3, with demos: week grid, grade rows), news, attendance and notifications (2 + 2 + 2, with demos), info centre (full width, icon and text in one row).
- **768:** 2 columns; wide cards span both.
- **360:** 1 column.
- **RTL:** mirrored. The week grid starts on the right. Progress bars grow from the right.
- **Elements:** `.bento .card`, `.demo` blocks (illustrations; demo data is fictional).

### 2.7 Calculator + student card (`#carte`)
- **Purpose:** show two signature features working.
- **1280:** two rows of 2 columns (copy | panel), the second row reversed. Each panel sits on a soft 3-colour radial (`--panel-*`).
- **768 / 360:** 1 column, copy first. Panel padding 16px at 360. The student card stacks the QR above the details.
- **RTL:** columns mirror. The formula and ID stay LTR. The QR progress bar shrinks towards the left.
- **Elements:** `.calc` (§3.12), `.idcard` (§3.13), "Démonstration — données fictives".

### 2.8 Offline mode (`#hors-ligne`)
- **Purpose:** explain, and let people try, how the app behaves without network.
- **1280:** title block, then 2 columns: 3 numbered steps (buttons) | demo panel (3-state switch above a framed mini-screen with banner and 6 data rows). Below, a full-width bilingual card (copy and "see this page in Arabic" button | two greeting bubbles).
- **768 / 360:** 1 column, **demo first**, steps below. Bilingual card stacks.
- **RTL:** mirrored. Arrow keys on the switch follow visual order.
- **Elements:** `#offDemo` (§3.14), `.bi` card, `#langTry`.

### 2.9 Who it's for (`#pour-qui`)
- **Purpose:** students on one side, the university on the other.
- **1280:** 2 equal cards. Students: light card, tag, h3 26px, text, 4 checks, "Télécharger l'app" button. University: jade-900 card, tag in the top row, h3, text, 4 checks, "Inscrire mon université" (white button) and "Accès personnel" (outline) buttons.
- **768 / 360:** stacked. At 360 the two buttons share the row equally.
- **RTL:** mirrored.

### 2.10 Testimonials and figures (proof block): **off by default**
- **Purpose:** social proof, once there is real content.
- Wrapped in `<!-- BEGIN proof-block -->` … `<!-- END proof-block -->` with `hidden` on the `<section>`. Remove `hidden` to switch it on, or delete the block.
- **1280:** title, 3 figures (number 40px DM Mono jade-600 + caption), 2 quotes (18/600 quote, 48px round photo, name and role).
- **768:** 3 figures in a row, 2 quotes. **360:** everything in 1 column.
- **RTL:** mirrored; figures stay LTR digits.

### 2.11 Get started
- **Purpose:** 3 steps to start using it.
- **1280:** 3 cards (40px jade-900 number disc in DM Mono, h3, text, sample ID in `code`).
- **768 / 360:** 1 column.
- **RTL:** mirrored.

### 2.12 FAQ (`#faq`)
- **Purpose:** remove the blockers (price, login, offline, desktop, iPhone, APK install, privacy).
- **All widths:** max 780px column of 7 `<details>`.
- **RTL:** the "+" moves to the left.

### 2.13 Final CTA (`#telecharger`)
- **Purpose:** the download moment.
- **1280:** rounded 20px panel (jade-600 → jade-900 at 150° with a soft jade glow), 2 columns: h2, lead, store row (white buttons, App Store translucent), 2 text links (student website, admin portal) | white QR panel (180px QR + caption).
- **768 / 360:** 1 column, centred. QR panel below.
- **RTL:** mirrored.

### 2.14 Footer
- **1280:** 4 columns: brand and about line | Application | Accès | Légal (+ "Nous suivre", hidden until a social link exists). Legal row: © year, tagline.
- **768:** 2 columns (brand full width). **360:** 1 column. 104px bottom padding at ≤760 so the sticky bar never covers it.
- **RTL:** mirrored.

### 2.15 Sticky download bar (≤760 only)
- See §3.6.

### 2.16 Other pages
- **404.html:** sky-to-bg gradient, big "404" in DM Mono jade-400, h1, lead, "Retour à l'accueil" (primary) and "Voir la FAQ" (ghost). `noindex`.
- **privacy.html / terms.html:** same simple nav, back link, h1, "Dernière mise à jour : [JJ/MM/AAAA]", white 20px-radius `.prose` box holding a marked placeholder. Replace the `.prose` content with the approved text (h2 / p / ul are already styled).

---

## 3. Components

Shared states: **hover** applies on pointer devices only. **Focus** = 3px `--jade-300` outline with 3px offset, on every interactive element (`:focus-visible`). **Pressed** = scale(.98). **Disabled** = no hover, no press, `cursor: default`, `aria-disabled="true"`. **Arabic** = mirrored and set in Naskh; numbers stay DM Mono.

1. **Button** `.btn`: 48px high (sm 44), padding 0 24px (sm 0 16px), radius full, 15/700 (sm 14/700), gap 8–12px.
   - Primary: jade-600, white text, shadow 0 8px 20px −6px jade-600/.55. Hover jade-900 and translateY(−1px).
   - Ghost-dark: white, 1px border, jade-600 text. Hover border jade-200.
   - Light (on dark): white with jade-900 text. Hover jade-50.
   - Outline-light: 1px white/.35 border. Hover white/.08 fill.
   - No loading state (no button submits anything).
2. **Store button** `.store-btn`: min 58px high, padding 8px 24px 8px 20px, radius 16px, 26px icon + two-line label.
   - Dark: text-primary background, black on hover.
   - APK: jade-600, jade-900 on hover.
   - Soon: white 75%, 1px border, no shadow, no hover, `aria-disabled`.
   - Hover translateY(−2px) and shadow-lg.
   - Inside the CTA: white, hover jade-50; "soon" is translucent white with a white/.25 border.
   - ≤600: full width, centred.
   - Unset link = "coming soon" toast. **Replace with the official Google Play / App Store badges before launch** (their brand rules).
3. **Nav pill**: see §2.2. Links 44px high, padding 8px 16px, text-secondary. Hover text-primary on jade 8%.
4. **Language toggle** `.lang-toggle`: track 3px padding on bg-light with a 1px border. Two buttons 40×36px, each with a hit area extended to 44px. Pressed state (`aria-pressed="true"`) = white with shadow-sm and jade-600 text. "ع" is drawn in the system font, so Naskh is never loaded in French mode. Each button has `lang` + `aria-label` (Français / العربية).
5. **Phone menu** `.menu-btn` + `#menuSheet` (≤1100):
   - Button 44px circle on bg-light, two 16×2px bars that cross into an X when open (200ms).
   - Sheet: white, radius 20, shadow-lg, 8px padding. Links 48px high, 16/600, hover jade-50 / jade-600. A full-width primary button at the end.
   - Keyboard: when it opens, focus moves to the first link. Esc closes and returns focus to the button. Tapping a link or outside closes it. It closes itself when the window grows past 1100px.
   - No JS: the button is hidden and the links show as a horizontal scroller.
6. **Sticky download bar** `.m-cta` (≤760): fixed bottom bar, white 97%, top border, safe-area padding, 12px/16px padding. Primary "Télécharger Unipocket" (flex 1) + ghost "Site web".
   - Hidden: translateY(110%) plus `inert`. Shown: slides in over 250ms once the hero store row has scrolled above the viewport; hides again while `#telecharger` is on screen.
   - While it is shown the toast moves up to 88px.
7. **Pill** `.pill`: radius full, padding 6px 14px 6px 6px (mirrored in RTL), white 65% with blur, 13/500 jade-900. Inner badge jade-600, 11/700 white.
8. **Badges / tags**: `.badge` 11/700, padding 4px 8px, radius full. ok = jade-50/jade-600, risk = danger-bg/danger-700. `.who-tag` 28px high, 12/700, jade-50/jade-600 or jade-900/white. `.eyebrow` 13/600, padding 8px 16px, jade-50/jade-600.
9. **Feature card** `.card`: white, 1px border, radius 20, padding 28px (24px at 360). Icon tile 44px (radius 14, 22px icon). h3 20/700, 16px top margin. Text 15px text-secondary. Optional `.demo` inset on bg-light (radius 16, padding 16). Hover translateY(−3px) and shadow-lg (200ms). Cards are not links, so they have no focus state.
10. **Floating card** `.float`: white 96%, radius 20, padding 16, shadow-lg. Widths 220–260px. Label 12/700 text-secondary; title 14/700; sub 12px. Bobs (§7). Decorative: `aria-hidden`.
11. **Phone mock-up** `.phone`: 300×620 (280×580 ≤760). Bezel 11px `--device` with a 2px `--device-edge` inset, radius 46. Screen radius 36 on bg-light. 92×26 island. Status bar, home screen, 62px tab bar. `role="img"` with a translated `aria-label`.
12. **Calculator** `.calc` (white panel, radius 20, padding 28/20):
    - Weighting radiogroup: 3 chips, 44px high, radius full, 13/600. Checked = jade-600 fill and white text. Arrow keys move the selection (mirrored in RTL). Roving tabindex.
    - Two sliders (0–20, step 0.5, 44px hit height, jade-600 accent), each with its value in DM Mono 15/500.
    - Result box (radius 16, padding 20):
      - normal: jade-50 background, big value DM Mono 40/500 jade-600;
      - warn (needed ≥15): warning-bg / warning-800;
      - bad (needed >20): danger-bg / danger-700 text "impossible", 22px;
      - done (≤0): "Déjà acquis ✓" at 28px.
    - The formula line is DM Mono 12.5px, always LTR. `aria-live="polite"`.
13. **Student QR card** `.idcard`:
    - Max 380px, radius 20, padding 24, gradient jade-600 → jade-900 at 145° with a soft highlight and a ring motif.
    - Top row (11/700 uppercase, letter-spaced) with the Unipocket mini-logo. A 132px white QR box (radius 16). Name 18/800, ID DM Mono 13px LTR, 2×2 meta grid, "active" dot in success-300.
    - Footer: "Nouveau code dans" + timer pill (DM Mono 0:60), then a 4px progress bar.
    - Fake QR: `role="img"` + label. States: counting / swapping (opacity 0 for 200ms).
14. **Offline demo** `#offDemo`:
    - Steps: 3 buttons with a 36px number disc, h 18/700, 15px text. Active step = white card, border, shadow-md, coloured disc (jade-600; offline-800 in the offline state); `aria-current="step"`.
    - Switch: tablist, 3 tabs, 44px high, each with a coloured dot. Selected = white plus shadow-sm.
    - Mini-screen: 6px `--device` frame, radius 24 (device). Banner (13/600): jade-50/jade-600 → offline-bg/offline-800 → info-bg/info-700. Rows (white, radius 12) with a status chip.
    - `aria-live="polite"` on the panel.
15. **FAQ item** `details`: white, 1px border, radius 16, padding 0 24px. Summary 64px min height, 16/700, "+" 24px jade-400 that rotates 45° when open (200ms). Open = shadow-md. Answer 15px text-secondary. Native keyboard (Enter/Space).
16. **Toast** `#toast` (`role="status"`): fixed, bottom 24px (88px with the sticky bar), centred, text-primary background, white 14/600, padding 12px 20px, radius full, max width 100vw − 32px. Fades and slides up 20px over 250ms, stays 2.6s.
17. **Footer**: §2.14. Links 14px text-secondary, 44px high, hover jade-600. h5 13/700.
18. **Placeholder slot** `.ph-slot` (legal pages): striped, 1.5px dashed text-tertiary border, radius 16, DM Mono 12px. The label is the placeholder name in jade-600 capitals.
19. **Text link with arrow** (`.web-link`, `.cta-links a`, `.back-link`): 44px min height, 600–700 weight, 16px arrow icon that mirrors in RTL.

---

## 4. Icons

Every icon is 24×24, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, round caps and joins (except `play`, which is filled, and `arrow-hand`, 60×40). Each one has its own file in `assets/icons/`. `assets/icons/icons.svg` holds all of them as `<symbol id="i-NAME">`. **The pages inline a copy of that sprite** right after `<body>` and reference it with `<use href="#i-NAME">`. That is because browsers block external `<use>` references when a page is opened from `file://`. If you edit an icon, update the file, the sprite and the inline copies (4 pages).

| Name | File | Used in | Display size | Stroke | Notes |
|---|---|---|---|---|---|
| `play` | `assets/icons/play.svg` | Google Play store button (filled) | 26px | filled |  |
| `download` | `assets/icons/download.svg` | APK store button | 26px | 2 |  |
| `smartphone` | `assets/icons/smartphone.svg` | App Store "coming soon" button, "Mobile app" card | 26px / 22px | 2 |  |
| `arrow-hand` | `assets/icons/arrow-hand.svg` | Hero hand-drawn note (desktop ≥1100px only) | 60×40px | 2 | mirrored in RTL |
| `calendar` | `assets/icons/calendar.svg` | "Next class" floating card, schedule feature, phone tab bar | 20 / 22 / 18px | 2 |  |
| `wifi-off` | `assets/icons/wifi-off.svg` | Offline floating card, "Works offline" pillar | 20px | 2 |  |
| `home` | `assets/icons/home.svg` | Phone mock tab bar | 18px | 2 |  |
| `chart-line` | `assets/icons/chart-line.svg` | Grades feature, notification row, tab bar | 22 / 16 / 18px | 2 |  |
| `bell` | `assets/icons/bell.svg` | Notifications feature, tab bar | 22 / 18px | 2 |  |
| `user` | `assets/icons/user.svg` | Phone mock tab bar | 18px | 2 |  |
| `globe` | `assets/icons/globe.svg` | "FR & AR" pillar, bilingual card | 20 / 22px | 2 |  |
| `shield-check` | `assets/icons/shield-check.svg` | "Secure data" pillar | 20px | 2 |  |
| `devices` | `assets/icons/devices.svg` | "Mobile & web" pillar | 20px | 2 |  |
| `monitor` | `assets/icons/monitor.svg` | "Student website" card | 22px | 2 |  |
| `dashboard` | `assets/icons/dashboard.svg` | "Admin portal" card | 22px | 2 |  |
| `newspaper` | `assets/icons/newspaper.svg` | News feature | 22px | 2 |  |
| `user-check` | `assets/icons/user-check.svg` | Attendance feature | 22px | 2 |  |
| `clock` | `assets/icons/clock.svg` | "Class in 15 min" notification row | 16px | 2 |  |
| `help-circle` | `assets/icons/help-circle.svg` | Info centre feature | 22px | 2 |  |
| `arrow-right` | `assets/icons/arrow-right.svg` | Text links (student website, CTA links), legal page "back" link | 16px | 2 | mirrored in RTL (the back link is mirrored in LTR) |
| `check` | `assets/icons/check.svg` | Bullet for `.checks` lists (inlined as a CSS data-URI on a 22px jade-400 disc, 13px glyph, white, stroke 3) | 13px | 3 (CSS) | not in the HTML sprite |

The menu (2 bars → X), the FAQ "+" and the status dots are drawn in CSS, not icons. The phone-mock status bar shapes are CSS too.

---

## 5. Brand assets

- `assets/brand/unipocket-icon.svg`: app icon, rounded (radius 224/1024). Used in the nav, footer and student card. `unipocket-icon-square.svg`: full bleed, for stores. `unipocket-icon-512.png`.
- `assets/brand/unipocket-mark.svg` / `-mark-white.svg`: the U alone (jade-600 / white).
- `assets/brand/unipocket-logo.svg` / `-logo-white.svg`: icon + "Unipocket" wordmark in Plus Jakarta Sans 800, converted to outlines. `unipocket-logo-512.png` (512×109).
- `assets/favicons/`: `favicon.svg`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon-180.png` (square, iOS applies the mask), `icon-192.png` and `icon-512.png` (rounded, `purpose: any`), `icon-512-maskable.png` (full bleed; the U sits inside the 80% safe zone).
- Share images: `assets/images/share-fr-1200x630.jpg` (referenced by `og:image`) and `share-ar-1200x630.jpg` (for the Arabic page once it exists; open question 4).
- `assets/images/qr-download-unipocket-io.svg`: real, scannable QR (version 2, level M, 4-module quiet zone), jade-900 on white.

---

## 6. Images and placeholders

All raster images use `<picture>` (WebP, with a PNG fallback), carry `width`/`height` to avoid layout shift, and use `loading="lazy"` + `decoding="async"` (everything is below the first screen). Find any placeholder in the HTML with `data-placeholder="…"`.

| # | Placeholder | Files to replace (exact pixel size) | Format | Where | What the real file must look like |
|---|---|---|---|---|---|
| 3 | App screenshots (**filled**) | `assets/screenshots/screenshot-app-home-1280x800.webp`, `-640x400.webp`, `-1280x800.png` | WebP q82 + PNG | "What Unipocket is" → card 1 | Taken from the project prototype `UDJ - Polished Prototype.html`: Accueil, Emploi du temps, Notes, as three phones on #F5F7F6. Re-shoot from the shipped app later if wanted |
| 4 | Student website (**filled**) | `assets/screenshots/screenshot-student-website-1280x800.*` | WebP + PNG | Card 2 | From `Unipocket PWA - Standalone.html` (dashboard) in a minimal browser frame, URL `app.unipocket.io` |
| 5 | Admin portal (**filled**) | `assets/screenshots/screenshot-admin-dashboard-1280x800.*` | WebP + PNG | Card 3 | From `Unipocket Admin Portal.html` (dashboard) in the same browser frame, URL `admin.unipocket.io`; university codes neutralised (`UNI-…`) |
| 6 | Testimonial photos (optional) | `assets/images/testimonial-student-160x160.webp/.png`, `testimonial-staff-160x160.*` | WebP + PNG | Proof block (hidden) | Square portrait, face centred, plain background, shown as a 48px circle. Written consent needed |
| 7 | Figures × 3 | Text in the HTML: `[000]` + `[Légende…]` (`data-placeholder="figure-N"`) | – | Proof block | A real, sourced number (no estimates) + a short caption, FR + AR |
| 8 | Quotes × 2 | Text in the HTML: `[Citation réelle…]`, `[Prénom Nom]`, `[Filière, année]` / `[Fonction, service]` | – | Proof block | Real quotes with permission, FR + AR |
| 9 | Legal text × 2 | `privacy.html`, `terms.html` → `.prose` content, plus the `[JJ/MM/AAAA]` date | HTML | Legal pages | Approved text with h2 / p / ul, FR + AR |
| 10 | Store badges | The current `.store-btn` markup | SVG | Hero, CTA | Official Google Play / App Store badges in FR and AR, at least 48px high |

---

## 7. Motion

The global rule `@media (prefers-reduced-motion: reduce)` turns off **all** animations and transitions, forces reveal elements into place and sets `scroll-behavior: auto`. The JS also skips the reveal and offline auto-play when reduce motion is on.

| Animation | Trigger | Duration / easing | Small or slow phones | Reduce motion |
|---|---|---|---|---|
| Cloud drift | always, in the hero | 60–90s, linear, infinite alternate, translateX(−30 → 40px) | **Off ≤600px**. Clouds 5–6 hidden. Paused while the hero is off screen | off |
| Floating-card bob | always | 6s ease-in-out infinite, translateY(0 → −10px), staggered −2/−3/−4s | **Off ≤760px** (cards stack). Paused off screen | off |
| Section reveal | element enters the viewport (12% visible) | 700ms `--ease`, translateY(12px → 0), **no opacity change** | Only elements that start below the fold | off (no movement) |
| Button / store / card hover lift | hover | 150ms (cards 200ms) ease, −1 / −2 / −3px + shadow | hover only (touch never triggers it) | off |
| Press | :active | instant, scale(.98) | same | off |
| Menu bars → X | toggle | 200ms | same | off |
| FAQ "+" rotate | open/close | 200ms | same | off |
| Sticky bar | scroll past hero / reach CTA | 250ms ease, translateY(110% → 0) | – | instant |
| Toast | link not set | 250ms fade + 20px slide, visible 2.6s | – | instant |
| QR swap | every 60s | opacity 250ms. Progress bar scaleX, 1s linear per tick | Ticks only while the card is on screen | instant |
| Offline demo | auto every 3.5s while ≥40% visible; or a tap | colour transitions 250ms | Auto-play stops forever after the first tap | no auto-play |
| Calculator result background | value change | 200ms | – | instant |

Other small-phone savings: no `backdrop-filter` ≤600px (nav and pill), no Caveat font (notes hidden <1100px), the Arabic font is only downloaded in Arabic, there is no animation framework and no third-party script.

---

## 8. Interactions

### 8.1 Language switch
1. The starting language is the first of these that exists: `?lang=fr|ar` in the URL (not saved); `localStorage['unipocket-lang']`; the browser language (`ar*` gives Arabic); otherwise French.
2. Clicking FR or ع (or the "see this page in Arabic/French" button) calls `setLang`. It:
   - sets `<html lang>` and `dir`;
   - swaps every `[data-i18n]` innerHTML, `[data-i18n-aria]` aria-label and `[data-i18n-alt]` alt from `i18n/strings.js`;
   - updates `document.title` and the meta description (`meta.<page>.*`);
   - sets `aria-pressed`;
   - saves the choice;
   - lets the calculator and offline demo re-render their dynamic text.
3. There is no reload, and the scroll position is kept.
4. Without JS the page is French and complete.

### 8.2 Links
Every `[data-link="key"]` gets its URL from `config/links.js`.
- Empty value: clicking shows the toast ("L'app est en cours de publication…" for `googlePlay` and `apk`; "Lien bientôt disponible" for the rest).
- `http(s)` links open in a new tab with `rel="noopener"`.
- `apk` gets the `download` attribute.
- `supportEmail` becomes `mailto:`.
- When `appStore` is set, the "Bientôt sur" badge turns into a live "Disponible sur" link.
- `socials`: only non-empty entries are shown; the block stays hidden if all are empty.

### 8.3 Calculator
- needed = (target − w_cc × CC) ÷ w_exam, with w_cc ∈ {0.4, 0.5, 0.3} and w_exam = 1 − w_cc.
- Shown rounded **up** to 0.1 ("11.4 / 20").
- Rules: needed > 20 → "impossible" (red); needed ≤ 0 → "Déjà acquis ✓"; needed ≥ 15 → amber.
- The formula line shows the real values to 2 decimals.
- Defaults: 40/60, CC 8, target 10.
- The hint says the weighting is only an example; in the app each subject has its own.

### 8.4 QR card
- A decorative 25×25 random pattern with three finder squares. It is **not scannable and not the real algorithm**; labelled "Démonstration — données fictives".
- Countdown from 0:60, 1 tick per second; at 0 the pattern fades and redraws.
- Runs only while the card is visible. The same pattern also appears in the hero QR card.

### 8.5 Offline demo
| State | Banner | Data rows (5) | "Envoi d'un justificatif" |
|---|---|---|---|
| `on` En ligne | jade: "Connecté · Données à jour" | "À jour" | "Envoyé" |
| `off` Hors-ligne | orange: "Mode hors-ligne · Dernière synchro : aujourd'hui 07:42" | "Disponible" (grey) | "En attente du réseau" (orange) |
| `back` Réseau revenu | blue: "Réseau revenu · Synchronisation terminée" | "À jour" | "Envoyé automatiquement" |

The step buttons and the switch tabs both set the state. Arrow keys move between tabs (mirrored in RTL). The demo auto-plays every 3.5s while at least 40% visible and stops permanently after any tap. Without JS it shows the `on` state.

### 8.6 Menu, sticky bar and FAQ
See §3.5, §3.6 and §3.15. FAQ items are independent (several can be open at once).

### 8.7 Keyboard
Tab order follows the DOM. Every control is a native `a`, `button`, `input` or `details`. Radiogroup and tablist use roving tabindex and arrow keys. Esc closes the menu. The skip link is first. When the sticky bar is hidden it is `inert`, so it can't be tabbed into.

---

## 9. Copy (FR + AR)

All text lives in `i18n/strings.js`. French is also written directly in the HTML. **⚠ = Arabic that must be proofread by a native speaker before launch. Every Arabic string is currently unreviewed.** HTML tags inside values (`<br>`, `<b>`, `<code>`) are intentional.

### 9.1 Page meta
| | FR | AR ⚠ |
|---|---|---|
| Title | Unipocket — Le portail étudiant de ton université | Unipocket — البوابة الطلابية لجامعتك |
| Description | Emploi du temps, notes, présences, actualités et carte étudiante QR. Application mobile et site étudiant pour toutes les universités, en français et en arabe, même hors-ligne. | الجدول الدراسي، النتائج، الحضور، الأخبار والبطاقة الطلابية QR. تطبيق للهاتف وموقع طلابي لكل الجامعات، بالعربية والفرنسية، حتى بدون اتصال. |
| Share title (og) | Unipocket — Ta vie étudiante, dans ta poche | Unipocket — حياتك الجامعية في جيبك |
| Share text (og) | Le portail étudiant pour toutes les universités. Bilingue FR · AR, fonctionne hors-ligne. | البوابة الطلابية لكل الجامعات. بالعربية والفرنسية، ويعمل بدون إنترنت. |

`og:*` tags are static French in `index.html` (crawlers don't run JS). The Arabic values are ready for the `/ar/` page (open question 4).

### 9.2 All strings
| Key | FR | AR | Proof |
|---|---|---|---|
| `skip` | Aller au contenu | انتقل إلى المحتوى | ⚠ |
| `brandSub` | Portail étudiant | البوابة الطلابية | ⚠ |
| `navWhat` | Unipocket | Unipocket |  |
| `navFeatures` | Fonctionnalités | المميزات | ⚠ |
| `navOffline` | Hors-ligne | بدون إنترنت | ⚠ |
| `navWho` | Pour qui | لمن؟ | ⚠ |
| `navFaq` | FAQ | الأسئلة الشائعة | ⚠ |
| `navCta` | Télécharger | تحميل | ⚠ |
| `pillNew` | Nouveau | جديد | ⚠ |
| `pillText` | Le portail étudiant de ton université | البوابة الطلابية لجامعتك | ⚠ |
| `h1a` | Ta vie étudiante. | حياتك الجامعية. | ⚠ |
| `h1b` | Dans ta poche. | في جيبك. | ⚠ |
| `lead` | Emploi du temps, notes, présences, actualités et carte étudiante de ton université — sur ton téléphone ou sur le web, en français et en arabe, même sans connexion. | الجدول الدراسي، النتائج، الحضور، الأخبار والبطاقة الطلابية لجامعتك — على هاتفك أو على الويب، بالعربية والفرنسية، حتى بدون اتصال. | ⚠ |
| `getOn` | Disponible sur | متوفر على | ⚠ |
| `directDl` | Téléchargement direct | تحميل مباشر | ⚠ |
| `apkLabel` | Fichier APK | ملف APK | ⚠ |
| `soon` | Bientôt sur | قريباً على | ⚠ |
| `webLink` | Pas d'Android ? Ouvre le site étudiant | لا تملك أندرويد؟ افتح الموقع الطلابي | ⚠ |
| `metaLangs` | Français · العربية | العربية · Français | ⚠ |
| `metaAndroid` | Android en priorité, iOS bientôt | أندرويد أولاً، iOS قريباً | ⚠ |
| `annot1` | fini les captures<br>WhatsApp ! | وداعاً لصور<br>الواتساب! | ⚠ |
| `annot2` | même sans<br>réseau | حتى بدون<br>شبكة | ⚠ |
| `fNext` | Prochain cours | المحاضرة القادمة | ⚠ |
| `fIn` | dans 12 min | بعد 12 دقيقة | ⚠ |
| `cMath` | Mathématiques Générales | الرياضيات العامة | ⚠ |
| `cMathRoom` | 08:00 · Amphi A1 | 08:00 · المدرج A1 | ⚠ |
| `fGpa` | Moyenne · S2 | المعدل · الفصل 2 | ⚠ |
| `mention` | Mention Bien | جيد | ⚠ |
| `fCard` | Carte étudiante | البطاقة الطلابية | ⚠ |
| `fQrValid` | Valide | صالحة | ⚠ |
| `fQrRenew` | Se renouvelle toutes les 60 s | تتجدد كل 60 ثانية | ⚠ |
| `fOff` | Mode hors-ligne | وضع عدم الاتصال | ⚠ |
| `fOffSub` | Tes données restent accessibles | بياناتك تبقى متاحة | ⚠ |
| `pDate` | Lundi 23 mars | الاثنين 23 مارس | ⚠ |
| `pHello` | Bonjour, Ahmed 👋 | أهلاً، أحمد 👋 | ⚠ |
| `pSub` | 3 cours aujourd'hui · Prochain dans <b>12 min</b> | 3 محاضرات اليوم · التالية بعد <b>12 دقيقة</b> | ⚠ |
| `pGpa` | Moyenne | المعدل | ⚠ |
| `pAtt` | Présences | الحضور | ⚠ |
| `pAttMin` | min. 75% | الحد 75% | ⚠ |
| `pCred` | Crédits | الأرصدة | ⚠ |
| `pSem` | ce sem. | هذا الفصل | ⚠ |
| `pAgenda` | Agenda du jour | جدول اليوم | ⚠ |
| `pSeeAll` | Voir tout | عرض الكل | ⚠ |
| `r1` | Pr. Abdi Hassan · Amphi A1 | أ. عبدي حسن · المدرج A1 | ⚠ |
| `pSoon` | 12 min | 12 د | ⚠ |
| `cInfo` | TP Informatique | تطبيقات الإعلام الآلي | ⚠ |
| `r2` | Pr. Warsama · Labo 3 | أ. ورسمه · المختبر 3 | ⚠ |
| `pExam` | Examen | امتحان | ⚠ |
| `cPhys` | Physique Générale | الفيزياء العامة | ⚠ |
| `r3` | Pr. Djibril · Salle 204 | أ. جبريل · القاعة 204 | ⚠ |
| `pNews` | Actualités | الأخبار | ⚠ |
| `pNewsItem` | Calendrier des examens S2 disponible | جدول امتحانات الفصل 2 متاح | ⚠ |
| `tHome` | Accueil | الرئيسية | ⚠ |
| `tAgenda` | Agenda | الجدول | ⚠ |
| `tGrades` | Notes | النتائج | ⚠ |
| `tNews` | Actus | الأخبار | ⚠ |
| `tProfile` | Profil | حسابي | ⚠ |
| `stripTitle` | Pensée pour les étudiants, quelle que soit leur université | صُمّم للطلاب، أيّاً كانت جامعتهم | ⚠ |
| `p1` | Fonctionne hors-ligne | يعمل بدون إنترنت | ⚠ |
| `p2` | Français &amp; Arabe | العربية والفرنسية | ⚠ |
| `p3` | Données sécurisées | بيانات آمنة | ⚠ |
| `p4` | Mobile &amp; web | الهاتف والويب | ⚠ |
| `whatEyebrow` | Qu'est-ce que Unipocket ? | ما هو Unipocket؟ | ⚠ |
| `whatH2a` | Un seul portail, | بوابة واحدة، | ⚠ |
| `whatH2b` | trois façons d'y accéder | وثلاث طرق للوصول إليها | ⚠ |
| `whatLead` | Unipocket réunit au même endroit tout ce que ton université partage avec ses étudiants. Les mêmes informations, à jour, sur chaque écran. | يجمع Unipocket في مكان واحد كل ما تشاركه جامعتك مع طلابها. نفس المعلومات، محدّثة، على كل شاشة. | ⚠ |
| `tagStudents` | Étudiants | الطلاب | ⚠ |
| `w1t` | Application mobile | تطبيق الهاتف | ⚠ |
| `w1d` | Pour le quotidien. Android d'abord, iOS bientôt. Fonctionne même sans réseau. | للاستخدام اليومي. أندرويد أولاً، وiOS قريباً. يعمل حتى بدون شبكة. | ⚠ |
| `w2t` | Site étudiant | الموقع الطلابي | ⚠ |
| `w2d` | Le même compte depuis n'importe quel navigateur : ordinateur de la bibliothèque, tablette ou iPhone. | نفس الحساب من أي متصفح: حاسوب المكتبة، جهاز لوحي أو آيفون. | ⚠ |
| `tagStaff` | Personnel | الموظفون | ⚠ |
| `w3t` | Portail d'administration | بوابة الإدارة | ⚠ |
| `w3d` | Pour le personnel de l'université : publier les actualités, gérer les emplois du temps, les notes et les présences. | لموظفي الجامعة: نشر الأخبار، وإدارة الجداول الدراسية والنتائج والحضور. | ⚠ |
| `featEyebrow` | Fonctionnalités | المميزات | ⚠ |
| `featH2a` | Tout ce dont tu as besoin, | كل ما تحتاجه، | ⚠ |
| `featH2b` | au même endroit | في مكان واحد | ⚠ |
| `featLead` | Plus besoin de courir entre le tableau d'affichage, le portail web et les groupes WhatsApp. | لا داعي بعد اليوم للتنقل بين لوحة الإعلانات والبوابة الإلكترونية ومجموعات الواتساب. | ⚠ |
| `f1t` | Emploi du temps toujours à jour | جدول دراسي محدّث دائماً | ⚠ |
| `f1d` | Vue jour et semaine, salles, enseignants, examens en surbrillance. Exporte tout ton semestre vers le calendrier de ton téléphone. | عرض يومي وأسبوعي، القاعات، الأساتذة، والامتحانات بارزة. صدّر فصلك الدراسي كاملاً إلى تقويم هاتفك. | ⚠ |
| `dMon` | Lun | إثن | ⚠ |
| `wk1` | Maths<br>A1 | رياضيات<br>A1 | ⚠ |
| `wk2` | Physique | فيزياء | ⚠ |
| `dTue` | Mar | ثلا | ⚠ |
| `wk3` | Chimie | كيمياء | ⚠ |
| `wk4` | Algo | خوارزميات | ⚠ |
| `dWed` | Mer | أرب | ⚠ |
| `wk5` | Maths | رياضيات | ⚠ |
| `exam` | Examen | امتحان | ⚠ |
| `dThu` | Jeu | خمي | ⚠ |
| `dFri` | Ven | جمع | ⚠ |
| `wk6` | Algo<br>Labo 3 | خوارزميات<br>مختبر 3 | ⚠ |
| `f2t` | Notes &amp; moyenne en temps réel | النتائج والمعدل لحظة بلحظة | ⚠ |
| `f2d` | Contrôle continu, examen, coefficient. Une notification dès la publication — et une alerte si une matière est à risque. | المراقبة المستمرة، الامتحان، المعامل. إشعار فور النشر — وتنبيه إذا كانت مادة في خطر. | ⚠ |
| `ok` | Validé | ناجح | ⚠ |
| `cAlgo` | Algorithmique | الخوارزميات | ⚠ |
| `risk` | À risque | في خطر | ⚠ |
| `f3t` | Actualités officielles | أخبار رسمية | ⚠ |
| `f3d` | Les annonces vérifiées de l'université, sans rumeurs ni transferts douteux. | إعلانات الجامعة الموثّقة، بلا إشاعات ولا رسائل مشكوك فيها. | ⚠ |
| `catOff` | Officiel | رسمي | ⚠ |
| `n1` | Examens S2 — session juin | امتحانات الفصل 2 — دورة يونيو | ⚠ |
| `catEv` | Événement | فعالية | ⚠ |
| `n2` | Remise des diplômes | حفل التخرج | ⚠ |
| `f4t` | Présences &amp; absences | الحضور والغياب | ⚠ |
| `f4d` | Ton taux par matière, tes absences et une projection avant d'atteindre la limite de 75%. | نسبة حضورك في كل مادة، غياباتك، وتوقّع قبل بلوغ حد 75%. | ⚠ |
| `f5t` | Notifications utiles | إشعارات مفيدة | ⚠ |
| `f5d` | Notes publiées, cours dans 15 min, alerte présence. Et le silence de 22h à 7h. | نشر النتائج، محاضرة بعد 15 دقيقة، تنبيه الحضور. وهدوء تام من 22:00 إلى 07:00. | ⚠ |
| `nt1` | Nouvelles notes | نتائج جديدة | ⚠ |
| `nt1d` | Chimie Organique : 15/20 | الكيمياء العضوية: 20/15 | ⚠ |
| `nt2` | Cours dans 15 min | محاضرة بعد 15 دقيقة | ⚠ |
| `nt2d` | Physique · Salle 204 | الفيزياء · القاعة 204 | ⚠ |
| `f6t` | Centre d'information | مركز المعلومات | ⚠ |
| `f6d` | FAQ, annuaire du campus, démarches pas à pas et formulaires : réinscription, relevé de notes, rattrapages… sans faire la queue au guichet. | أسئلة شائعة، دليل الحرم الجامعي، إجراءات خطوة بخطوة ونماذج: إعادة التسجيل، كشف النقاط، الاستدراك… دون انتظار في الطابور. | ⚠ |
| `calcEyebrow` | Calculateur de moyenne | حاسبة المعدل | ⚠ |
| `calcH2` | « Combien il me faut à l'examen ? » | «كم أحتاج في الامتحان؟» | ⚠ |
| `calcLead` | La question que tout étudiant se pose. Unipocket y répond en une seconde, avec la formule affichée — pas de boîte noire. | السؤال الذي يطرحه كل طالب. يجيب عنه Unipocket في ثانية، مع عرض المعادلة بوضوح. | ⚠ |
| `calcC1` | Choisis ta note cible, l'app calcule la note minimale à l'examen | اختر المعدل الذي تريده، ويحسب التطبيق النقطة الدنيا في الامتحان | ⚠ |
| `calcC2` | Fonctionne sans connexion : calcul 100% local | يعمل بدون اتصال: حساب محلي 100% | ⚠ |
| `calcC3` | Alerte claire quand la validation devient impossible | تنبيه واضح عندما يصبح النجاح مستحيلاً | ⚠ |
| `tryIt` | Essaie-le maintenant | جرّبها الآن | ⚠ |
| `calcHint2` | Pondération d'exemple — dans l'app, chaque matière a la sienne. | أوزان على سبيل المثال — في التطبيق، لكل مادة أوزانها. | ⚠ |
| `wCC` | CC | مراقبة | ⚠ |
| `wEx` | Exam | امتحان | ⚠ |
| `ccLabel` | Note de contrôle continu | نقطة المراقبة المستمرة | ⚠ |
| `targetLabel` | Note finale visée | المعدل النهائي المطلوب | ⚠ |
| `needLabel` | Il te faut à l'examen | تحتاج في الامتحان إلى | ⚠ |
| `qrEyebrow` | Carte étudiante digitale | البطاقة الطلابية الرقمية | ⚠ |
| `qrH2` | Ta carte étudiante, toujours sur toi. | بطاقتك الطلابية، معك دائماً. | ⚠ |
| `qrLead` | Un QR code sécurisé pour la bibliothèque, l'accès au campus et les réductions étudiantes. Il change toutes les 60 secondes : une capture d'écran ne sert à rien. | رمز QR آمن للمكتبة ودخول الحرم الجامعي والتخفيضات الطلابية. يتغير كل 60 ثانية: لقطة الشاشة لا تنفع. | ⚠ |
| `qrC1` | Signé cryptographiquement (HMAC-SHA256) | موقّع رقمياً (HMAC-SHA256) | ⚠ |
| `qrC2` | Vérifiable sans connexion, par toi comme par le scanner | يمكن التحقق منه بدون اتصال | ⚠ |
| `qrC3` | Nom, numéro, filière, année et statut d'inscription | الاسم، الرقم، التخصص، السنة وحالة التسجيل | ⚠ |
| `idTitle` | Carte étudiante | البطاقة الطلابية | ⚠ |
| `idName` | Ahmed Omar Said | أحمد عمر سعيد | ⚠ |
| `idProg` | Programme | التخصص | ⚠ |
| `idProgV` | Sc. Exactes L2 | علوم دقيقة L2 | ⚠ |
| `idYear` | Année | السنة | ⚠ |
| `idStatus` | Statut | الحالة | ⚠ |
| `idActive` | Actif | نشط | ⚠ |
| `idRenew` | Nouveau code dans | رمز جديد خلال | ⚠ |
| `demoNote` | Démonstration — données fictives | عرض توضيحي — بيانات وهمية | ⚠ |
| `offEyebrow` | Conçue pour les réseaux instables | صُمّم للشبكات غير المستقرة | ⚠ |
| `offH2a` | Le réseau coupe ? | انقطعت الشبكة؟ | ⚠ |
| `offH2b` | Unipocket continue. | Unipocket يستمر. | ⚠ |
| `offLead` | La connexion n'est pas toujours fiable. Unipocket garde une copie de tes données sur ton téléphone, pour que tu ne sois jamais bloqué. | الاتصال ليس دائماً موثوقاً. يحتفظ Unipocket بنسخة من بياناتك على هاتفك، حتى لا تبقى عالقاً أبداً. | ⚠ |
| `os1t` | Avec réseau | مع الشبكة | ⚠ |
| `os1d` | À chaque ouverture, Unipocket enregistre ton emploi du temps, tes notes, tes présences et ta carte sur le téléphone. | عند كل فتح، يحفظ Unipocket جدولك ونتائجك وحضورك وبطاقتك على الهاتف. | ⚠ |
| `os2t` | Sans réseau | بدون شبكة | ⚠ |
| `os2d` | Tu consultes tout normalement. Un bandeau orange affiche l'heure de la dernière synchronisation. Ce que tu envoies est mis en attente. | تتصفح كل شيء بشكل عادي. يعرض شريط برتقالي وقت آخر مزامنة. وما ترسله يوضع في الانتظار. | ⚠ |
| `os3t` | Le réseau revient | عودة الشبكة | ⚠ |
| `os3d` | L'app se met à jour toute seule et envoie ce qui attendait. Rien à faire de ton côté. | يتحدّث التطبيق تلقائياً ويرسل ما كان في الانتظار. لا شيء عليك فعله. | ⚠ |
| `segOn` | En ligne | متصل | ⚠ |
| `segOff` | Hors-ligne | بدون اتصال | ⚠ |
| `segBack` | Réseau revenu | عادت الشبكة | ⚠ |
| `s1` | Emploi du temps | الجدول الدراسي | ⚠ |
| `s2` | Notes &amp; moyenne | النتائج والمعدل | ⚠ |
| `s3` | Carte QR | بطاقة QR | ⚠ |
| `s4` | Présences | الحضور | ⚠ |
| `s5` | Centre d'info | مركز المعلومات | ⚠ |
| `s6` | Envoi d'un justificatif | إرسال مبرر غياب | ⚠ |
| `o2t` | Français &amp; Arabe | العربية والفرنسية | ⚠ |
| `o2d` | Change de langue dès l'écran de connexion. Tout l'affichage bascule instantanément, y compris l'orientation de droite à gauche. | غيّر اللغة من شاشة تسجيل الدخول. تتحول الواجهة كاملة فوراً، بما في ذلك الاتجاه من اليمين إلى اليسار. | ⚠ |
| `langTry` | Voir cette page en arabe | Voir cette page en français |  |
| `whoEyebrow` | Pour qui ? | لمن؟ | ⚠ |
| `whoH2a` | Pour les étudiants. | للطلاب. | ⚠ |
| `whoH2b` | Et pour chaque université. | ولكل جامعة. | ⚠ |
| `whoStT` | Tes études, au même endroit | دراستك، في مكان واحد | ⚠ |
| `whoStD` | Sur ton téléphone ou sur le web, même quand le réseau ne suit pas. | على هاتفك أو على الويب، حتى عندما تضعف الشبكة. | ⚠ |
| `whoS1` | Ton emploi du temps et tes salles, chaque jour | جدولك وقاعاتك، كل يوم | ⚠ |
| `whoS2` | Tes notes et ta moyenne, avec le calculateur | نتائجك ومعدلك، مع الحاسبة | ⚠ |
| `whoS3` | Tes présences et tes absences, matière par matière | حضورك وغياباتك، مادة بمادة | ⚠ |
| `whoS4` | Ta carte étudiante QR, toujours sur toi | بطاقتك الطلابية QR، معك دائماً | ⚠ |
| `whoStCta` | Télécharger l'app | حمّل التطبيق | ⚠ |
| `tagUni` | Université | الجامعة | ⚠ |
| `whoUnT` | Toute université est la bienvenue | كل جامعة مرحّب بها | ⚠ |
| `whoUnD` | Unipocket s'adapte à n'importe quel établissement. Le portail d'administration permet au personnel de publier et de mettre à jour les informations que les étudiants reçoivent dans l'app et sur le site. | يتكيّف Unipocket مع أي مؤسسة جامعية. تتيح بوابة الإدارة للموظفين نشر وتحديث المعلومات التي يتلقاها الطلاب في التطبيق وعلى الموقع. | ⚠ |
| `whoU1` | Publier des actualités officielles et des notifications | نشر الأخبار الرسمية والإشعارات | ⚠ |
| `whoU2` | Mettre à jour les emplois du temps et les salles | تحديث الجداول الدراسية والقاعات | ⚠ |
| `whoU3` | Saisir les notes et suivre les présences | إدخال النتائج ومتابعة الحضور | ⚠ |
| `whoU4` | Gérer les dossiers étudiants | إدارة ملفات الطلاب | ⚠ |
| `whoUnCta` | Inscrire mon université | سجّل جامعتك | ⚠ |
| `whoUnLogin` | Accès personnel | دخول الموظفين | ⚠ |
| `proofEyebrow` | Ils utilisent Unipocket | يستخدمون Unipocket | ⚠ |
| `proofH2` | Ce qu'en disent les étudiants et le personnel | ماذا يقول الطلاب والموظفون | ⚠ |
| `stEyebrow` | Démarrer | البداية | ⚠ |
| `stH2b` | Trois étapes, et c'est prêt | ثلاث خطوات، وتكون جاهزاً | ⚠ |
| `st1t` | Télécharge l'app | حمّل التطبيق | ⚠ |
| `st1d` | Depuis Google Play ou directement via le fichier APK. Gratuite, sans publicité. | من Google Play أو مباشرة عبر ملف APK. مجاني وبدون إعلانات. | ⚠ |
| `st2t` | Connecte-toi | سجّل الدخول | ⚠ |
| `st2d` | Avec ton numéro étudiant (ex. <code>ETU-2024-0432</code>) et ton mot de passe universitaire. Active ensuite l'empreinte ou Face ID. | برقمك الطلابي (مثال: <code>ETU-2024-0432</code>) وكلمة مرور الجامعة. ثم فعّل البصمة أو Face ID. | ⚠ |
| `st3t` | Personnalise | خصّص | ⚠ |
| `st3d` | Choisis ta langue et tes notifications. Ton emploi du temps et tes notes sont déjà là. | اختر لغتك وإشعاراتك. جدولك ونتائجك موجودة بالفعل. | ⚠ |
| `faqH2` | Questions fréquentes | الأسئلة الشائعة | ⚠ |
| `q1` | L'application est-elle gratuite ? | هل التطبيق مجاني؟ | ⚠ |
| `a1` | Oui. Unipocket est entièrement gratuite pour les étudiants, sans publicité. | نعم. Unipocket مجاني بالكامل للطلاب، وبدون إعلانات. | ⚠ |
| `q2` | Quels identifiants dois-je utiliser ? | ما هي بيانات الدخول؟ | ⚠ |
| `a2` | Ton numéro étudiant et ton mot de passe universitaire. Après 3 essais incorrects, le compte est bloqué 5 minutes par sécurité. En cas d'oubli, adresse-toi à la scolarité. | رقمك الطلابي وكلمة مرور الجامعة. بعد 3 محاولات خاطئة يُقفل الحساب 5 دقائق للأمان. إذا نسيت كلمة المرور، توجّه إلى مصلحة الشؤون الطلابية. | ⚠ |
| `q3` | Est-ce que ça marche sans internet ? | هل يعمل بدون إنترنت؟ | ⚠ |
| `a3` | Oui. Emploi du temps, notes, carte QR, présences et centre d'information restent disponibles hors-ligne. Seules les actions qui nécessitent un envoi (justificatifs, par exemple) attendent le retour du réseau, puis partent automatiquement. | نعم. الجدول، النتائج، بطاقة QR، الحضور ومركز المعلومات متاحة بدون اتصال. فقط العمليات التي تتطلب إرسالاً (مثل المبررات) تنتظر عودة الشبكة، ثم تُرسل تلقائياً. | ⚠ |
| `q7` | Puis-je utiliser Unipocket sur ordinateur ? | هل يمكنني استخدام Unipocket على الحاسوب؟ | ⚠ |
| `a7` | Oui. Le site étudiant donne accès aux mêmes informations, avec le même compte, depuis n'importe quel navigateur. | نعم. يتيح الموقع الطلابي الوصول إلى نفس المعلومات، بنفس الحساب، من أي متصفح. | ⚠ |
| `q4` | Et sur iPhone ? | وماذا عن الآيفون؟ | ⚠ |
| `a4b` | La version iOS arrive bientôt sur l'App Store. En attendant, tu peux utiliser le site étudiant depuis ton iPhone. | نسخة iOS ستصل قريباً إلى App Store. في الأثناء، يمكنك استخدام الموقع الطلابي من الآيفون. | ⚠ |
| `q5` | Comment installer le fichier APK ? | كيف أثبّت ملف APK؟ | ⚠ |
| `a5` | Télécharge le fichier, ouvre-le, puis autorise l'installation depuis cette source quand Android le demande. Ne télécharge l'APK que depuis cette page officielle. | حمّل الملف وافتحه، ثم اسمح بالتثبيت من هذا المصدر عندما يطلب أندرويد ذلك. لا تحمّل الملف إلا من هذه الصفحة الرسمية. | ⚠ |
| `q6` | Mes données sont-elles protégées ? | هل بياناتي محمية؟ | ⚠ |
| `a6` | Tes jetons de connexion sont stockés dans l'espace chiffré du téléphone, et le QR code est signé et expire après 60 secondes. Tes données ne sont jamais revendues. | تُخزَّن رموز الدخول في المساحة المشفّرة للهاتف، ورمز QR موقّع وينتهي بعد 60 ثانية. لا تُباع بياناتك أبداً. | ⚠ |
| `ctaH2` | Commence ta journée avec Unipocket. | ابدأ يومك مع Unipocket. | ⚠ |
| `ctaLead` | En 10 secondes, tu sais ce que tu as aujourd'hui, où tu en es, et ce que l'université doit te dire. | في 10 ثوانٍ تعرف ما لديك اليوم، وأين وصلت، وما تريد الجامعة إخبارك به. | ⚠ |
| `ctaWeb` | Ouvrir le site étudiant | افتح الموقع الطلابي | ⚠ |
| `ctaAdmin` | Personnel : portail d'administration | الموظفون: بوابة الإدارة | ⚠ |
| `scan` | Scanne avec ton téléphone pour télécharger | امسح الرمز بهاتفك للتحميل | ⚠ |
| `footAbout2` | Le portail étudiant pour toutes les universités : application mobile, site étudiant et portail d'administration. En français et en arabe. | البوابة الطلابية لكل الجامعات: تطبيق الهاتف، الموقع الطلابي وبوابة الإدارة. بالعربية والفرنسية. | ⚠ |
| `footApp` | Application | التطبيق | ⚠ |
| `footAccess` | Accès | الوصول | ⚠ |
| `footWeb` | Site étudiant | الموقع الطلابي | ⚠ |
| `footAdmin` | Portail admin | بوابة الإدارة | ⚠ |
| `footContact` | Contact &amp; support | التواصل والدعم | ⚠ |
| `footLegal` | Légal | قانوني | ⚠ |
| `footPrivacy` | Confidentialité | الخصوصية | ⚠ |
| `footTerms` | Conditions d'utilisation | شروط الاستخدام | ⚠ |
| `footFollow` | Nous suivre | تابعنا | ⚠ |
| `footMade` | Fait pour les étudiants, par des étudiants | صُنع للطلاب، من الطلاب | ⚠ |
| `mCta` | Télécharger Unipocket | حمّل Unipocket | ⚠ |
| `mWeb` | Site web | الموقع | ⚠ |
| `ariaNav` | Navigation principale | التنقل الرئيسي | ⚠ |
| `ariaHome` | Unipocket — accueil | Unipocket — الصفحة الرئيسية | ⚠ |
| `ariaLang` | Langue | اللغة | ⚠ |
| `ariaMenu` | Menu | القائمة | ⚠ |
| `ariaPhone` | Aperçu de l'écran d'accueil de Unipocket | معاينة الشاشة الرئيسية لتطبيق Unipocket | ⚠ |
| `ariaWeights` | Pondération | الأوزان | ⚠ |
| `ariaQrDemo` | QR code de démonstration | رمز QR توضيحي | ⚠ |
| `ariaNet` | État du réseau | حالة الشبكة | ⚠ |
| `altShotApp` | Application Unipocket sur téléphone, écran d'accueil | تطبيق Unipocket على الهاتف، الشاشة الرئيسية | ⚠ |
| `altShotWeb` | Le site étudiant Unipocket dans un navigateur | الموقع الطلابي Unipocket في متصفح | ⚠ |
| `altShotAdmin` | Tableau de bord du portail d'administration | لوحة تحكم بوابة الإدارة | ⚠ |
| `altDlQr` | QR code : unipocket.io | رمز QR: unipocket.io | ⚠ |
| `nfTitle` | Page introuvable | الصفحة غير موجودة | ⚠ |
| `nfLead` | La page que tu cherches n'existe pas ou a été déplacée. Vérifie l'adresse, ou repars de l'accueil. | الصفحة التي تبحث عنها غير موجودة أو تم نقلها. تحقّق من العنوان، أو عُد إلى الصفحة الرئيسية. | ⚠ |
| `nfHome` | Retour à l'accueil | العودة إلى الصفحة الرئيسية | ⚠ |
| `nfFaq` | Voir la FAQ | الأسئلة الشائعة | ⚠ |
| `legalBack` | Retour à l'accueil | العودة إلى الصفحة الرئيسية | ⚠ |
| `legalPrivacyH1` | Politique de confidentialité | سياسة الخصوصية | ⚠ |
| `legalUpdated` | Dernière mise à jour : | آخر تحديث: | ⚠ |
| `legalTermsH1` | Conditions d'utilisation | شروط الاستخدام | ⚠ |
| `calc.impossible` | Validation impossible — contacte ton département | النجاح مستحيل — تواصل مع قسمك | ⚠ |
| `calc.acquired` | Déjà acquis ✓ | مضمون مسبقاً ✓ | ⚠ |
| `off.banner.on` | Connecté · Données à jour | متصل · البيانات محدّثة | ⚠ |
| `off.banner.off` | Mode hors-ligne · Dernière synchro : aujourd'hui 07:42 | وضع عدم الاتصال · آخر مزامنة: اليوم 07:42 | ⚠ |
| `off.banner.back` | Réseau revenu · Synchronisation terminée | عادت الشبكة · اكتملت المزامنة | ⚠ |
| `off.status.fresh` | À jour | محدّث | ⚠ |
| `off.status.cached` | Disponible | متاح | ⚠ |
| `off.status.pending` | En attente du réseau | في انتظار الشبكة | ⚠ |
| `off.status.sent` | Envoyé | تم الإرسال | ⚠ |
| `off.status.auto` | Envoyé automatiquement | أُرسل تلقائياً | ⚠ |
| `toast.appSoon` | L'app est en cours de publication — le lien arrive très bientôt | التطبيق قيد النشر — سيتوفر الرابط قريباً | ⚠ |
| `toast.linkSoon` | Lien bientôt disponible | الرابط سيتوفر قريباً | ⚠ |
| `meta.home.title` | Unipocket — Le portail étudiant de ton université | Unipocket — البوابة الطلابية لجامعتك | ⚠ |
| `meta.home.description` | Emploi du temps, notes, présences, actualités et carte étudiante QR. Application mobile et site étudiant pour toutes les universités, en français et en arabe, même hors-ligne. | الجدول الدراسي، النتائج، الحضور، الأخبار والبطاقة الطلابية QR. تطبيق للهاتف وموقع طلابي لكل الجامعات، بالعربية والفرنسية، حتى بدون اتصال. | ⚠ |
| `meta.home.shareTitle` | Unipocket — Ta vie étudiante, dans ta poche | Unipocket — حياتك الجامعية في جيبك | ⚠ |
| `meta.home.shareDescription` | Le portail étudiant pour toutes les universités. Bilingue FR · AR, fonctionne hors-ligne. | البوابة الطلابية لكل الجامعات. بالعربية والفرنسية، ويعمل بدون إنترنت. | ⚠ |
| `meta.404.title` | Page introuvable — Unipocket | الصفحة غير موجودة — Unipocket | ⚠ |
| `meta.404.description` | Cette page n'existe pas ou a été déplacée. | هذه الصفحة غير موجودة أو تم نقلها. | ⚠ |
| `meta.privacy.title` | Politique de confidentialité — Unipocket | سياسة الخصوصية — Unipocket | ⚠ |
| `meta.privacy.description` | Politique de confidentialité de Unipocket, le portail étudiant pour toutes les universités. | سياسة الخصوصية لـ Unipocket، البوابة الطلابية لكل الجامعات. | ⚠ |
| `meta.terms.title` | Conditions d'utilisation — Unipocket | شروط الاستخدام — Unipocket | ⚠ |
| `meta.terms.description` | Conditions d'utilisation de Unipocket, le portail étudiant pour toutes les universités. | شروط الاستخدام لـ Unipocket، البوابة الطلابية لكل الجامعات. | ⚠ |

---

## 10. Product claims to verify

| # | Claim | Where it appears (string keys) |
|---|---|---|
| 1 | Free, no ads | `st1d`, `q1`/`a1` |
| 2 | Android first, iOS "coming soon" | `metaAndroid`, `w1d`, `soon`, `q4`/`a4b` |
| 3 | Works offline: schedule, grades, QR card, attendance, info centre | `p1`, `fOff`, `fOffSub`, `annot2`, `offLead`, `os1d`–`os3d`, `s1`–`s5`, `a3`, `calcC2` |
| 4 | Things you send while offline (absence notes) are queued and go out automatically | `os2d`, `os3d`, `s6`, `off.status.*`, `a3` |
| 5 | Offline banner shows the last sync time | `os2d`, `off.banner.off` |
| 6 | 75% attendance limit, with a projection | `f4d`, `pAttMin` |
| 7 | QR code renewed every 60s; a screenshot is useless | `fQrRenew`, `qrLead`, `idRenew`, `a6` |
| 8 | QR signed with HMAC-SHA256, can be verified offline by the student and the scanner | `qrC1`, `qrC2` |
| 9 | QR used for the library, campus access and student discounts | `qrLead` |
| 10 | Card shows name, number, programme, year and enrolment status | `qrC3` |
| 11 | Login = student number + university password | `st2d`, `a2` |
| 12 | 3 wrong attempts → account locked for 5 min | `a2` |
| 13 | Fingerprint / Face ID after the first login | `st2d` |
| 14 | Login tokens stored in the phone's encrypted storage; data never sold | `a6`, `p3` |
| 15 | Notifications: grades published, class in 15 min, attendance alert; quiet hours 22:00–07:00 | `f5d`, `nt2` |
| 16 | Grades: notification on publication, "at risk" alert | `f2d` |
| 17 | Export the semester to the phone calendar | `f1d` |
| 18 | Info centre: FAQ, campus directory, step-by-step procedures, forms (re-enrolment, transcript, resits) | `f6d` |
| 19 | Language can be switched from the login screen; full RTL | `o2d` |
| 20 | Student website: same account, same information, any browser | `w2d`, `a7`, `a4b` |
| 21 | Admin portal: publish news and notifications, schedules and rooms, grades, attendance, student records | `w3d`, `whoU1`–`whoU4` |
| 22 | Calculator is 100% local and shows its formula | `calcLead`, `calcC1`–`calcC3` |
| 23 | "Made for students, by students" | `footMade` |
| 25 | Works for any university ("toute université est la bienvenue") — onboarding a new university must actually be possible | `whoH2b`, `whoUnT`, `whoUnD`, `whoUnCta`, `stripTitle`, `footAbout2` |
| 24 | Only download the APK from this page (implies the APK is hosted here) | `a5` |

---

## 11. Performance and accessibility

- **Nothing loads from another website.** Fonts, scripts, icons and the QR code are all local.
- **First visit on a phone, before compression** (screenshots excluded): HTML 47 KB, CSS 53 KB, JS 48 KB (including all strings), Plus Jakarta Sans 30 KB, DM Mono 2 × 10 KB, icon and logo SVGs about 25 KB, download QR 12 KB. That is **about 245 KB raw, about 70 KB gzipped**. Arabic adds Noto Naskh at 19 KB. Desktop adds Caveat at 12 KB. Lazy screenshots are 7 KB each at 640 px.
- **Fonts:** WOFF2 only, cut down to the characters on the page. Plus Jakarta covers Basic Latin, Latin-1 and the punctuation used. Naskh covers the Arabic letters used plus ، ؛ ؟ ـ. DM Mono covers ASCII plus · – − × ÷ ↑ →. **Re-run the subsetting when copy changes** (README).
- **Contrast:** checked ratios are listed in §1.1. All text is ≥4.5:1, except large headline accents (jade-400 at ≥28px bold, 3.15–3.39:1, which counts as large text).
- **Semantics:** lang/dir on `<html>`, landmarks (nav, main, footer), one h1 per page, labelled icon-only buttons, decorative SVGs `aria-hidden`, the phone and QR are `role="img"` with labels, live regions on the calculator and offline demo, `role="status"` on the toast.
- **No JS:** all text is visible, reveal leaves everything in place, the menu button and language toggle are hidden, nav links scroll sideways, the offline demo shows its first state.
