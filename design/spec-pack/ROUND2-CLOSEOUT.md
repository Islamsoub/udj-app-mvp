# Round 2 close-out: PWA login hero and attendance copy

Revised 2026-11-09 (third pass). This file sits at the root of the zip. Every other path matches `design/spec-pack/`.

**What changed in this pass**
- New §4: copy for the attendance page (Hero, subject rows, ring), in both languages.
- §3 now gives the Seuil label's string (A2), the near ring colour (A3) and the "+ {k}" suffix (A4, full forms in §5).
- §1: the dark submit button figure is corrected to 2.82 : 1, and the other hero figures now match `globals.css`. The light-corner question is closed.
- `Round 2 Spec.html` §1 now agrees with this file. `OVERRIDES.json` and `INDEX.md` are brought up to date.
- `tokens/pwa/tokens.css` and `tokens.json` are rebuilt from `pwa/app/globals.css`, which fixes `--ink2` (`#656B60`) and `--ink3` (`#80867A`).
- The prototype's offline switch now matches `login.module.css`.
- All 12 renders are redone, because `--ink2` and `--ink3` changed.

**Shipped-code reference.** Token names and values come from `pwa/app/globals.css` on `develop`. Rebuild the token files from that file, never from `design/pwa-tokens.css`, which is an older loose copy. No parallel tokens are introduced.

## Decisions, one line each

- **A1, the attendance page:** see §4. The Hero states the overall band in words. Each subject row states its own band, and near rows give the absences left. PresenceRing takes the overall band's stroke, as the dashboard ring does.
- **A2, the Seuil label:** "Seuil : 75%" / "الحد الأدنى: 75%". The figure comes from `percentText`, so there is no space and the sign is Latin in both languages. The percent form does not change anywhere in the PWA; the prototype's "75 %" was wrong and is corrected.
- **A3, the near ring stroke:** `--warning-ink`, in both themes. On `--surface` it measures 6.39 : 1 in light and 8.36 : 1 in dark.
- **A4, the "+ {k}" suffix:** goes at the end of the sentence, after " · ", and names "matière(s)" / "مادة". It applies to `near`, `below` and term-over-below. The six Arabic forms are in §5.

## 1. Login hero tokens

`globals.css` on `develop` already ships every value in this section. It was checked on 2026-11-09.

| Token | Light | Dark |
|---|---|---|
| `--hero-bg` | `linear-gradient(155deg, #168666, #0F6E56)` | `linear-gradient(155deg, #0F5E48, #0A3D2E)` |
| `--hero-ink` | `#FFFFFF` | `#FFFFFF` |
| `--hero-mark` | `var(--hero-ink)` | `var(--hero-ink)` |
| `--hero-chip` | `rgba(10,61,46,.40)` | `rgba(10,61,46,.40)` |
| `--hero-chip-hover` | `rgba(10,61,46,.50)` | `rgba(10,61,46,.50)` |

**Decorative circles:** `rgba(255,255,255,.04)`.

**Measured contrast for white text.** These figures use WCAG 2.x and sRGB, with the blends composited in 8-bit, the same method as `globals.css`.

| Point | Light | Dark |
|---|---|---|
| Gradient start | 4.53 | 7.73 |
| Gradient end | 6.20 | 12.21 |
| Start + 4% circle (lightest pixel on the hero) | **4.23** | 7.05 |
| Chip label over a circle, at rest | 6.35 | 8.84 |
| Chip label over a circle, hover | 7.09 | 9.23 |

**The light corner is closed: it is accepted at 4.23.** The 4% circle stays, and the gradient start stays at `#168666`. The condition is that no text sits in the top-left corner, in either direction. The only text inside a circle is the language chip, on its own pill, at 6.35 : 1. `globals.css` records this decision.

**Darker and quieter than the button.** The dark stops, `#0F5E48` (L 0.086) and `#0A3D2E` (L 0.036), are darker than the light stops (0.182 and 0.119). The dark submit button, `#2BB989` (L 0.370), measures **2.82 : 1** against the hero's lightest point, which is the start stop under the 4% circle. Against the bare start stop it measures 3.10 : 1. The previous pass quoted 3.10 for the lightest point, which was wrong. The conclusion is unchanged.

**Submit button label** is `--on-jade` in both themes:

| Theme | Label on `--jade` | Label on `--jade-hover` |
|---|---|---|
| Light (`#1E231F`) | 4.71 | 5.78 |
| Dark (`#0F1713`) | 7.29 | 8.87 |

**`--hero-chip`.** This is the jade-900 wash, as shipped. Against the lightest point it measures 6.35 in light, where the earlier black wash measured 5.62. In dark the two are effectively equal, at 8.84 and 8.83.

**Scope.** This section does not change the dashboard grade-average card. The card keeps `linear-gradient(150deg, #168666, #0F6E56)` and its 7% depth circle. That gradient is not a custom property in `globals.css`. The prototype calls its stops `--hero-start` / `--hero-end`.

## 2. Files in this zip

