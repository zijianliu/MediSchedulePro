import { Router } from 'express';
import * as visitController from '../controllers/visit.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.post('/check-in/:id', authMiddleware, visitController.checkIn);

router.post(
  '/call',
  authMiddleware,
  requireRoles(UserRole.DOCTOR),
  visitController.callNextPatient,
);

router.post(
  '/complete/:id',
  authMiddleware,
  requireRoles(UserRole.DOCTOR),
  visitController.completeVisit,
);

router.post(
  '/miss/:id',
  authMiddleware,
  requireRoles(UserRole.DOCTOR),
  visitController.markMissed,
);

router.post(
  '/requeue/:id',
  authMiddleware,
  requireRoles(UserRole.DOCTOR, UserRole.ADMIN),
  visitController.requeueMissed,
);

router.get(
  '/doctors/:doctorId/queue',
  authMiddleware,
  visitController.getDoctorQueue,
);

export default router;
