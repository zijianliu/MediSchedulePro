import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.get('/', departmentController.listDepartments);
router.get('/doctors/list', departmentController.listDoctors);
router.get('/doctors/:id', departmentController.getDoctor);
router.get('/:id', departmentController.getDepartment);

router.post('/', authMiddleware, requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN), departmentController.createDepartment);
router.put('/:id', authMiddleware, requireRoles(UserRole.ADMIN, UserRole.DEPT_ADMIN), departmentController.updateDepartment);
router.patch('/:id/toggle-status', authMiddleware, requireRoles(UserRole.ADMIN), departmentController.toggleDepartmentStatus);

export default router;
