/* global React */
/* ============ UDJ polished prototype — CORE ============ */
/* Light/dark tokens, FR/AR strings, theme context, base primitives. */

const LIGHT = {
  mode: 'light',
  bg: '#F2F5F3', surface: '#FFFFFF', surface2: '#F4F7F5', sunken: '#ECEFEC',
  text1: '#1C2320', text2: '#6B7B74', text3: '#9EADA7',
  hair: 'rgba(28,35,32,0.07)', hair2: 'rgba(28,35,32,0.11)',
  jade: '#1D9E75', jade600: '#0F6E56', jade700: '#0B5544',
  jadeFaint: 'rgba(29,158,117,0.10)', jadeText: '#0F6E56',
  danger: '#EF4444', dangerBg: 'rgba(239,68,68,0.10)',
  amber: '#E08A1E', amberBg: 'rgba(224,138,30,0.12)',
  exam: '#8B5CF6', examBg: 'rgba(139,92,246,0.12)',
  blue: '#2F7DD1', blueBg: 'rgba(47,125,209,0.12)',
  slate: '#5A6B7B', slateBg: 'rgba(90,107,123,0.12)',
  toggleOff: '#D9D9D9',
  cardShadow: '0 2px 10px rgba(28,35,32,0.05), 0 1px 2px rgba(28,35,32,0.04)',
  cardShadowLg: '0 6px 18px rgba(28,35,32,0.08), 0 1px 3px rgba(28,35,32,0.05)',
  navShadow: '0 6px 22px rgba(15,110,86,0.16), 0 2px 6px rgba(0,0,0,0.06)',
  scrim: 'rgba(16,22,20,0.45)',
};
const DARK = {
  mode: 'dark',
  bg: '#0E1512', surface: '#17211D', surface2: '#1E2A25', sunken: '#0A0F0D',
  text1: '#ECF1EE', text2: '#9DB0A8', text3: '#6E847B',
  hair: 'rgba(255,255,255,0.08)', hair2: 'rgba(255,255,255,0.13)',
  jade: '#2BB989', jade600: '#0F6E56', jade700: '#0B5544',
  jadeFaint: 'rgba(43,185,137,0.16)', jadeText: '#5FD3A6',
  danger: '#FF6B6B', dangerBg: 'rgba(255,107,107,0.15)',
  amber: '#F0A84B', amberBg: 'rgba(240,168,75,0.16)',
  exam: '#A98BF0', examBg: 'rgba(169,139,240,0.18)',
  blue: '#5AA0E6', blueBg: 'rgba(90,160,230,0.18)',
  slate: '#9DB0BE', slateBg: 'rgba(157,176,190,0.16)',
  toggleOff: '#33403A',
  cardShadow: '0 2px 12px rgba(0,0,0,0.40)',
  cardShadowLg: '0 8px 22px rgba(0,0,0,0.5)',
  navShadow: '0 8px 24px rgba(0,0,0,0.55)',
  scrim: 'rgba(0,0,0,0.62)',
};

