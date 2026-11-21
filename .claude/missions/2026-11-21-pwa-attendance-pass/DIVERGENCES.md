# Divergences to record (ready to paste)

The guard blocks agents from `.claude/design-known-divergences.md`. Islam adds these rows. Format of the file: Where | Spec says | Built says | Decision. Rows are added here by each milestone; the Lead copies them into the report. "Last reviewed" in that file needs the date.

| Where | Spec says | Built says | Decision |
|---|---|---|---|
| Panel field labels and hero secondary text (PWA Présence) | `--ink3` (`.dp-section-lbl`, `.hj-*` secondary) | `--ink2` | Code wins, 2026-11-21. `--ink3` is under 4.5:1 as text and reserved for non-text (CLAUDE.md). |
| Submit button label in the justification panel (PWA) | white on `--jade` (`.btn-save`, prototype `#justify-foot-btn`) | `--on-jade` rgb(30,35,31) on `--jade` | Code wins, 2026-11-21. White on jade is 3.39:1 and fails AA; the PWA's rule is dark ink on jade (CLAUDE.md). |
| Extra copy the prototype lacks (PWA Présence) | none | the threshold note under "Par matière", the "Encore n absence(s)" flag, the count line "Affichées : n sur m", the panel's explanatory sentences | Product owner, 2026-11-21. Data and wording the PWA already has and keeps (decision 9). |
