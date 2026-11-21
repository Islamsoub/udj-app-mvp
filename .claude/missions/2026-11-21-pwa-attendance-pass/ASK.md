# ASK — for Islam. Nothing here is changed until he answers.

Ranked, most important first. The first five are the "Needs your decision" of the report. If something fit both lists it is here. Plain words on purpose.

## Top five

**A1. A refused justification cannot be sent again.** The prototype shows a new upload form under "Justificatif rejeté". Ours shows the refusal, the reason and the document, and nothing to act on, yet a refused absence still sits under "À justifier" while its deadline is open, because the screen treats it as actionable. Options: (a) allow a new upload on a refused absence (the server's own rule, "absent and inside the deadline", appears to accept it; to be confirmed with the backend), (b) keep it read-only and take refused absences out of "À justifier", (c) leave as is. Recommend (a): the list already promises an action, and the student otherwise has no way to fix a refused file.

**A2. The band colour on the green hero.** On the green hero the amber and red of the ring and the threshold line cannot reach readable contrast with any existing colour. The plan keeps the band in words and icon (for example "marge faible", the warning icon). Options: (a) words and icon only, ring in white, (b) add a small pale chip in the hero for near and below (needs one or two new colour variables), (c) keep the white hero. Recommend (a): it keeps the dashboard's hero look and adds nothing new; the words already say it.

**A3. A real "0%" for missing data comes from the server.** When no session hours can be worked out, the server sends a subject's percentage as 0, and the PWA cannot tell that from a true 0 (`backend/src/routes/student.ts:696`). The screen then shows "0%" and the red band for something that is simply unknown. Options: (a) leave it, (b) a backend change so the server sends null and the PWA shows nothing, as it does for "absences left". Recommend (b) as its own backend task: it is the only honest fix, and the PWA side is already written for null elsewhere.

**A4. "Par matière": table or bars.** The prototype shows a table (Matière, Présences, Taux, Absences restantes) and, below 640 wide, shows nothing at all (its table is hidden and its cards never switched on, so the card is empty at 400). Ours shows a bar per subject with the code, a threshold mark and an "Encore n absences" flag. Options: (a) keep the bars, (b) table on wide screens and the bars on a phone, (c) table only. Recommend (a): nothing is lost, it works at every width, and the prototype has no phone version to copy.

**A5. Which filter opens first.** The prototype opens on "À justifier" (the actions); ours opens on "Tout". Options: (a) keep "Tout", (b) open on "À justifier". Recommend (b): the screen's job is to act on absences, and the count line still shows how many there are in total.

## Smaller decisions for later

**A6. Hero extras from the prototype.** A status word ("Régulier"), three counts (Validées, Limite, À risque) and the label "Taux de présence". The PWA has none of these and no words for them (the status words are the dashboard's, standing decision 8). Options: (a) none, (b) add the counts with existing words. Recommend (a).

**A7. The date tile.** The prototype puts each absence's date in a 46×55 tile (day and month) at the start of the row. Ours has a status icon and a date line under the subject. Options: (a) keep ours, (b) the tile. Recommend (a): the icon says the status, which the tile cannot.

**A8. Quick reasons and the note.** The prototype has three quick-reason chips and an 80-pixel note area. Ours has a single-line optional reason (80 characters) and no chips. Options: (a) keep ours, (b) add the chips (new words, French and Arabic). Recommend (a).

**A9. State boxes: padding 24 or 20.** Standing decision 4 says 20. The error, offline and "nothing recorded" boxes here, on Notes and on Planning all use 24 and a 15px title, so they agree. Options: (a) leave all at 24, (b) change all three screens to 20. Recommend (a): consistent today; same question as Notes A11.

**A10. The panel's frame (shared with Planning and Notes).** The prototype puts the subject as the title and the date as the subtitle, and fixes "Envoyer" in a footer. Ours puts the date as a line in the body and the button under the form; the frame is 420 wide (prototype 400), title 17/700 (20/800). Options: (a) leave, (b) one follow-up for all screens that use it. Recommend (b) later.

**A11. Words that differ.** "Présence ce semestre" vs "Taux de présence"; "Absences" vs "Mes absences"; chips "Justifiée / Refusée / Délai dépassé" vs "Approuvée / Rejetée". Options: (a) keep ours, (b) copy the prototype. Recommend (a): the build's words are the reviewed ones.

**A12. Faint form borders.** The note field and the file drop area have a 1px border at about 1.4:1, under the 3:1 a control boundary should have. It is the PWA's shared border colour, as on Planning and Notes (Notes A17). Options: (a) leave, (b) a darker border for all fields, as a separate job. Recommend (b) later.

**A13. Numerals in a mono face.** The prototype sets numbers in DM Mono; the PWA uses Plus Jakarta everywhere (same as Notes A12). Options: (a) keep, (b) mono here. Recommend (a).
