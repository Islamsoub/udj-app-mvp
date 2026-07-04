import { z } from 'zod';

/**
 * Zod schemas for every form (impl spec §27) — mirrors the backend route
 * validators so client-side errors match server-side rules.
 */

export const MATRICULE_REGEX = /^UDJ-\d{4}-\d{3,4}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').regex(EMAIL_REGEX, 'Email invalide'),
  password: z.string().min(4, 'Mot de passe requis'),
  stayConnected: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

// ─── Student (impl spec §27 StudentForm) ─────────────────────────────────────

const studentBase = z.object({
  firstName: z.string().min(2, '2 caractères minimum').max(50, '50 caractères maximum'),
  lastName: z.string().min(2, '2 caractères minimum').max(50, '50 caractères maximum'),
  matricule: z.string().regex(MATRICULE_REGEX, 'Format : UDJ-YYYY-NNNN'),
  email: z.string().regex(EMAIL_REGEX, 'Email invalide'),
  facultyId: z.string().min(1, 'Faculté requise'),
  programmeId: z.string().min(1, 'Programme requis'),
  currentSemester: z.coerce.number().int().min(1).max(10),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'GRADUATED']),
});

export const studentCreateSchema = studentBase.extend({
  password: z.string().min(8, 'Minimum 8 caractères'),
});
export type StudentCreateValues = z.infer<typeof studentCreateSchema>;

export const studentEditSchema = studentBase;
export type StudentEditValues = z.infer<typeof studentEditSchema>;

// ─── Admin (impl spec §27 AdminForm) ─────────────────────────────────────────

const adminBase = z
  .object({
    firstName: z.string().min(1, 'Prénom requis').max(50),
    lastName: z.string().min(1, 'Nom requis').max(50),
    email: z.string().regex(EMAIL_REGEX, 'Email invalide'),
    role: z.enum(['SUPER_ADMIN', 'FACULTY_ADMIN', 'REGISTRAR', 'NEWS_EDITOR'], {
      message: 'Rôle requis',
    }),
    facultyId: z.string().optional(),
  })
  .refine((d) => d.role !== 'FACULTY_ADMIN' || !!d.facultyId, {
    message: 'Le périmètre (faculté) est requis pour un admin de faculté',
    path: ['facultyId'],
  });

export const adminCreateSchema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis').max(50),
    lastName: z.string().min(1, 'Nom requis').max(50),
    email: z.string().regex(EMAIL_REGEX, 'Email invalide'),
    role: z.enum(['SUPER_ADMIN', 'FACULTY_ADMIN', 'REGISTRAR', 'NEWS_EDITOR'], {
      message: 'Rôle requis',
    }),
    facultyId: z.string().optional(),
    password: z.string().min(8, 'Minimum 8 caractères'),
  })
  .refine((d) => d.role !== 'FACULTY_ADMIN' || !!d.facultyId, {
    message: 'Le périmètre (faculté) est requis pour un admin de faculté',
    path: ['facultyId'],
  });
export type AdminCreateValues = z.infer<typeof adminCreateSchema>;

export const adminEditSchema = adminBase;
export type AdminEditValues = z.infer<typeof adminBase>;

// ─── Faculty (impl spec §27 FacultyForm — all 5 required) ────────────────────

export const facultySchema = z.object({
  nameFr: z.string().min(1, 'Nom (FR) requis'),
  nameAr: z.string().min(1, 'Nom (AR) requis'),
  code: z.string().min(1, 'Code requis').max(12, '12 caractères maximum'),
  phone: z.string().min(1, 'Téléphone requis'),
  email: z.string().regex(EMAIL_REGEX, 'Email invalide'),
  address: z.string().optional(),
  hours: z.string().optional(),
});
export type FacultyValues = z.infer<typeof facultySchema>;

// ─── Programme (impl spec §27 ProgrammeForm) ─────────────────────────────────

export const programmeSchema = z.object({
  nameFr: z.string().min(1, 'Nom (FR) requis'),
  nameAr: z.string().min(1, 'Nom (AR) requis'),
  code: z.string().min(1, 'Code requis').max(16),
  facultyId: z.string().min(1, 'Faculté requise'),
  level: z.enum(['DUT', 'LICENCE', 'MASTER', 'DOCTORAT'], { message: 'Niveau requis' }),
  durationSemesters: z.coerce.number().int().min(2, 'Entre 2 et 16').max(16, 'Entre 2 et 16'),
  totalCredits: z.coerce.number().int().min(1, 'Crédits requis'),
});
export type ProgrammeValues = z.infer<typeof programmeSchema>;

// ─── Subject (impl spec §27 SubjectForm) ─────────────────────────────────────

export const subjectSchema = z.object({
  nameFr: z.string().min(1, 'Nom (FR) requis'),
  nameAr: z.string().min(1, 'Nom (AR) requis'),
  code: z.string().min(1, 'Code requis').max(16),
  programmeId: z.string().min(1, 'Programme requis'),
  semesterId: z.string().min(1, 'Semestre requis'),
  coefficient: z.coerce.number().min(1, 'Entre 1 et 10').max(10, 'Entre 1 et 10'),
  credits: z.coerce.number().int().min(1, 'Entre 1 et 30').max(30, 'Entre 1 et 30'),
  hoursCm: z.coerce.number().min(0),
  hoursTd: z.coerce.number().min(0),
  hoursTp: z.coerce.number().min(0),
});
export type SubjectValues = z.infer<typeof subjectSchema>;

// ─── Semester (impl spec §27 SemesterForm) ───────────────────────────────────

export const semesterSchema = z.object({
  label: z.string().min(1, 'Libellé requis'),
  academicYear: z.string().min(1, 'Année académique requise'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  isCurrent: z.boolean(),
});
export type SemesterValues = z.infer<typeof semesterSchema>;

// ─── Schedule (impl spec §27 ScheduleForm — all required, end > start) ───────

export const scheduleSchema = z
  .object({
    subjectId: z.string().min(1, 'Matière requise'),
    programmeId: z.string().min(1, 'Programme requis'),
    semesterId: z.string().min(1, 'Semestre requis'),
    professorName: z.string().min(1, 'Enseignant requis'),
    room: z.string().min(1, 'Salle requise'),
    dayOfWeek: z.coerce.number().int().min(0).max(4),
    startTime: z.string().regex(TIME_REGEX, 'Heure invalide (HH:MM)'),
    endTime: z.string().regex(TIME_REGEX, 'Heure invalide (HH:MM)'),
    type: z.enum(['CM', 'TD', 'TP', 'EXAM'], { message: 'Type requis' }),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime'],
  });
export type ScheduleValues = z.infer<typeof scheduleSchema>;

// ─── News ────────────────────────────────────────────────────────────────────

export const newsSchema = z.object({
  titleFr: z.string().min(1, 'Titre requis'),
  bodyFr: z.string().min(1, 'Contenu requis'),
  category: z.string().min(1, 'Catégorie requise'),
  isUrgent: z.boolean(),
});
export type NewsValues = z.infer<typeof newsSchema>;

// ─── Notification composer ───────────────────────────────────────────────────

export const notificationSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(120, '120 caractères maximum'),
  body: z.string().min(1, 'Message requis').max(180, '180 caractères maximum'),
});
export type NotificationValues = z.infer<typeof notificationSchema>;
