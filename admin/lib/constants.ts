import type { AdminRole } from './types';
import type { Tone } from './tokens';

/** Route paths. */
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  students: '/students',
  studentDetail: (id: string) => `/students/${id}`,
  studentsImport: '/students/import',
  grades: '/grades',
  gradeEntry: (subjectId: string) => `/grades/${subjectId}`,
  attendance: '/attendance',
  attendanceSession: '/attendance/session',
  news: '/news',
  newsCreate: '/news/create',
  schedule: '/schedule',
  academics: '/academics',
  notifications: '/notifications',
  admins: '/admins',
  audit: '/audit',
  settings: '/settings',
} as const;

/** Breadcrumb map (impl spec §8) — path prefix → trail. */
export interface Crumb {
  label: string;
  href?: string;
}

export const CRUMBS: { prefix: string; trail: Crumb[] }[] = [
  { prefix: '/students/import', trail: [{ label: 'Étudiants', href: '/students' }, { label: 'Importer' }] },
  { prefix: '/students/', trail: [{ label: 'Étudiants', href: '/students' }, { label: 'Fiche étudiant' }] },
  { prefix: '/students', trail: [{ label: 'Étudiants' }] },
  { prefix: '/grades/', trail: [{ label: 'Notes', href: '/grades' }, { label: 'Saisie' }] },
  { prefix: '/grades', trail: [{ label: 'Notes' }] },
  { prefix: '/attendance/session', trail: [{ label: 'Présence', href: '/attendance' }, { label: "Faire l'appel" }] },
  { prefix: '/attendance', trail: [{ label: 'Présence' }] },
  { prefix: '/news/create', trail: [{ label: 'Actualités', href: '/news' }, { label: 'Nouvel article' }] },
  { prefix: '/news', trail: [{ label: 'Actualités' }] },
  { prefix: '/schedule', trail: [{ label: 'Emploi du temps' }] },
  { prefix: '/academics', trail: [{ label: 'Académique' }] },
  { prefix: '/notifications', trail: [{ label: 'Notifications' }] },
  { prefix: '/admins', trail: [{ label: 'Administrateurs' }] },
  { prefix: '/audit', trail: [{ label: "Journal d'audit" }] },
  { prefix: '/settings', trail: [{ label: 'Paramètres' }] },
  { prefix: '/', trail: [{ label: 'Tableau de bord' }] },
];

export function crumbsFor(pathname: string): Crumb[] {
  const hit = CRUMBS.find((c) =>
    c.prefix === '/' ? pathname === '/' : pathname.startsWith(c.prefix)
  );
  return hit ? hit.trail : [{ label: 'Tableau de bord' }];
}

/** Role labels + tones (impl spec §9 RBAC). */
export const ROLE_META: Record<AdminRole, { label: string; tone: Tone; scope: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', tone: 'exam', scope: 'Accès complet · gère les administrateurs' },
  FACULTY_ADMIN: { label: 'Admin Faculté', tone: 'blue', scope: 'Emploi du temps, matières, présence' },
  REGISTRAR: { label: 'Scolarité', tone: 'jade', scope: 'Étudiants, notes, présence' },
  NEWS_EDITOR: { label: 'Éditeur', tone: 'amber', scope: 'Actualités et notifications' },
};

/** Student status → badge meta (impl spec §5 statusMeta). */
export const STATUS_META: Record<string, { tone: Tone; label: string }> = {
  ACTIVE: { tone: 'jade', label: 'Actif' },
  SUSPENDED: { tone: 'slate', label: 'Suspendu' },
  GRADUATED: { tone: 'blue', label: 'Diplômé' },
  risk: { tone: 'danger', label: 'À risque' },
};

/** News category → tone (impl spec §19). */
export const CATEGORY_TONES: Record<string, Tone> = {
  official: 'jade',
  events: 'blue',
  scolarite: 'amber',
  sport: 'exam',
  jeunesse: 'slate',
  sponsors: 'slate',
  general: 'slate',
};

