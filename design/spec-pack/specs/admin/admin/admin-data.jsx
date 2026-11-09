/* global window */
/* ============ Unipocket Admin — DATA LAYER ============ */
/* Deterministic sample data. Same universe as the mobile app:
   Ahmed Omar (UDJ-2024-0432), Génie Informatique L3, the 8 subjects. */

/* ---- seeded RNG (mulberry32) ---- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260609);
const rand = (lo, hi) => lo + rng() * (hi - lo);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const round05 = (n) => Math.max(0, Math.min(20, Math.round(n * 2) / 2));

/* ---- subjects (8, matching the app) ---- */
const SUBJECTS = [
  { id: 'INF301', name: 'Algorithmique avancée',        coef: 4, sem: 1, prof: 'Pr. Hassan Robleh',   room: 'Salle C12' },
  { id: 'INF201', name: 'Bases de données',             coef: 3, sem: 1, prof: 'Dr. Safia Mohamed',   room: 'Labo Info 1' },
  { id: 'MAT202', name: 'Mathématiques générales L2',   coef: 4, sem: 1, prof: 'Pr. Abdi Farah',      room: 'Salle A05' },
  { id: 'PHY305', name: 'Physique quantique',           coef: 3, sem: 1, prof: 'Pr. Moussa Ali',      room: 'Salle D04' },
  { id: 'INF303', name: 'Réseaux informatiques',        coef: 3, sem: 2, prof: 'Dr. Omar Hassan',     room: 'Labo Info 2' },
  { id: 'INF304', name: "Systèmes d'exploitation",      coef: 3, sem: 2, prof: 'Dr. Youssouf Ahmed',  room: 'Amphi A1' },
  { id: 'ANG110', name: 'Anglais technique',            coef: 1, sem: 2, prof: 'Mrs. Amina Aden',     room: 'Salle B08' },
  { id: 'STA201', name: 'Statistiques L2',              coef: 2, sem: 2, prof: 'Pr. Ibrahim Djama',   room: 'Salle B08' },
];

/* ---- student names (Djibouti — FR-speaking) ---- */
const FIRST_M = ['Ahmed', 'Ibrahim', 'Mohamed', 'Youssouf', 'Abdi', 'Said', 'Omar', 'Hamse', 'Bilal', 'Guled', 'Yacin', 'Liban', 'Mukhtar', 'Mahdi', 'Ismael', 'Daher', 'Souleiman', 'Abdourahman', 'Farhan', 'Abdoulkader'];
const FIRST_F = ['Fatouma', 'Khadija', 'Amina', 'Hawa', 'Asma', 'Nima', 'Roda', 'Sagal', 'Idil', 'Maryam', 'Deka', 'Nasra', 'Houda', 'Sahra', 'Ayan', 'Zeinab', 'Halima', 'Kaltoun', 'Naima', 'Filsan', 'Warsan', 'Hodan'];
const LAST = ['Omar', 'Hassan', 'Daoud', 'Ali', 'Farah', 'Aden', 'Robleh', 'Mahamoud', 'Ismael', 'Moussa', 'Abdallah', 'Guelleh', 'Warsama', 'Osman', 'Houmed', 'Kamil', 'Mahdi', 'Saleh', 'Bouh', 'Egal', 'Awaleh', 'Ibrahim', 'Waiss', 'Cheik', 'Dini', 'Abdi', 'Hersi', 'Yacub', 'Said', 'Jama', 'Egeh', 'Hama'];

