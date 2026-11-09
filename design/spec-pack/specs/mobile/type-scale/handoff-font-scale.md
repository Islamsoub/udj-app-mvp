# App-wide type scale — change request for Claude

## What I want
Reduce **font sizes only** across the whole app by a uniform **×0.92** (≈ −8%). The current polish pushed type up from the old 14px base and it reads too large on real phones. Everything else — touch targets, paddings, icon sizes, radii, spacing, line-height ratios — **stays exactly as-is.** Only the glyphs get smaller.

## The one decision: a single uniform multiplier, not per-element hand-tuning
Apply the **same 0.92 factor to every fontSize**. Don't pick new bespoke numbers per element. A uniform multiplier shrinks the big sizes more in absolute pixels (26→24, −2px) and the small sizes less (12→11, −1px), which is exactly the right behavior and **preserves the type hierarchy** — the ratios between title/body/caption are untouched. Hand-editing each value risks drifting the hierarchy and is impossible to re-tune later.

Make it **one constant** so the whole app can be re-dialed in a second:

```ts
// theme/type.ts
export const TYPE_SCALE = 0.92;            // single knob — 0.90–0.93 is the usable range
export const fz = (n: number) => Math.round(n * TYPE_SCALE * 10) / 10;  // 15.5 -> 14.3
```

Then **wrap every `fontSize` value in `fz()`**:

```tsx
// before
<Text style={{ fontSize: 15.5, fontWeight: '700' }}>…</Text>
// after
<Text style={{ fontSize: fz(15.5), fontWeight: '700' }}>…</Text>
```

Do this everywhere a `fontSize` literal appears (StyleSheet objects and inline styles alike). If the codebase has a central typography tokens file, apply `fz()` there once and the rest inherits — that's the cleanest path.

## Reference mapping (at 0.92) — sanity-check your output against this
These are the same roles from the design; values are `fz(current)`. Use them to verify the multiplier is wired correctly, **not** to hardcode.

| Role | Current | ×0.92 |
|---|---|---|
| Tab/screen title (Home greeting, hero) | 26 | 23.9 |
| Tab title (Agenda/Notes/News) | 22 | 20.3 |
| Stack/sheet title | 22 | 20.3 |
| Stat value (GPA, %, credits) | 26 | 23.9 |
| Card subject / title | 15.5–16.5 | 14.3–15.2 |
| Row label (settings, detail) | 14.5–15.5 | 13.3–14.3 |
| Row value | 14.5–15 | 13.3–13.8 |
| Body / prof·room / news body | 14 | 12.9 |
| Time pill, day-cell date (mono) | 13 | 12.0 |
| Section header (uppercase) | 12.5–13 | 11.5–12.0 |
| Status/category pill | 13 | 12.0 |
| Small label / caption | 11.5–12 | 10.6–11.0 |

## Do NOT scale
- **Touch targets / control heights** — buttons, rows, nav items, day cells, toggles stay at their current px (44+ minimum). Smaller text inside the same-height control is the whole point.
- **Icon sizes, the colour rail (5px), connector dot (12px), QR, avatars.**
- **Paddings, margins, gaps, border-radii, hairlines, card shadows.**
- **Line-height** where it's a unitless ratio (1.3, 1.5, …) — it scales naturally with the font. Only if a line-height is set as an absolute px should it get `fz()` too.
- **Status-bar clock** (system-rendered) and any monospace that must align in a fixed-width column — check those still fit after scaling (they will at 0.92, but eyeball the day-strip dates and time pills).

## React Native specifics
- Keep `allowFontScaling` at its default (**true**). The 0.92 is our new *base*; the OS large-text accessibility setting should still multiply on top of it so accessibility isn't broken.
- If any `<Text>` currently sets `allowFontScaling={false}`, leave that as-is — just apply `fz()` to its size.
- After wiring, the app's "Taille du texte" setting (Small/Normal/Large) can map to scale steps later (e.g. 0.85 / 0.92 / 1.0) — out of scope for this pass, but `TYPE_SCALE` is the hook for it.

## Acceptance checks
- Every `fontSize` in the app routes through `fz()` (grep for `fontSize:` and confirm no bare literals remain in app code).
- On a normal phone, type is visibly ~8% smaller but hierarchy is unchanged — no element looks disproportionately shrunk.
- Touch targets, card sizes, spacing, and icons are pixel-identical to before.
- Changing `TYPE_SCALE` to `1.0` returns the app exactly to today's sizes (proves nothing was hand-edited).
- The Agenda time pill ("08:00 – 10:00") and day-strip dates still fit on a 320px screen.
