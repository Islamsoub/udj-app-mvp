# Divergences to record (ready to paste)

The guard blocks agents from `.claude/design-known-divergences.md`. Islam adds these rows. Format of the file: Where | Spec says | Built says | Decision. Rows are added here by each milestone; the Lead copies them into the report. "Last reviewed" in that file needs the date.

| Where | Spec says | Built says | Decision |
|---|---|---|---|
| Panel field labels (PWA Présence) | `--ink3` (`.dp-section-lbl`) | `--ink2` | Code wins, 2026-11-21. `--ink3` is under 4.5:1 as text and reserved for non-text (CLAUDE.md). |
| Submit button label in the justification panel (PWA) | white on `--jade` (`.btn-save`, prototype `#justify-foot-btn`) | `--on-jade` rgb(30,35,31) on `--jade` | Code wins, 2026-11-21. White on jade is 3.39:1 and fails AA; the PWA's rule is dark ink on jade (CLAUDE.md). |
| Extra copy the prototype lacks (PWA Présence) | none | the threshold note under "Par matière", the "Encore n absence(s)" flag, the count line "Affichées : n sur m", the panel's explanatory sentences | Product owner, 2026-11-21. Data and wording the PWA already has and keeps (decision 9). |
| Présence hero text (PWA) | label 78% white, secondary lines 85% white, on `linear-gradient(150deg, --jade, --jade-hover)` (`.hj-label`, `.hj-summary`, `#pres-hero`) | every line solid `--hero-ink` (white) on `--hero-card-bg`, as the Notes and dashboard heroes | Code wins, 2026-11-21. White is 4.53:1 on the gradient's lighter stop and 6.20:1 on the darker; 85% white would be 3.74:1. The depth circle is not drawn when the hero's content box is under 520px, so no text sits on it. |
| Présence hero, band on the green (PWA) | ring and line in the band colour (amber, red) | ring and threshold line in `--hero-ink` in every band; the band is said in bold words with the warning icon | Code wins, 2026-11-21. `--warning-ink` and `--danger` are under 3:1 on the green and no existing colour reaches it. Whether to add a colour cue is A2. |
