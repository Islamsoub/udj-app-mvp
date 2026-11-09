# Bottom nav — bigger icons · change request for Claude

## What I want
Make the five **bottom-tab icons a little bigger** — about **+12%**. Nothing else about the nav bar changes: same bar height, same active pill, same touch targets, same spacing. Only the glyphs grow.

## Exact change
The nav glyphs render in a square box (viewBox `0 0 24 24`). Bump the rendered box size:

```
icon render size:  25 → 28   (width & height, all five tabs)
```

That's the whole change — a single uniform bump applied to **home, schedule (agenda), grades (notes), news (actus), profile**. Because each glyph's internal transform is expressed in viewBox units, scaling the outer box scales every icon proportionally and **keeps the optical balance** that was tuned per-icon (filled icons sit slightly smaller, stroke icons slightly larger so all five read at equal weight). Do **not** retune the per-icon inner transforms.

In the RN codebase this is wherever the tab icon size is set — a `size`/`width`/`height` prop on the nav icon component, or the icon size constant in the tab-bar config. Change `25` to `28` there; if the five icons are sized individually, bump each by the same ratio (×1.12) rather than to a flat number, to preserve their relative optical sizing.

## Do NOT change
- **Active pill** — stays `46×46`, radius `15`, jade fill on the selected tab.
- **Touch target** — each tab cell stays full-width / `flex: 1`; the tappable area is unchanged (the pill and cell are not resized).
- **Active dot** — the 4px dot under the selected icon, the 2px gap above it, bar height (60), bar radius (22), insets, and shadow all stay as-is.
- **Icon colors** — active `#fff`, inactive `text2`. Unchanged.

## Acceptance check
- All five icons are visibly ~12% larger and still optically balanced (no single icon looks bigger/heavier than the others).
- The active pill, the dot, bar height, and spacing are pixel-identical to before.
- Icons stay centered in the 46×46 pill with no clipping at the new size.
