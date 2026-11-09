/* global window */
/* ============ Unipocket Admin — DATA LAYER 2 ============ */
/* Academics, schedule, admin users, audit log, notification history. */

/* course colours (from the mobile app) */
const COURSE = ['#6366F1', '#2F7DD1', '#1E94C4', '#119A8B', '#2E9E5B', '#6B9A2E', '#D9821A', '#E2673A', '#E0556A', '#D6519E', '#7C53E0', '#5A6B7B'];

/* ---- faculties ---- */
const FACULTIES = [
  { id: 'FST', name: 'Sciences et Technologies', short: 'FST', dean: 'Pr. Abdi Farah', programmes: 6, students: 1240 },
  { id: 'FDEG', name: 'Droit, Économie & Gestion', short: 'FDEG', dean: 'Pr. Hawa Mahamoud', programmes: 5, students: 1685 },
  { id: 'FLSH', name: 'Lettres & Sciences Humaines', short: 'FLSH', dean: 'Pr. Omar Guelleh', programmes: 4, students: 980 },
  { id: 'FM', name: 'Médecine', short: 'FM', dean: 'Pr. Safia Mohamed', programmes: 3, students: 620 },
  { id: 'IST', name: 'Institut Sup. d\'Ingénieurs', short: 'IST', dean: 'Pr. Hassan Robleh', programmes: 4, students: 540 },
];

/* ---- programmes ---- */
const PROGRAMMES = [
  { id: 'GINF', name: 'Génie Informatique', faculty: 'FST', levels: 'L1–L3 · M1–M2', students: 312, current: true },
  { id: 'GCIV', name: 'Génie Civil', faculty: 'FST', levels: 'L1–L3', students: 248 },
  { id: 'GELE', name: 'Génie Électrique', faculty: 'FST', levels: 'L1–L3', students: 196 },
  { id: 'MATH', name: 'Mathématiques', faculty: 'FST', levels: 'L1–L3 · M1', students: 142 },
  { id: 'PHCH', name: 'Physique-Chimie', faculty: 'FST', levels: 'L1–L3', students: 168 },
  { id: 'GEST', name: 'Gestion des entreprises', faculty: 'FDEG', levels: 'L1–L3 · M1–M2', students: 420 },
  { id: 'DROI', name: 'Droit public', faculty: 'FDEG', levels: 'L1–L3', students: 380 },
  { id: 'LANG', name: 'Langues étrangères', faculty: 'FLSH', levels: 'L1–L3', students: 290 },
  { id: 'MEDG', name: 'Médecine générale', faculty: 'FM', levels: 'Année 1–6', students: 620 },
];

/* ---- semesters ---- */
const SEMESTERS = [
  { id: 'S2-2526', label: 'Semestre 2', year: '2025–2026', start: '3 fév. 2026', end: '20 juin 2026', status: 'current' },
  { id: 'S1-2526', label: 'Semestre 1', year: '2025–2026', start: '15 sept. 2025', end: '23 janv. 2026', status: 'closed' },
  { id: 'S2-2425', label: 'Semestre 2', year: '2024–2025', start: '5 fév. 2025', end: '21 juin 2025', status: 'archived' },
  { id: 'S1-2425', label: 'Semestre 1', year: '2024–2025', start: '16 sept. 2024', end: '24 janv. 2025', status: 'archived' },
];

/* ---- weekly schedule (Génie Informatique L3) — Djibouti week Dim–Jeu ---- */
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'];
const SCHEDULE = [
  { day: 0, start: '09:00', end: '10:30', subjectId: 'ANG110', name: 'Anglais technique', prof: 'Mrs. Amina Aden', room: 'Salle B08', c: 6 },
  { day: 0, start: '11:00', end: '12:30', subjectId: 'INF301', name: 'Algorithmique avancée', prof: 'Pr. Hassan Robleh', room: 'Salle C12', c: 10 },
  { day: 1, start: '08:00', end: '09:30', subjectId: 'STA201', name: 'Statistiques L2', prof: 'Pr. Ibrahim Djama', room: 'Salle B08', c: 1 },
  { day: 1, start: '10:00', end: '11:30', subjectId: 'INF304', name: "Systèmes d'exploitation", prof: 'Dr. Youssouf Ahmed', room: 'Amphi A1', c: 4 },
  { day: 1, start: '14:00', end: '15:30', subjectId: 'INF201', name: 'Bases de données', prof: 'Dr. Safia Mohamed', room: 'Labo Info 1', c: 2 },
  { day: 3, start: '08:00', end: '10:00', subjectId: 'INF201', name: 'Bases de données', prof: 'Dr. Safia Mohamed', room: 'Labo Info 1', c: 2 },
  { day: 3, start: '10:30', end: '12:00', subjectId: 'MAT202', name: 'Mathématiques générales L2', prof: 'Pr. Abdi Farah', room: 'Salle A05', c: 5 },
  { day: 3, start: '14:00', end: '15:30', subjectId: 'PHY305', name: 'Physique quantique', prof: 'Pr. Moussa Ali', room: 'Salle D04', c: 0 },
  { day: 4, start: '08:00', end: '09:30', subjectId: 'INF303', name: 'Réseaux informatiques', prof: 'Dr. Omar Hassan', room: 'Labo Info 2', c: 3 },
  { day: 4, start: '10:00', end: '11:30', subjectId: 'INF304', name: "Systèmes d'exploitation", prof: 'Dr. Youssouf Ahmed', room: 'Amphi A1', c: 4 },
  { day: 4, start: '13:00', end: '14:30', subjectId: 'STA201', name: 'Statistiques L2', prof: 'Pr. Ibrahim Djama', room: 'Salle B08', c: 1 },
];