const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/* ---- build 42 students ---- */
const N = 42;
const STUDENTS = [];
const usedNames = new Set();
for (let i = 0; i < N; i++) {
  let first, last, name, sex;
  if (i === 0) { name = 'Ahmed Omar'; first = 'Ahmed'; last = 'Omar'; sex = 'm'; }
  else {
    do {
      sex = rng() < 0.5 ? 'm' : 'f';
      first = pick(sex === 'm' ? FIRST_M : FIRST_F);
      last = pick(LAST);
      name = first + ' ' + last;
    } while (usedNames.has(name) || name === 'Ahmed Omar');
  }
  usedNames.add(name);
  const id = i === 0 ? 'UDJ-2024-0432' : 'UDJ-2024-0' + String(401 + i).padStart(3, '0');
  const ability = i === 0 ? 12.2 : rand(6.5, 17.5);   // baseline academic level
  const presence = i === 0 ? 87 : Math.round(rand(58, 100));
  STUDENTS.push({
    idx: i, id, name, sex, initials: initials(name),
    programme: 'Génie Informatique', programmeShort: 'Génie Info.', year: 'L3',
    faculty: 'Sciences et Tech.',
    email: (first + '.' + last).toLowerCase().replace(/[^a-z.]/g, '') + '@univ.dj',
    phone: '+253 77 ' + Math.floor(rand(10, 99)) + ' ' + Math.floor(rand(10, 99)) + ' ' + Math.floor(rand(10, 99)),
    ability, presence,
    _status: 'active',
  });
}

/* ---- gradebook: per student × subject {cc, cf} ---- */
const AHMED = {
  INF301: { cc: 14, cf: 15.5 }, INF201: { cc: 12, cf: 13 }, MAT202: { cc: 13, cf: 15 }, PHY305: { cc: 8, cf: 7 },
  INF303: { cc: 15, cf: 14 }, INF304: { cc: 11, cf: 12.5 }, ANG110: { cc: 16, cf: 15 }, STA201: { cc: 9, cf: 8.5 },
};
const NF = (cc, cf) => (cc == null || cf == null) ? null : 0.4 * cc + 0.6 * cf;

const GRADEBOOK = {};   // GRADEBOOK[studentIdx][subjectId] = {cc, cf}
STUDENTS.forEach((s) => {
  GRADEBOOK[s.idx] = {};
  SUBJECTS.forEach((subj) => {
    if (s.idx === 0) { GRADEBOOK[0][subj.id] = { ...AHMED[subj.id] }; return; }
    const cc = round05(s.ability + rand(-3, 3));
    let cf = round05(s.ability + rand(-3.5, 3.5));
    // INF304 (Systèmes d'exploitation) = entry in progress: ~45% of CF not yet entered
    if (subj.id === 'INF304' && rng() < 0.45) cf = null;
    GRADEBOOK[s.idx][subj.id] = { cc, cf };
  });
});

/* per-student computed academics */
STUDENTS.forEach((s) => {
  let wsum = 0, csum = 0;
  SUBJECTS.forEach((subj) => {
    const g = GRADEBOOK[s.idx][subj.id];
    const nf = NF(g.cc, g.cf);
    if (nf != null) { wsum += nf * subj.coef; csum += subj.coef; }
  });
  s.gpa = csum ? wsum / csum : 0;
  s.credits = Math.round((s.gpa >= 10 ? 1 : s.gpa / 10) * 32);
  s.status = s.idx !== 0 && rng() < 0.05 ? 'suspended'
    : (s.gpa < 10 || s.presence < 75) ? 'risk' : 'active';
});
STUDENTS[0].status = 'active';

/* subject-level entry progress (for grade page) */
const SUBJECT_PROGRESS = {};
SUBJECTS.forEach((subj) => {
  let entered = 0;
  STUDENTS.forEach((s) => { if (GRADEBOOK[s.idx][subj.id].cf != null) entered++; });
  SUBJECT_PROGRESS[subj.id] = { entered, total: N, published: subj.id !== 'INF304' };
});

/* grade lifecycle stage per subject (UX Architecture §3.5) — seeds all 7 stages.
   stage>=4 ⇒ CC publié ; stage>=7 ⇒ NF publié (used for entry-table lock). */
const SUBJECT_STAGE = {
  INF301: 7, INF201: 2, MAT202: 4, PHY305: 1,   // S1
  INF303: 3, INF304: 5, ANG110: 6, STA201: 4,   // S2
};

/* ---- attendance: per student × subject ---- */
const ATT_SUBJECTS = [
  { id: 'INF301', name: 'Algorithmique avancée', sessions: 20 },
  { id: 'STA201', name: 'Statistiques L2', sessions: 20 },
  { id: 'PHY305', name: 'Physique quantique', sessions: 18 },
  { id: 'ANG110', name: 'Anglais technique', sessions: 12 },
];

