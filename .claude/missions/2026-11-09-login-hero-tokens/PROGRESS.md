# Progress — PWA login hero: adopt the Round 2 close-out tokens

## Run 1 — 2026-11-09

Branch: `feature/login-hero-tokens` (from `develop` @ 795cadb). One commit, all
three milestones. Not pushed, no PR opened — the user approves that step.

### Milestone 1 — done
- `pwa/app/globals.css`: the five `--hero-*` tokens in both theme blocks now
  hold the close-out values; comments rewritten with re-measured figures.
  Nothing else in the file changed. `var(--hero-bg)` is used only in
  `login.module.css` `.hero` (grepped `pwa/`), so the gradient is safe.
- `pwa/components/login/login.module.css`: `.blob` → `rgba(255, 255, 255, 0.04)`;
  stale comments fixed at `.hero`, `.blob`, `.mark` (the inline one) and
  `.langChip:focus-visible`.
  - **Deviation, flagged:** I also edited the `COLOUR.` paragraph of the big
    `.mark` block comment (~lines 93–96), which said "dark wants jade". It is
    outside the listed line ranges but describes the superseded jade mark, which
    the mission goal says must go. Revert those 3 lines if the reviewer prefers.
- Contrast method: WCAG 2.x relative luminance, sRGB, white text; circle and
  chip blends composited in sRGB and rounded to 8 bits per step (as a browser
  draws them). Script: computed in Node, no dependency.

  | Point | Light | Dark |
  |---|---|---|
  | Gradient start | 4.53 | 7.73 |
  | Gradient end | 6.20 | 12.21 |
  | Start + 4% circle (worst point) | **4.23** | 7.05 |
  | Chip label over start + circle, rest | 6.35 | 8.84 |
  | Chip label over start + circle, hover | 7.09 | 9.23 |
  | Dark submit `#2BB989` vs bare start | — | 3.10 |
  | Dark submit `#2BB989` vs start + circle | — | 2.82 |

  Without 8-bit rounding of the blends the figures are 4.23 / 7.01, chip
  6.37 / 7.10 (light) and 8.77 / 9.28 (dark), submit 2.81 — the close-out's
  numbers. The comments use the rounded ones (they match the planner's spot check).
  End + 4% circle: light 5.70, dark 10.89 (unrounded; not cited in comments).
- Not measured: "under the tagline, worst glyph" — it needs the rendered
  gradient geometry. The comment instead states the bound that holds: text
  outside the circles never drops below 4.53:1 (the start stop is the
  gradient's lightest colour).
- `npm run typecheck` (pwa/): passes — `tsc --noEmit`, no output, exit 0.
- `npm run build` (pwa/): passes — Next.js 16.3.3 (Turbopack), "Compiled
  successfully", TypeScript finished, 12/12 static pages generated, all 12 routes
  listed. No warnings or errors.
- Screenshots (headless Edge, 1280x960, `next start` with theme/lang cookies
  injected via a local proxy): `screenshots/login-light-fr.png`,
  `screenshots/login-light-ar.png`, `screenshots/login-dark-fr.png`,
  `screenshots/login-dark-ar.png`. In AR the chip moves to the right-hand corner
  as before (logical properties); no RTL selector was added.
  - Observation, not investigated: a first capture at a 420px window width
    showed the card cropped on the inline-end side in both themes. Probably the
    headless window's minimum width, not the layout, and unrelated to this change
    (no layout property touched). Worth a quick look on a real phone.

### Milestone 2 — done
- `design/pwa-tokens.css`: `--hero-*` values identical to globals.css in both
  themes; short inline comments carry the same figures as milestone 1. Header:
  new "Amended for the Round 2 close-out (2026-11-09)" paragraph; the three older
  paragraphs that state superseded values ("login hero", "flat hero", "white
  hero") each get a parenthetical "superseded by the Round 2 close-out amendment
  below" — not deleted.

### Milestone 3 — done
- `.claude/design-known-divergences.md`: `| Login hero tokens |` row deleted;
  the other four rows are untouched. "Last reviewed" already read 2026-11-09, so
  it did not change.

### Flagged
- The `.mark` COLOUR paragraph edit above (outside the listed line ranges).
- For Design (from the mission, not done here — do not edit `design/spec-pack/`):
  `OVERRIDES.json` R2-on-green-text still says chip `rgba(0,0,0,.16)` and
  circles `.07`; `INDEX.md` line 31 still names `--warning-text` /
  `--danger-text`; the close-out's dark submit "3.10 : 1 against the lightest
  point" is against the bare start stop — against start + circle it is 2.82.
- Follow-up ticket still needed: dark-mode browser chrome colour (`themeColor`
  in layout.tsx, `theme_color` in manifest.json — left untouched).

### Could not do
- Nothing blocking. Push and PR are left for the user.

## Run 1, follow-up commit — 2026-11-09 (review fixes, user-approved)

This is a second commit on `feature/login-hero-tokens`, on top of 3a6f290, which was not amended. Not pushed, no PR.

1. **`pwa/public/offline.html`** (the service-worker offline fallback, which has its own copy of the hero):
   - light `--hero-bg`: `var(--jade-text)` → `linear-gradient(155deg, #168666, #0F6E56)`.
   - dark `--hero-bg`: `var(--surface2)` → `linear-gradient(155deg, #0F5E48, #0A3D2E)`.
   - dark `--hero-ink`: `var(--ink)` → `#FFFFFF`.
   - dark `--hero-mark`: `var(--jade)` → `var(--hero-ink)`.
   - `.blob`: `0.07` → `0.04`.
   - The page has no language chip, so there are no chip tokens to add.
   - `--jade-text` in the light block is now unused there. I left it, because the block is a copy of the globals.css tokens.
   - sw.js needs no cache bump: VERSION includes the build id, so a deploy re-precaches offline.html.
   - Rendered in light/dark × FR/AR: `screenshots/offline-{light,dark}-{fr,ar}.png`. All four show the gradient, a white mark and white text. In AR the text is right-aligned and the circles swap sides.
2. **Arabic corner wording.** `linear-gradient(155deg)` is physical, so the start stop is always the top-left corner. The circles use logical insets: `.blobStart` covers the top-left in FR and `.blobEnd` covers it in AR (I checked that both cover the corner pixel). The comments now name the physical top-left corner in:
   - globals.css: the light `--hero-bg` and `--hero-chip` comments, the dark `--hero-bg`, `--hero-ink` and `--hero-chip` comments.
   - login.module.css: `.blob` and `.langChip`.
   - design/pwa-tokens.css: the header amendment, the light `--hero-bg` and chip comments, and the dark comment.
   - **AR chip, measured.** I placed the chip box at top 14 / inline-end 14, about 54×30 px, measured from the render. The hero is 231 px tall. I took the 155deg gradient line, read the chip's lightest corner on it, and composited in sRGB with 8-bit blends:

     | | t along gradient | Light rest / hover | Dark rest / hover |
     |---|---|---|---|
     | AR, 420px card | 0.42 | 6.90 / 7.60 | 9.76 / 10.17 |
     | AR, 327px hero (375px phone) | 0.35 | 6.80 / 7.50 | 9.62 / 10.03 |
     | FR, chip's actual corner | 0.05 | 6.43 / 7.09 | 8.85 / 9.36 |

     The stated figures (6.35 / 7.09 and 8.84 / 9.23) are measured at the hero's lightest point, so they are a floor that holds in both directions. The AR figures are added alongside them.
3. **globals.css:** removed the `--hero-start` / `--hero-end` reference. Neither name exists anywhere in pwa/ (grepped).
4. **`pwa/components/login/LoginCard.tsx`:** the mark comment no longer says the dark mark is jade.
5. **Accepted deviation:** the user kept the run-1 edit to the `.mark` COLOUR paragraph in login.module.css, which was outside the listed line ranges.

**Checks after this commit**
- `npm run typecheck` (pwa/): passes, exit 0.
- `npm run build` (pwa/): passes. It compiled, ran TypeScript and generated 12/12 pages, with no warnings.

### Follow-up: browser chrome colour (extends the existing note; not done here)
These are left alone on purpose and belong with the dark-mode `themeColor` / `theme_color` ticket:
- `pwa/app/layout.tsx:25-27`: the comment says the chrome colour is `--hero-bg` (light) and matches the hero. The hero is now a gradient (#168666 → #0F6E56), so this is only true at the end stop.
- `pwa/scripts/generate-icons.mjs:9, 28, 32`: the comment says the icon is the light hero, "--hero-bg … = --jade-text", and `HERO_BG = '#0F6E56'`. That is no longer what `--hero-bg` is.
