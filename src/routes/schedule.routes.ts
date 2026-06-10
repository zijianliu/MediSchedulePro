import { Router } from 'express';
import * as scheduleController from '../controllers/schedule.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', scheduleController.listSchedules);
router.get('/available', scheduleController.getAvailableSchedules);
router.get('/:id', scheduleController.getSchedule);

router.post(
  '/',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN),
  scheduleController.createSchedule,
);

router.post(
  '/:id/cancel',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN),
  scheduleController.cancelSchedule,
);

export default router;