/* ---- programme-level attendance overview (UX Architecture §4.7) ---- */
/* hours-based class average; "at risk" = below 75% threshold */
const ATT_OVERVIEW = [
  { id: 'INF301', name: 'Algorithmique avancée', done: 12, total: 16, avg: 82, risk: 3 },
  { id: 'STA201', name: 'Statistiques L2',        done: 11, total: 16, avg: 79, risk: 5 },
  { id: 'PHY305', name: 'Physique quantique',     done: 14, total: 18, avg: 68, risk: 11 },
  { id: 'ANG110', name: 'Anglais technique',      done: 10, total: 12, avg: 88, risk: 1 },
];

/* ---- pending justifications queue ---- */
const REASONS = [
  { label: 'Certificat médical', doc: 'PDF', icon: 'file' },
  { label: 'Convocation administrative', doc: 'PDF', icon: 'file' },
  { label: 'Urgence familiale', doc: 'Photo', icon: 'image' },
  { label: 'Transport / grève', doc: 'PDF', icon: 'file' },
];
const JUST_STATUS = ['pending', 'pending', 'pending', 'pending', 'approved', 'rejected'];
const JUSTIFICATIONS = [];
const dates = ['3 juin', '3 juin', '2 juin', '2 juin', '1 juin', '31 mai', '30 mai', '29 mai', '28 mai', '27 mai'];
for (let i = 0; i < 14; i++) {
  const s = STUDENTS[1 + Math.floor(rng() * (N - 1))];
  const subj = pick(ATT_SUBJECTS);
  const reason = pick(REASONS);
  JUSTIFICATIONS.push({
    id: 'JST-' + (1040 + i),
    student: s, subject: subj.name, subjectId: subj.id,
    absenceDate: pick(['28 mai', '29 mai', '30 mai', '31 mai', '1 juin', '2 juin']),
    submitted: dates[i % dates.length],
    reason: reason.label, docType: reason.doc, docIcon: reason.icon,
    note: pick([
      'Consultation médicale, certificat joint.',
      'Convoqué au service de la scolarité.',
      'Problème de transport ce matin.',
      'Rendez-vous médical de contrôle.',
      'Urgence familiale, justificatif fourni.',
    ]),
    status: i < 9 ? 'pending' : JUST_STATUS[i % JUST_STATUS.length],
  });
}

/* ---- news (reuse the app's 6 articles + a couple drafts) ---- */
const NEWS = [
  { id: 1, cat: 'official', urgent: true, status: 'published', title: 'Inscriptions 2025 ouvertes', source: 'Service Communication', date: '1 juin 2026', time: '12:24', views: 1284, read: '3 min', body: "Les inscriptions pour l'année universitaire 2025–2026 sont ouvertes du 1er au 30 juillet. Rendez-vous au bureau de la scolarité avec votre dossier complet." },
  { id: 2, cat: 'events', status: 'published', title: 'Journée portes ouvertes — Samedi 24 mai', source: 'Vie étudiante', date: '20 mai 2026', time: '09:00', views: 842, read: '2 min', body: "L'université ouvre ses portes au public ce samedi. Visites des laboratoires, rencontres avec les enseignants et démonstrations des clubs étudiants de 9h à 16h." },
  { id: 3, cat: 'scolarite', urgent: true, status: 'published', title: 'Calendrier des examens S2 publié', source: 'Scolarité', date: '17 mai 2026', time: '14:30', views: 2103, read: '2 min', body: 'Le calendrier des examens du second semestre est désormais disponible. Consultez les dates et les salles affectées à chaque épreuve sur le portail étudiant.' },
  { id: 4, cat: 'sport', status: 'published', title: 'Tournoi inter-facultés de football', source: 'Club Sport', date: '10 mai 2026', time: '17:00', views: 561, read: '2 min', body: "Le grand tournoi inter-facultés revient ! Inscriptions des équipes jusqu'au 20 mai. Première journée le 25 mai au stade du campus." },
  { id: 5, cat: 'jeunesse', status: 'draft', title: 'Hackathon étudiant : inscrivez votre équipe', source: 'Club Tech', date: '5 mai 2026', time: '11:00', views: 0, read: '4 min', body: '48 heures pour concevoir une solution numérique au service du campus. Équipes de 3 à 5 personnes. Prix pour les trois meilleures équipes.' },
  { id: 6, cat: 'sponsors', urgent: true, status: 'published', title: 'Programme de bourses Orange Djibouti', source: 'Partenariats', date: '1 mai 2026', time: '10:00', views: 1487, read: '3 min', body: 'Orange Djibouti lance un programme de bourses pour les étudiants en informatique et télécommunications. Dépôt des candidatures avant le 15 juin.' },
  { id: 7, cat: 'scolarite', status: 'draft', title: 'Nouvelles modalités de stage L3', source: 'Scolarité', date: '28 avril 2026', time: '16:10', views: 0, read: '3 min', body: 'Les conventions de stage doivent désormais être déposées en ligne. La procédure complète sera communiquée prochainement.' },
];

