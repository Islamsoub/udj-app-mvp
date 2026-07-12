import { Router } from 'express';
import authRouter from './auth';
import dashboardRouter from './dashboard';
import studentsRouter from './students';
import academicsRouter from './academics';
import scheduleRouter from './schedule';
import gradesRouter from './grades';
import attendanceRouter from './attendance';
import newsRouter from './news';
import categoriesRouter from './categories';
import notificationsRouter from './notifications';
import usersRouter from './users';
import auditRouter from './audit';
import settingsRouter from './settings';

/**
 * Aggregates every admin sub-router. Mount once in src/index.ts:
 *
 *   import adminRouter from './routes/admin';
 *   app.use('/admin', adminRouter);
 *
 * Academic-structure routes (faculties, programmes, semesters, subjects) live
 * under academicsRouter and are mounted at the /admin root so their paths read
 * /admin/faculties, /admin/programmes, etc.
 */
const adminRouter = Router();

adminRouter.use('/auth', authRouter);
adminRouter.use('/dashboard', dashboardRouter);
adminRouter.use('/students', studentsRouter);
adminRouter.use('/schedule', scheduleRouter);
adminRouter.use('/grades', gradesRouter);
adminRouter.use('/attendance', attendanceRouter);
// News categories must be registered BEFORE the news router so that
// /admin/news/categories is not matched by the news `GET /:id` route.
adminRouter.use('/news/categories', categoriesRouter);
adminRouter.use('/news', newsRouter);
adminRouter.use('/notifications', notificationsRouter);
adminRouter.use('/users', usersRouter);
adminRouter.use('/audit', auditRouter);
adminRouter.use('/settings', settingsRouter);

// academics defines its own sub-paths (/faculties, /programmes, /semesters, /subjects)
adminRouter.use('/', academicsRouter);

export default adminRouter;
