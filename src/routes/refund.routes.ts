import { Router } from 'express';
import * as refundController from '../controllers/refund.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', authMiddleware, refundController.listRefunds);
router.get('/:id', authMiddleware, refundController.getRefund);

router.post(
  '/:id/process',
  authMiddleware,
  requireRoles(UserRole.FINANCE, UserRole.ADMIN),
  refundController.processRefund,
);

router.post(
  '/:id/complete',
  authMiddleware,
  requireRoles(UserRole.FINANCE, UserRole.ADMIN),
  refundController.completeRefund,
);

export default router;
