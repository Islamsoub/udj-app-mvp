# PWA login hero: adopt the Round 2 close-out tokens

## Goal
The five `--hero-*` tokens in `pwa/app/globals.css` match
`design/spec-pack/ROUND2-CLOSEOUT.md` §1 in both themes. Each one's comment
explains the current decision, gives contrast figures re-measured against the
new values, and no longer describes the superseded ones: "Flat, not a gradient",
the neutral dark hero, the dark ink, the jade mark, the 16%/28% white pill.
The login hero's decorative circles are at `rgba(255,255,255,.04)`.
`design/pwa-tokens.css`, which globals.css copies, says the same thing. The
"Login hero tokens" row is gone from `.claude/design-known-divergences.md`.
The dashboard GPA card, which uses `--hero-start` / `--hero-end` and keeps its
7% circle, is untouched. All three milestones land in one PR.

## Product
pwa

## Milestones

### 1. Hero tokens, circle opacity and their comments
- Goal: `pwa/app/globals.css` declares the close-out values for all five `--hero-*` tokens in both themes. The login `.blob` is white 4%. Every contrast figure in the touched comments is re-measured against those values.
- Paths:
  - `pwa/app/globals.css`, only the `--hero-*` declarations and their comments inside `[data-theme="light"]` and `[data-theme="dark"]`
  - `pwa/components/login/login.module.css`, only:
    - the `.blob` background (line 56);
    - the stale comments at lines ~42–45 (`.hero`), ~50–52 (`.blob`), ~104 (`.mark`) and ~768–769 (`.langChip:focus-visible`).
- Target values (ROUND2-CLOSEOUT.md §1, verbatim; the user accepted them exactly):

  | Token | Light | Dark |
  |---|---|---|
  | `--hero-bg` | `linear-gradient(155deg, #168666, #0F6E56)` | `linear-gradient(155deg, #0F5E48, #0A3D2E)` |
  | `--hero-ink` | `#FFFFFF` | `#FFFFFF` |
  | `--hero-mark` | `#FFFFFF` | `#FFFFFF` |
  | `--hero-chip` | `rgba(10,61,46,.40)` | `rgba(10,61,46,.40)` |
  | `--hero-chip-hover` | `rgba(10,61,46,.50)` | `rgba(10,61,46,.50)` |

  In light only `--hero-bg` changes. Light ink, mark and chip already resolve to these values; only their comments change. In dark, all five change. Dark `--hero-mark` may be written `var(--hero-ink)`, as in light.
- `.blob` becomes `rgba(255, 255, 255, 0.04)`.
- Required content of the light `--hero-bg` / `--hero-ink` comment (user decision, 2026-11-09):
  - The worst case is **4.23:1**: white on the gradient start `#168666` under the 4% circle.
  - That point is below AA. **No text may sit in that corner.**
  - The 4.23:1 is accepted.
  - Do not claim AA at every pixel.

  Exact wording is the builder's; these are developer comments, not copy.
- Notes for the builder:
  - Measure with WCAG 2.x sRGB relative luminance. Compute circle and chip blends in sRGB, over the 4% circle. Write your own figures in the comments rather than copying the close-out's. The planner's spot check:
    - start + 4% circle: light 4.23, dark 7.05;
    - chip, rest / hover: light 6.35 / 7.09, dark 8.84 / 9.23.
  - Do not repeat the close-out's "3.10 : 1 against the lightest point" for the dark submit button. 3.10 is against the bare start stop; against start plus circle it is 2.82.
  - `--hero-bg` is used only as `background:` in `login.module.css` `.hero`, so a gradient is safe there. Grep `pwa/` for any other `var(--hero-bg)` before changing it.
  - Do not touch `--hero-start` / `--hero-end`, `--jade*`, `--on-jade` or any other token.
  - pwa/ has no CI job. Run `npm run typecheck` and `npm run build` in `pwa/` by hand and paste both results into PROGRESS.md.
