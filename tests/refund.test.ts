import prisma from '../src/utils/prisma';
import * as refundService from '../src/services/refund.service';
import * as appointmentService from '../src/services/appointment.service';
import * as scheduleService from '../src/services/schedule.service';
import {
  createTestDepartment,
  createTestDoctor,
  createTestPatient,
  createTestUser,
  getTomorrowDateStr,
} from './helpers';
import { UserRole, TimeSlot, AppointmentStatus, RefundStatus } from '../src/types/enums';

describe('Refund Service', () => {
  let department: any;
  let doctor: any;
  let patient: any;
  let schedule: any;
  let appointment: any;
  let financeUser: any;
  let adminUser: any;

  beforeEach(async () => {
    department = await createTestDepartment();
    doctor = await createTestDoctor(department.id);
    patient = await createTestPatient();
    financeUser = await createTestUser(UserRole.FINANCE);
    adminUser = await createTestUser(UserRole.ADMIN);

    const date = getTomorrowDateStr();
    schedule = await scheduleService.createSchedule(
      doctor.id,
      department.id,
      date,
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

    await appointmentService.payAppointment(appointment.id, patient.id);
  });

  describe('停诊退款流程', () => {
    it('停诊后预约单进入停诊待退款状态', async () => {
      const result = await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      expect(result.affectedAppointments).toBe(1);

      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updatedAppointment?.status).toBe(AppointmentStatus.CLINIC_CANCELLED_REFUND);

      const refunds = await prisma.refundRecord.findMany({
        where: { appointmentId: appointment.id },
      });

      expect(refunds.length).toBe(1);
      expect(refunds[0].status).toBe(RefundStatus.PENDING);
      expect(refunds[0].amount).toBe(100);
    });

    it('财务人员可以处理退款', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      const refunds = await prisma.refundRecord.findMany({
        where: { appointmentId: appointment.id },
      });

      const result = await refundService.processRefund(
        refunds[0].id,
        financeUser.id,
        financeUser.role,
      );

      expect(result.status).toBe(RefundStatus.PROCESSING);

      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updatedAppointment?.status).toBe(AppointmentStatus.REFUND_PROCESSING);
    });

    it('退款完成后状态变为已退款', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      const refunds = await prisma.refundRecord.findMany({
        where: { appointmentId: appointment.id },
      });

      await refundService.processRefund(
        refunds[0].id,
        financeUser.id,
        financeUser.role,
      );

      const result = await refundService.completeRefund(
        refunds[0].id,
        financeUser.id,
        financeUser.role,
      );

      expect(result.status).toBe(RefundStatus.COMPLETED);

      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updatedAppointment?.status).toBe(AppointmentStatus.REFUNDED);
    });
  });

  describe('状态流转控制', () => {
    it('只有待处理的退款才能开始处理', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      const refunds = await prisma.refundRecord.findMany({
        where: { appointmentId: appointment.id },
      });

      await refundService.processRefund(
        refunds[0].id,
        financeUser.id,
        financeUser.role,
      );

      await expect(
        refundService.processRefund(
          refunds[0].id,
          financeUser.id,
          financeUser.role,
        ),
      ).rejects.toThrow();
    });

    it('只有处理中的退款才能完成', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      const refunds = await prisma.refundRecord.findMany({
        where: { appointmentId: appointment.id },
      });

      await expect(
        refundService.completeRefund(
          refunds[0].id,
          financeUser.id,
          financeUser.role,
        ),
      ).rejects.toThrow();
    });
  });

  describe('退款列表', () => {
    it('财务人员可以查看所有退款', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      const refunds = await refundService.listRefunds(
        financeUser.id,
        financeUser.role,
      );

      expect(refunds.length).toBeGreaterThanOrEqual(1);
    });

    it('患者只能查看自己的退款', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      const refunds = await refundService.listRefunds(
        patient.id,
        UserRole.PATIENT,
      );

      expect(refunds.length).toBeGreaterThanOrEqual(1);

      const otherPatient = await createTestPatient();
      const otherRefunds = await refundService.listRefunds(
        otherPatient.id,
        UserRole.PATIENT,
      );

      expect(otherRefunds.length).toBe(0);
    });
  });
});
