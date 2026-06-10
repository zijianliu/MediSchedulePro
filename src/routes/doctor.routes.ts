import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';
import * as visitController from '../controllers/visit.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', departmentController.listDoctors);
router.get('/:id', departmentController.getDoctor);
router.get('/:id/queue', authMiddleware, visitController.getDoctorQueue);

export default router;
