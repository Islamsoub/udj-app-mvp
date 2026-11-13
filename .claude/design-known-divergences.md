# Known divergences — design/spec-pack vs the built product

The design checker must not report anything on this list. Each one has been
seen and decided. Remove an entry when it is actually fixed.

Last reviewed: 2026-11-13

| Where | Spec says | Built says | Decision |
|---|---|---|---|
| `--ink2`, light | `#6C7267` | `#656B60` | Code wins. The built value is measured at 4.58:1 on `--sunken`. Design to update its token file. |
| `--ink3`, light | `#9CA396` | `#80867A` | Code wins, same reason. |
| Offline switch knob | white, 17px | `--on-jade`, 22px | Code wins. Design to update the prototype. |
| Arabic dashboard | "Hier", "Lundi", "juin 10" in French | same | Real bug, tracked separately. Not a spec divergence. |
| Sidebar mark (PWA dashboard) | `assets/unipocket-sidebar-mark.png` (`dashboard.html:17`) | `assets/brand/unipocket-u-tile.svg`, served as `pwa/public/brand/logo-on-neutral.svg` | Product owner, 2026-11-13. The PWA keeps the vector tile rather than the PNG (the mobile 1024² launcher icon reused at 34px), but takes the PNG's gradient, `#149E5F → #0A3D2E`, fitted along its diagonal. In doing so the tile leaves the token system on purpose. Evidence, from `specs/pwa/dashboard/css/app.css`: `#1D9E75` is `--jade` (line 10); `#0F6E56` is `--jade-text` (line 10); `#0A3D2E` is the dark `--hero-bg` end stop (line 15); `#149E5F` appears nowhere in the token block. So the old gradient was `--jade → --jade-text`, two tokens, and the new one's light end, `#149E5F`, has no token behind it. It matches only the colour baked into Design's `unipocket-sidebar-mark.png`. |
| Logo tile SVG, spec pack vs PWA | `specs/pwa/dashboard/assets/unipocket-u-tile.svg` (also `assets/brand/` and `specs/pwa/login/assets/`, identical): `#1D9E75 → #0F6E56` | `pwa/public/brand/logo-on-neutral.svg`: `#149E5F → #0A3D2E` | Product owner, 2026-11-13. The two files disagree, and that is correct: the PWA's tile follows the gradient in `unipocket-sidebar-mark.png` (row above). The spec pack's SVGs are Design's files and are not edited. `pwa/public/brand/logo-on-neutral.svg` is the only tile the app may use. Copying any spec-pack `unipocket-u-tile.svg` into `pwa/` brings back the lighter, more teal green. |
| First nav item and dashboard title (PWA) | "Tableau de bord" / "لوحة التحكم" | "Accueil" / "الرئيسية" | Product owner, 2026-11-13: keep Accueil. |
| Dashboard attendance card title (PWA) | "Assiduité" (`dashboard.html:101`) | "Présence" | Product owner, 2026-11-13. The mobile app says "Présence" and is the authority for wording; the card now carries the same name as its destination (sidebar, tab bar, topbar and `/attendance` heading). FR only; Arabic unchanged. |
| Schedule label, sidebar (PWA) | "Emploi du temps" (`dashboard.html:27`) | "Planning", in the sidebar, the tab bar, the topbar title and the `/schedule` heading | Product owner, 2026-11-13. Too long for the rail. FR only; Arabic unchanged. |
