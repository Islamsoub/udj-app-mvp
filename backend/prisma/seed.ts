import {
  PrismaClient,
  ProgrammeLevel,
  StudentStatus,
  ScheduleEntryType,
  AttendanceStatus,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ── Clear all tables in reverse dependency order ──────────────────────────
  await prisma.refreshToken.deleteMany();
  await prisma.qrToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.scheduleEntry.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.faculty.deleteMany();

  // ── STEP 1 — Faculties ────────────────────────────────────────────────────
  const [fdeg, fllsh, , fs, fi, iuti, iutt] = await Promise.all([
    prisma.faculty.create({
      data: {
        code: 'FDEG',
        nameFr: "Faculté de Droit, d'Économie et de Gestion",
        nameAr: 'كلية الحقوق والاقتصاد والتسيير',
        email: 'fdeg@univ.edu.dj',
        phone: '(+253) 21 31 55 30',
        address: 'Campus de Balbala, Croisement RN2-RN5',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
    prisma.faculty.create({
      data: {
        code: 'FLLSH',
        nameFr: 'Faculté des Lettres, Langues et Sciences Humaines',
        nameAr: 'كلية الآداب واللغات والعلوم الإنسانية',
        email: 'fllsh@univ.edu.dj',
        phone: '(+253) 21 31 55 23',
        address: 'Campus de Balbala, Croisement RN2-RN5',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
    prisma.faculty.create({
      data: {
        code: 'FM',
        nameFr: 'Faculté de Médecine',
        nameAr: 'كلية الطب',
        email: 'fm@univ.edu.dj',
        phone: '(+253) 21 35 21 70',
        address: 'Rue Abdoulkader Waberi',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
    prisma.faculty.create({
      data: {
        code: 'FS',
        nameFr: 'Faculté des Sciences',
        nameAr: 'كلية العلوم',
        email: 'fs@univ.edu.dj',
        phone: '(+253) 21 31 55 55',
        address: 'Campus de Balbala, Croisement RN2-RN5',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
    prisma.faculty.create({
      data: {
        code: 'FI',
        nameFr: "Faculté d'Ingénieurs",
        nameAr: 'كلية الهندسة',
        email: 'fi@univ.edu.dj',
        phone: '(+253) 21 31 55 55',
        address: 'Campus de Balbala, Croisement RN2-RN5',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
    prisma.faculty.create({
      data: {
        code: 'IUTI',
        nameFr: 'Institut Universitaire de Technologie Industrielle',
        nameAr: 'المعهد الجامعي للتكنولوجيا الصناعية',
        email: 'iuti@univ.edu.dj',
        phone: '(+253) 21 31 55 55',
        address: 'Campus de Balbala, Croisement RN2-RN5',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
    prisma.faculty.create({
      data: {
        code: 'IUTT',
        nameFr: 'Institut Universitaire de Technologie Tertiaire',
        nameAr: 'المعهد الجامعي للتكنولوجيا الخدمية',
        email: 'iutt@univ.edu.dj',
        phone: '(+253) 21 32 36 00',
        address: 'Av. Djanaleh',
        hours: 'Dimanche – Jeudi 07h30 – 18h30',
      },
    }),
  ]);

  // ── STEP 2 — Programmes ───────────────────────────────────────────────────
  const [info, math, , , droit, , , , , ] = await Promise.all([
    // FS
    prisma.programme.create({
      data: { code: 'INFO', nameFr: 'Informatique', nameAr: 'المعلوماتية', level: ProgrammeLevel.LICENCE, facultyId: fs.id, durationSemesters: 6, totalCredits: 180 },
    }),
    prisma.programme.create({
      data: { code: 'MATH', nameFr: 'Mathématiques', nameAr: 'الرياضيات', level: ProgrammeLevel.LICENCE, facultyId: fs.id, durationSemesters: 6, totalCredits: 180 },
    }),
    prisma.programme.create({
      data: { code: 'BG', nameFr: 'Biologie & Géologie', nameAr: 'البيولوجيا والجيولوجيا', level: ProgrammeLevel.LICENCE, facultyId: fs.id, durationSemesters: 6, totalCredits: 180 },
    }),
    prisma.programme.create({
      data: { code: 'PC', nameFr: 'Physique & Chimie', nameAr: 'الفيزياء والكيمياء', level: ProgrammeLevel.LICENCE, facultyId: fs.id, durationSemesters: 6, totalCredits: 180 },
    }),
    // FDEG
    prisma.programme.create({
      data: { code: 'DROIT', nameFr: 'Droit', nameAr: 'الحقوق', level: ProgrammeLevel.LICENCE, facultyId: fdeg.id, durationSemesters: 6, totalCredits: 180 },
    }),
    prisma.programme.create({
      data: { code: 'EG', nameFr: 'Économie et Gestion', nameAr: 'الاقتصاد والتسيير', level: ProgrammeLevel.LICENCE, facultyId: fdeg.id, durationSemesters: 6, totalCredits: 180 },
    }),
    // FLLSH
    prisma.programme.create({
      data: { code: 'AS', nameFr: 'Anglais', nameAr: 'الإنجليزية', level: ProgrammeLevel.LICENCE, facultyId: fllsh.id, durationSemesters: 6, totalCredits: 180 },
    }),
    // FI
    prisma.programme.create({
      data: { code: 'GC', nameFr: 'Génie Civil', nameAr: 'الهندسة المدنية', level: ProgrammeLevel.MASTER, facultyId: fi.id, durationSemesters: 10, totalCredits: 300 },
    }),
    // IUTI
    prisma.programme.create({
      data: { code: 'GEII', nameFr: 'Génie Électrique et Informatique Industrielle', nameAr: 'الهندسة الكهربائية والمعلوماتية الصناعية', level: ProgrammeLevel.DUT, facultyId: iuti.id, durationSemesters: 4, totalCredits: 120 },
    }),
    // IUTT
    prisma.programme.create({
      data: { code: 'GEA', nameFr: 'Gestion des Entreprises et Administrations', nameAr: 'إدارة المؤسسات والإدارات', level: ProgrammeLevel.DUT, facultyId: iutt.id, durationSemesters: 4, totalCredits: 120 },
    }),
  ]);

  // ── STEP 3 — Semesters ────────────────────────────────────────────────────
  const [s1, s2] = await Promise.all([
    prisma.semester.create({
      data: {
        label: 'S1',
        academicYear: '2024-2025',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2025-01-31'),
        isCurrent: false,
      },
    }),
    prisma.semester.create({
      data: {
        label: 'S2',
        academicYear: '2024-2025',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-06-30'),
        isCurrent: true,
      },
    }),
  ]);

  // ── STEP 3b — S1 subjects (18 total, 6 per programme) ───────────────────
  const [inf201, inf202, inf203, mat201, phy201, ang201s1] = await Promise.all([
    prisma.subject.create({ data: { code: 'INF201', nameFr: 'Programmation orientée objet', nameAr: 'البرمجة كائنية التوجه', coefficient: 4, credits: 4, hoursCm: 24, hoursTd: 12, hoursTp: 12, programmeId: info.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'INF202', nameFr: 'Structures de données', nameAr: 'هياكل البيانات', coefficient: 3, credits: 3, hoursCm: 18, hoursTd: 12, hoursTp: 6, programmeId: info.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'INF203', nameFr: "Systèmes d'exploitation", nameAr: 'أنظمة التشغيل', coefficient: 3, credits: 3, hoursCm: 18, hoursTd: 12, hoursTp: 6, programmeId: info.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'MAT201', nameFr: 'Mathématiques discrètes', nameAr: 'الرياضيات المتقطعة', coefficient: 3, credits: 3, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: info.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'PHY201', nameFr: 'Électronique numérique', nameAr: 'الإلكترونيات الرقمية', coefficient: 2, credits: 2, hoursCm: 18, hoursTd: 6, hoursTp: 6, programmeId: info.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'ANG201', nameFr: 'Anglais technique S1', nameAr: 'الإنجليزية التقنية ف١', coefficient: 2, credits: 2, hoursCm: 0, hoursTd: 18, hoursTp: 0, programmeId: info.id, semesterId: s1.id } }),
  ]);

  const [drt201, drt202, drt203, his201, eco201, fra201] = await Promise.all([
    prisma.subject.create({ data: { code: 'DRT201', nameFr: 'Droit constitutionnel', nameAr: 'القانون الدستوري', coefficient: 4, credits: 4, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'DRT202', nameFr: 'Droit des obligations', nameAr: 'قانون الالتزامات', coefficient: 3, credits: 3, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'DRT203', nameFr: 'Droit pénal général', nameAr: 'القانون الجنائي العام', coefficient: 3, credits: 3, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'HIS201', nameFr: 'Histoire du droit', nameAr: 'تاريخ القانون', coefficient: 2, credits: 2, hoursCm: 18, hoursTd: 6, hoursTp: 0, programmeId: droit.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'ECO201', nameFr: 'Économie politique', nameAr: 'الاقتصاد السياسي', coefficient: 3, credits: 3, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'FRA201', nameFr: 'Méthodologie juridique', nameAr: 'المنهجية القانونية', coefficient: 2, credits: 2, hoursCm: 0, hoursTd: 18, hoursTp: 0, programmeId: droit.id, semesterId: s1.id } }),
  ]);

  const [alg101, ana101, top101, pro101, phy101, ang101] = await Promise.all([
    prisma.subject.create({ data: { code: 'ALG101', nameFr: 'Algèbre linéaire', nameAr: 'الجبر الخطي', coefficient: 4, credits: 4, hoursCm: 30, hoursTd: 18, hoursTp: 0, programmeId: math.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'ANA101', nameFr: 'Analyse réelle', nameAr: 'التحليل الحقيقي', coefficient: 4, credits: 4, hoursCm: 30, hoursTd: 18, hoursTp: 0, programmeId: math.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'TOP101', nameFr: 'Topologie générale', nameAr: 'الطوبولوجيا العامة', coefficient: 3, credits: 3, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: math.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'PRO101', nameFr: 'Probabilités', nameAr: 'الاحتمالات', coefficient: 3, credits: 3, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: math.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'PHY101', nameFr: 'Mécanique classique', nameAr: 'الميكانيكا الكلاسيكية', coefficient: 2, credits: 2, hoursCm: 18, hoursTd: 12, hoursTp: 6, programmeId: math.id, semesterId: s1.id } }),
    prisma.subject.create({ data: { code: 'ANG101', nameFr: 'Anglais scientifique', nameAr: 'الإنجليزية العلمية', coefficient: 2, credits: 2, hoursCm: 0, hoursTd: 18, hoursTp: 0, programmeId: math.id, semesterId: s1.id } }),
  ]);

  // ── STEP 4 — 8 subjects for Informatique L2 S2 ───────────────────────────
  const [inf301, inf302, mat301, phy301, inf303, inf304, ang301, sta301] =
    await Promise.all([
      prisma.subject.create({
        data: { code: 'INF301', nameFr: 'Algorithmique avancée', nameAr: 'الخوارزميات المتقدمة', coefficient: 4, credits: 5, hoursCm: 24, hoursTd: 12, hoursTp: 12, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'INF302', nameFr: 'Bases de données', nameAr: 'قواعد البيانات', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 12, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'MAT301', nameFr: 'Mathématiques générales L2', nameAr: 'الرياضيات العامة س٢', coefficient: 4, credits: 5, hoursCm: 30, hoursTd: 18, hoursTp: 0, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'PHY301', nameFr: 'Physique quantique', nameAr: 'الفيزياء الكمية', coefficient: 3, credits: 4, hoursCm: 24, hoursTd: 12, hoursTp: 6, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'INF303', nameFr: 'Réseaux informatiques', nameAr: 'شبكات الحاسوب', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 6, hoursTp: 18, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'INF304', nameFr: "Systèmes d'exploitation", nameAr: 'أنظمة التشغيل', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 12, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'ANG301', nameFr: 'Anglais technique', nameAr: 'الإنجليزية التقنية', coefficient: 2, credits: 2, hoursCm: 12, hoursTd: 12, hoursTp: 0, programmeId: info.id, semesterId: s2.id },
      }),
      prisma.subject.create({
        data: { code: 'STA301', nameFr: 'Statistiques L2', nameAr: 'الإحصاء س٢', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 18, hoursTp: 0, programmeId: info.id, semesterId: s2.id },
      }),
    ]);

  // ── STEP 4b — 7 subjects for Droit L2 S2 (Fatima) ───────────────────────
  const [drt301, drt302, drt303, drt304, his301, fra301, eco311] = await Promise.all([
    prisma.subject.create({
      data: { code: 'DRT301', nameFr: 'Droit Civil', nameAr: 'القانون المدني', coefficient: 4, credits: 5, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'DRT302', nameFr: 'Droit Constitutionnel', nameAr: 'القانون الدستوري', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'DRT303', nameFr: 'Droit Administratif', nameAr: 'القانون الإداري', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'DRT304', nameFr: 'Droit Pénal Général', nameAr: 'قانون العقوبات العام', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'HIS301', nameFr: 'Histoire du Droit', nameAr: 'تاريخ القانون', coefficient: 2, credits: 3, hoursCm: 18, hoursTd: 6, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'FRA301', nameFr: 'Langue Française Juridique', nameAr: 'اللغة الفرنسية القانونية', coefficient: 2, credits: 2, hoursCm: 0, hoursTd: 18, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'ECO311', nameFr: 'Économie Politique', nameAr: 'الاقتصاد السياسي', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 0, programmeId: droit.id, semesterId: s2.id },
    }),
  ]);

  // ── STEP 4c — 7 subjects for Mathématiques L2 S2 (Youssouf) ──────────────
  const [alg201, ana201, top201, pro201, phy211, inf211, ang211] = await Promise.all([
    prisma.subject.create({
      data: { code: 'ALG201', nameFr: 'Algèbre Linéaire', nameAr: 'الجبر الخطي', coefficient: 4, credits: 5, hoursCm: 30, hoursTd: 18, hoursTp: 0, programmeId: math.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'ANA201', nameFr: 'Analyse Réelle', nameAr: 'التحليل الحقيقي', coefficient: 4, credits: 5, hoursCm: 30, hoursTd: 18, hoursTp: 0, programmeId: math.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'TOP201', nameFr: 'Topologie Générale', nameAr: 'التبولوجيا العامة', coefficient: 3, credits: 4, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: math.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'PRO201', nameFr: 'Probabilités & Statistiques', nameAr: 'الاحتمالات والإحصاء', coefficient: 3, credits: 4, hoursCm: 24, hoursTd: 12, hoursTp: 0, programmeId: math.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'PHY211', nameFr: 'Mécanique Classique', nameAr: 'الميكانيكا الكلاسيكية', coefficient: 3, credits: 4, hoursCm: 18, hoursTd: 12, hoursTp: 6, programmeId: math.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'INF211', nameFr: 'Programmation Scientifique', nameAr: 'البرمجة العلمية', coefficient: 2, credits: 3, hoursCm: 12, hoursTd: 0, hoursTp: 18, programmeId: math.id, semesterId: s2.id },
    }),
    prisma.subject.create({
      data: { code: 'ANG211', nameFr: 'Anglais Scientifique', nameAr: 'الإنجليزية العلمية', coefficient: 2, credits: 2, hoursCm: 0, hoursTd: 18, hoursTp: 0, programmeId: math.id, semesterId: s2.id },
    }),
  ]);

  // ── STEP 5 — Student Ahmed ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('test1234', 12);
  const ahmed = await prisma.student.create({
    data: {
      studentIdDisplay: 'UDJ-2024-0432',
      firstName: 'Ahmed',
      lastName: 'Omar Said',
      email: 'ahmed.omar@univ-djibouti.dj',
      photoUrl: null,
      currentSemester: 4,
      status: StudentStatus.ACTIVE,
      passwordHash,
      programmeId: info.id,
      notifGrades: true,
      notifCourses: true,
      notifAttendance: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
  });

  // ── STEP 5b — Student Fatima ─────────────────────────────────────────────
  const fatima = await prisma.student.create({
    data: {
      studentIdDisplay: 'UDJ-2024-0587',
      firstName: 'Fatima',
      lastName: 'Hassan Ali',
      email: 'fatima.hassan@univ-djibouti.dj',
      photoUrl: null,
      currentSemester: 4,
      status: StudentStatus.ACTIVE,
      passwordHash,
      programmeId: droit.id,
      notifGrades: true,
      notifCourses: true,
      notifAttendance: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    },
  });

  // ── STEP 5c — Student Youssouf ────────────────────────────────────────────
  const youssouf = await prisma.student.create({
    data: {
      studentIdDisplay: 'UDJ-2024-0891',
      firstName: 'Youssouf',
      lastName: 'Mohamed Daher',
      email: 'youssouf.mohamed@univ-djibouti.dj',
      photoUrl: null,
      currentSemester: 4,
      status: StudentStatus.ACTIVE,
      passwordHash,
      programmeId: math.id,
      notifGrades: true,
      notifCourses: true,
      notifAttendance: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '06:00',
    },
  });

  // ── STEP 6 — Grades ───────────────────────────────────────────────────────
  await prisma.grade.createMany({
    data: [
      { studentId: ahmed.id, subjectId: inf301.id, semesterId: s2.id, noteCc: 14.0,  noteCf: 15.5,  noteFinale: 14.9,  isValidated: true  },
      { studentId: ahmed.id, subjectId: inf302.id, semesterId: s2.id, noteCc: 12.0,  noteCf: 13.0,  noteFinale: 12.6,  isValidated: true  },
      { studentId: ahmed.id, subjectId: mat301.id, semesterId: s2.id, noteCc: 13.0,  noteCf: 15.0,  noteFinale: 14.2,  isValidated: true  },
      { studentId: ahmed.id, subjectId: phy301.id, semesterId: s2.id, noteCc:  8.0,  noteCf:  7.0,  noteFinale:  7.4,  isValidated: false },
      { studentId: ahmed.id, subjectId: inf303.id, semesterId: s2.id, noteCc: 16.0,  noteCf: 14.0,  noteFinale: 14.8,  isValidated: true  },
      { studentId: ahmed.id, subjectId: inf304.id, semesterId: s2.id, noteCc: 11.0,  noteCf: 10.5,  noteFinale: 10.7,  isValidated: true  },
      { studentId: ahmed.id, subjectId: ang301.id, semesterId: s2.id, noteCc: 15.0,  noteCf: 17.0,  noteFinale: 16.2,  isValidated: true  },
      { studentId: ahmed.id, subjectId: sta301.id, semesterId: s2.id, noteCc:  9.0,  noteCf:  6.0,  noteFinale:  7.2,  isValidated: false },
    ],
  });

  // ── STEP 6b — Grades (Fatima) ────────────────────────────────────────────
  await prisma.grade.createMany({
    data: [
      { studentId: fatima.id, subjectId: drt301.id, semesterId: s2.id, noteCc: 16.0, noteCf: 17.5, noteFinale: 16.9, isValidated: true  },
      { studentId: fatima.id, subjectId: drt302.id, semesterId: s2.id, noteCc: 14.0, noteCf: 13.0, noteFinale: 13.4, isValidated: true  },
      { studentId: fatima.id, subjectId: drt303.id, semesterId: s2.id, noteCc: 11.0, noteCf: 10.0, noteFinale: 10.4, isValidated: true  },
      { studentId: fatima.id, subjectId: drt304.id, semesterId: s2.id, noteCc:  9.0, noteCf:  8.5, noteFinale:  8.7, isValidated: false },
      { studentId: fatima.id, subjectId: his301.id, semesterId: s2.id, noteCc: 15.0, noteCf: 16.0, noteFinale: 15.6, isValidated: true  },
      { studentId: fatima.id, subjectId: fra301.id, semesterId: s2.id, noteCc: 13.0, noteCf: 12.5, noteFinale: 12.7, isValidated: true  },
      { studentId: fatima.id, subjectId: eco311.id, semesterId: s2.id, noteCc:  7.0, noteCf:  6.5, noteFinale:  6.7, isValidated: false },
    ],
  });

  // ── STEP 6c — Grades (Youssouf) ──────────────────────────────────────────
  await prisma.grade.createMany({
    data: [
      { studentId: youssouf.id, subjectId: alg201.id, semesterId: s2.id, noteCc: 17.0, noteCf: 18.0, noteFinale: 17.6, isValidated: true  },
      { studentId: youssouf.id, subjectId: ana201.id, semesterId: s2.id, noteCc: 15.0, noteCf: 16.5, noteFinale: 15.9, isValidated: true  },
      { studentId: youssouf.id, subjectId: top201.id, semesterId: s2.id, noteCc: 12.0, noteCf: 11.0, noteFinale: 11.4, isValidated: true  },
      { studentId: youssouf.id, subjectId: pro201.id, semesterId: s2.id, noteCc: 13.0, noteCf: 12.0, noteFinale: 12.4, isValidated: true  },
      { studentId: youssouf.id, subjectId: phy211.id, semesterId: s2.id, noteCc: 10.0, noteCf:  9.5, noteFinale:  9.7, isValidated: true  },
      { studentId: youssouf.id, subjectId: inf211.id, semesterId: s2.id, noteCc:  6.0, noteCf:  5.5, noteFinale:  5.7, isValidated: false },
      { studentId: youssouf.id, subjectId: ang211.id, semesterId: s2.id, noteCc: 11.0, noteCf: 12.0, noteFinale: 11.6, isValidated: true  },
    ],
  });

  // ── STEP 6d — S1 Grades ──────────────────────────────────────────────────
  // Ahmed: GPA ~12.65 (Assez Bien) — improving to ~14.5 in S2
  // Weighted: 13.0*4 + 12.0*3 + 11.5*3 + 13.5*3 + 12.0*2 + 14.0*2 = 215 / 17 = 12.65
  await prisma.grade.createMany({
    data: [
      { studentId: ahmed.id, subjectId: inf201.id, semesterId: s1.id, noteCc: 12.0, noteCf: 13.5, noteFinale: 13.0, isValidated: true },
      { studentId: ahmed.id, subjectId: inf202.id, semesterId: s1.id, noteCc: 11.0, noteCf: 12.5, noteFinale: 12.0, isValidated: true },
      { studentId: ahmed.id, subjectId: inf203.id, semesterId: s1.id, noteCc: 10.5, noteCf: 12.0, noteFinale: 11.5, isValidated: true },
      { studentId: ahmed.id, subjectId: mat201.id, semesterId: s1.id, noteCc: 13.0, noteCf: 14.0, noteFinale: 13.5, isValidated: true },
      { studentId: ahmed.id, subjectId: phy201.id, semesterId: s1.id, noteCc: 11.0, noteCf: 13.0, noteFinale: 12.0, isValidated: true },
      { studentId: ahmed.id, subjectId: ang201s1.id, semesterId: s1.id, noteCc: 13.5, noteCf: 14.5, noteFinale: 14.0, isValidated: true },
    ],
  });

  // Fatima: GPA ~15.53 (Bien) — consistently excellent in S1 and S2 (~16.2)
  // Weighted: 15.5*4 + 16.0*3 + 14.5*3 + 15.0*2 + 16.5*3 + 15.5*2 = 264 / 17 = 15.53
  await prisma.grade.createMany({
    data: [
      { studentId: fatima.id, subjectId: drt201.id, semesterId: s1.id, noteCc: 15.0, noteCf: 16.0, noteFinale: 15.5, isValidated: true },
      { studentId: fatima.id, subjectId: drt202.id, semesterId: s1.id, noteCc: 15.5, noteCf: 16.5, noteFinale: 16.0, isValidated: true },
      { studentId: fatima.id, subjectId: drt203.id, semesterId: s1.id, noteCc: 14.0, noteCf: 15.0, noteFinale: 14.5, isValidated: true },
      { studentId: fatima.id, subjectId: his201.id, semesterId: s1.id, noteCc: 14.5, noteCf: 15.5, noteFinale: 15.0, isValidated: true },
      { studentId: fatima.id, subjectId: eco201.id, semesterId: s1.id, noteCc: 16.0, noteCf: 17.0, noteFinale: 16.5, isValidated: true },
      { studentId: fatima.id, subjectId: fra201.id, semesterId: s1.id, noteCc: 15.0, noteCf: 16.0, noteFinale: 15.5, isValidated: true },
    ],
  });

  // Youssouf: GPA ~10.64 (Passable) — declining to ~9.8 in S2 (concern)
  // Weighted: 11.0*4 + 10.5*4 + 10.0*3 + 11.5*3 + 10.0*2 + 10.5*2 = 191.5 / 18 = 10.64
  await prisma.grade.createMany({
    data: [
      { studentId: youssouf.id, subjectId: alg101.id, semesterId: s1.id, noteCc: 10.5, noteCf: 11.5, noteFinale: 11.0, isValidated: true },
      { studentId: youssouf.id, subjectId: ana101.id, semesterId: s1.id, noteCc: 10.0, noteCf: 11.0, noteFinale: 10.5, isValidated: true },
      { studentId: youssouf.id, subjectId: top101.id, semesterId: s1.id, noteCc:  9.5, noteCf: 10.5, noteFinale: 10.0, isValidated: true },
      { studentId: youssouf.id, subjectId: pro101.id, semesterId: s1.id, noteCc: 11.0, noteCf: 12.0, noteFinale: 11.5, isValidated: true },
      { studentId: youssouf.id, subjectId: phy101.id, semesterId: s1.id, noteCc:  9.5, noteCf: 10.5, noteFinale: 10.0, isValidated: true },
      { studentId: youssouf.id, subjectId: ang101.id, semesterId: s1.id, noteCc: 10.0, noteCf: 11.0, noteFinale: 10.5, isValidated: true },
    ],
  });

  // ── STEP 7 — Schedule entries (Sun–Thu, 3 per day) ────────────────────────
  const effectiveDate = new Date('2025-02-01');
  await prisma.scheduleEntry.createMany({
    data: [
      // Sunday (0)
      { subjectId: inf301.id, semesterId: s2.id, dayOfWeek: 0, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.CM, room: 'Amphi A1',    professorName: 'Pr. Hassan Robleh',  effectiveDate },
      { subjectId: mat301.id, semesterId: s2.id, dayOfWeek: 0, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Amphi B2',    professorName: 'Pr. Abdi Farah',     effectiveDate },
      { subjectId: inf302.id, semesterId: s2.id, dayOfWeek: 0, startTime: '13:00', endTime: '14:30', type: ScheduleEntryType.TD, room: 'Salle C12',   professorName: 'Dr. Safia Mohamed',  effectiveDate },
      // Monday (1)
      { subjectId: phy301.id, semesterId: s2.id, dayOfWeek: 1, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.CM, room: 'Amphi A1',    professorName: 'Pr. Moussa Ali',     effectiveDate },
      { subjectId: inf303.id, semesterId: s2.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Salle D04',   professorName: 'Dr. Omar Hassan',    effectiveDate },
      { subjectId: inf304.id, semesterId: s2.id, dayOfWeek: 1, startTime: '14:00', endTime: '16:00', type: ScheduleEntryType.TP, room: 'Labo Info 2', professorName: 'Dr. Youssouf Ahmed', effectiveDate },
      // Tuesday (2)
      { subjectId: ang301.id, semesterId: s2.id, dayOfWeek: 2, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.TD, room: 'Salle B08',   professorName: 'Mrs. Amina Aden',    effectiveDate },
      { subjectId: sta301.id, semesterId: s2.id, dayOfWeek: 2, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Amphi B2',    professorName: 'Pr. Ibrahim Djama',  effectiveDate },
      { subjectId: inf301.id, semesterId: s2.id, dayOfWeek: 2, startTime: '13:00', endTime: '14:30', type: ScheduleEntryType.TD, room: 'Salle C12',   professorName: 'Pr. Hassan Robleh',  effectiveDate },
      // Wednesday (3)
      { subjectId: inf302.id, semesterId: s2.id, dayOfWeek: 3, startTime: '08:00', endTime: '10:00', type: ScheduleEntryType.TP, room: 'Labo Info 1', professorName: 'Dr. Safia Mohamed',  effectiveDate },
      { subjectId: mat301.id, semesterId: s2.id, dayOfWeek: 3, startTime: '10:30', endTime: '12:00', type: ScheduleEntryType.TD, room: 'Salle A05',   professorName: 'Pr. Abdi Farah',     effectiveDate },
      { subjectId: phy301.id, semesterId: s2.id, dayOfWeek: 3, startTime: '14:00', endTime: '15:30', type: ScheduleEntryType.TD, room: 'Salle D04',   professorName: 'Pr. Moussa Ali',     effectiveDate },
      // Thursday (4)
      { subjectId: inf303.id, semesterId: s2.id, dayOfWeek: 4, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.TP, room: 'Labo Info 2', professorName: 'Dr. Omar Hassan',    effectiveDate },
      { subjectId: inf304.id, semesterId: s2.id, dayOfWeek: 4, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Amphi A1',    professorName: 'Dr. Youssouf Ahmed', effectiveDate },
      { subjectId: sta301.id, semesterId: s2.id, dayOfWeek: 4, startTime: '13:00', endTime: '14:30', type: ScheduleEntryType.TD, room: 'Salle B08',   professorName: 'Pr. Ibrahim Djama',  effectiveDate },
    ],
  });

  // ── STEP 7b — Schedule entries (Fatima / Droit) ──────────────────────────
  await prisma.scheduleEntry.createMany({
    data: [
      // Sunday (0)
      { subjectId: drt301.id, semesterId: s2.id, dayOfWeek: 0, startTime: '08:00', endTime: '10:00', type: ScheduleEntryType.CM, room: 'Amphi D1',  professorName: 'Pr. Amina Bogoreh',  effectiveDate },
      { subjectId: his301.id, semesterId: s2.id, dayOfWeek: 0, startTime: '10:30', endTime: '12:00', type: ScheduleEntryType.CM, room: 'Salle 101', professorName: 'Pr. Hodan Warsama',  effectiveDate },
      { subjectId: eco311.id, semesterId: s2.id, dayOfWeek: 0, startTime: '14:00', endTime: '15:30', type: ScheduleEntryType.TD, room: 'Salle 103', professorName: 'Dr. Nour Ibrahim',   effectiveDate },
      // Monday (1)
      { subjectId: drt302.id, semesterId: s2.id, dayOfWeek: 1, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.CM, room: 'Amphi D1',  professorName: 'Pr. Amina Bogoreh',  effectiveDate },
      { subjectId: drt303.id, semesterId: s2.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Salle 102', professorName: 'Dr. Ali Hassan',     effectiveDate },
      { subjectId: drt304.id, semesterId: s2.id, dayOfWeek: 1, startTime: '14:00', endTime: '15:30', type: ScheduleEntryType.TD, room: 'Salle 104', professorName: 'Dr. Ali Hassan',     effectiveDate },
      // Tuesday (2)
      { subjectId: drt301.id, semesterId: s2.id, dayOfWeek: 2, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.TD, room: 'Salle 101', professorName: 'Pr. Amina Bogoreh',  effectiveDate },
      { subjectId: drt302.id, semesterId: s2.id, dayOfWeek: 2, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.TD, room: 'Salle 102', professorName: 'Pr. Amina Bogoreh',  effectiveDate },
      { subjectId: fra301.id, semesterId: s2.id, dayOfWeek: 2, startTime: '13:00', endTime: '14:30', type: ScheduleEntryType.TD, room: 'Salle 103', professorName: 'Mme. Safia Djama',   effectiveDate },
      // Wednesday (3)
      { subjectId: drt303.id, semesterId: s2.id, dayOfWeek: 3, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.TD, room: 'Salle 102', professorName: 'Dr. Ali Hassan',     effectiveDate },
      { subjectId: drt304.id, semesterId: s2.id, dayOfWeek: 3, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Amphi D1',  professorName: 'Dr. Ali Hassan',     effectiveDate },
      // Thursday (4)
      { subjectId: eco311.id, semesterId: s2.id, dayOfWeek: 4, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.CM, room: 'Salle 103', professorName: 'Dr. Nour Ibrahim',   effectiveDate },
      { subjectId: his301.id, semesterId: s2.id, dayOfWeek: 4, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.TD, room: 'Salle 101', professorName: 'Pr. Hodan Warsama',  effectiveDate },
      { subjectId: fra301.id, semesterId: s2.id, dayOfWeek: 4, startTime: '13:00', endTime: '14:30', type: ScheduleEntryType.CM, room: 'Salle 104', professorName: 'Mme. Safia Djama',   effectiveDate },
    ],
  });

  // ── STEP 7c — Schedule entries (Youssouf / Mathématiques) ────────────────
  await prisma.scheduleEntry.createMany({
    data: [
      // Sunday (0)
      { subjectId: alg201.id, semesterId: s2.id, dayOfWeek: 0, startTime: '08:00', endTime: '10:00', type: ScheduleEntryType.CM, room: 'Amphi E1',  professorName: 'Pr. Said Elmi',      effectiveDate },
      { subjectId: ana201.id, semesterId: s2.id, dayOfWeek: 0, startTime: '10:30', endTime: '12:00', type: ScheduleEntryType.CM, room: 'Amphi E1',  professorName: 'Pr. Said Elmi',      effectiveDate },
      // Monday (1)
      { subjectId: top201.id, semesterId: s2.id, dayOfWeek: 1, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.CM, room: 'Salle F01', professorName: 'Dr. Yassin Omar',    effectiveDate },
      { subjectId: pro201.id, semesterId: s2.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.CM, room: 'Salle F02', professorName: 'Dr. Yassin Omar',    effectiveDate },
      { subjectId: inf211.id, semesterId: s2.id, dayOfWeek: 1, startTime: '14:00', endTime: '16:00', type: ScheduleEntryType.TP, room: 'Labo Sci',  professorName: 'Mr. Mahad Ali',      effectiveDate },
      // Tuesday (2)
      { subjectId: alg201.id, semesterId: s2.id, dayOfWeek: 2, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.TD, room: 'Salle F01', professorName: 'Pr. Said Elmi',      effectiveDate },
      { subjectId: ana201.id, semesterId: s2.id, dayOfWeek: 2, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.TD, room: 'Salle F01', professorName: 'Pr. Said Elmi',      effectiveDate },
      { subjectId: phy211.id, semesterId: s2.id, dayOfWeek: 2, startTime: '13:00', endTime: '14:30', type: ScheduleEntryType.CM, room: 'Amphi E2',  professorName: 'Pr. Houssein Farah', effectiveDate },
      // Wednesday (3)
      { subjectId: top201.id, semesterId: s2.id, dayOfWeek: 3, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.TD, room: 'Salle F02', professorName: 'Dr. Yassin Omar',    effectiveDate },
      { subjectId: pro201.id, semesterId: s2.id, dayOfWeek: 3, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.TD, room: 'Salle F02', professorName: 'Dr. Yassin Omar',    effectiveDate },
      { subjectId: phy211.id, semesterId: s2.id, dayOfWeek: 3, startTime: '14:00', endTime: '15:30', type: ScheduleEntryType.TD, room: 'Salle F03', professorName: 'Pr. Houssein Farah', effectiveDate },
      // Thursday (4)
      { subjectId: inf211.id, semesterId: s2.id, dayOfWeek: 4, startTime: '08:00', endTime: '09:30', type: ScheduleEntryType.CM, room: 'Salle F01', professorName: 'Mr. Mahad Ali',      effectiveDate },
      { subjectId: ang211.id, semesterId: s2.id, dayOfWeek: 4, startTime: '10:00', endTime: '11:30', type: ScheduleEntryType.TD, room: 'Salle F04', professorName: 'Mme. Fadumo Elmi',   effectiveDate },
    ],
  });

  // ── STEP 8 — Attendance records (10 sessions per subject) ────────────────
  // Feb 2 = Sunday, Feb 3 = Monday, Feb 4 = Tuesday, Feb 5 = Wednesday, Feb 6 = Thursday
  function weeklyDates(start: string, count: number): Date[] {
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i * 7);
      return d;
    });
  }

  const sunDates = weeklyDates('2025-02-02', 10); // INF301, MAT301
  const monDates = weeklyDates('2025-02-03', 10); // PHY301, INF303, INF304
  const tueDates = weeklyDates('2025-02-04', 10); // ANG301
  const wedDates = weeklyDates('2025-02-05', 10); // INF302
  const thuDates = weeklyDates('2025-02-06', 10); // STA301

  type AttRow = {
    studentId: string;
    subjectId: string;
    sessionDate: Date;
    status: AttendanceStatus;
    justificationUrl: null;
  };

  const rows: AttRow[] = [];

  // INF301 — 10/10 PRESENT (Sunday)
  sunDates.forEach((d) =>
    rows.push({ studentId: ahmed.id, subjectId: inf301.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );

  // INF302 — 9/10, index 4 ABSENT (Wednesday)
  wedDates.forEach((d, i) =>
    rows.push({ studentId: ahmed.id, subjectId: inf302.id, sessionDate: d, status: i === 4 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );

  // MAT301 — 10/10 PRESENT (Sunday — same dates as INF301, different subject, no conflict)
  sunDates.forEach((d) =>
    rows.push({ studentId: ahmed.id, subjectId: mat301.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );

  // PHY301 — 7/10: indices 3,6 ABSENT + index 8 JUSTIFIED (Monday)
  monDates.forEach((d, i) => {
    const status =
      i === 3 || i === 6 ? AttendanceStatus.ABSENT :
      i === 8             ? AttendanceStatus.JUSTIFIED :
                            AttendanceStatus.PRESENT;
    rows.push({ studentId: ahmed.id, subjectId: phy301.id, sessionDate: d, status, justificationUrl: null });
  });

  // INF303 — 9/10: index 5 JUSTIFIED (Monday)
  monDates.forEach((d, i) =>
    rows.push({ studentId: ahmed.id, subjectId: inf303.id, sessionDate: d, status: i === 5 ? AttendanceStatus.JUSTIFIED : AttendanceStatus.PRESENT, justificationUrl: null })
  );

  // INF304 — 8/10: indices 4,7 ABSENT (Monday)
  monDates.forEach((d, i) =>
    rows.push({ studentId: ahmed.id, subjectId: inf304.id, sessionDate: d, status: i === 4 || i === 7 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );

  // ANG301 — 10/10 PRESENT (Tuesday)
  tueDates.forEach((d) =>
    rows.push({ studentId: ahmed.id, subjectId: ang301.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );

  // STA301 — 8/10: index 3 ABSENT + index 6 JUSTIFIED (Thursday)
  thuDates.forEach((d, i) => {
    const status =
      i === 3 ? AttendanceStatus.ABSENT :
      i === 6 ? AttendanceStatus.JUSTIFIED :
                AttendanceStatus.PRESENT;
    rows.push({ studentId: ahmed.id, subjectId: sta301.id, sessionDate: d, status, justificationUrl: null });
  });

  await prisma.attendanceRecord.createMany({ data: rows });

  // ── STEP 8b — Attendance records (Fatima) ────────────────────────────────
  const fatimaRows: AttRow[] = [];

  // DRT301 — 10/10 PRESENT
  sunDates.forEach((d) =>
    fatimaRows.push({ studentId: fatima.id, subjectId: drt301.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // DRT302 — 9/10: index 7 ABSENT
  monDates.forEach((d, i) =>
    fatimaRows.push({ studentId: fatima.id, subjectId: drt302.id, sessionDate: d, status: i === 7 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // DRT303 — 10/10 PRESENT
  monDates.forEach((d) =>
    fatimaRows.push({ studentId: fatima.id, subjectId: drt303.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // DRT304 — 8/10: indices 2, 5 ABSENT
  monDates.forEach((d, i) =>
    fatimaRows.push({ studentId: fatima.id, subjectId: drt304.id, sessionDate: d, status: i === 2 || i === 5 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // HIS301 — 10/10 PRESENT
  sunDates.forEach((d) =>
    fatimaRows.push({ studentId: fatima.id, subjectId: his301.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // FRA301 — 9/10: index 4 JUSTIFIED
  tueDates.forEach((d, i) =>
    fatimaRows.push({ studentId: fatima.id, subjectId: fra301.id, sessionDate: d, status: i === 4 ? AttendanceStatus.JUSTIFIED : AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // ECO311 — 6/10 at risk: indices 1, 4, 7 ABSENT + index 9 JUSTIFIED
  thuDates.forEach((d, i) => {
    const status =
      i === 1 || i === 4 || i === 7 ? AttendanceStatus.ABSENT :
      i === 9                        ? AttendanceStatus.JUSTIFIED :
                                       AttendanceStatus.PRESENT;
    fatimaRows.push({ studentId: fatima.id, subjectId: eco311.id, sessionDate: d, status, justificationUrl: null });
  });

  await prisma.attendanceRecord.createMany({ data: fatimaRows });

  // ── STEP 8c — Attendance records (Youssouf) ──────────────────────────────
  const youssoufRows: AttRow[] = [];

  // ALG201 — 10/10 PRESENT
  sunDates.forEach((d) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: alg201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // ANA201 — 10/10 PRESENT
  sunDates.forEach((d) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: ana201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // TOP201 — 9/10: index 6 ABSENT
  monDates.forEach((d, i) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: top201.id, sessionDate: d, status: i === 6 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // PRO201 — 10/10 PRESENT
  monDates.forEach((d) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: pro201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // PHY211 — 8/10: indices 3, 8 ABSENT
  tueDates.forEach((d, i) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: phy211.id, sessionDate: d, status: i === 3 || i === 8 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // INF211 — 7/10 at risk: indices 0, 4, 6 ABSENT
  monDates.forEach((d, i) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: inf211.id, sessionDate: d, status: i === 0 || i === 4 || i === 6 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );
  // ANG211 — 9/10: index 2 ABSENT
  thuDates.forEach((d, i) =>
    youssoufRows.push({ studentId: youssouf.id, subjectId: ang211.id, sessionDate: d, status: i === 2 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null })
  );

  await prisma.attendanceRecord.createMany({ data: youssoufRows });

  // ── STEP 8d — S1 Attendance (10 sessions per subject, S1 date range) ──────
  const s1SunDates = weeklyDates('2024-09-15', 10);
  const s1MonDates = weeklyDates('2024-09-16', 10);
  const s1TueDates = weeklyDates('2024-09-17', 10);
  const s1WedDates = weeklyDates('2024-09-18', 10);
  const s1ThuDates = weeklyDates('2024-09-19', 10);

  const s1AhmedRows: AttRow[] = [];
  // INF201 — 9/10: index 5 ABSENT (Sun)
  s1SunDates.forEach((d, i) => s1AhmedRows.push({ studentId: ahmed.id, subjectId: inf201.id, sessionDate: d, status: i === 5 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // INF202 — 8/10: indices 2, 7 ABSENT (Mon)
  s1MonDates.forEach((d, i) => s1AhmedRows.push({ studentId: ahmed.id, subjectId: inf202.id, sessionDate: d, status: i === 2 || i === 7 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // INF203 — 9/10: index 4 JUSTIFIED (Tue)
  s1TueDates.forEach((d, i) => s1AhmedRows.push({ studentId: ahmed.id, subjectId: inf203.id, sessionDate: d, status: i === 4 ? AttendanceStatus.JUSTIFIED : AttendanceStatus.PRESENT, justificationUrl: null }));
  // MAT201 — 10/10 PRESENT (Wed)
  s1WedDates.forEach((d) => s1AhmedRows.push({ studentId: ahmed.id, subjectId: mat201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  // PHY201 — 9/10: index 6 ABSENT (Thu)
  s1ThuDates.forEach((d, i) => s1AhmedRows.push({ studentId: ahmed.id, subjectId: phy201.id, sessionDate: d, status: i === 6 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // ANG201 — 10/10 PRESENT (Mon)
  s1MonDates.forEach((d) => s1AhmedRows.push({ studentId: ahmed.id, subjectId: ang201s1.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  await prisma.attendanceRecord.createMany({ data: s1AhmedRows });

  const s1FatimaRows: AttRow[] = [];
  // DRT201 — 10/10 PRESENT (Sun)
  s1SunDates.forEach((d) => s1FatimaRows.push({ studentId: fatima.id, subjectId: drt201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  // DRT202 — 10/10 PRESENT (Mon)
  s1MonDates.forEach((d) => s1FatimaRows.push({ studentId: fatima.id, subjectId: drt202.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  // DRT203 — 9/10: index 3 ABSENT (Tue)
  s1TueDates.forEach((d, i) => s1FatimaRows.push({ studentId: fatima.id, subjectId: drt203.id, sessionDate: d, status: i === 3 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // HIS201 — 10/10 PRESENT (Wed)
  s1WedDates.forEach((d) => s1FatimaRows.push({ studentId: fatima.id, subjectId: his201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  // ECO201 — 9/10: index 8 JUSTIFIED (Thu)
  s1ThuDates.forEach((d, i) => s1FatimaRows.push({ studentId: fatima.id, subjectId: eco201.id, sessionDate: d, status: i === 8 ? AttendanceStatus.JUSTIFIED : AttendanceStatus.PRESENT, justificationUrl: null }));
  // FRA201 — 10/10 PRESENT (Sun)
  s1SunDates.forEach((d) => s1FatimaRows.push({ studentId: fatima.id, subjectId: fra201.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  await prisma.attendanceRecord.createMany({ data: s1FatimaRows });

  const s1YoussoufRows: AttRow[] = [];
  // ALG101 — 8/10: indices 1, 6 ABSENT (Sun)
  s1SunDates.forEach((d, i) => s1YoussoufRows.push({ studentId: youssouf.id, subjectId: alg101.id, sessionDate: d, status: i === 1 || i === 6 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // ANA101 — 7/10: indices 2, 5, 8 ABSENT (Mon)
  s1MonDates.forEach((d, i) => s1YoussoufRows.push({ studentId: youssouf.id, subjectId: ana101.id, sessionDate: d, status: i === 2 || i === 5 || i === 8 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // TOP101 — 8/10: indices 3, 7 ABSENT (Tue)
  s1TueDates.forEach((d, i) => s1YoussoufRows.push({ studentId: youssouf.id, subjectId: top101.id, sessionDate: d, status: i === 3 || i === 7 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // PRO101 — 10/10 PRESENT (Wed)
  s1WedDates.forEach((d) => s1YoussoufRows.push({ studentId: youssouf.id, subjectId: pro101.id, sessionDate: d, status: AttendanceStatus.PRESENT, justificationUrl: null }));
  // PHY101 — 8/10: indices 0, 4 ABSENT (Thu)
  s1ThuDates.forEach((d, i) => s1YoussoufRows.push({ studentId: youssouf.id, subjectId: phy101.id, sessionDate: d, status: i === 0 || i === 4 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  // ANG101 — 9/10: index 9 ABSENT (Mon)
  s1MonDates.forEach((d, i) => s1YoussoufRows.push({ studentId: youssouf.id, subjectId: ang101.id, sessionDate: d, status: i === 9 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, justificationUrl: null }));
  await prisma.attendanceRecord.createMany({ data: s1YoussoufRows });

  // ── STEP 9 — Notifications ────────────────────────────────────────────────
  const now = new Date();
  const minsAgo  = (m: number) => new Date(now.getTime() - m * 60_000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const daysAgo  = (d: number) => new Date(now.getTime() - d * 86_400_000);

  function yesterdayAt(h: number, m: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(h, m, 0, 0);
    return d;
  }

  await prisma.notification.createMany({
    data: [
      {
        studentId: ahmed.id,
        type: NotificationType.GRADES,
        titleFr: 'Vos notes de Mathématiques Générales L2 sont disponibles',
        titleAr: 'درجاتك في الرياضيات العامة س٢ متاحة',
        bodyFr: 'Consultez votre relevé pour le détail des évaluations du semestre.',
        bodyAr: 'اطلع على كشفك لمعرفة تفاصيل تقييمات السداسي.',
        createdAt: minsAgo(12),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.SCHEDULE,
        titleFr: 'Cours dans 15 minutes — Amphi A1',
        titleAr: 'محاضرة بعد ١٥ دقيقة — مدرج A1',
        bodyFr: 'Algorithmique avancée avec Pr. Hassan Robleh.',
        bodyAr: 'الخوارزميات المتقدمة مع أ.د. حسن روبله.',
        createdAt: hoursAgo(1),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.ATTENDANCE,
        titleFr: 'Présence Physique Quantique à 72% — sous le seuil',
        titleAr: 'الحضور في الفيزياء الكمية ٧٢٪ — تحت العتبة',
        bodyFr: "Vous risquez d'être déclaré non-assidu. Justifiez vos absences.",
        bodyAr: 'قد تُعتبر غير مواظب. قم بتبرير غياباتك.',
        createdAt: yesterdayAt(14, 32),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.GENERAL,
        titleFr: '3 nouvelles notifications',
        titleAr: '٣ إشعارات جديدة',
        bodyFr: "Mises à jour d'emploi du temps et nouvelles publications.",
        bodyAr: 'تحديثات الجدول والمنشورات الجديدة.',
        createdAt: yesterdayAt(9, 15),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.SCHEDULE,
        titleFr: 'Examen final déplacé au 18 juin',
        titleAr: 'تأجيل الامتحان النهائي إلى ١٨ جوان',
        bodyFr: 'Statistiques L2 — nouvelle salle : Amphi C103.',
        bodyAr: 'الإحصاء س٢ — قاعة جديدة : مدرج C103.',
        createdAt: daysAgo(5),
      },
    ],
  });

  // ── STEP 9b — Notifications (Fatima) ─────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        studentId: fatima.id,
        type: NotificationType.ATTENDANCE,
        titleFr: 'Présence Économie Politique à 60% — sous le seuil',
        titleAr: 'الحضور في الاقتصاد السياسي ٦٠٪ — تحت العتبة',
        bodyFr: "Vous risquez d'être déclarée non-assidue. Justifiez vos absences.",
        bodyAr: 'قد تُعتبرين غير مواظبة. قومي بتبرير غياباتك.',
        createdAt: hoursAgo(3),
      },
      {
        studentId: fatima.id,
        type: NotificationType.GRADES,
        titleFr: 'Vos notes de Droit Civil sont disponibles',
        titleAr: 'درجاتك في القانون المدني متاحة',
        bodyFr: 'Consultez votre relevé pour le détail des évaluations.',
        bodyAr: 'اطلعي على كشفك لمعرفة تفاصيل التقييمات.',
        createdAt: daysAgo(1),
      },
    ],
  });

  // ── STEP 9c — Notifications (Youssouf) ───────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        studentId: youssouf.id,
        type: NotificationType.ATTENDANCE,
        titleFr: 'Présence Programmation Scientifique à 70% — sous le seuil',
        titleAr: 'الحضور في البرمجة العلمية ٧٠٪ — تحت العتبة',
        bodyFr: "Vous risquez d'être déclaré non-assidu. Justifiez vos absences.",
        bodyAr: 'قد تُعتبر غير مواظب. قم بتبرير غياباتك.',
        createdAt: hoursAgo(5),
      },
      {
        studentId: youssouf.id,
        type: NotificationType.GRADES,
        titleFr: "Vos notes d'Algèbre Linéaire sont disponibles",
        titleAr: 'درجاتك في الجبر الخطي متاحة',
        bodyFr: 'Consultez votre relevé pour le détail des évaluations.',
        bodyAr: 'اطلع على كشفك لمعرفة تفاصيل التقييمات.',
        createdAt: daysAgo(2),
      },
    ],
  });

  // ── STEP 9d — Additional notifications (all students, S1 results + variety) ─
  await prisma.notification.createMany({
    data: [
      {
        studentId: ahmed.id,
        type: NotificationType.GRADES,
        titleFr: 'Résultats du S1 validés par le conseil pédagogique',
        titleAr: 'نتائج الفصل الأول معتمدة من المجلس البيداغوجي',
        bodyFr: 'Vos résultats du premier semestre ont été officiellement validés.',
        bodyAr: 'تم اعتماد نتائج الفصل الأول رسمياً.',
        isRead: true,
        createdAt: daysAgo(14),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.SCHEDULE,
        titleFr: 'Emploi du temps S2 mis à jour',
        titleAr: 'تم تحديث جدول الفصل الثاني',
        bodyFr: 'Votre emploi du temps pour le second semestre est maintenant disponible.',
        bodyAr: 'جدولك للفصل الثاني متوفر الآن.',
        isRead: true,
        createdAt: daysAgo(3),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.GENERAL,
        titleFr: 'Inscription aux examens finaux ouverte',
        titleAr: 'التسجيل في الامتحانات النهائية مفتوح',
        bodyFr: "Connectez-vous au portail avant le 10 juin pour confirmer votre inscription aux examens.",
        bodyAr: 'سجّل في البوابة قبل 10 يونيو لتأكيد تسجيلك في الامتحانات.',
        isRead: false,
        createdAt: daysAgo(5),
      },
      {
        studentId: ahmed.id,
        type: NotificationType.GENERAL,
        titleFr: "Rappel : rapport de stage à rendre le 15 mai",
        titleAr: 'تذكير: تقرير التدريب يجب تسليمه في 15 مايو',
        bodyFr: "Déposez votre rapport au secrétariat ou via le portail étudiant avant la date limite.",
        bodyAr: 'سلّم تقريرك في الأمانة أو عبر بوابة الطالب قبل الموعد النهائي.',
        isRead: false,
        createdAt: daysAgo(7),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        studentId: fatima.id,
        type: NotificationType.GRADES,
        titleFr: 'Résultats du S1 validés par le conseil pédagogique',
        titleAr: 'نتائج الفصل الأول معتمدة من المجلس البيداغوجي',
        bodyFr: 'Vos résultats du premier semestre ont été officiellement validés.',
        bodyAr: 'تم اعتماد نتائج الفصل الأول رسمياً.',
        isRead: true,
        createdAt: daysAgo(14),
      },
      {
        studentId: fatima.id,
        type: NotificationType.SCHEDULE,
        titleFr: 'Emploi du temps S2 mis à jour',
        titleAr: 'تم تحديث جدول الفصل الثاني',
        bodyFr: 'Votre emploi du temps pour le second semestre est maintenant disponible.',
        bodyAr: 'جدولك للفصل الثاني متوفر الآن.',
        isRead: true,
        createdAt: daysAgo(3),
      },
      {
        studentId: fatima.id,
        type: NotificationType.GENERAL,
        titleFr: 'Inscription aux examens finaux ouverte',
        titleAr: 'التسجيل في الامتحانات النهائية مفتوح',
        bodyFr: "Connectez-vous au portail avant le 10 juin pour confirmer votre inscription aux examens.",
        bodyAr: 'سجّل في البوابة قبل 10 يونيو لتأكيد تسجيلك في الامتحانات.',
        isRead: false,
        createdAt: daysAgo(5),
      },
      {
        studentId: fatima.id,
        type: NotificationType.GENERAL,
        titleFr: "Rappel : rapport de stage à rendre le 15 mai",
        titleAr: 'تذكير: تقرير التدريب يجب تسليمه في 15 مايو',
        bodyFr: "Déposez votre rapport au secrétariat ou via le portail étudiant avant la date limite.",
        bodyAr: 'سلّم تقريرك في الأمانة أو عبر بوابة الطالب قبل الموعد النهائي.',
        isRead: false,
        createdAt: daysAgo(7),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        studentId: youssouf.id,
        type: NotificationType.GRADES,
        titleFr: 'Résultats du S1 validés par le conseil pédagogique',
        titleAr: 'نتائج الفصل الأول معتمدة من المجلس البيداغوجي',
        bodyFr: 'Vos résultats du premier semestre ont été officiellement validés.',
        bodyAr: 'تم اعتماد نتائج الفصل الأول رسمياً.',
        isRead: true,
        createdAt: daysAgo(14),
      },
      {
        studentId: youssouf.id,
        type: NotificationType.SCHEDULE,
        titleFr: 'Emploi du temps S2 mis à jour',
        titleAr: 'تم تحديث جدول الفصل الثاني',
        bodyFr: 'Votre emploi du temps pour le second semestre est maintenant disponible.',
        bodyAr: 'جدولك للفصل الثاني متوفر الآن.',
        isRead: true,
        createdAt: daysAgo(3),
      },
      {
        studentId: youssouf.id,
        type: NotificationType.ATTENDANCE,
        titleFr: 'Votre taux de présence est en baisse',
        titleAr: 'معدل حضورك في انخفاض',
        bodyFr: "Votre présence globale est passée sous 80%. Pensez à régulariser votre situation.",
        bodyAr: 'انخفض معدل حضورك الكلي تحت 80%. تذكّر تسوية وضعك.',
        isRead: false,
        createdAt: daysAgo(2),
      },
      {
        studentId: youssouf.id,
        type: NotificationType.GENERAL,
        titleFr: 'Inscription aux examens finaux ouverte',
        titleAr: 'التسجيل في الامتحانات النهائية مفتوح',
        bodyFr: "Connectez-vous au portail avant le 10 juin pour confirmer votre inscription aux examens.",
        bodyAr: 'سجّل في البوابة قبل 10 يونيو لتأكيد تسجيلك في الامتحانات.',
        isRead: false,
        createdAt: daysAgo(5),
      },
      {
        studentId: youssouf.id,
        type: NotificationType.GENERAL,
        titleFr: "Rappel : rapport de stage à rendre le 15 mai",
        titleAr: 'تذكير: تقرير التدريب يجب تسليمه في 15 مايو',
        bodyFr: "Déposez votre rapport au secrétariat ou via le portail étudiant avant la date limite.",
        bodyAr: 'سلّم تقريرك في الأمانة أو عبر بوابة الطالب قبل الموعد النهائي.',
        isRead: false,
        createdAt: daysAgo(7),
      },
    ],
  });

  // ── STEP 10 — News articles ───────────────────────────────────────────────
  await prisma.newsArticle.createMany({
    data: [
      {
        titleFr: "Inscriptions pour l'année universitaire 2025-2026 ouvertes",
        titleAr: 'فتح باب التسجيل للعام الجامعي 2025-2026',
        bodyFr: "L'Université de Djibouti annonce l'ouverture des inscriptions pour l'année universitaire 2025-2026. Les étudiants actuels et nouveaux sont invités à compléter leur dossier avant le 15 septembre 2025.\n\nLes inscriptions se font en ligne via le portail étudiant ou en personne au bureau de la scolarité, bâtiment A, rez-de-chaussée. Les documents requis incluent une copie de la carte d'identité, le relevé de notes du baccalauréat, et deux photos d'identité récentes.\n\nLes frais d'inscription restent inchangés par rapport à l'année précédente. Des bourses sont disponibles pour les étudiants méritants — consultez le bureau des affaires sociales pour plus d'informations.\n\nPour toute question, contactez le service de la scolarité à scolarite@univ-djibouti.dj ou appelez le +253 21 35 10 07.",
        bodyAr: "تعلن جامعة جيبوتي عن فتح باب التسجيل للعام الجامعي 2025-2026. يُدعى الطلاب الحاليون والجدد لإكمال ملفاتهم قبل 15 سبتمبر 2025.\n\nيتم التسجيل عبر الإنترنت من خلال بوابة الطالب أو شخصياً في مكتب الشؤون الدراسية، المبنى أ، الطابق الأرضي.",
        heroImageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        category: 'official',
        readTimeMinutes: 4,
        isUrgent: true,
        publishedAt: daysAgo(2),
      },
      {
        titleFr: 'Journée portes ouvertes — Samedi 24 mai',
        titleAr: 'يوم الأبواب المفتوحة — السبت 24 مايو',
        bodyFr: "Découvrez les filières et rencontrez les enseignants. Programme complet disponible à l'accueil.\n\nLa journée débutera à 9h00 avec un mot de bienvenue du président de l'université, suivi de présentations par chaque département. Des stands d'information seront installés dans la cour principale où les futurs étudiants pourront poser leurs questions directement aux professeurs et aux étudiants actuels.\n\nUn déjeuner sera offert à midi dans le restaurant universitaire. L'après-midi sera consacrée aux visites guidées des laboratoires, de la bibliothèque et des installations sportives.\n\nInscription gratuite mais obligatoire sur le site web de l'université.",
        bodyAr: 'اكتشفوا التخصصات وتعرفوا على الأساتذة. البرنامج الكامل متوفر في الاستقبال.',
        heroImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        category: 'events',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(4),
      },
      {
        titleFr: 'Calendrier des examens du second semestre publié',
        titleAr: 'نشر جدول امتحانات الفصل الثاني',
        bodyFr: "Le calendrier des examens finaux du second semestre est désormais disponible. Les épreuves se dérouleront du 15 au 30 juin 2026.\n\nChaque étudiant est tenu de vérifier son emploi du temps personnel sur le portail. En cas d'erreur ou de conflit d'horaire, veuillez contacter votre département avant le 10 juin.\n\nRappel : tout retard de plus de 15 minutes entraîne l'interdiction d'accès à la salle d'examen. Les téléphones portables doivent être éteints et déposés à l'entrée.",
        bodyAr: 'جدول الامتحانات النهائية للفصل الثاني متوفر الآن. ستجرى الاختبارات من 15 إلى 30 يونيو 2026.',
        heroImageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
        category: 'scolarite',
        readTimeMinutes: 2,
        isUrgent: false,
        publishedAt: daysAgo(6),
      },
      {
        titleFr: 'Tournoi inter-facultés de football — Résultats',
        titleAr: 'نتائج بطولة كرة القدم بين الكليات',
        bodyFr: "La faculté des Sciences et Technologies remporte le tournoi inter-facultés 2026 ! Après trois semaines de compétition intense, l'équipe de Sciences et Tech a battu la faculté de Droit 3-1 en finale.\n\nMeilleur joueur du tournoi : Ahmed Hassan (Sciences et Tech) avec 7 buts en 5 matchs. Le prix du meilleur gardien revient à Youssouf Ali (Lettres et Sciences Humaines).\n\nLe prochain tournoi de basketball débutera le 15 octobre. Les inscriptions des équipes sont ouvertes jusqu'au 1er octobre auprès du service des sports.",
        bodyAr: 'فازت كلية العلوم والتكنولوجيا ببطولة 2026 بين الكليات! بعد ثلاثة أسابيع من المنافسة المكثفة.',
        heroImageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
        category: 'sport',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(8),
      },
      {
        titleFr: 'Coopération UDJ — Istanbul Technical University',
        titleAr: 'تعاون بين جامعة جيبوتي وجامعة إسطنبول التقنية',
        bodyFr: "L'Université de Djibouti et Istanbul Technical University ont signé un accord de coopération académique pour la période 2025-2030. Cet accord ouvre de nouvelles perspectives pour les étudiants et les chercheurs des deux institutions.\n\nLes points clés de l'accord incluent un programme d'échange d'étudiants permettant à 10 étudiants par an de passer un semestre dans l'institution partenaire, la co-direction de thèses de doctorat, et la mise en place de projets de recherche conjoints dans les domaines de l'intelligence artificielle et des énergies renouvelables.\n\nLes étudiants intéressés par le programme d'échange peuvent déposer leur candidature auprès du bureau des relations internationales avant le 31 mars de chaque année. Les critères de sélection incluent un GPA minimum de 14/20 et un niveau B2 en anglais.\n\nUne délégation d'ITU visitera le campus de Djibouti en novembre pour une série de conférences ouvertes à tous.",
        bodyAr: 'وقعت جامعة جيبوتي وجامعة إسطنبول التقنية اتفاقية تعاون أكاديمي للفترة 2025-2030.',
        heroImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
        category: 'official',
        readTimeMinutes: 5,
        isUrgent: false,
        publishedAt: daysAgo(10),
      },
      {
        titleFr: 'Nouvelle bibliothèque numérique accessible aux étudiants',
        titleAr: 'مكتبة رقمية جديدة متاحة للطلاب',
        bodyFr: "L'université met à disposition une plateforme de bibliothèque numérique donnant accès à plus de 50 000 ouvrages, revues scientifiques et mémoires. L'accès est gratuit pour tous les étudiants inscrits.\n\nPour vous connecter, utilisez vos identifiants du portail étudiant sur biblio.univ-djibouti.dj. La plateforme est accessible 24h/24 depuis n'importe quel appareil.\n\nDes formations à l'utilisation de la bibliothèque numérique sont organisées chaque lundi de 14h à 15h dans la salle informatique B12.",
        bodyAr: 'توفر الجامعة منصة مكتبة رقمية تتيح الوصول إلى أكثر من 50,000 كتاب ومجلة علمية. الدخول مجاني لجميع الطلاب المسجلين.',
        heroImageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
        category: 'official',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(12),
      },
      {
        titleFr: 'Résultats du concours de programmation — Hackathon UDJ 2026',
        titleAr: 'نتائج مسابقة البرمجة — هاكاثون UDJ 2026',
        bodyFr: "Le premier Hackathon de l'Université de Djibouti s'est tenu le weekend dernier avec la participation de 45 équipes. Le thème de cette édition : « Solutions numériques pour Djibouti ».\n\nL'équipe gagnante, composée de Farah Ali, Hodan Mohamed et Saïd Youssouf (tous en L3 Informatique), a développé une application de covoiturage adaptée aux trajets urbains de Djibouti-ville. Leur solution a impressionné le jury par son interface intuitive et son modèle économique viable.\n\nLe deuxième prix revient à une application de gestion de l'eau potable, et le troisième à un chatbot d'assistance administrative pour les étudiants.\n\nLes trois équipes gagnantes recevront un accompagnement de l'incubateur universitaire pour développer leurs projets.",
        bodyAr: 'أقيم أول هاكاثون لجامعة جيبوتي في نهاية الأسبوع الماضي بمشاركة 45 فريقاً.',
        heroImageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
        category: 'events',
        readTimeMinutes: 4,
        isUrgent: false,
        publishedAt: daysAgo(14),
      },
      {
        titleFr: 'Changement des horaires de la bibliothèque pendant le Ramadan',
        titleAr: 'تغيير مواعيد المكتبة خلال شهر رمضان',
        bodyFr: "Pendant le mois de Ramadan, les horaires de la bibliothèque universitaire sont modifiés comme suit :\n\nDimanche à Jeudi : 8h00 – 14h00 puis 21h00 – 00h00\nVendredi et Samedi : Fermée\n\nLa salle de lecture reste accessible pendant les horaires d'ouverture. Les emprunts et retours de livres se font uniquement le matin.\n\nRamadan Kareem à toute la communauté universitaire.",
        bodyAr: 'خلال شهر رمضان، تم تعديل مواعيد المكتبة الجامعية. رمضان كريم لجميع أفراد الأسرة الجامعية.',
        heroImageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80',
        category: 'scolarite',
        readTimeMinutes: 2,
        isUrgent: true,
        publishedAt: daysAgo(16),
      },
      {
        titleFr: 'Programme de mentorat pour les nouveaux étudiants',
        titleAr: 'برنامج إرشاد للطلاب الجدد',
        bodyFr: "Le programme de mentorat « Grands frères, grandes sœurs » reprend pour la rentrée 2025. Chaque nouvel étudiant sera jumelé avec un étudiant de 2ème ou 3ème année qui l'accompagnera pendant son premier semestre.\n\nLes mentors bénévoles recevront une formation le 5 septembre et un certificat de compétences en fin d'année. Si vous êtes en L2 ou L3 et souhaitez devenir mentor, inscrivez-vous avant le 25 août sur le portail étudiant.\n\nL'an dernier, 87% des étudiants mentorés ont déclaré que le programme les avait aidés à s'intégrer plus rapidement.",
        bodyAr: 'يعود برنامج الإرشاد للعام الدراسي 2025. سيتم ربط كل طالب جديد بطالب من السنة الثانية أو الثالثة.',
        heroImageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
        category: 'events',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(18),
      },
      {
        titleFr: "Bourses d'excellence — Appel à candidatures",
        titleAr: 'منح التميز — دعوة للترشح',
        bodyFr: "L'Université de Djibouti offre 20 bourses d'excellence pour l'année 2025-2026, couvrant la totalité des frais de scolarité et une allocation mensuelle de 50 000 FDJ.\n\nCritères d'éligibilité :\n- GPA supérieur ou égal à 16/20 au dernier semestre\n- Présence supérieure à 90%\n- Aucune sanction disciplinaire\n\nLes dossiers de candidature doivent être déposés au bureau des affaires sociales avant le 15 juillet. Les résultats seront annoncés le 1er août.\n\nPour plus d'informations, consultez le guide des bourses sur le portail étudiant ou contactez bourses@univ-djibouti.dj.",
        bodyAr: 'تقدم جامعة جيبوتي 20 منحة تميز للعام 2025-2026، تشمل الرسوم الدراسية الكاملة وبدل شهري.',
        heroImageUrl: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&q=80',
        category: 'scolarite',
        readTimeMinutes: 4,
        isUrgent: false,
        publishedAt: daysAgo(20),
      },
      {
        titleFr: "Conférence : L'intelligence artificielle en Afrique de l'Est",
        titleAr: 'محاضرة: الذكاء الاصطناعي في شرق أفريقيا',
        bodyFr: "Le département d'informatique organise une conférence ouverte à tous sur le thème de l'intelligence artificielle et ses applications dans la région. Intervenant principal : Dr. Amina Farah, chercheuse en IA à l'Université de Nairobi.\n\nDate : Mercredi 18 juin, 10h00 – 12h00\nLieu : Amphithéâtre principal\n\nLa conférence sera suivie d'un atelier pratique de 14h à 16h pour les étudiants en informatique (inscription obligatoire, places limitées à 30).",
        bodyAr: 'ينظم قسم الحاسوب محاضرة مفتوحة للجميع حول الذكاء الاصطناعي وتطبيقاته في المنطقة.',
        heroImageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
        category: 'events',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(22),
      },
      {
        titleFr: 'Maintenance du réseau WiFi — Interruption prévue',
        titleAr: 'صيانة شبكة الواي فاي — انقطاع متوقع',
        bodyFr: "Une maintenance du réseau WiFi du campus est prévue le samedi 14 juin de 6h00 à 12h00. Pendant cette période, l'accès à Internet sera interrompu dans tous les bâtiments.\n\nLa bibliothèque numérique et le portail étudiant seront également inaccessibles. Veuillez planifier vos travaux en conséquence.\n\nNous nous excusons pour la gêne occasionnée.",
        bodyAr: 'من المقرر إجراء صيانة لشبكة الواي فاي في الحرم الجامعي يوم السبت 14 يونيو.',
        heroImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
        category: 'official',
        readTimeMinutes: 1,
        isUrgent: true,
        publishedAt: daysAgo(24),
      },
      {
        titleFr: "Club de lecture — Nouveau cycle « Littérature djiboutienne »",
        titleAr: 'نادي القراءة — دورة جديدة «الأدب الجيبوتي»',
        bodyFr: "Le club de lecture de l'université lance un nouveau cycle consacré à la littérature djiboutienne contemporaine. Premier livre : « Passage des larmes » d'Abdourahman Waberi.\n\nLes rencontres ont lieu tous les jeudis de 16h à 17h30 dans la salle de conférence de la bibliothèque. Ouvert à tous, aucune inscription nécessaire.\n\nExemplaires disponibles à la bibliothèque (prêt gratuit).",
        bodyAr: 'يطلق نادي القراءة في الجامعة دورة جديدة مخصصة للأدب الجيبوتي المعاصر.',
        heroImageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
        category: 'events',
        readTimeMinutes: 2,
        isUrgent: false,
        publishedAt: daysAgo(26),
      },
      {
        titleFr: 'Résultats des élections du conseil étudiant 2025-2026',
        titleAr: 'نتائج انتخابات مجلس الطلاب 2025-2026',
        bodyFr: "Les élections du conseil étudiant se sont tenues le 20 mai avec un taux de participation de 62%. Le nouveau bureau est composé de :\n\nPrésident : Ismail Omar (L3 Droit)\nVice-présidente : Sahra Ahmed (L3 Informatique)\nSecrétaire général : Mohamed Abdillahi (L2 Économie)\nTrésorière : Amina Youssouf (L3 Gestion)\n\nLe nouveau conseil prendra ses fonctions le 1er juin. Leurs priorités annoncées incluent l'amélioration des espaces de vie étudiante et la mise en place d'un système de navettes.",
        bodyAr: 'أجريت انتخابات مجلس الطلاب في 20 مايو بنسبة مشاركة بلغت 62%.',
        heroImageUrl: 'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=800&q=80',
        category: 'official',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(28),
      },
      {
        titleFr: "Stage obligatoire S6 — Rappel des échéances",
        titleAr: 'التدريب الإجباري — تذكير بالمواعيد النهائية',
        bodyFr: "Rappel pour les étudiants en L3 : le stage obligatoire du 6ème semestre doit débuter avant le 1er mars. Voici les échéances importantes :\n\n- Convention de stage signée : avant le 15 février\n- Début du stage : 1er mars au plus tard\n- Rapport de stage : à rendre le 15 mai\n- Soutenance : du 1er au 15 juin\n\nLes conventions de stage sont disponibles au secrétariat de votre département. Pour les étudiants n'ayant pas encore trouvé de stage, une liste d'entreprises partenaires est affichée au bureau des stages (bâtiment C, 2ème étage).\n\nContact : stages@univ-djibouti.dj",
        bodyAr: 'تذكير لطلاب السنة الثالثة: يجب أن يبدأ التدريب الإجباري قبل 1 مارس.',
        heroImageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
        category: 'scolarite',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(30),
      },
    ],
  });

  // ── Final counts ──────────────────────────────────────────────────────────
  const [fC, pC, smC, subC, stC, gC, schC, attC, notifC, newsC] =
    await Promise.all([
      prisma.faculty.count(),
      prisma.programme.count(),
      prisma.semester.count(),
      prisma.subject.count(),
      prisma.student.count(),
      prisma.grade.count(),
      prisma.scheduleEntry.count(),
      prisma.attendanceRecord.count(),
      prisma.notification.count(),
      prisma.newsArticle.count(),
    ]);

  console.log(
    `Seeded: ${fC} faculties, ${pC} programmes, ${smC} semesters, ` +
    `${subC} subjects, ${stC} students (Ahmed/Fatima/Youssouf), ${gC} grades, ` +
    `${schC} schedule entries, ${attC} attendance records, ` +
    `${notifC} notifications, ${newsC} news articles`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