const NEWS_CATS = [
  { id: 'official', label: 'Officiel' }, { id: 'events', label: 'Événements' },
  { id: 'scolarite', label: 'Scolarité' }, { id: 'sport', label: 'Sport' },
  { id: 'jeunesse', label: 'Jeunesse' }, { id: 'sponsors', label: 'Sponsors' }, { id: 'general', label: 'Général' },
];

/* ---- recent activity (audit log) ---- */
const ACTIVITY = [
  { who: 'Vous', role: 'REGISTRAR', action: 'a publié les notes de', target: 'Physique quantique · S1', kind: 'grade', when: 'Il y a 12 min' },
  { who: 'F. Robleh', role: 'NEWS_EDITOR', action: 'a publié un article', target: 'Inscriptions 2025 ouvertes', kind: 'news', when: 'Il y a 1 h' },
  { who: 'Vous', role: 'REGISTRAR', action: 'a validé un justificatif de', target: 'Khadija Ali', kind: 'attendance', when: 'Il y a 2 h' },
  { who: 'S. Mohamed', role: 'FACULTY_ADMIN', action: 'a modifié le profil de', target: 'Ibrahim Daoud', kind: 'student', when: 'Il y a 3 h' },
  { who: 'Vous', role: 'REGISTRAR', action: 'a saisi 42 notes pour', target: 'Algorithmique avancée', kind: 'grade', when: 'Hier · 16:40' },
  { who: 'A. Farah', role: 'FACULTY_ADMIN', action: 'a rejeté un justificatif de', target: 'Mahdi Omar', kind: 'attendance', when: 'Hier · 14:05' },
  { who: 'Système', role: 'SYSTEM', action: 'a envoyé une notification push à', target: '2 480 étudiants', kind: 'notif', when: 'Hier · 09:12' },
];

/* ---- dashboard aggregates ---- */
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const DASHBOARD = {
  totalStudents: N,
  avgPresence: Math.round(avg(STUDENTS.map((s) => s.presence))),
  avgGpa: avg(STUDENTS.map((s) => s.gpa)),
  pendingJust: JUSTIFICATIONS.filter((j) => j.status === 'pending').length,
  atRisk: STUDENTS.filter((s) => s.status === 'risk').length,
  // GPA distribution buckets
  gpaDist: [
    { label: '<10', range: [0, 10] }, { label: '10–12', range: [10, 12] },
    { label: '12–14', range: [12, 14] }, { label: '14–16', range: [14, 16] }, { label: '16+', range: [16, 21] },
  ].map((b) => ({ ...b, count: STUDENTS.filter((s) => s.gpa >= b.range[0] && s.gpa < b.range[1]).length })),
  // presence trend (last 8 weeks)
  presenceTrend: [82, 85, 84, 88, 86, 89, 87, 87],
};

window.ADMIN_DATA = {
  SUBJECTS, STUDENTS, GRADEBOOK, NF, SUBJECT_PROGRESS, SUBJECT_STAGE,
  ATT_SUBJECTS, ATT_OVERVIEW, JUSTIFICATIONS, NEWS, NEWS_CATS, ACTIVITY, DASHBOARD,
  ATT_THRESHOLD: 75, JUSTIFICATION_DEADLINE_DAYS: 8,
};
