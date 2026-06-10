import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '../types/enums';

const router = Router();

router.post('/', authMiddleware, appointmentController.createAppointment);
router.get('/mine', authMiddleware, appointmentController.listPatientAppointments);
router.get('/my', authMiddleware, appointmentController.listPatientAppointments);
router.get('/:id', authMiddleware, appointmentController.getAppointment);
router.post('/:id/pay', authMiddleware, appointmentController.payAppointment);
router.post('/:id/cancel', authMiddleware, appointmentController.cancelAppointment);
router.post('/:id/checkin', authMiddleware, appointmentController.checkIn);
router.post('/:id/miss', authMiddleware, appointmentController.markMissed);
router.post('/:id/requeue', authMiddleware, appointmentController.requeueMissed);
router.post('/:id/complete', authMiddleware, appointmentController.completeVisit);

router.get(
  '/doctor/mine',
  authMiddleware,
  requireRoles(UserRole.DOCTOR),
  appointmentController.listDoctorAppointments,
);

router.post('/process-timeouts', appointmentController.processTimeouts);

export default router;