export const CATEGORY_LABELS: Record<string, string> = {
  official: 'Officiel',
  events: 'Événements',
  scolarite: 'Scolarité',
  sport: 'Sport',
  jeunesse: 'Jeunesse',
  sponsors: 'Partenaires',
  general: 'Général',
};

/** Djibouti working week — Dimanche → Jeudi (reconciliation §2). */
export const WEEK_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'] as const;
export const WEEK_DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'] as const;

/** Schedule grid: 08:00–16:00, 64px/hour (reconciliation §2, impl spec §22). */
export const SCHEDULE_START_HOUR = 8;
export const SCHEDULE_END_HOUR = 16;
export const SCHEDULE_PX_PER_HOUR = 64;

export const SCHEDULE_TYPES: { value: string; label: string }[] = [
  { value: 'CM', label: 'CM' },
  { value: 'TD', label: 'TD' },
  { value: 'TP', label: 'TP' },
  { value: 'EXAM', label: 'Examen' },
];

export const PROGRAMME_LEVELS: { value: string; label: string }[] = [
  { value: 'DUT', label: 'DUT' },
  { value: 'LICENCE', label: 'Licence' },
  { value: 'MASTER', label: 'Master' },
  { value: 'DOCTORAT', label: 'Doctorat' },
];

// ─── RBAC page access ────────────────────────────────────────────────────────

export type PageKey =
  | 'dashboard'
  | 'students'
  | 'grades'
  | 'attendance'
  | 'news'
  | 'schedule'
  | 'academics'
  | 'notifications'
  | 'admins'
  | 'audit'
  | 'settings';

const ALL: AdminRole[] = ['SUPER_ADMIN', 'FACULTY_ADMIN', 'REGISTRAR', 'NEWS_EDITOR'];

/**
 * Which roles may see each section (task spec "RBAC in the UI"):
 * SUPER_ADMIN everything; REGISTRAR everything except admins (and the settings
 * danger zone, gated in-page); FACULTY_ADMIN scoped, no admins/settings/audit;
 * NEWS_EDITOR news (+ notifications, its composer scope) only.
 */
export const PAGE_ACCESS: Record<PageKey, AdminRole[]> = {
  dashboard: ALL,
  students: ['SUPER_ADMIN', 'REGISTRAR', 'FACULTY_ADMIN'],
  grades: ['SUPER_ADMIN', 'REGISTRAR', 'FACULTY_ADMIN'],
  attendance: ['SUPER_ADMIN', 'REGISTRAR', 'FACULTY_ADMIN'],
  news: ['SUPER_ADMIN', 'REGISTRAR', 'NEWS_EDITOR'],
  schedule: ['SUPER_ADMIN', 'REGISTRAR', 'FACULTY_ADMIN'],
  academics: ['SUPER_ADMIN', 'REGISTRAR', 'FACULTY_ADMIN'],
  notifications: ['SUPER_ADMIN', 'REGISTRAR', 'NEWS_EDITOR'],
  admins: ['SUPER_ADMIN'],
  audit: ['SUPER_ADMIN'],
  settings: ['SUPER_ADMIN'],
};

export function canAccess(role: AdminRole | undefined, page: PageKey): boolean {
  if (!role) return false;
  return PAGE_ACCESS[page].includes(role);
}

/** Recipient counts fallback labels for the notification composer. */
export const NOTIFICATION_TARGETS: { key: 'all' | 'faculty' | 'programme' | 'students'; label: string; desc: string }[] = [
  { key: 'all', label: 'Tous', desc: 'Tous les étudiants' },
  { key: 'faculty', label: 'Une faculté', desc: 'Étudiants d’une faculté' },
  { key: 'programme', label: 'Un programme', desc: 'Étudiants d’un programme' },
  { key: 'students', label: 'Un étudiant', desc: 'Sélection individuelle' },
];