/* ---- cross-programme schedule (UX Architecture §5.1 — par salle / par enseignant) ---- */
/* GINF L3 sessions + a handful from other programmes that share rooms/slots,
   deliberately creating room + teacher conflicts to demonstrate detection. */
const ALL_SCHEDULE = [
  ...SCHEDULE.map((s) => ({ ...s, programme: 'Génie Info. L3' })),
  // Droit L2 — conflicts with INF301 in Salle C12 (Dim 11:00)
  { day: 0, start: '11:00', end: '12:30', name: 'Mathématiques générales', prof: 'Pr. Abdi Farah', room: 'Salle C12', c: 5, programme: 'Droit L2' },
  { day: 2, start: '09:00', end: '10:30', name: 'Droit constitutionnel', prof: 'Pr. Hawa Mahamoud', room: 'Amphi A1', c: 9, programme: 'Droit L2' },
  // Gestion L1 — conflicts with INF304 in Amphi A1 (Lun 10:00)
  { day: 1, start: '10:00', end: '11:00', name: 'Économie générale', prof: 'Dr. Omar Hassan', room: 'Amphi A1', c: 11, programme: 'Gestion L1' },
  { day: 3, start: '14:00', end: '15:30', name: 'Comptabilité', prof: 'Mrs. Amina Aden', room: 'Salle A05', c: 6, programme: 'Gestion L1' },
  // Génie Élec. L2 — Pr. Hassan Robleh double-booked Dim 11:00 (teacher conflict)
  { day: 0, start: '11:00', end: '12:00', name: 'Architecture des ordinateurs', prof: 'Pr. Hassan Robleh', room: 'Salle E01', c: 0, programme: 'Génie Élec. L2' },
  { day: 4, start: '08:00', end: '09:30', name: 'Électronique numérique', prof: 'Pr. Moussa Ali', room: 'Salle E01', c: 3, programme: 'Génie Élec. L2' },
];

/* ---- admin users ---- */
const ROLES = {
  SUPER_ADMIN: { label: 'Super Admin', tone: 'exam', desc: 'Accès complet · gère les administrateurs' },
  FACULTY_ADMIN: { label: 'Admin Faculté', tone: 'blue', desc: 'Emploi du temps, matières, présence' },
  REGISTRAR: { label: 'Scolarité', tone: 'jade', desc: 'Étudiants, notes, présence' },
  NEWS_EDITOR: { label: 'Éditeur', tone: 'amber', desc: 'Actualités et notifications' },
};
const ADMINS = [
  { id: 'A-01', name: 'Saïd Warsama', email: 'said.warsama@univ.dj', role: 'REGISTRAR', scope: 'Scolarité', active: true, last: "Aujourd'hui · 14:30", you: true },
  { id: 'A-02', name: 'Hassan Aden', email: 'hassan.aden@univ.dj', role: 'SUPER_ADMIN', scope: 'Direction', active: true, last: "Aujourd'hui · 09:12" },
  { id: 'A-03', name: 'Fatouma Robleh', email: 'fatouma.robleh@univ.dj', role: 'NEWS_EDITOR', scope: 'Communication', active: true, last: 'Hier · 17:48' },
  { id: 'A-04', name: 'Safia Mohamed', email: 'safia.mohamed@univ.dj', role: 'FACULTY_ADMIN', scope: 'Sciences et Tech.', active: true, last: 'Hier · 11:05' },
  { id: 'A-05', name: 'Abdi Farah', email: 'abdi.farah@univ.dj', role: 'FACULTY_ADMIN', scope: 'Sciences et Tech.', active: true, last: 'Il y a 3 j' },
  { id: 'A-06', name: 'Amina Ismael', email: 'amina.ismael@univ.dj', role: 'REGISTRAR', scope: 'Scolarité', active: false, last: 'Il y a 28 j' },
];

