# Unipocket — App Icon Fix (Handoff to Claude Code)

## Problem we solved
The Android launcher icon looked **too small** next to other apps. It was **not** a config or
resolution bug. Android masks the adaptive-icon **foreground** to a circle/squircle and only
shows the inner **72 dp viewport** (the outer 18 dp is cropped). The old mark (graduation cap
stacked over a tall narrow "U") is taller than it is wide, so scaling it to fill the safe zone by
its bounding box left big empty gaps left/right inside the circle — it read tiny. Pushing the
source from 680→950 px didn't help because we were enlarging a *narrow* silhouette.

## What we changed
1. Switched the icon mark to the **"U" only** (no cap) — it's nearly square, so it fills the
   circle far better.
2. Rendered it **bold and filled in white**, sized to sit inside the 66 dp safe circle
   (mark spans ~r33 of the 108 dp canvas → ~600 px in a 1024 px foreground), centred on the
   circle's mid-line. Verified against a simulated 72 dp circle crop: **nothing clips**.
3. Background is a **jade diagonal gradient** (#149E5F → #0A3D2E, top-left → bottom-right).
   Because a gradient is not a flat color, the adaptive icon now uses a **backgroundImage**
   layer instead of `backgroundColor`.

## Files (replace the old ones in `assets/icons/`)
| File | Size | Role |
|---|---|---|
| `icon.png` | 1024×1024 | Full-bleed composite (gradient + white U). iOS + legacy. |
| `adaptive-icon-foreground.png` | 1024×1024 | Android foreground: white U on transparent, sized for the safe zone. |
| `adaptive-icon-background.png` | 1024×1024 | Android background: jade gradient, full bleed. |
| `icon-play-store.png` | 512×512 | Google Play store listing. |

## app.json / app.config — change to make
```jsonc
{
  "expo": {
    "icon": "./assets/icons/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/adaptive-icon-foreground.png",
        "backgroundImage": "./assets/icons/adaptive-icon-background.png",
        "backgroundColor": "#0A3D2E"
      }
    }
  }
}
```
Notes:
- Remove the old `"android": { "icon": ... }` full-bleed override if present — the adaptiveIcon
  block handles Android.
- Keep `backgroundColor` as a fallback for launchers that ignore `backgroundImage`.
- Run `npx expo prebuild --clean` then rebuild so the mipmaps regenerate from the new assets.

## Why this is safe at small sizes
The white U is a solid, wide form filling ~82% of the visible circle and holds up at 44 dp.
No thin strokes (those shimmer/vanish on the launcher). The brand "U" shape itself is unchanged
from the source logo (Frame 60) — only the cap was dropped and the form bolded/filled.
