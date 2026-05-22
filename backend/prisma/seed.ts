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
  const [info, , , , , , , , ,] = await Promise.all([
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
  const [, s2] = await Promise.all([
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

  // ── STEP 5 — Student Ahmed ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('test1234', 10);
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

  // ── STEP 10 — News articles ───────────────────────────────────────────────
  await prisma.newsArticle.createMany({
    data: [
      {
        titleFr: 'Inscriptions 2025 ouvertes',
        titleAr: 'فتح التسجيلات ٢٠٢٥',
        bodyFr: "Les inscriptions pour l'année universitaire 2025-2026 sont ouvertes du 1er au 30 juillet. Rendez-vous au bureau de la scolarité avec votre dossier complet.",
        bodyAr: 'التسجيلات للسنة الجامعية ٢٠٢٥-٢٠٢٦ مفتوحة من ١ إلى ٣٠ يوليو. توجهوا إلى مكتب الشؤون البيداغوجية بملفكم الكامل.',
        heroImageUrl: null,
        category: 'official',
        readTimeMinutes: 3,
        isUrgent: true,
        publishedAt: daysAgo(2),
      },
      {
        titleFr: 'Journée portes ouvertes — Samedi 24 mai',
        titleAr: 'يوم الأبواب المفتوحة — السبت ٢٤ مايو',
        bodyFr: "Découvrez les filières et rencontrez les enseignants. Programme complet disponible à l'accueil.",
        bodyAr: 'اكتشفوا التخصصات والتقوا بالأساتذة. البرنامج الكامل متاح في الاستقبال.',
        heroImageUrl: null,
        category: 'events',
        readTimeMinutes: 2,
        isUrgent: false,
        publishedAt: daysAgo(4),
      },
      {
        titleFr: 'Calendrier des examens S2 publié',
        titleAr: 'نشر رزنامة امتحانات السداسي الثاني',
        bodyFr: 'Le calendrier des examens du second semestre est disponible. Les épreuves débuteront le 8 juin.',
        bodyAr: 'رزنامة امتحانات السداسي الثاني متاحة. تبدأ الاختبارات يوم ٨ يونيو.',
        heroImageUrl: null,
        category: 'scolarite',
        readTimeMinutes: 2,
        isUrgent: false,
        publishedAt: daysAgo(7),
      },
      {
        titleFr: 'Tournoi inter-facultés de football',
        titleAr: 'دوري كرة القدم بين الكليات',
        bodyFr: 'Le tournoi annuel aura lieu du 20 au 25 mai sur le terrain du campus. Inscriptions auprès du bureau des sports.',
        bodyAr: 'الدوري السنوي سيقام من ٢٠ إلى ٢٥ مايو في ملعب الحرم الجامعي. التسجيل لدى مكتب الرياضة.',
        heroImageUrl: null,
        category: 'sport',
        readTimeMinutes: 2,
        isUrgent: false,
        publishedAt: daysAgo(14),
      },
      {
        titleFr: 'Coopération UDJ — Istanbul Technical University',
        titleAr: 'تعاون جامعة جيبوتي — جامعة إسطنبول التقنية',
        bodyFr: "Un nouvel accord de partenariat a été signé renforçant la coopération dans le domaine de l'ingénierie.",
        bodyAr: 'تم توقيع اتفاقية شراكة جديدة لتعزيز التعاون في مجال الهندسة.',
        heroImageUrl: null,
        category: 'official',
        readTimeMinutes: 3,
        isUrgent: false,
        publishedAt: daysAgo(21),
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
    `${subC} subjects, ${stC} students, ${gC} grades, ` +
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
