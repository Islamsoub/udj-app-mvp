# Round 2 close-out: PWA login hero and attendance copy

Revised 2026-11-09 (second pass). This file sits at the root of the zip. Every other path matches `design/spec-pack/`.

**Shipped-code reference.** Token names and values come from `pwa/app/globals.css` on `develop`:
- `--warning-ink`
- `--danger-ink`
- `--on-jade`
- `--jade-hover`
- `--hero-chip`

No parallel tokens are introduced. The earlier text-colour tokens are removed from every file in this zip, including `specs/pwa/dashboard/Round 2 Spec.html`.

## 1. Login hero tokens

| Token | Light | Dark |
|---|---|---|
| `--hero-bg` | `linear-gradient(155deg, #168666, #0F6E56)` | `linear-gradient(155deg, #0F5E48, #0A3D2E)` |
| `--hero-ink` | `#FFFFFF` | `#FFFFFF` |
| `--hero-mark` | `#FFFFFF` | `#FFFFFF` |
| `--hero-chip` | `rgba(10,61,46,.40)` | `rgba(10,61,46,.40)` |
| `--hero-chip-hover` | `rgba(10,61,46,.50)` | `rgba(10,61,46,.50)` |

**Decorative circles:** `rgba(255,255,255,.04)`, down from .07.

**Measured contrast for white text** (WCAG 2.x, sRGB):

| Point | Light | Dark |
|---|---|---|
| Gradient start | 4.53 | 7.73 |
| Gradient end | 6.20 | 12.21 |
| Start + 4% circle (lightest pixel on the hero) | **4.23** | 7.01 |
| Under the tagline, worst glyph | 5.28 | 9.71 |
| Chip label over a circle, at rest | 6.37 | 8.77 |
| Chip label over a circle, hover | 7.10 | 9.28 |

**4% does not close the light corner.** The gradient start alone measures 4.53, so any white overlay on it lands below 4.5; at 4% it is 4.23. No text sits on that corner, and the chip there measures 6.37. To pass at every pixel, one of these has to change:
- the circle comes off the start side, or
- the gradient start darkens. At 4%, any start at or below about `#147E60` passes.

I've left this for you to decide.

**Darker and quieter than the button.** Dark start `#0F5E48` (L 0.086) and dark end `#0A3D2E` (L 0.036) are darker than the light stops (0.182 and 0.119). The dark submit button `#2BB989` (L 0.370) measures 3.10 : 1 against the lightest point of the hero.

**Submit button label** is `--on-jade` in both themes, in `login-screen.css` and `app.css`:

| Theme | Label on `--jade` | Label on `--jade-hover` |
|---|---|---|
| Light (`#1E231F`) | 4.71 | 5.78 |
| Dark (`#0F1713`) | 7.29 | 8.87 |

**`--jade-hover`.** Light is now `#22B083`, as shipped. The value I had, `#0F6E56`, came from the prototype. It inverted the hover, darkening a background that `--on-jade` text sits on.

**`--hero-chip`.** The jade-900 wash it is now was not my choice to change. The black wash came from Round 2 §3, written before the shipped token existed. The jade wash measures higher in both themes:
- Light: 6.37 vs 5.64 over a 4% circle.
- Dark: 8.77 vs 8.78, effectively equal.

The dark-mode chip uses the same wash, because the dark hero is now jade and no longer neutral.

**These hero values differ from what `globals.css` ships today.** The decisions here are the newer ones, so `globals.css` (and `design/pwa-tokens.css`, which it copies) will need to follow:

| Token | Shipped | This close-out |
|---|---|---|
| light `--hero-bg` | `var(--jade-text)` = flat `#0F6E56` (5.34 : 1 with a 7% circle) | `#168666 → #0F6E56` gradient (Round 2 §3) |
| dark `--hero-bg` | `var(--surface2)` | `#0F5E48 → #0A3D2E` gradient |
| dark `--hero-ink` | `var(--ink)` | `#FFFFFF` |
| dark `--hero-mark` | `var(--jade)` | `#FFFFFF` |
| dark `--hero-chip` / `-hover` | `rgba(255,255,255,.16)` / `.28` | `rgba(10,61,46,.40)` / `.50` |

**Scope.** The dashboard grade-average card is unchanged: it keeps `--hero-start` / `--hero-end` and its 7% depth circle.

## 2. Files in this zip

