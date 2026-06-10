import prisma from '../src/utils/prisma';
import * as visitService from '../src/services/visit.service';
import * as appointmentService from '../src/services/appointment.service';
import * as scheduleService from '../src/services/schedule.service';
import {
  createTestDepartment,
  createTestDoctor,
  createTestPatient,
  createTestUser,
} from './helpers';
import { UserRole, TimeSlot, AppointmentStatus } from '../src/types/enums';

describe('Visit Service', () => {
  let department: any;
  let doctor: any;
  let patient: any;
  let patient2: any;
  let schedule: any;
  let appointment: any;
  let appointment2: any;
  let adminUser: any;

  beforeEach(async () => {
    department = await createTestDepartment();
    doctor = await createTestDoctor(department.id);
    patient = await createTestPatient();
    patient2 = await createTestPatient();
    adminUser = await createTestUser(UserRole.ADMIN);

    const today = new Date().toISOString().split('T')[0];
    schedule = await scheduleService.createSchedule(
      doctor.id,
      department.id,
      today,
      TimeSlot.MORNING,
      10,
      100,
      adminUser.id,
      adminUser.role,
    );

    appointment = await appointmentService.createAppointment(
      patient.id,
      schedule.id,
      patient.realName,
      '110101199001015678',
      '13900139000',
    );

    appointment2 = await appointmentService.createAppointment(
      patient2.id,
      schedule.id,
      patient2.realName,
      '110101199001015679',
      '13900139001',
    );

    await appointmentService.payAppointment(appointment.id, patient.id);
    await appointmentService.payAppointment(appointment2.id, patient2.id);
  });

  describe('checkIn', () => {
    it('患者可以签到', async () => {
      const result = await visitService.checkIn(appointment.id, patient.id);

      expect(result).toBeDefined();
      expect(result.queueNumber).toBeDefined();
      expect(result.queueNumber).toBe(1);

      const updated = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updated?.status).toBe(AppointmentStatus.CHECKED_IN);
    });

    it('待就诊状态才能签到', async () => {
      await visitService.checkIn(appointment.id, patient.id);

      await expect(
        visitService.checkIn(appointment.id, patient.id),
      ).rejects.toThrow();
    });
  });

  describe('callNextPatient', () => {
    beforeEach(async () => {
      await visitService.checkIn(appointment.id, patient.id);
      await visitService.checkIn(appointment2.id, patient2.id);
    });

    it('医生可以叫号', async () => {
      const result = await visitService.callNextPatient(schedule.id, doctor.id);

      expect(result).toBeDefined();
      expect(result?.status).toBe(AppointmentStatus.IN_VISIT);
    });

    it('叫号按签到顺序', async () => {
      const nextPatient = await visitService.callNextPatient(schedule.id, doctor.id);

      expect(nextPatient?.patientId).toBe(patient.id);
    });
  });

  describe('completeVisit', () => {
    beforeEach(async () => {
      await visitService.checkIn(appointment.id, patient.id);
      await visitService.callNextPatient(schedule.id, doctor.id);
    });

    it('医生可以完成就诊', async () => {
      const result = await visitService.completeVisit(appointment.id, doctor.id);

      expect(result.success).toBe(true);

      const updated = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updated?.status).toBe(AppointmentStatus.COMPLETED);
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('markMissed', () => {
    beforeEach(async () => {
      await visitService.checkIn(appointment.id, patient.id);
    });

    it('医生可以标记过号', async () => {
      const result = await visitService.markMissed(appointment.id, doctor.id);

      expect(result.success).toBe(true);

      const updated = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updated?.status).toBe(AppointmentStatus.MISSED);
    });
  });

  describe('requeueMissed', () => {
    beforeEach(async () => {
      await visitService.checkIn(appointment.id, patient.id);
      await visitService.markMissed(appointment.id, doctor.id);
    });

    it('过号后可以重新排队', async () => {
      const result = await visitService.requeueMissed(appointment.id, doctor.id);

      expect(result.success).toBe(true);
      expect(result.queueNumber).toBeDefined();

      const updated = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updated?.status).toBe(AppointmentStatus.CHECKED_IN);
    });
  });

  describe('getDoctorQueue', () => {
    it('医生可以查看自己的患者队列', async () => {
      await visitService.checkIn(appointment.id, patient.id);

      const queue = await visitService.getDoctorQueue(
        doctor.id,
        new Date().toISOString().split('T')[0],
      );

      expect(queue.length).toBeGreaterThanOrEqual(1);
    });
  });
});