const STRINGS = {
  fr: {
    profile: 'Profil', settings: 'Paramètres', back: 'Retour',
    tabs: { home: 'Accueil', schedule: 'Agenda', grades: 'Notes', news: 'Actualités', profile: 'Profil' },
    greetingPrefix: 'Bonjour,', firstName: 'Ahmed', fullName: 'Ahmed Omar',
    studentId: 'UDJ-2024-00831', filiere: 'Génie Informatique', filiereShort: 'Génie Info. · L3',
    faculte: 'Sciences et Tech.', annee: 'L3 — Licence 3', email: 'ahmed.omar@univ.dj', phone: '+253 77 12 34 56',
    cardLabel: 'CARTE ÉTUDIANTE', university: 'Université de Djibouti',
    accessCode: "Code d'accès campus", regen: 'Se régénère dans 47 s', valid: 'Valide · expire dans 47 s',
    showQr: 'AFFICHER QR', qrFull: 'Carte étudiante', qrHint: 'Présentez ce code à l\'entrée du campus',
    quick: { docs: 'Documents', presence: 'Présence', alerts: 'Alertes' },
    details: 'Détails', detailsAcad: 'Détails académiques',
    secPref: 'Préférences', secNotif: 'Notifications', secData: 'Compte & données', secAccount: 'Compte',
    langue: 'Langue', langueSub: "Langue de l'application", langueVal: 'Français',
    theme: 'Thème', themeSub: 'Apparence', themeVal: 'Système',
    textSize: 'Taille du texte', textSizeVal: 'Normal',
    notesAvail: 'Notes disponibles', courseReminder: 'Rappel de cours', presenceAlerts: 'Alertes présence',
    quietHours: 'Heures de silence', quietVal: '22h – 7h',
    storage: 'Stockage hors-ligne', storageVal: '12.4 MB',
    clearCache: 'Vider le cache', accountInfo: 'Informations du compte', lastSync: 'Dernière synchro.', lastSyncVal: 'Auj. 14:30',
    infoCenter: "Centre d'information", logout: 'Déconnexion', help: 'Aide & infos',
    // pickers
    pickLangTitle: 'Langue', optFr: 'Français', optFrSub: 'Français', optAr: 'العربية', optArSub: 'Arabe',
    pickThemeTitle: 'Thème', optLight: 'Clair', optLightSub: 'Toujours clair', optDark: 'Sombre', optDarkSub: 'Toujours sombre',
    optSystem: 'Système', optSystemSub: "Suivre l'appareil",
    pickTextTitle: 'Taille du texte', pickTextSub: 'Aperçu sous chaque option',
    optSmall: 'Petit', optNormal: 'Normal', optLarge: 'Grand', sampleText: 'Le mot du jour : étudier sans relâche.',
    quietTitle: 'Heures de silence', quietSub: 'Aucune notification pendant cette plage.',
    from: 'Début', to: 'Fin', save: 'Enregistrer', cancel: 'Annuler',
    clearTitle: 'Vider le cache ?', clearBody: 'Cette action supprimera toutes les données hors-ligne (12.4 MB). Vous devrez vous reconnecter pour les retélécharger.', clearConfirm: 'Vider le cache',
    logoutTitle: 'Se déconnecter ?', logoutBody: 'Vous devrez à nouveau saisir votre identifiant et mot de passe pour revenir.', logoutConfirm: 'Déconnexion',
    sessionTitle: 'Session expirée', sessionBody: 'Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer.', sessionLogin: 'Se reconnecter', sessionLater: 'Plus tard',
    login: {
      brand: 'Université de Djibouti', tagline: 'Connectez-vous à votre espace étudiant',
      idLabel: 'Votre numéro étudiant', idPh: 'UDJ-2024-0432',
      pwLabel: 'Mot de passe', pwPh: '••••••••', forgot: 'Mot de passe oublié ?',
      signIn: 'Se connecter', retry: 'Réessayer', signing: 'Connexion…',
      errTitle: 'ID ou mot de passe incorrect', errBody: 'Il vous reste 2 tentatives avant le blocage.',
      lockTitle: 'Compte temporairement bloqué', lockBody: '3 tentatives échouées. Réessayez dans :', lockMin: 'minutes restantes',
      lockHelp: 'Besoin d’aide ? Contacter la scolarité',
      sessTitle: 'Session expirée', sessBody: 'Reconnectez-vous pour des raisons de sécurité.',
      welcome: 'Bon retour', change: 'Changer', savedName: 'Ahmed Omar', savedId: 'UDJ-2024-00831',
      demo: 'Aperçu des états',
    },
    // account info
    acFaculte: 'Faculté', acAnnee: 'Année', acEmail: 'Email', acPhone: 'Téléphone', acFiliere: 'Filière',
    // storage
    storageTitle: 'Stockage hors-ligne', storageTotal: 'Total mis en cache', storageManage: 'Gérer le cache',
    catCourses: 'Cours', catGrades: 'Notes', catPresence: 'Présence', catNews: 'Actualités', catProfile: 'Profil & QR',
    storageNote: 'Les données sont mises en cache pour un accès hors-ligne.',
    // info center
    infoTitle: "Centre d'information", infoContacts: 'Contacts', infoFaq: 'Questions fréquentes', infoDocs: 'Documents',
    ctScolarite: 'Service Scolarité', ctScolariteV: 'Bât. A · 8h–16h', ctBib: 'Bibliothèque', ctBibV: 'Bât. C · 8h–20h',
    faq1: 'Comment réinitialiser mon mot de passe ?', faq2: 'Où trouver mon relevé de notes ?', faq3: 'Comment justifier une absence ?',
    doc1: 'Demande de relevé de notes', doc2: 'Procédure de stage',
    online: 'En ligne', offline: 'Hors ligne',
    presence: {
      title: 'Présence', rateLabel: 'Taux de présence global', badge: 'Régulier',
      summary: '12 absences sur 90 séances', secSubjects: 'Par matière', secJustif: 'Justificatifs',
      upload: 'Envoyer un justificatif', uploadHint: 'PDF ou photo · certificat médical, convocation…',
      uploadTitle: 'Envoyer un justificatif', uploadBody: 'Joignez un certificat médical ou un document officiel. Formats acceptés : PDF, JPG, PNG.',
      uploadCta: 'Choisir un fichier', dropHint: 'Touchez pour parcourir vos fichiers',
      subjects: [
        { name: 'Algorithmique avancée', pct: 95, sessions: '19/20 séances', proj: 'Encore 3 absences possibles', level: 'ok' },
        { name: 'Statistiques L2', pct: 80, sessions: '16/20 séances', proj: '2 absences restantes', level: 'warn' },
        { name: 'Physique Quantique', pct: 72, sessions: '13/18 séances', proj: 'Limite atteinte', level: 'danger' },
        { name: 'Anglais Technique', pct: 100, sessions: '12/12 séances', proj: 'Présence parfaite', level: 'ok' },
      ],
    },
    home: {
      date: 'MARDI 9 JUIN 2026', sub: 'Bon après-midi ☀️',
      agenda: 'Agenda du jour', news: 'Actualités récentes', seeAll: 'Voir tout',
      live: 'En cours', done: 'Terminé',
      emptyAgenda: "Aucun cours aujourd'hui", emptyAgendaSub: 'Profitez de votre journée.',
      stats: [
        { key: 'gpa', label: 'GPA', value: '12.3', sub: 'Assez Bien' },
        { key: 'presence', label: 'Présence', value: '87%', sub: 'Seuil : 75%' },
        { key: 'credits', label: 'Crédits', value: '24', sub: '/ 32 ce sem.' },
      ],
      schedule: [
        { start: '08:00', end: '09:30', title: 'Anglais technique', prof: 'Mrs. Amina Aden', room: 'Salle B08', course: 0, status: 'past' },
        { start: '10:00', end: '11:30', title: 'Statistiques L2', prof: 'Pr. Ibrahim Djama', room: 'Amphi B2', course: 1, status: 'past' },
        { start: '13:00', end: '14:30', title: 'Algorithmique avancée', prof: 'Pr. Hassan Robleh', room: 'Salle C12', course: 10, status: 'live' },
      ],
      newsItems: [
        { title: 'Inscriptions 2025 ouvertes', cat: 'official', catLabel: 'Official' },
        { title: 'Journée portes ouvertes — Samedi 24 mai', cat: 'events', catLabel: 'Events' },
        { title: 'Calendrier des examens S2 publié', cat: 'scolarite', catLabel: 'Scolarité' },
      ],
    },
    schedule: {
      title: 'Emploi du temps', weekOfPrefix: 'Sem. du', todayPrefix: "Aujourd'hui", todayBtn: "Aujourd'hui",
      status: { upcoming: 'À venir', live: 'En cours', done: 'Terminé' },
      emptyTitle: 'Aucun cours ce jour', emptySub: 'Profitez de votre journée.',
      weekendTitle: 'Week-end', weekendSub: 'Pas de cours le vendredi et le samedi.',
      breakLabel: 'Pause de', heure: 'heure', heures: 'heures',
      detail: { salle: 'Salle', horaire: 'Horaire', code: 'Code matière', coef: 'Coefficient', statut: 'Statut',
        notesLabel: 'NOTES PERSONNELLES', notePlaceholder: 'Ajouter une note…', save: 'Enregistrer' },
      wdShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      wdLong: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
      byDay: [
        [ { start: '09:00', end: '10:30', title: 'Anglais technique', prof: 'Mrs. Amina Aden', room: 'Salle B08', course: 7, code: 'ANG110', coef: 1 },
          { start: '11:00', end: '12:30', title: 'Algorithmique avancée', prof: 'Pr. Hassan Robleh', room: 'Salle C12', course: 10, code: 'INF301', coef: 4 } ],
        [ { start: '08:00', end: '09:30', title: 'Statistiques L2', prof: 'Pr. Ibrahim Djama', room: 'Salle B08', course: 1, code: 'STA201', coef: 2 },
          { start: '10:00', end: '11:30', title: "Systèmes d'exploitation", prof: 'Dr. Youssouf Ahmed', room: 'Amphi A1', course: 6, code: 'INF304', coef: 3 },
          { start: '14:00', end: '15:30', title: 'Bases de données', prof: 'Dr. Safia Mohamed', room: 'Labo Info 1', course: 2, code: 'INF201', coef: 4 } ],
        [],
        [ { start: '08:00', end: '10:00', title: 'Bases de données', prof: 'Dr. Safia Mohamed', room: 'Labo Info 1', course: 2, code: 'INF201', coef: 4 },
          { start: '10:30', end: '12:00', title: 'Mathématiques générales L2', prof: 'Pr. Abdi Farah', room: 'Salle A05', course: 3, code: 'MAT202', coef: 3 },
          { start: '14:00', end: '15:30', title: 'Physique quantique', prof: 'Pr. Moussa Ali', room: 'Salle D04', course: 0, code: 'PHY305', coef: 2 } ],
        [ { start: '08:00', end: '09:30', title: 'Réseaux informatiques', prof: 'Dr. Omar Hassan', room: 'Labo Info 2', course: 4, code: 'INF303', coef: 3 },
          { start: '10:00', end: '11:30', title: "Systèmes d'exploitation", prof: 'Dr. Youssouf Ahmed', room: 'Amphi A1', course: 6, code: 'INF304', coef: 3 },
          { start: '13:00', end: '14:30', title: 'Statistiques L2', prof: 'Pr. Ibrahim Djama', room: 'Salle B08', course: 1, code: 'STA201', coef: 2 } ],
        null, null,
      ],
    },
    grades: {
      title: 'Notes', heroLabel: 'Moyenne générale', perSubject: 'Par matière',
      creditsLabel: 'Crédits', creditsEarned: 24, creditsTotal: 32, over: '/20',
      semesters: ['Semestre 1', 'Semestre 2'],
      status: { ok: 'Validé', warn: 'Limite', risk: 'À Risque' }, atRisk: 'Sous la moyenne',
      metrics: ['CC', 'CF', 'COEF', 'NF'],
      emptyTitle: 'Aucune note publiée', emptySub: 'Les notes de ce semestre apparaîtront ici.', notRated: 'Non calculée',
      mentions: [{ min: 16, label: 'Très Bien' }, { min: 14, label: 'Bien' }, { min: 12, label: 'Assez Bien' }, { min: 10, label: 'Passable' }, { min: 0, label: 'Insuffisant' }],
      bySemester: [
        { gpa: '12.28', subjects: [
          { name: 'Algorithmique avancée', cc: '14.00', cf: '15.50', coef: 4, nf: '14.90' },
          { name: 'Bases de données', cc: '12.00', cf: '13.00', coef: 3, nf: '12.60' },
          { name: 'Mathématiques générales L2', cc: '13.00', cf: '15.00', coef: 4, nf: '14.20' },
          { name: 'Physique quantique', cc: '8.00', cf: '7.00', coef: 3, nf: '7.40' },
        ] },
        { gpa: '13.10', subjects: [
          { name: 'Réseaux informatiques', cc: '15.00', cf: '14.00', coef: 3, nf: '14.40' },
          { name: "Systèmes d'exploitation", cc: '11.00', cf: '12.50', coef: 3, nf: '12.05' },
          { name: 'Anglais technique', cc: '16.00', cf: '15.00', coef: 1, nf: '15.40' },
          { name: 'Statistiques L2', cc: '9.00', cf: '8.50', coef: 2, nf: '8.70' },
        ] },
      ],
      calc: { title: 'Calculateur de notes', subtitle: "Quelle note ai-je besoin à l'examen ?", matiere: 'MATIÈRE',
        currentCC: 'Note CC actuelle', target: 'NOTE FINALE VISÉE', targetPh: '12.00', compute: 'Calculer',
        resultNeed: "Il vous faut {v}/20 à l'examen", resultDone: 'Objectif déjà atteint', resultImposs: 'Objectif inatteignable (>20)' },
      history: { title: 'Évolution de la moyenne', subtitle: 'Progression par semestre', current: 'Moyenne actuelle',
        hint: 'Historique complet disponible après plusieurs semestres', admission: 'admission',
        points: [{ label: 'S1', v: 12.28 }, { label: 'S2', v: 13.10 }] },
    },
    news: {
      title: 'Actualités', urgent: 'Officiel · Urgent', share: 'Partager',
      emptyTitle: 'Aucune actualité', emptySub: 'Revenez plus tard pour les dernières nouvelles.',
      filters: [['all', 'Tout'], ['official', 'Officiel'], ['events', 'Événements'], ['scolarite', 'Scolarité'], ['sport', 'Sport'], ['jeunesse', 'Jeunesse'], ['sponsors', 'Sponsors']],
      catLabels: { official: 'Officiel', events: 'Événements', scolarite: 'Scolarité', sport: 'Sport', jeunesse: 'Jeunesse', sponsors: 'Sponsors', general: 'Général' },
      items: [
        { id: 1, cat: 'official', urgent: true, title: 'Inscriptions 2025 ouvertes', source: 'Service Communication', org: 'UDJ · Université de Djibouti', date: '1 juin 2026 · 12:24', time: 'Il y a 9j', read: '3 min', unread: true, body: "Les inscriptions pour l'année universitaire 2025–2026 sont ouvertes du 1er au 30 juillet. Rendez-vous au bureau de la scolarité avec votre dossier complet." },
        { id: 2, cat: 'events', title: 'Journée portes ouvertes — Samedi 24 mai', source: 'Vie étudiante', org: 'UDJ · Vie étudiante', date: '20 mai 2026 · 09:00', time: 'Il y a 11j', read: '2 min', unread: true, body: "L'université ouvre ses portes au public ce samedi. Visites des laboratoires, rencontres avec les enseignants et démonstrations des clubs étudiants de 9h à 16h." },
        { id: 3, cat: 'scolarite', title: 'Calendrier des examens S2 publié', source: 'Scolarité', org: 'UDJ · Scolarité', date: '17 mai 2026 · 14:30', time: 'Il y a 14j', read: '2 min', unread: false, body: 'Le calendrier des examens du second semestre est désormais disponible. Consultez les dates et les salles affectées à chaque épreuve sur le portail étudiant.' },
        { id: 4, cat: 'sport', title: 'Tournoi inter-facultés de football', source: 'Club Sport', org: 'UDJ · Club Sport', date: '10 mai 2026 · 17:00', time: 'Il y a 21j', read: '2 min', unread: false, body: "Le grand tournoi inter-facultés revient ! Inscriptions des équipes jusqu'au 20 mai. Première journée le 25 mai au stade du campus." },
        { id: 5, cat: 'jeunesse', title: 'Hackathon étudiant : inscrivez votre équipe', source: 'Club Tech', org: 'UDJ · Club Tech', date: '5 mai 2026 · 11:00', time: 'Il y a 23j', read: '4 min', unread: false, body: '48 heures pour concevoir une solution numérique au service du campus. Équipes de 3 à 5 personnes. Prix pour les trois meilleures équipes.' },
        { id: 6, cat: 'sponsors', title: 'Programme de bourses Orange Djibouti', source: 'Partenariats', org: 'UDJ · Partenariats', date: '1 mai 2026 · 10:00', time: 'Il y a 28j', read: '3 min', unread: false, body: 'Orange Djibouti lance un programme de bourses pour les étudiants en informatique et télécommunications. Dépôt des candidatures avant le 15 juin.' },
      ],
    },
    notif: {
      title: 'Notifications', markAll: 'Tout marquer comme lu', marked: 'Tout marqué comme lu', undo: 'Annuler',
      thisWeek: 'Cette semaine', earlier: 'Plus tôt',
      empty: 'Aucune notification', emptySub: 'Vous êtes à jour.',
      groups: [
        { label: 'Cette semaine', items: [
          { cat: 'notes', title: 'Vos notes de Mathématiques Générales L2 sont disponibles', body: 'Consultez votre relevé pour le détail des évaluations du semestre.', date: 'mercredi 3 juin', catLabel: 'Notes', read: false },
          { cat: 'agenda', title: 'Cours dans 15 minutes — Amphi A1', body: 'Algorithmique avancée avec Pr. Hassan Robleh.', date: 'mercredi 3 juin', catLabel: 'Agenda', read: false },
          { cat: 'presence', severity: 'warn', title: 'Présence Physique Quantique à 72% — sous le seuil', body: "Vous risquez d'être déclaré non-assidu. Justifiez vos absences.", date: 'mardi 2 juin', catLabel: 'Présence', read: false },
          { cat: 'news', title: 'Calendrier des examens S2 publié', body: 'Consultez les dates et salles de la session de juin.', date: 'mardi 2 juin', catLabel: 'Actualités', read: false },
        ] },
        { label: 'Plus tôt', items: [
          { cat: 'notes', title: 'Note de TP Réseaux ajoutée', body: 'Travaux pratiques 04 — 15.5/20.', date: 'vendredi 29 mai', catLabel: 'Notes', read: true },
          { cat: 'general', title: 'Maintenance planifiée du portail', body: 'Le portail sera indisponible samedi de 2h à 4h.', date: 'jeudi 28 mai', catLabel: 'Général', read: true },
        ] },
      ],
    },
  },
  ar: {
    profile: 'الملف', settings: 'الإعدادات', back: 'رجوع',
    tabs: { home: 'الرئيسية', schedule: 'الجدول', grades: 'الدرجات', news: 'الأخبار', profile: 'الملف' },
    greetingPrefix: 'مرحباً،', firstName: 'أحمد', fullName: 'أحمد عمر',
    studentId: 'UDJ-2024-00831', filiere: 'هندسة المعلوماتية', filiereShort: 'هندسة معلوماتية · س٣',
    faculte: 'العلوم والتكنولوجيا', annee: 'السنة الثالثة — ليسانس', email: 'ahmed.omar@univ.dj', phone: '+253 77 12 34 56',
    cardLabel: 'بطاقة الطالب', university: 'جامعة جيبوتي',
    accessCode: 'رمز الدخول للحرم', regen: 'يتجدد خلال ٤٧ ثانية', valid: 'صالحة · تنتهي خلال ٤٧ ثانية',
    showQr: 'عرض الرمز', qrFull: 'بطاقة الطالب', qrHint: 'اعرض هذا الرمز عند مدخل الحرم',
    quick: { docs: 'المستندات', presence: 'الحضور', alerts: 'التنبيهات' },
    details: 'التفاصيل', detailsAcad: 'التفاصيل الأكاديمية',
    secPref: 'التفضيلات', secNotif: 'الإشعارات', secData: 'الحساب والبيانات', secAccount: 'الحساب',
    langue: 'اللغة', langueSub: 'لغة التطبيق', langueVal: 'العربية',
    theme: 'المظهر', themeSub: 'السمة', themeVal: 'النظام',
    textSize: 'حجم النص', textSizeVal: 'عادي',
    notesAvail: 'الدرجات المتاحة', courseReminder: 'تذكير بالمحاضرات', presenceAlerts: 'تنبيهات الحضور',
    quietHours: 'ساعات الصمت', quietVal: '٢٢:٠٠ – ٧:٠٠',
    storage: 'التخزين دون اتصال', storageVal: '12.4 MB',
    clearCache: 'مسح الذاكرة المؤقتة', accountInfo: 'معلومات الحساب', lastSync: 'آخر مزامنة', lastSyncVal: 'اليوم ١٤:٣٠',
    infoCenter: 'مركز المعلومات', logout: 'تسجيل الخروج', help: 'المساعدة والمعلومات',
    pickLangTitle: 'اللغة', optFr: 'Français', optFrSub: 'الفرنسية', optAr: 'العربية', optArSub: 'العربية',
    pickThemeTitle: 'المظهر', optLight: 'فاتح', optLightSub: 'فاتح دائماً', optDark: 'داكن', optDarkSub: 'داكن دائماً',
    optSystem: 'النظام', optSystemSub: 'حسب الجهاز',
    pickTextTitle: 'حجم النص', pickTextSub: 'معاينة تحت كل خيار',
    optSmall: 'صغير', optNormal: 'عادي', optLarge: 'كبير', sampleText: 'كلمة اليوم: ادرس بلا كلل.',
    quietTitle: 'ساعات الصمت', quietSub: 'لا إشعارات خلال هذه الفترة.',
    from: 'من', to: 'إلى', save: 'حفظ', cancel: 'إلغاء',
    clearTitle: 'مسح الذاكرة المؤقتة؟', clearBody: 'سيؤدي هذا إلى حذف جميع البيانات دون اتصال (12.4 MB). ستحتاج إلى إعادة الاتصال لتنزيلها مجدداً.', clearConfirm: 'مسح الذاكرة',
    logoutTitle: 'تسجيل الخروج؟', logoutBody: 'ستحتاج إلى إدخال رقمك وكلمة المرور مرة أخرى للعودة.', logoutConfirm: 'تسجيل الخروج',
    sessionTitle: 'انتهت الجلسة', sessionBody: 'انتهت جلستك لأسباب أمنية. أعد تسجيل الدخول للمتابعة.', sessionLogin: 'إعادة الدخول', sessionLater: 'لاحقاً',
    login: {
      brand: 'جامعة جيبوتي', tagline: 'سجّل الدخول إلى فضائك الطلابي',
      idLabel: 'رقمك الطلابي', idPh: 'UDJ-2024-0432',
      pwLabel: 'كلمة المرور', pwPh: '••••••••', forgot: 'نسيت كلمة المرور؟',
      signIn: 'تسجيل الدخول', retry: 'إعادة المحاولة', signing: 'جارٍ الاتصال…',
      errTitle: 'الرقم أو كلمة المرور غير صحيحة', errBody: 'لديك محاولتان قبل الحظر.',
      lockTitle: 'الحساب محظور مؤقتاً', lockBody: '٣ محاولات فاشلة. أعد المحاولة بعد:', lockMin: 'دقائق متبقية',
      lockHelp: 'بحاجة لمساعدة؟ تواصل مع الشؤون الطلابية',
      sessTitle: 'انتهت الجلسة', sessBody: 'أعد تسجيل الدخول لأسباب أمنية.',
      welcome: 'مرحباً بعودتك', change: 'تغيير', savedName: 'أحمد عمر', savedId: 'UDJ-2024-00831',
      demo: 'معاينة الحالات',
    },
    acFaculte: 'الكلية', acAnnee: 'السنة', acEmail: 'البريد', acPhone: 'الهاتف', acFiliere: 'التخصص',
    storageTitle: 'التخزين دون اتصال', storageTotal: 'الإجمالي المخزن', storageManage: 'إدارة التخزين',
    catCourses: 'المقررات', catGrades: 'الدرجات', catPresence: 'الحضور', catNews: 'الأخبار', catProfile: 'الملف والرمز',
    storageNote: 'يتم تخزين البيانات للوصول دون اتصال.',
    infoTitle: 'مركز المعلومات', infoContacts: 'جهات الاتصال', infoFaq: 'الأسئلة الشائعة', infoDocs: 'المستندات',
    ctScolarite: 'مكتب الشؤون الطلابية', ctScolariteV: 'مبنى أ · ٨–١٦', ctBib: 'المكتبة', ctBibV: 'مبنى ج · ٨–٢٠',
    faq1: 'كيف أعيد تعيين كلمة المرور؟', faq2: 'أين أجد كشف درجاتي؟', faq3: 'كيف أبرر غياباً؟',
    doc1: 'طلب كشف الدرجات', doc2: 'إجراءات التدريب',
    online: 'متصل', offline: 'دون اتصال',
    presence: {
      title: 'الحضور', rateLabel: 'نسبة الحضور الإجمالية', badge: 'منتظم',
      summary: '١٢ غياب من أصل ٩٠ حصة', secSubjects: 'حسب المادة', secJustif: 'المبررات',
      upload: 'إرسال مبرر', uploadHint: 'PDF أو صورة · شهادة طبية، استدعاء…',
      uploadTitle: 'إرسال مبرر', uploadBody: 'أرفق شهادة طبية أو وثيقة رسمية. الصيغ المقبولة: PDF، JPG، PNG.',
      uploadCta: 'اختيار ملف', dropHint: 'اضغط لتصفّح ملفاتك',
      subjects: [
        { name: 'الخوارزميات المتقدمة', pct: 95, sessions: '١٩/٢٠ حصة', proj: 'يمكنك التغيب ٣ مرات أخرى', level: 'ok' },
        { name: 'الإحصاء س٢', pct: 80, sessions: '١٦/٢٠ حصة', proj: 'يتبقى لك غيابان', level: 'warn' },
        { name: 'الفيزياء الكمية', pct: 72, sessions: '١٣/١٨ حصة', proj: 'بلغت الحد الأقصى', level: 'danger' },
        { name: 'الإنجليزية التقنية', pct: 100, sessions: '١٢/١٢ حصة', proj: 'حضور مثالي', level: 'ok' },
      ],
    },
    home: {
      date: 'الثلاثاء ٩ يونيو ٢٠٢٦', sub: 'مساء الخير ☀️',
      agenda: 'جدول اليوم', news: 'آخر الأخبار', seeAll: 'عرض الكل',
      live: 'جارٍ الآن', done: 'انتهى',
      emptyAgenda: 'لا محاضرات اليوم', emptyAgendaSub: 'استمتع بيومك.',
      stats: [
        { key: 'gpa', label: 'المعدل', value: '١٢٫٣', sub: 'جيد' },
        { key: 'presence', label: 'الحضور', value: '٨٧٪', sub: 'الحد: ٧٥٪' },
        { key: 'credits', label: 'الأرصدة', value: '٢٤', sub: '/ ٣٢ هذا الفصل' },
      ],
      schedule: [
        { start: '08:00', end: '09:30', title: 'الإنجليزية التقنية', prof: 'أ. أمينة عدن', room: 'قاعة B08', course: 0, status: 'past' },
        { start: '10:00', end: '11:30', title: 'الإحصاء س٢', prof: 'د. إبراهيم جامع', room: 'مدرج B2', course: 1, status: 'past' },
        { start: '13:00', end: '14:30', title: 'الخوارزميات المتقدمة', prof: 'د. حسن روبلة', room: 'قاعة C12', course: 10, status: 'live' },
      ],
      newsItems: [
        { title: 'فتح التسجيل ٢٠٢٥', cat: 'official', catLabel: 'رسمي' },
        { title: 'يوم الأبواب المفتوحة — السبت ٢٤ مايو', cat: 'events', catLabel: 'فعاليات' },
        { title: 'نشر جدول امتحانات الفصل الثاني', cat: 'scolarite', catLabel: 'الدراسة' },
      ],
    },
    schedule: {
      title: 'جدول الحصص', weekOfPrefix: 'أسبوع', todayPrefix: 'اليوم', todayBtn: 'اليوم',
      status: { upcoming: 'قادم', live: 'جارٍ الآن', done: 'انتهى' },
      emptyTitle: 'لا محاضرات اليوم', emptySub: 'استمتع بيومك.',
      weekendTitle: 'عطلة نهاية الأسبوع', weekendSub: 'لا محاضرات يومي الجمعة والسبت.',
      breakLabel: 'استراحة', heure: 'ساعة', heures: 'ساعات',
      detail: { salle: 'القاعة', horaire: 'التوقيت', code: 'رمز المادة', coef: 'المعامل', statut: 'الحالة',
        notesLabel: 'ملاحظات شخصية', notePlaceholder: 'أضف ملاحظة…', save: 'حفظ' },
      wdShort: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      wdLong: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      byDay: [
        [ { start: '09:00', end: '10:30', title: 'الإنجليزية التقنية', prof: 'أ. أمينة عدن', room: 'قاعة B08', course: 7, code: 'ANG110', coef: 1 },
          { start: '11:00', end: '12:30', title: 'الخوارزميات المتقدمة', prof: 'د. حسن روبلة', room: 'قاعة C12', course: 10, code: 'INF301', coef: 4 } ],
        [ { start: '08:00', end: '09:30', title: 'الإحصاء س٢', prof: 'د. إبراهيم جامع', room: 'قاعة B08', course: 1, code: 'STA201', coef: 2 },
          { start: '10:00', end: '11:30', title: 'أنظمة التشغيل', prof: 'د. يوسف أحمد', room: 'مدرج A1', course: 6, code: 'INF304', coef: 3 },
          { start: '14:00', end: '15:30', title: 'قواعد البيانات', prof: 'د. صفية محمد', room: 'مختبر ١', course: 2, code: 'INF201', coef: 4 } ],
        [],
        [ { start: '08:00', end: '10:00', title: 'قواعد البيانات', prof: 'د. صفية محمد', room: 'مختبر ١', course: 2, code: 'INF201', coef: 4 },
          { start: '10:30', end: '12:00', title: 'الرياضيات العامة س٢', prof: 'د. عبدي فرح', room: 'قاعة A05', course: 3, code: 'MAT202', coef: 3 },
          { start: '14:00', end: '15:30', title: 'الفيزياء الكمية', prof: 'د. موسى علي', room: 'قاعة D04', course: 0, code: 'PHY305', coef: 2 } ],
        [ { start: '08:00', end: '09:30', title: 'شبكات المعلومات', prof: 'د. عمر حسن', room: 'مختبر ٢', course: 4, code: 'INF303', coef: 3 },
          { start: '10:00', end: '11:30', title: 'أنظمة التشغيل', prof: 'د. يوسف أحمد', room: 'مدرج A1', course: 6, code: 'INF304', coef: 3 },
          { start: '13:00', end: '14:30', title: 'الإحصاء س٢', prof: 'د. إبراهيم جامع', room: 'قاعة B08', course: 1, code: 'STA201', coef: 2 } ],
        null, null,
      ],
    },
    grades: {
      title: 'الدرجات', heroLabel: 'المعدل العام', perSubject: 'حسب المادة',
      creditsLabel: 'الأرصدة', creditsEarned: 24, creditsTotal: 32, over: '/٢٠',
      semesters: ['الفصل ١', 'الفصل ٢'],
      status: { ok: 'ناجح', warn: 'حدّي', risk: 'في خطر' }, atRisk: 'تحت المعدل',
      metrics: ['المستمر', 'الامتحان', 'المعامل', 'النهائي'],
      emptyTitle: 'لا درجات منشورة', emptySub: 'ستظهر درجات هذا الفصل هنا.', notRated: 'غير محتسب',
      mentions: [{ min: 16, label: 'جيد جداً' }, { min: 14, label: 'جيد' }, { min: 12, label: 'مستحسن' }, { min: 10, label: 'مقبول' }, { min: 0, label: 'غير كافٍ' }],
      bySemester: [
        { gpa: '12.28', subjects: [
          { name: 'الخوارزميات المتقدمة', cc: '14.00', cf: '15.50', coef: 4, nf: '14.90' },
          { name: 'قواعد البيانات', cc: '12.00', cf: '13.00', coef: 3, nf: '12.60' },
          { name: 'الرياضيات العامة س٢', cc: '13.00', cf: '15.00', coef: 4, nf: '14.20' },
          { name: 'الفيزياء الكمية', cc: '8.00', cf: '7.00', coef: 3, nf: '7.40' },
        ] },
        { gpa: '13.10', subjects: [
          { name: 'شبكات المعلومات', cc: '15.00', cf: '14.00', coef: 3, nf: '14.40' },
          { name: 'أنظمة التشغيل', cc: '11.00', cf: '12.50', coef: 3, nf: '12.05' },
          { name: 'الإنجليزية التقنية', cc: '16.00', cf: '15.00', coef: 1, nf: '15.40' },
          { name: 'الإحصاء س٢', cc: '9.00', cf: '8.50', coef: 2, nf: '8.70' },
        ] },
      ],
      calc: { title: 'حاسبة الدرجات', subtitle: 'ما الدرجة التي أحتاجها في الامتحان؟', matiere: 'المادة',
        currentCC: 'درجة المراقبة الحالية', target: 'الدرجة النهائية المستهدفة', targetPh: '12.00', compute: 'احسب',
        resultNeed: 'تحتاج {v}/٢٠ في الامتحان', resultDone: 'تم تحقيق الهدف', resultImposs: 'الهدف غير قابل للتحقيق (>٢٠)' },
      history: { title: 'تطور المعدل', subtitle: 'التقدم حسب الفصل', current: 'المعدل الحالي',
        hint: 'السجل الكامل متاح بعد عدة فصول', admission: 'النجاح',
        points: [{ label: 'ف١', v: 12.28 }, { label: 'ف٢', v: 13.10 }] },
    },
    news: {
      title: 'الأخبار', urgent: 'رسمي · عاجل', share: 'مشاركة',
      emptyTitle: 'لا أخبار', emptySub: 'عُد لاحقاً لآخر المستجدات.',
      filters: [['all', 'الكل'], ['official', 'رسمي'], ['events', 'فعاليات'], ['scolarite', 'الدراسة'], ['sport', 'رياضة'], ['jeunesse', 'شباب'], ['sponsors', 'شركاء']],
      catLabels: { official: 'رسمي', events: 'فعاليات', scolarite: 'الدراسة', sport: 'رياضة', jeunesse: 'شباب', sponsors: 'شركاء', general: 'عام' },
      items: [
        { id: 1, cat: 'official', urgent: true, title: 'فتح التسجيل ٢٠٢٥', source: 'مصلحة الاتصال', org: 'جامعة جيبوتي', date: '١ يونيو ٢٠٢٦ · ١٢:٢٤', time: 'منذ ٩ أيام', read: '٣ دقائق', unread: true, body: 'التسجيل للسنة الجامعية ٢٠٢٥–٢٠٢٦ مفتوح من ١ إلى ٣٠ يوليو. توجّه إلى مكتب الشؤون الطلابية بملفك الكامل.' },
        { id: 2, cat: 'events', title: 'يوم الأبواب المفتوحة — السبت ٢٤ مايو', source: 'الحياة الطلابية', org: 'جامعة جيبوتي · الحياة الطلابية', date: '٢٠ مايو ٢٠٢٦ · ٠٩:٠٠', time: 'منذ ١١ يوماً', read: 'دقيقتان', unread: true, body: 'تفتح الجامعة أبوابها للجمهور يوم السبت. زيارات للمختبرات ولقاءات مع الأساتذة وعروض الأندية الطلابية من ٩ إلى ١٦.' },
        { id: 3, cat: 'scolarite', title: 'نشر جدول امتحانات الفصل الثاني', source: 'الشؤون الطلابية', org: 'جامعة جيبوتي · الشؤون الطلابية', date: '١٧ مايو ٢٠٢٦ · ١٤:٣٠', time: 'منذ ١٤ يوماً', read: 'دقيقتان', unread: false, body: 'أصبح جدول امتحانات الفصل الثاني متاحاً. اطّلع على التواريخ والقاعات المخصصة لكل اختبار عبر البوابة الطلابية.' },
        { id: 4, cat: 'sport', title: 'بطولة كرة القدم بين الكليات', source: 'نادي الرياضة', org: 'جامعة جيبوتي · نادي الرياضة', date: '١٠ مايو ٢٠٢٦ · ١٧:٠٠', time: 'منذ ٢١ يوماً', read: 'دقيقتان', unread: false, body: 'تعود البطولة الكبرى بين الكليات! تسجيل الفرق حتى ٢٠ مايو. اليوم الأول في ٢٥ مايو بملعب الحرم.' },
        { id: 5, cat: 'jeunesse', title: 'هاكاثون طلابي: سجّل فريقك', source: 'نادي التقنية', org: 'جامعة جيبوتي · نادي التقنية', date: '٥ مايو ٢٠٢٦ · ١١:٠٠', time: 'منذ ٢٣ يوماً', read: '٤ دقائق', unread: false, body: '٤٨ ساعة لتصميم حل رقمي يخدم الحرم الجامعي. فرق من ٣ إلى ٥ أشخاص. جوائز لأفضل ثلاثة فرق.' },
        { id: 6, cat: 'sponsors', title: 'برنامج منح أورانج جيبوتي', source: 'الشراكات', org: 'جامعة جيبوتي · الشراكات', date: '١ مايو ٢٠٢٦ · ١٠:٠٠', time: 'منذ ٢٨ يوماً', read: '٣ دقائق', unread: false, body: 'تطلق أورانج جيبوتي برنامج منح لطلاب المعلوماتية والاتصالات. تقديم الطلبات قبل ١٥ يونيو.' },
      ],
    },
    notif: {
      title: 'الإشعارات', markAll: 'تحديد الكل كمقروء', marked: 'تم تحديد الكل كمقروء', undo: 'تراجع',
      thisWeek: 'هذا الأسبوع', earlier: 'أقدم',
      empty: 'لا إشعارات', emptySub: 'أنت على اطلاع.',
      groups: [
        { label: 'هذا الأسبوع', items: [
          { cat: 'notes', title: 'درجات الرياضيات العامة س٢ متاحة', body: 'اطّلع على كشف درجاتك لتفاصيل تقييمات الفصل.', date: 'الأربعاء ٣ يونيو', catLabel: 'الدرجات', read: false },
          { cat: 'agenda', title: 'محاضرة بعد ١٥ دقيقة — مدرج A1', body: 'الخوارزميات المتقدمة مع د. حسن روبلة.', date: 'الأربعاء ٣ يونيو', catLabel: 'الجدول', read: false },
          { cat: 'presence', severity: 'warn', title: 'حضور الفيزياء الكمية ٧٢٪ — تحت الحد', body: 'قد تُعتبر غير منتظم. برّر غياباتك.', date: 'الثلاثاء ٢ يونيو', catLabel: 'الحضور', read: false },
          { cat: 'news', title: 'نشر جدول امتحانات الفصل الثاني', body: 'اطّلع على تواريخ وقاعات دورة يونيو.', date: 'الثلاثاء ٢ يونيو', catLabel: 'الأخبار', read: false },
        ] },
        { label: 'أقدم', items: [
          { cat: 'notes', title: 'أُضيفت درجة عملي الشبكات', body: 'العمل التطبيقي ٠٤ — ١٥٫٥/٢٠.', date: 'الجمعة ٢٩ مايو', catLabel: 'الدرجات', read: true },
          { cat: 'general', title: 'صيانة مجدولة للبوابة', body: 'ستكون البوابة غير متاحة السبت من ٢ إلى ٤ صباحاً.', date: 'الخميس ٢٨ مايو', catLabel: 'عام', read: true },
        ] },
      ],
    },
  },
};