Source:
- `specs/pwa/login/source/login-screen.html`
- `specs/pwa/login/source/login-screen.css`
- `specs/pwa/dashboard/dashboard.html`
- `specs/pwa/dashboard/css/app.css`

`dashboard.html` takes `?att=ok|near|below|ended`; with no parameter it shows `below`.

Spec and tokens:
- `specs/pwa/dashboard/Round 2 Spec.html`: token names and values changed to the ink tokens, plus the chip row in §3. The decisions are unchanged.
- `tokens/pwa/tokens.css` and `tokens/pwa/tokens.json`

Renders (all 1440×900, 1× pixel ratio):
- `screenshots/pwa-login/`: all seven. The light renders changed too, because of the dark submit label, 4% circles and jade chip.
- `screenshots/pwa-dashboard/`: all five. The attendance line and the notification row moved from `#C62828` / `#FF6B6B` to `--danger-ink` `#B3261E` / `#FF9B8F`.

## 3. Attendance card: the line under the ring

**Inputs.** `GET /student/attendance` returns `band` and `absencesLeft` for the overall figure and for every subject.

**Which subject is named.** Sort the subjects:
1. By band, worst first: `below`, then `near`, then `ok`.
2. By fewest `absencesLeft`; `null` sorts last.
3. By lowest `rate`.
4. By subject name, using `localeCompare` in the display language.

The first subject is named. If several subjects share the worst band, append "+ {k} autre(s)" / "+ {k} أخرى". If the worst band is `ok`, no subject is named. If `absencesLeft` is `null`, the term-over rows apply, whatever the band.

**Formatting.**
- Wrap {subject} in `<bdi>`.
- Use Western digits in both languages.
- In Arabic, pick the row with `Intl.PluralRules('ar').select(n)`. The categories are zero, one, two, few, many and other.

| State | Arabic category | FR | AR | Colour |
|---|---|---|---|---|
| `ok` | — | Toutes les matières au-dessus du seuil | جميع المواد فوق الحد الأدنى | `--ink2` |
| `near`, n = 0 | zero | {subject} : plus aucune absence possible | {subject}: لا يُسمح بأي غياب إضافي | `--warning-ink` |
| `near`, n = 1 | one | {subject} : encore 1 absence avant la limite | {subject}: يتبقّى غياب واحد قبل بلوغ الحد | `--warning-ink` |
| `near`, n = 2 | two | {subject} : encore 2 absences avant la limite | {subject}: يتبقّى غيابان قبل بلوغ الحد | `--warning-ink` |
| `near`, n = 3–10 | few | {subject} : encore {n} absences avant la limite | {subject}: يتبقّى {n} غيابات قبل بلوغ الحد | `--warning-ink` |
| `near`, n = 11–99 | many | {subject} : encore {n} absences avant la limite | {subject}: يتبقّى {n} غيابًا قبل بلوغ الحد | `--warning-ink` |
| `near`, n = 100+ | other | {subject} : encore {n} absences avant la limite | {subject}: يتبقّى {n} غياب قبل بلوغ الحد | `--warning-ink` |
| `below` | — | {subject} : limite d'absences dépassée | {subject}: تم تجاوز حد الغياب | `--danger-ink` |
| Term over, a subject below T | — | {subject} : semestre terminé sous le seuil | {subject}: انتهى الفصل دون بلوغ الحد الأدنى | `--danger-ink` |
| Term over, all subjects at or above T | — | Semestre terminé — toutes les matières au-dessus du seuil | انتهى الفصل — جميع المواد فوق الحد الأدنى | `--ink2` |

**Notes on the table.**
- *n = 2:* the Arabic "two" row has no numeral; غيابان is the dual form.
- *n = 100+:* the "other" row covers numbers such as 100–102 and 200. With realistic allowances it never occurs; it is there so every `Intl` category has a row.
- *Measured ink contrast:*

| Token | Light, on white | Light, on its tint | Dark, on `--surface` | Dark, on its tint |
|---|---|---|---|---|
| `--warning-ink` | 6.39 | 5.74 | 8.36 | 6.08 |
| `--danger-ink` | 6.54 | 5.74 | 7.59 | 6.14 |

**"Seuil : {T} %" label** takes the overall band's colour:
- `ok`: `--jade-text`
- `near`: `--warning-ink`
- `below`: `--danger-ink`

**Ring stroke** uses the overall band's fill colour: `--jade`, `--warning` or `--danger`.