Changed in this pass:
- `ROUND2-CLOSEOUT.md`, `OVERRIDES.json` and `INDEX.md` (at the root)
- `specs/pwa/dashboard/Round 2 Spec.html`: §1 now agrees with this file (B1, A2, A3).
- `specs/pwa/dashboard/dashboard.html`: changes the Seuil label to "75%" and the near ring to `--warning-ink`, and adds a new `?att=multi` state, which shows the "+ {k}" suffix.
- `specs/pwa/dashboard/css/app.css`: `--ink2` and `--ink3`.
- `specs/pwa/login/source/login-screen.html` and `.css`: changes `--ink2` and `--ink3`, and gives the offline switch the code's track and knob (B5).
- `tokens/pwa/tokens.css` and `tokens/pwa/tokens.json`: rebuilt from `globals.css` (B4).
- `screenshots/pwa-login/` (all seven) and `screenshots/pwa-dashboard/` (all five): 1440×900, at a 1× pixel ratio.

`dashboard.html` takes `?att=ok|near|below|ended|multi`. With no parameter it shows `below`.

## 3. Attendance card: the line under the ring

**Inputs.** `GET /student/attendance` returns `band` and `absencesLeft` for the overall figure and for every subject.

**Which subject is named.** Sort the subjects:
1. By band, worst first: `below`, then `near`, then `ok`.
2. By fewest `absencesLeft`; `null` sorts last.
3. By lowest `rate`.
4. By subject name, using `localeCompare` in the display language.

The first subject is named. If *k* more subjects share the worst band, append the §5 suffix. If the worst band is `ok`, no subject is named. If `absencesLeft` is `null`, the term-over rows apply, whatever the band.

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

**Seuil label (A2).** The new key is `dashboard.attendance.threshold`:

| | FR | AR |
|---|---|---|
| Template | `Seuil : {{threshold}}` | `الحد الأدنى: {{threshold}}` |
| Value | `fmtPercent(T)` gives "75%" | `fmtPercent(T)` gives "75%" |

- **Colour** follows the overall band: `ok` is `--jade-text`, `near` is `--warning-ink` and `below` is `--danger-ink`.
- **Wording.** The card's label is shorter than the attendance page's "Seuil requis : …" on purpose, because the card has less room. The figure is written the same way in both places.
- **The notification is the exception.** The server writes the push text (Round 2 §4) and keeps U+202F before "%". That text never passes through `percentText`.

**Ring stroke (A3).** The stroke follows the overall band:

| Band | Stroke | Light, on `--surface` | Dark, on `--surface` |
|---|---|---|---|
| `ok` | `--jade` | 3.39 | 6.17 |
| `near` | **`--warning-ink`** | 6.39 | 8.36 |
| `below` | `--danger` | 3.76 | 5.56 |

`--warning` (`#F59E0B`) measured 2.15 : 1, so it is not used for the ring.

**Measured ink contrast.**

| Token | Light, on white | Light, on its tint | Dark, on `--surface` | Dark, on its tint |
|---|---|---|---|---|
| `--warning-ink` | 6.39 | 5.74 | 8.36 | 6.08 |
| `--danger-ink` | 6.54 | 5.74 | 7.59 | 6.14 |

## 4. Attendance page (A1)

The page shows three things: the overall band in the Hero, each subject's band on its row, and the overall band on the ring. Every state uses the server's `band` and `absencesLeft`; the PWA never derives a band from `percentage`. Term over means `absencesLeft === null`.

**PresenceRing.** The stroke follows `overall.band`, with the same three colours as the dashboard ring (§3). Its track and `aria-label` do not change.

**Hero line.** These rows replace the line under the figure, `.heroThreshold`. An icon means the `WarningIcon` is shown, in the same colour as the text. `{{threshold}}` is `fmtPercent(T)`.

| Overall state | Key | FR | AR | Colour | Icon |
|---|---|---|---|---|---|
| `ok` | `attendance.hero.threshold` (unchanged) | Seuil requis : {{threshold}} | الحد الأدنى المطلوب: {{threshold}} | `--ink2` | no |
| `near` | `attendance.hero.near` (new) | Seuil requis : {{threshold}} · marge faible | الحد الأدنى المطلوب: {{threshold}} · هامش ضيق | `--warning-ink` | yes |
| `below` | `attendance.hero.below` (rewritten) | Seuil requis de {{threshold}} hors d'atteinte ce semestre | لم يعد بلوغ الحد الأدنى المطلوب {{threshold}} ممكنًا هذا الفصل | `--danger-ink` | yes |
| Term over, `below` | `attendance.hero.ended_below` (new) | Semestre terminé sous le seuil requis de {{threshold}} | انتهى الفصل دون بلوغ الحد الأدنى المطلوب {{threshold}} | `--danger-ink` | yes |
| Term over, otherwise | `attendance.hero.ended_ok` (new) | Semestre terminé · seuil requis : {{threshold}} | انتهى الفصل · الحد الأدنى المطلوب: {{threshold}} | `--ink2` | no |