- Done when:
  - The `globals.css` diff shows the table above in both theme blocks and nothing outside the `--hero-*` lines and their comments.
  - The light comment states 4.23:1 under the 4% circle and that no text may sit in that corner.
  - No touched comment still says "flat", "neutral", "quiet raised surface", "Ink, as everywhere else", "jade on the dark one", "5.34", "7.41" or "8.06", or a white 16%/28% pill.
  - `.blob` is `rgba(255, 255, 255, 0.04)`.
  - Typecheck and build pass in `pwa/`.
  - Screenshots of the login screen in light and dark, FR and AR, are attached to PROGRESS.md.

### 2. design/pwa-tokens.css follows globals.css
- Goal: `design/pwa-tokens.css` has the same `--hero-*` values as `globals.css`, and its header records the close-out amendment.
- Paths: `design/pwa-tokens.css`, only:
  - the header comment (lines ~1–26);
  - the light `--hero-*` lines and their comments (~72–80);
  - the dark `--hero-*` lines and their comment (~123–129).
- Notes:
  - Add an "Amended for the Round 2 close-out (2026-11-09)" paragraph to the header. It says:
    - both themes use a jade gradient, white ink, a white mark and the jade-900 chip wash;
    - the circles are white 4%;
    - the light worst case is 4.23:1 in a corner with no text.
  - Leave the older "Amended for…" paragraphs as history. Where one states a value that is now superseded ("flat hero", "--hero-bg is --jade-text", "in dark --hero-ink is --ink … white 16% / 28% pill"), mark it as superseded by the new paragraph rather than deleting it.
  - The contrast figures in this file's inline comments must match milestone 1's.
- Done when:
  - Diffing the `--hero-*` declarations of `design/pwa-tokens.css` against `pwa/app/globals.css` shows identical values in both themes.
  - The header has the new amendment.
  - No other line in the file changed.

### 3. Retire the divergence row
- Goal: `.claude/design-known-divergences.md` no longer lists the login hero, and its "Last reviewed" date is current.
- Paths: `.claude/design-known-divergences.md`
- Done when: the row that starts `| Login hero tokens |` is deleted and the other four rows are byte-identical.

## Flags
Resolved by the user, 2026-11-09:
1. ~~Light corner fails AA at one pixel~~ **Resolved:** accept 4.23:1 and use the close-out values exactly (`#168666 → #0F6E56`). The comment must state the worst case and that no text may sit there (milestone 1).
2. ~~Circle opacity is outside globals.css~~ **Resolved:** in scope. Set it to `.04` and fix the stale login.module.css comments (milestone 1).
3. ~~design/pwa-tokens.css~~ **Resolved:** in scope as milestone 2, same PR.
4. ~~Browser chrome colour~~ **Resolved: out of scope.** Leave `themeColor: '#0F6E56'` in `pwa/app/layout.tsx` and `theme_color` in `pwa/public/manifest.json` unchanged. A PR touching them is rejected.

Out of scope, follow-ups to track:
- **Dark-mode browser chrome colour.** `layout.tsx` sets one `themeColor` for both themes, and the manifest has one `theme_color`. Neither follows the new gradients or has a dark variant. Open a separate ticket.
- **Design's export is stale.**
  - `design/spec-pack/OVERRIDES.json`, R2-on-green-text: still says the chip is `rgba(0,0,0,.16)` and the circles stay `.07`.
  - `design/spec-pack/INDEX.md`, line 31: still names `--warning-text` / `--danger-text`.

  Both conflict with the close-out. Report this back to Design; **do not edit** anything under `design/spec-pack/`.
- **Close-out figure.** The dark submit button's "3.10 : 1 against the lightest point" is really its contrast against the bare start stop; against start plus circle it is 2.82. Include this in the report to Design.

No user-facing copy is added by this mission.

## Schema
No.
