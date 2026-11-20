# ASK — for Islam. Nothing here is changed until he answers.

Ranked, most important first. The first five go in the report's "Needs your decision" with a recommendation. The rest are "smaller decisions for later". If something fit both lists it is here, per the rules. Wording is plain on purpose, so the Lead can lift it.

## Top five

**A1. How a subject is judged (the coloured status).** The prototype says Validé, Limite or Risque from the final mark, with a yellow in-between. Ours says Validée, En attente or Non validée from what the faculty published, with no yellow. Options: (a) keep ours, (b) switch to the prototype's three levels and words. Recommend (a): ours follows what the faculty really decided, and the prototype's rule would show a "validated" label the faculty has not given.

**A2. The look of the average card.** The prototype's is a green card with white text and a thin credits bar. Ours is a white card with a progress ring, in the same style as the dashboard. Options: (a) keep ours, (b) the prototype's green card, (c) green card and keep the ring. Recommend (a): it matches the dashboard and Planning; the ring says the same thing the bar does.

**Decided 2026-11-20: (b), by Islam.** The green hero replaced the ring card on Notes (branch feature/pwa-grades-hero). Where it departs from Design's colours, and why, is in `.claude/design-known-divergences.md`.

**A3. The "Historique GPA" chart.** The prototype shows a small line chart of the average per semester. Ours has none. The real averages per semester are already loaded for the tabs, so nothing would be invented. Options: (a) leave it out, (b) build it from the real semester averages. Recommend (a) for now: it is new scope and needs a decision on semesters with no average.

**Decided 2026-11-20: (b), by Islam.** Built from the real semester averages. A semester with no published average gets no dot and breaks the line; one semester is a single dot; none is a sentence. The chart has a text alternative (feature/pwa-grades-hero).

**A4. The "Exporter PDF" button.** The prototype has it; the PWA cannot export a PDF. Options: (a) leave it out, as the schedule's print button was, (b) build a real export later, (c) show a button that is switched off. Recommend (a): a button that promises something missing misleads.

**Decided 2026-11-20: (b), by Islam, built now.** Exporter PDF opens the browser's print dialog on a one-page report of the selected semester; no dependency (feature/pwa-grades-hero).

**A5. The "Calculer" button in the calculator.** The prototype has one. Ours updates the result as the student types (the interaction spec, section 9), which makes the button unnecessary. Options: (a) keep it live, no button, (b) add the button too. Recommend (a): the spec asks for it and the result is never out of date.

## Smaller decisions for later

**A6. Extras on the phone cards.** The prototype's cards add a strip (CC, CF, Coef, NF), a thin coloured bar, and for a failing subject a "Sous la moyenne" line. Ours is a plain grid that also shows Code and Credits. Options: (a) keep ours, (b) add the strip and the bar, (c) also the warning line (needs French and Arabic text I have not checked exists). Recommend (a): nothing is missing from ours.

**A7. Colour per subject in the table.** The prototype has none here. Options: (a) none, (b) a small colour mark per subject as on Planning. Recommend (a): the prototype is silent and Planning's colours mean a time slot.

**A8. Many semesters on a phone.** Five semesters already fill 309 of 352 pixels; six or more do not fit. Options: (a) scroll the strip sideways inside its box (the plan), (b) wrap to two lines, (c) a drop-down past five. Recommend (a): simplest, and nothing is hidden.

**A9. Only one semester.** The one-button strip does nothing. Options: (a) hide the strip, (b) keep it. Recommend (a): a button that does nothing is a fault, but hiding removes an element, so you decide.

**A10. The table on a tablet (640 to 1023 wide).** With 8 columns the table needs about 990px and the card is 662 wide at 800, so it scrolls sideways with no hint. Options: (a) keep the scroll and add an edge fade, (b) hide the Code column at this width (the field stays on the phone card), (c) squeeze the columns. Recommend (a): keeps every column.

**A11. State cards: padding 24 or 20.** The standing rule says cards use 20px padding. The error, empty and offline boxes on Notes and on Planning both use 24, and a 15px title. They agree with each other. Options: (a) leave both at 24, (b) change both to 20 (touches Planning, out of this job's scope). Recommend (a): consistent today.

**A12. Numbers in DM Mono or Plus Jakarta.** The prototype sets grades and the average in a monospaced face. The PWA uses Plus Jakarta everywhere, the dashboard included. Options: (a) keep Plus Jakarta, (b) mono on this screen only. Recommend (a): consistent with the dashboard.

**A13. The ring on a phone.** At 400 wide the ring sits alone on its row above the text; the card is 283 tall (prototype 188) and half of that row is empty. Options: (a) keep, (b) ring beside the text, smaller. Recommend (b) if you like it tighter; it is purely a look choice.

**A14. "non publiée" repeated.** In a semester with nothing published the phrase shows 15 times, and "En attente" 5 times. The standing rule forces the wording. Options: (a) keep it per cell, (b) say it once under the average and show "—" in the cells ("—" changes the meaning slightly). Recommend (a): each cell stays understandable alone.

**A15. The calculator panel's frame (shared with Planning and Présence).** Its width is 420 (prototype 400), title 17/700 (20/800), close button square-ish and unfilled (round and filled), body padding 20 (18 and 22). Changing it changes two other screens, outside this job's files. Options: (a) leave, (b) one follow-up for all three screens. Recommend (b) later: do it once, everywhere.

**A16. Words that differ from the prototype.** Hero label "Moyenne du semestre" vs "Moyenne générale · S1"; "Assez bien" vs "Assez Bien"; "22 / 33 crédits validés" vs "Crédits : 23/23"; column "Finale" vs "NF", "Coef." vs "Coef"; an extra "Code" column; column order. Options: (a) keep ours, (b) copy the prototype's words and order. Recommend (a): the build's words are already reviewed, and Code is a real field.

**A17. Form borders are faint.** The calculator's select and input have a 1px border at about 1.4:1 against the white, under the 3:1 a control boundary should have. It is the PWA's shared border colour, the same on Planning, the dashboard and the prototype, so fixing it here alone would make Notes different. Options: (a) leave it, (b) darker border for all form fields in the PWA (a separate job). Recommend (b) as its own job.
