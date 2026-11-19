# DECIDE — questions for Islam

One line each. Answer with the letter. "Default" is what the Builder does if you say "go with the default"; it is only ever the safe, reversible choice. IDs D1…D16; nothing here is in the known-divergences list.

**D1. GPA hero: white card or the prototype's jade hero?** Ours is a white card with a progress ring (it follows the dashboard card style). The prototype has a jade gradient card, a coloured dot on the mention, and a thin credits bar instead of a ring. (a) keep ours, (b) the prototype's jade hero, (c) jade, but keep the ring. Default: (a), no change.

**D2. "Historique GPA" card.** The prototype has a line chart of GPA per semester beside the hero. Ours has none. The real data exists (each semester's GPA is already loaded for the tabs), so it would not be invented points. (a) leave out, (b) build it from the real semester GPAs, as a small card or a chart in the hero. Default: (a). Choosing (b) is new scope, not a fix. If (b): where does a semester with no GPA go (gap, or skipped)?

**D3. "Exporter PDF" button.** In the prototype, not in ours; the PWA has no PDF export. (a) leave it out, as with the schedule's print button, (b) build a real export later, (c) show a disabled button. Default: (a). If you want (a) written down, I will propose a row for the known-divergences file.

**D4. "Calculer" button.** The prototype has one; ours updates the result as you type (Interaction Spec §9, 150 ms), so the two cannot both be right. Ours drops the button on purpose (see the comment in `GradeCalculator.tsx`). (a) keep live, no button, and add a divergence row, (b) add the button as well. Default: (a).

**D5. Status wording and thresholds.** Prototype: "VALIDÉ / LIMITE / RISQUE", decided by the final mark (yellow "limite" band under the pass mark, red below). Ours: "Validée / En attente / Non validée" from what the server sends (validated, not yet published, failed), with no yellow band. These are different rules, not a style difference. (a) keep ours, (b) switch to the prototype's three levels and wording. Default: (a). Size and upper-case of the pill are fixed in F5 either way.

**D6. Colour per subject in the table.** The prototype's table and cards have no subject colour. The app's 12-colour palette exists. (a) none, as the prototype, (b) a coloured dot or rail per subject, as on Planning. Default: (a).

**D7. Extras on the phone cards.** The prototype's cards have a four-cell strip (CC, CF, Coef, NF), a thin coloured progress bar, and, for a failing subject, a "Sous la moyenne" warning line. Ours has a plain 3×2 grid with Code and Credits as well. (a) keep ours, (b) add the strip and the bar (all fields stay), (c) also the warning line (needs a French and an Arabic string; I did not check that one exists). Default: (a).

**D8. Many semesters on a phone.** With 6+ semesters the strip is wider than a 400px screen (5 semesters already fill 309 of 352). The plan scrolls the strip sideways inside its own box. (a) agree, (b) wrap to two lines, (c) a drop-down instead past five. Default: (a).

**D9. Only one semester.** Ours shows a one-button strip, which does nothing. (a) hide the strip when there is one semester, (b) keep it. Default: (a). It is a dead control; I listed it here only because it removes an element.

**D10. Table at tablet width (640 to 1023).** With 8 columns the table needs about 990px, the card is 662 at 800. It scrolls sideways inside the card, with nothing telling the student. The prototype's 7-column table fits (622). (a) keep the scroll and add a fade on the edge, (b) hide the Code column at this width (the field stays on the phone card and in the course panel), (c) shrink padding until it fits. Default: (a).

**D11. Numbers in the table, hero and calculator.** The prototype sets them in DM Mono (hero 42/500, cells 13.5 mono). Ours uses Plus Jakarta (hero 40/800). (a) keep Plus Jakarta, as everywhere else in the PWA, (b) DM Mono here as the prototype. Default: (a), and a divergence row.

**D12. Hero on a phone.** At 400 the ring sits alone in its own row above the text; the card is 282.8 tall (prototype 188) and the right 200px of that row is empty. (a) keep, (b) ring beside the text at about 72px. Default: (a).

**D13. "non publiée" repeated.** In a semester with nothing published the table shows the phrase 15 times and "En attente" 5 times (12 in a CC-only semester). Decision 6 forces the wording. (a) keep it per cell, (b) one line under the hero, and "—" in the cells (needs no new text, but "—" is a change of meaning). Default: (a).

**D14. Calculator panel chrome (shared with Planning and Presence).** `SlidePanel` is 420 wide (prototype 400), title 17/700 (prototype 20/800), subtitle 12.5 (13.5), close button 36×36 square-ish with no fill (34 round, filled), body padding 20 (18 22). Fixing it changes two other screens. (a) leave, (b) separate follow-up for all three. Default: (a).

**D15. Proposed rows for `.claude/design-known-divergences.md`** (I cannot edit that file; you or Lead can). Differences I kept on purpose, with reasons:
1. Table headers and panel labels use `--ink2`; the prototype uses `--ink3` (`css/app.css` `.data-table th`, `.dp-section-lbl`). `--ink3` is under AA and reserved for non-text (CLAUDE.md).
2. Sort buttons and semester options keep a 44px hit area (header 44.5 tall vs 34.5): touch target.
3. "Non validée" pill uses `--danger-ink`; the prototype `--danger` (`.pill-lvl-risque`), same reason as the existing "Événement" row.
4. Extra copy not in the prototype: the table legend, the calculator note and hint.
5. No "Calculer" button (D4) and no "Exporter PDF" (D3), if you choose those answers.
Say yes and Lead adds them. Default: add all five.

**D16. Words that differ from the prototype** (copy, so not changed without you): hero label "Moyenne du semestre" vs "Moyenne générale · S1"; "Assez bien" vs "Assez Bien"; credits "22 / 33 crédits validés" vs "Crédits : 23/23"; column "Finale" vs "NF", "Coef." vs "Coef"; an extra "Code" column; column order (Code, Coef., Crédits before CC, CF) vs (CC, CF, NF, Coef, Crédits). (a) keep ours, (b) reorder columns as the prototype (no new text). Default: (a).