const SANS = "'Plus Jakarta Sans', sans-serif";
const ARFONT = "'Noto Naskh Arabic', 'Plus Jakarta Sans', sans-serif";
const MONO = "'DM Mono', monospace";
const FW = 360, FH = 780;

const UDJCtx = React.createContext(null);
const useUDJ = () => React.useContext(UDJCtx);

/* ---------- status bar ---------- */
const StatusBar = () => {
  const { T, rtl } = useUDJ();
  return (
    <div style={{ height: 44, paddingTop: 14, paddingLeft: 22, paddingRight: 18, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 13, fontWeight: 500,
      color: T.text1, direction: 'ltr' }}>
      <span>{rtl ? '٩:٤١' : '9:41'}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="16" height="11" viewBox="0 0 16 11"><g fill={T.text1}>
          <rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4" y="5" width="3" height="6" rx="0.5"/>
          <rect x="8" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="12" y="0" width="3" height="11" rx="0.5"/>
        </g></svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke={T.text1} strokeWidth="1.4" strokeLinecap="round">
          <path d="M1 4 C 4 1, 10 1, 13 4"/><path d="M3 6 C 5 4.5, 9 4.5, 11 6"/><path d="M5 8 C 6 7.3, 8 7.3, 9 8"/>
          <circle cx="7" cy="9.6" r="0.7" fill={T.text1} stroke="none"/>
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect x="0.5" y="0.5" width="19" height="10" rx="2" fill="none" stroke={T.text1} strokeOpacity="0.4"/>
          <rect x="2" y="2" width="14" height="7" rx="1" fill={T.text1}/>
          <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill={T.text1} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
};

/* ---------- glyphs ---------- */
const Chevron = ({ color, size = 13 }) => {
  const { T, rtl } = useUDJ();
  return (
    <svg width={size * 0.58} height={size} viewBox="0 0 7 12" style={{ display: 'block', transform: rtl ? 'scaleX(-1)' : 'none' }}>
      <path d="M1 1 L6 6 L1 11" stroke={color || T.text3} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
const Back = ({ color, size = 23 }) => {
  const { T, rtl } = useUDJ();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || T.text1} strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" style={{ transform: rtl ? 'scaleX(-1)' : 'none' }}>
      <path d="M15 5 L8 12 L15 19"/>
    </svg>
  );
};
const Gear = ({ color, size = 19 }) => {
  const { T } = useUDJ();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || T.text2} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>
    </svg>
  );
};
const Check = ({ color = '#fff', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 L10 17.5 L19 6.5"/></svg>
);
const CatIcon = ({ kind, color, size = 17 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'lang': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>;
    case 'moon': return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/></svg>;
    case 'text': return <svg {...p}><path d="M4 6h16M9 6v13M15 11h5M17 11v8"/></svg>;
    case 'bell': return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'sync': return <svg {...p}><path d="M20 11a8 8 0 0 0-14-4M4 13a8 8 0 0 0 14 4"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>;
    case 'storage': return <svg {...p}><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/></svg>;
    case 'trash': return <svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>;
    case 'user': return <svg {...p}><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3.6 4.4-5.5 7-5.5s6 1.9 7 5.5"/></svg>;
    case 'out': return <svg {...p}><path d="M14 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M9 12h11M17 8l3 4-3 4"/></svg>;
    case 'info': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>;
    case 'doc': return <svg {...p}><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/></svg>;
    case 'cal': return <svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5 H20.5M8 3 V6.5M16 3 V6.5"/></svg>;
    case 'phone': return <svg {...p}><path d="M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5 2 2 0 0 1 6 3Z"/></svg>;
    case 'mail': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>;
    case 'key': return <svg {...p}><circle cx="8" cy="15" r="4"/><path d="M11 12 20 3M17 6l2 2M14 9l2 2"/></svg>;
    case 'upload': return <svg {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>;
    case 'chart': return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>;
    case 'grad': return <svg {...p}><path d="M2 9 L12 4.5 L22 9 L12 13.5 Z"/><path d="M6 11v4.5c0 1 2.7 2 6 2s6-1 6-2V11"/><path d="M22 9v5"/></svg>;
    case 'alert': return <svg {...p}><path d="M12 4 L22 20 H2 Z"/><path d="M12 10v4M12 17h.01"/></svg>;
    case 'calc': return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="2.2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 14h.01M12 14h.01M16 14v3M8 17h4"/></svg>;
    case 'share': return <svg {...p}><circle cx="6" cy="12" r="2.6"/><circle cx="17" cy="6" r="2.6"/><circle cx="17" cy="18" r="2.6"/><path d="M8.3 10.8 14.7 7.2M8.3 13.2 14.7 16.8"/></svg>;
    case 'image': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.4"/><circle cx="8.5" cy="10" r="1.7"/><path d="M21 15.5 L16 11 L5 19"/></svg>;
    case 'mega': return <svg {...p}><path d="M4 10v4l11 5V5L4 10Z"/><path d="M4 10H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1"/><path d="M18.5 9a3.5 3.5 0 0 1 0 6"/></svg>;
    default: return null;
  }
};

/* ---------- toggle ---------- */
const Toggle = ({ on, onClick }) => {
  const { T } = useUDJ();
  return (
    <div onClick={onClick} style={{ width: 44, height: 26, borderRadius: 9999, position: 'relative', flexShrink: 0,
      background: on ? T.jade : T.toggleOff, transition: 'background .18s', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 2, left: 2, width: 22, height: 22, borderRadius: 9999, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: on ? 'translateX(18px)' : 'none', transition: 'transform .18s' }}/>
    </div>
  );
};

/* ---------- avatar ---------- */
const Avatar = ({ size = 60, initials = 'AO', ring = false }) => {
  const { T } = useUDJ();
  return (
    <div style={{ width: size, height: size, borderRadius: 9999, background: T.jadeFaint, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: ring ? `0 0 0 3px ${T.surface}, 0 0 0 5px ${T.jadeFaint}` : 'none' }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: size * 0.42, color: T.jadeText }}>{initials}</span>
    </div>
  );
};

/* ---------- QR placeholder (always light) ---------- */
const QR = ({ size = 64, fg = '#0B5544' }) => {
  const cells = 9, gap = size / cells;
  const pattern = ['111111101','100000101','101110101','101110100','101110111','100000100','111111101','000000001','110101011'];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} rx={size * 0.06} fill="#fff"/>
      {pattern.map((row, y) => row.split('').map((v, x) => v === '1'
        ? <rect key={x + '-' + y} x={x * gap + 2} y={y * gap + 2} width={gap - 1} height={gap - 1} rx={0.8} fill={fg}/> : null))}
    </svg>
  );
};