**The Hero does not show absences left.** The overall `absencesLeft` is a pooled figure. One absence counts against one subject, so the pooled figure can read "8 left" while one subject has none. The subject rows carry the number instead.

**Subject rows.** These rows replace the flag in `.subjectMeta`. Each row is chosen by that subject's own band.

| Subject state | Key | FR | AR | Colour |
|---|---|---|---|---|
| `ok` | — | no flag | no flag | — |
| `near`, n = 0 (zero) | `attendance.subjects.near.zero` | Plus aucune absence possible | لا يُسمح بأي غياب إضافي | `--warning-ink` |
| `near`, n = 1 (one) | `…near.one` | Encore 1 absence avant la limite | يتبقّى غياب واحد قبل بلوغ الحد | `--warning-ink` |
| `near`, n = 2 (two) | `…near.two` | Encore 2 absences avant la limite | يتبقّى غيابان قبل بلوغ الحد | `--warning-ink` |
| `near`, 3–10 (few) | `…near.few` | Encore {{n}} absences avant la limite | يتبقّى {{n}} غيابات قبل بلوغ الحد | `--warning-ink` |
| `near`, 11–99 (many) | `…near.many` | Encore {{n}} absences avant la limite | يتبقّى {{n}} غيابًا قبل بلوغ الحد | `--warning-ink` |
| `near`, 100+ (other) | `…near.other` | Encore {{n}} absences avant la limite | يتبقّى {{n}} غياب قبل بلوغ الحد | `--warning-ink` |
| `below` | `attendance.subjects.below` (rewritten) | Limite d'absences dépassée | تم تجاوز حد الغياب | `--danger-ink` |
| Term over, `below` | `attendance.subjects.ended_below` (new) | Semestre terminé sous le seuil | انتهى الفصل دون بلوغ الحد الأدنى | `--danger-ink` |
| Term over, otherwise | — | no flag | no flag | — |

Each flag keeps its `WarningIcon`, in the text's colour. A `near` subject under T now reads "Encore 2 absences avant la limite". Its figure and the threshold tick on its bar show that it is under T. This replaces "Sous le seuil", which did not say whether the subject could still recover.

**Row treatment.** These replace `.subjectBelow`, which applied the same warning treatment to every subject under T.

| Band | Row border | Bar fill | Figure (`.subjectValue`) |
|---|---|---|---|
| `near` | `--warning-ink` | `--warning-ink` | `--warning-ink` |
| `below` | `--danger` | `--danger` | `--danger-ink` |
| `ok` | unchanged | unchanged | unchanged |

`--warning` is not used for these graphics, for the reason given in A3. `--warning-ink` measures 5.33 : 1 against the `--sunken` track.

**Order.** The rows use the §3 sort.

The French keys carry the same six plural forms as Arabic, so both locales use one shape. In French, `two` through `other` are identical. `n = 0` takes `zero` in both locales, as on the dashboard.

## 5. The "+ {k}" suffix (A4)

**What k counts.** k is the number of subjects in the worst band other than the named one. For the term-over line, it is the other subjects that ended below T.

**Where it goes.** At the end of the sentence, after " · ". It does not go after {subject}: the near sentence's {n} belongs to the named subject only, so "Statistiques L2 + 1 autre : encore 2 absences" would wrongly suggest that both subjects have 2 left. The suffix names "matière" so that it cannot be read as "1 more absence".

**When it applies.** It applies to `near`, `below` and term-over-below. It never applies to `ok` or term-over-ok, and it is not rendered when k = 0.

Example: "Statistiques L2 : limite d'absences dépassée · + 1 autre matière". Preview it with `dashboard.html?att=multi`.

The key is `dashboard.attendance.others`, an object that replaces the "+ {{k}} autre(s)" string:

| Category | FR (`Intl.PluralRules('fr')`) | AR (`Intl.PluralRules('ar')`) |
|---|---|---|
| zero | — (k = 0 is not rendered) | + {{k}} مادة أخرى (never rendered) |
| one | + 1 autre matière | + مادة أخرى |
| two | — | + مادتان أخريان |
| few (3–10) | — | + {{k}} مواد أخرى |
| many | + {{k}} autres matières | + {{k}} مادة أخرى |
| other | + {{k}} autres matières | + {{k}} مادة أخرى |

**Notes on the forms.**
- **Arabic one and two** carry no numeral, the same pattern as the dual غيابان in §3.
- **French** has only the categories one, many and other.
- **Placement in the markup.** Put the suffix inside the sentence's element, after {subject}'s `<bdi>`, and keep it in the sentence's own colour.

## 6. Prototype ≠ code, not changed here

The login prototype still differs from `login.module.css` in three places. None of them was in this brief. Code wins, as for B5, so a checker should not flag the build for any of them:
- **Password field.** The prototype gives it a `--jade-faint` fill. The code gives it the same fill as the ID field.
- **Rate-limit button.** In the prototype the whole label is `--ink3` and DM Mono. In the code the label is `--ink2` and only the digits are in DM Mono.
- **Logo mark.** The prototype draws a 64 px image. The code draws a mask that is 92 px tall.