/* ---- audit log ---- */
const AUDIT_POOL = [
  ['grade.publish', 'Grade', 'Physique quantique · S1', 'Saïd Warsama'],
  ['grade.update', 'Grade', 'Ahmed Omar · INF301', 'Saïd Warsama'],
  ['grade.bulkCreate', 'Grade', 'Algorithmique avancée (42)', 'Saïd Warsama'],
  ['news.create', 'NewsArticle', 'Inscriptions 2025 ouvertes', 'Fatouma Robleh'],
  ['news.update', 'NewsArticle', 'Calendrier des examens S2', 'Fatouma Robleh'],
  ['news.delete', 'NewsArticle', 'Annonce test', 'Fatouma Robleh'],
  ['attendance.justification.approve', 'Justification', 'JST-1041 · Khadija Ali', 'Saïd Warsama'],
  ['attendance.justification.reject', 'Justification', 'JST-1048 · Mahdi Omar', 'Abdi Farah'],
  ['student.update', 'Student', 'Ibrahim Daoud', 'Safia Mohamed'],
  ['student.create', 'Student', 'UDJ-2024-0442', 'Saïd Warsama'],
  ['student.status', 'Student', 'Ayan Cheik → suspendu', 'Saïd Warsama'],
  ['student.resetPassword', 'Student', 'Sahra Egeh', 'Saïd Warsama'],
  ['schedule.create', 'ScheduleEntry', 'INF301 · Dim 11:00', 'Safia Mohamed'],
  ['schedule.delete', 'ScheduleEntry', 'PHY305 · Mer 16:00', 'Abdi Farah'],
  ['subject.create', 'Subject', 'INF305 · Sécurité', 'Abdi Farah'],
  ['notification.send', 'Notification', '2 480 étudiants', 'Système'],
  ['admin.create', 'Admin', 'Amina Ismael', 'Hassan Aden'],
  ['admin.update', 'Admin', 'Abdi Farah → FACULTY_ADMIN', 'Hassan Aden'],
  ['auth.login', 'Session', 'said.warsama@univ.dj', 'Saïd Warsama'],
];
const AUDIT = [];
const aWhen = ['12 min', '38 min', '1 h', '2 h', '3 h', '5 h', 'Hier 16:40', 'Hier 14:05', 'Hier 11:20', 'Hier 09:12', '2 j', '2 j', '3 j', '3 j', '4 j', '5 j', '6 j', '7 j', '8 j'];
for (let i = 0; i < AUDIT_POOL.length; i++) {
  const [action, entity, target, who] = AUDIT_POOL[i];
  AUDIT.push({
    id: 'LOG-' + (9100 - i), action, entity, target, who,
    when: aWhen[i] || (i + 2) + ' j',
    ip: '196.201.' + (((i * 37) % 254) + 1) + '.' + (((i * 91) % 254) + 1),
  });
}

/* ---- notification history ---- */
const NOTIF_HISTORY = [
  { id: 'N-01', title: 'Notes de Physique quantique disponibles', target: 'Génie Informatique L3', count: 42, when: 'Aujourd\'hui · 12:36', kind: 'notes' },
  { id: 'N-02', title: 'Inscriptions 2025 ouvertes', target: 'Tous les étudiants', count: 2480, when: 'Hier · 09:12', kind: 'news' },
  { id: 'N-03', title: 'Cours déplacé — Amphi A1', target: 'Génie Informatique L3', count: 42, when: 'Il y a 2 j', kind: 'agenda' },
  { id: 'N-04', title: 'Calendrier des examens S2 publié', target: 'Faculté Sciences et Tech.', count: 1240, when: 'Il y a 3 j', kind: 'news' },
  { id: 'N-05', title: 'Rappel : justificatifs d\'absence', target: 'Étudiants à risque', count: 22, when: 'Il y a 5 j', kind: 'presence' },
];

window.ADMIN_DATA2 = {
  COURSE, FACULTIES, PROGRAMMES, SEMESTERS, DAYS, DAYS_SHORT, SCHEDULE, ALL_SCHEDULE,
  ROLES, ADMINS, AUDIT, NOTIF_HISTORY,
};