/* ---------- course colours (12 sequential) + notification category map ---------- */
const COURSE_LIGHT = ['#6366F1','#2F7DD1','#1E94C4','#119A8B','#2E9E5B','#6B9A2E','#E08A1E','#E2673A','#E0556A','#D6519E','#8B5CF6','#5A6B7B'];
const COURSE_DARK  = ['#8488F5','#5AA0E6','#54B4DC','#36BCAC','#4FC07D','#93BE54','#F0A84B','#F08A5F','#F0808F','#E97FBE','#A98BF0','#9DB0BE'];
const courseColor = (T, idx) => (T.mode === 'dark' ? COURSE_DARK : COURSE_LIGHT)[(((idx | 0) % 12) + 12) % 12];

/* category/severity → { fg, bg } using theme tokens. severity overrides category. */
const notifColor = (T, cat, sev) => {
  if (sev === 'danger') return { fg: T.danger, bg: T.dangerBg };
  if (sev === 'warn') return { fg: T.amber, bg: T.amberBg };
  switch (cat) {
    case 'notes': return { fg: T.jadeText, bg: T.jadeFaint };
    case 'agenda': return { fg: T.blue, bg: T.blueBg };
    case 'presence': return { fg: T.amber, bg: T.amberBg };
    case 'news': return { fg: T.exam, bg: T.examBg };
    default: return { fg: T.slate, bg: T.slateBg };
  }
};
const newsColor = (T, cat) => {
  switch (cat) {
    case 'official': return { fg: T.jadeText, bg: T.jadeFaint };
    case 'events': return { fg: T.blue, bg: T.blueBg };
    case 'scolarite': return { fg: T.amber, bg: T.amberBg };
    case 'sport': return { fg: T.exam, bg: T.examBg };
    case 'jeunesse': return { fg: T.slate, bg: T.slateBg };
    case 'sponsors': return { fg: T.slate, bg: T.slateBg };
    default: return { fg: T.slate, bg: T.slateBg };
  }
};

Object.assign(window, {
  UDJ_LIGHT: LIGHT, UDJ_DARK: DARK, UDJ_STRINGS: STRINGS,
  UDJ_SANS: SANS, UDJ_ARFONT: ARFONT, UDJ_MONO: MONO, UDJ_FW: FW, UDJ_FH: FH,
  UDJCtx, useUDJ, StatusBar, Chevron, Back, Gear, Check, CatIcon, Toggle, Avatar, QR,
  courseColor, notifColor, newsColor,
});
