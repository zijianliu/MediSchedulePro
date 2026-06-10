import { Router } from 'express';
import * as logController from '../controllers/log.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get(
  '/operation',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN),
  logController.listOperationLogs,
);

router.get(
  '/status/:appointmentId',
  authMiddleware,
  logController.listStatusLogs,
);

export default router;
