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
| Sidebar mark (PWA dashboard) | `assets/unipocket-sidebar-mark.png` (`dashboard.html:17`) | `assets/brand/unipocket-u-tile.svg`, served as `pwa/public/brand/logo-on-neutral.svg` | Product owner, 2026-11-13. The PNG is the mobile 1024² launcher icon reused at 34px, and its gradient `#149D5E → #0A3E2F` matches no token. The tile SVG's gradient is `--jade → --jade-text` (`#1D9E75 → #0F6E56`), and it is vector. |
| First nav item and dashboard title (PWA) | "Tableau de bord" / "لوحة التحكم" | "Accueil" / "الرئيسية" | Product owner, 2026-11-13: keep Accueil. |
