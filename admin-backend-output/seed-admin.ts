/**
 * Admin portal seed — run AFTER the main seed (needs faculties to exist).
 *
 *   npx tsx prisma/seed-admin.ts     (or wire into package.json scripts)
 *
 * Seeds:
 *   • 6 admin accounts (reconciliation §4) — all password "admin1234".
 *   • 1 SystemSettings singleton row with defaults.
 *   • 19 AuditLog entries (implementation spec AuditEntry data, LOG-91NN ids).
 *   • 5 notification-history entries (NotifHistory data) as notification.send
 *     audit rows — the /admin/notifications/history endpoint reads these back.
 *
 * Idempotent: clears admin-scoped tables (audit_logs, admin_refresh_tokens,
 * admins, system_settings) and reseeds. Student/academic data is untouched.
 */
import { PrismaClient, AdminRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_COST = 12;
const DEFAULT_PASSWORD = 'admin1234';

interface AdminSeed {
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  facultyCode: string | null;
  active: boolean;
}

const ADMIN_SEED_DATA: AdminSeed[] = [
  { firstName: 'Saïd', lastName: 'Warsama', email: 'said.warsama@univ.dj', role: AdminRole.REGISTRAR, facultyCode: null, active: true },
  { firstName: 'Hassan', lastName: 'Aden', email: 'hassan.aden@univ.dj', role: AdminRole.SUPER_ADMIN, facultyCode: null, active: true },
  { firstName: 'Fatouma', lastName: 'Robleh', email: 'fatouma.robleh@univ.dj', role: AdminRole.NEWS_EDITOR, facultyCode: null, active: true },
  { firstName: 'Safia', lastName: 'Mohamed', email: 'safia.mohamed@univ.dj', role: AdminRole.FACULTY_ADMIN, facultyCode: 'FST', active: true },
  { firstName: 'Abdi', lastName: 'Farah', email: 'abdi.farah@univ.dj', role: AdminRole.FACULTY_ADMIN, facultyCode: 'FST', active: true },
  { firstName: 'Amina', lastName: 'Ismael', email: 'amina.ismael@univ.dj', role: AdminRole.REGISTRAR, facultyCode: null, active: false },
];

function daysAgo(n: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('[seed-admin] clearing admin tables…');
  await prisma.auditLog.deleteMany();
  await prisma.adminRefreshToken.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.systemSettings.deleteMany();

  // ── Resolve the FACULTY_ADMIN scope. Reconciliation lists "FST"; the base
  //    seed uses "FS" (Faculté des Sciences). Fall back gracefully.
  const fst =
    (await prisma.faculty.findUnique({ where: { code: 'FST' } })) ??
    (await prisma.faculty.findUnique({ where: { code: 'FS' } })) ??
    (await prisma.faculty.findFirst());
  if (!fst) {
    throw new Error('No faculty found — run the main seed (prisma/seed.ts) first.');
  }
  console.log(`[seed-admin] FACULTY_ADMIN scope → ${fst.code} (${fst.nameFr})`);

  // ── Admins ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_COST);
  const adminByName = new Map<string, string>();

  for (const a of ADMIN_SEED_DATA) {
    const admin = await prisma.admin.create({
      data: {
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        role: a.role,
        facultyId: a.role === AdminRole.FACULTY_ADMIN ? fst.id : null,
        isActive: a.active,
        passwordHash,
        lastLoginAt: a.active ? daysAgo(a.role === AdminRole.SUPER_ADMIN ? 0 : 2, 8, 30) : null,
      },
    });
    adminByName.set(`${a.firstName} ${a.lastName}`, admin.id);
  }
  console.log(`[seed-admin] created ${ADMIN_SEED_DATA.length} admins (password "${DEFAULT_PASSWORD}")`);

  const superId = adminByName.get('Hassan Aden')!;
  const registrarId = adminByName.get('Saïd Warsama')!;
  const editorId = adminByName.get('Fatouma Robleh')!;
  const facAdminId = adminByName.get('Safia Mohamed')!;

  // ── SystemSettings singleton ───────────────────────────────────────────────
  await prisma.systemSettings.create({
    data: {
      id: 'singleton',
      gradeWeightCc: 0.4,
      gradeWeightCf: 0.6,
      attendanceThreshold: 75,
      autoPublishGrades: false,
      notifyOnPublish: true,
      weeklyRecap: false,
    },
  });
  console.log('[seed-admin] created SystemSettings singleton');

  // ── 19 AuditLog entries (LOG-91NN) ─────────────────────────────────────────
  const IP_POOL = ['196.201.192.14', '196.201.192.51', '41.194.6.32', '154.62.10.7'];
  type Entry = {
    n: number;
    action: string;
    entityType: string;
    who: string;
    target: string;
    before: object | null;
    after: object | null;
    day: number;
    hour: number;
    min: number;
  };

  const entries: Entry[] = [
    { n: 1, action: 'grade.publish', entityType: 'Grade', who: registrarId, target: 'INF301 — Algorithmique avancée', before: { publishedAt: null }, after: { publishedAt: 'now', count: 38 }, day: 0, hour: 9, min: 12 },
    { n: 2, action: 'grade.update', entityType: 'Grade', who: registrarId, target: 'UDJ-2024-0432 · MAT202', before: { noteCc: 11, noteCf: 9 }, after: { noteCc: 12, noteCf: 13, noteFinale: 12.6 }, day: 0, hour: 8, min: 47 },
    { n: 3, action: 'attendance.approve', entityType: 'AttendanceRecord', who: facAdminId, target: 'UDJ-2024-0119 · absence 28/06', before: { justificationStatus: 'PENDING' }, after: { justificationStatus: 'APPROVED', status: 'JUSTIFIED' }, day: 0, hour: 8, min: 5 },
    { n: 4, action: 'news.create', entityType: 'NewsArticle', who: editorId, target: 'Inscription S2 ouverte', before: null, after: { titleFr: 'Inscription S2 ouverte', category: 'Académique' }, day: 1, hour: 16, min: 30 },
    { n: 5, action: 'notification.send', entityType: 'Notification', who: editorId, target: 'Tous les étudiants', before: null, after: { title: 'Résultats S2 disponibles', target: 'all', count: 2480, status: 'Envoyé via FCM' }, day: 1, hour: 15, min: 10 },
    { n: 6, action: 'student.create', entityType: 'Student', who: registrarId, target: 'UDJ-2025-0043 · Nour Abdi', before: null, after: { matricule: 'UDJ-2025-0043', programme: 'INFO' }, day: 1, hour: 11, min: 22 },
    { n: 7, action: 'student.status', entityType: 'Student', who: registrarId, target: 'UDJ-2023-0210 · Idriss Ali', before: { status: 'ACTIVE' }, after: { status: 'SUSPENDED' }, day: 2, hour: 14, min: 8 },
    { n: 8, action: 'student.resetPassword', entityType: 'Student', who: registrarId, target: 'UDJ-2024-0432 · Ahmed Omar', before: null, after: { reset: true }, day: 2, hour: 10, min: 41 },
    { n: 9, action: 'grade.bulkCreate', entityType: 'Grade', who: registrarId, target: 'INF201 — Bases de données', before: null, after: { saved: 41 }, day: 2, hour: 9, min: 3 },
    { n: 10, action: 'attendance.reject', entityType: 'AttendanceRecord', who: facAdminId, target: 'UDJ-2024-0305 · absence 24/06', before: { justificationStatus: 'PENDING' }, after: { justificationStatus: 'REJECTED' }, day: 3, hour: 13, min: 55 },
    { n: 11, action: 'attendance.record', entityType: 'AttendanceRecord', who: facAdminId, target: 'PHY305 · séance 23/06', before: null, after: { saved: 34 }, day: 3, hour: 11, min: 0 },
    { n: 12, action: 'subject.create', entityType: 'Subject', who: facAdminId, target: 'STA201 — Statistiques L2', before: null, after: { code: 'STA201', coefficient: 2 }, day: 4, hour: 15, min: 20 },
    { n: 13, action: 'news.update', entityType: 'NewsArticle', who: editorId, target: 'Journée portes ouvertes', before: { isUrgent: false }, after: { isUrgent: true }, day: 4, hour: 12, min: 47 },
    { n: 14, action: 'admin.create', entityType: 'Admin', who: superId, target: 'abdi.farah@univ.dj · FACULTY_ADMIN', before: null, after: { email: 'abdi.farah@univ.dj', role: 'FACULTY_ADMIN' }, day: 5, hour: 10, min: 15 },
    { n: 15, action: 'settings.update', entityType: 'SystemSettings', who: superId, target: 'Seuil d’assiduité', before: { attendanceThreshold: 70 }, after: { attendanceThreshold: 75 }, day: 5, hour: 9, min: 30 },
    { n: 16, action: 'grade.publish', entityType: 'Grade', who: registrarId, target: 'MAT202 — Mathématiques générales L2', before: { publishedAt: null }, after: { publishedAt: 'now', count: 40 }, day: 6, hour: 16, min: 2 },
    { n: 17, action: 'news.delete', entityType: 'NewsArticle', who: superId, target: 'Ancien communiqué', before: { titleFr: 'Ancien communiqué' }, after: null, day: 6, hour: 14, min: 44 },
    { n: 18, action: 'admin.deactivate', entityType: 'Admin', who: superId, target: 'amina.ismael@univ.dj', before: { isActive: true }, after: { isActive: false }, day: 7, hour: 11, min: 9 },
    { n: 19, action: 'student.bulkCreate', entityType: 'Student', who: superId, target: 'Import CSV · 39 étudiants', before: null, after: { created: 39, skipped: 3 }, day: 7, hour: 9, min: 0 },
  ];

  for (const e of entries) {
    await prisma.auditLog.create({
      data: {
        id: `LOG-91${String(e.n).padStart(2, '0')}`,
        adminId: e.who,
        action: e.action,
        entityType: e.entityType,
        entityId: null,
        before: e.before ?? undefined,
        after: e.after
          ? { ...e.after, target: (e.after as Record<string, unknown>).target ?? e.target }
          : undefined,
        ipAddress: IP_POOL[e.n % IP_POOL.length],
        createdAt: daysAgo(e.day, e.hour, e.min),
      },
    });
  }
  console.log(`[seed-admin] created ${entries.length} audit-log entries`);

  // ── 5 notification-history entries (NotifHistory) ───────────────────────────
  // Stored as notification.send audit rows; history endpoint reads `after`.
  const notifHistory = [
    { title: 'Résultats S2 disponibles', target: 'all', count: 2480, kind: 'notes', who: editorId, day: 1, hour: 9, min: 15 },
    { title: 'Reprise des cours lundi', target: 'all', count: 2480, kind: 'agenda', who: editorId, day: 3, hour: 17, min: 0 },
    { title: 'Alerte assiduité — FST', target: 'faculty', count: 1240, kind: 'presence', who: facAdminId, day: 5, hour: 10, min: 30 },
    { title: 'Nouvelle actualité campus', target: 'all', count: 2480, kind: 'news', who: editorId, day: 6, hour: 13, min: 20 },
    { title: 'Rappel inscription pédagogique', target: 'programme', count: 42, kind: 'agenda', who: registrarId, day: 8, hour: 8, min: 45 },
  ];

  for (let i = 0; i < notifHistory.length; i += 1) {
    const h = notifHistory[i];
    await prisma.auditLog.create({
      data: {
        id: `LOG-92${String(i + 1).padStart(2, '0')}`,
        adminId: h.who,
        action: 'notification.send',
        entityType: 'Notification',
        entityId: null,
        before: undefined,
        after: {
          title: h.title,
          target: h.target,
          count: h.count,
          kind: h.kind,
          status: 'Envoyé via FCM',
          sentAt: daysAgo(h.day, h.hour, h.min).toISOString(),
        },
        ipAddress: IP_POOL[i % IP_POOL.length],
        createdAt: daysAgo(h.day, h.hour, h.min),
      },
    });
  }
  console.log(`[seed-admin] created ${notifHistory.length} notification-history entries`);

  console.log('[seed-admin] ✓ done — log in with hassan.aden@univ.dj / admin1234 (SUPER_ADMIN)');
}

main()
  .catch((e) => {
    console.error('[seed-admin] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
