import prisma from '../src/utils/prisma';
import * as appointmentService from '../src/services/appointment.service';
import * as scheduleService from '../src/services/schedule.service';
import {
  createTestDepartment,
  createTestDoctor,
  createTestPatient,
  createTestUser,
  getTomorrowDateStr,
} from './helpers';
import { UserRole, TimeSlot, AppointmentStatus } from '../src/types/enums';

describe('Appointment Service', () => {
  let department: any;
  let doctor: any;
  let patient: any;
  let patient2: any;
  let schedule: any;
  let adminUser: any;

  beforeEach(async () => {
    department = await createTestDepartment();
    doctor = await createTestDoctor(department.id);
    patient = await createTestPatient();
    patient2 = await createTestPatient();
    adminUser = await createTestUser(UserRole.ADMIN);

    const date = getTomorrowDateStr();
    schedule = await scheduleService.createSchedule(
      doctor.id,
      department.id,
      date,
      TimeSlot.MORNING,
      5,
      100,
      adminUser.id,
      adminUser.role,
    );
  });

  describe('createAppointment', () => {
    it('应该成功创建预约', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      expect(appointment).toBeDefined();
      expect(appointment.status).toBe(AppointmentStatus.PENDING_PAYMENT);
      expect(appointment.patientId).toBe(patient.id);
      expect(appointment.scheduleId).toBe(schedule.id);
      expect(appointment.fee).toBe(100);
    });

    it('创建预约后应该锁定号源', async () => {
      await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      const inventory = await prisma.slotInventory.findUnique({
        where: { scheduleId: schedule.id },
      });

      expect(inventory?.availableSlots).toBe(4);
      expect(inventory?.lockedSlots).toBe(1);
      expect(inventory?.bookedSlots).toBe(0);
    });

    it('库存不足时不能预约', async () => {
      for (let i = 0; i < 5; i++) {
        const tempPatient = await createTestPatient();
        await appointmentService.createAppointment(
          tempPatient.id,
          schedule.id,
          `患者${i}`,
          `11010119900101000${i}`,
          `1390013900${i}`,
        );
      }

      await expect(
        appointmentService.createAppointment(
          patient2.id,
          schedule.id,
          '测试患者',
          '110101199001011111',
          '138001381111',
        ),
      ).rejects.toThrow();
    });

    it('同一患者不能重复预约同一时段', async () => {
      await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await expect(
        appointmentService.createAppointment(
          patient.id,
          schedule.id,
          patient.realName,
          '110101199001015678',
          '13900139000',
        ),
      ).rejects.toThrow();
    });

    it('同一患者同一天同一科室不能预约多个号源', async () => {
      const date = getTomorrowDateStr();
      const afternoonSchedule = await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.AFTERNOON,
        5,
        100,
        adminUser.id,
        adminUser.role,
      );

      await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await expect(
        appointmentService.createAppointment(
          patient.id,
          afternoonSchedule.id,
          patient.realName,
          '110101199001015678',
          '13900139000',
        ),
      ).rejects.toThrow();
    });

    it('预约需要实名信息', async () => {
      await expect(
        appointmentService.createAppointment(
          patient.id,
          schedule.id,
          '',
          '110101199001015678',
          '13900139000',
        ),
      ).rejects.toThrow();
    });
  });

  describe('payAppointment', () => {
    it('支付成功后状态变为待就诊', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      const result = await appointmentService.payAppointment(appointment.id, patient.id);

      expect(result?.status).toBe(AppointmentStatus.PENDING_VISIT);
    });

    it('支付成功后释放锁定并增加已预约', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await appointmentService.payAppointment(appointment.id, patient.id);

      const inventory = await prisma.slotInventory.findUnique({
        where: { scheduleId: schedule.id },
      });

      expect(inventory?.availableSlots).toBe(4);
      expect(inventory?.lockedSlots).toBe(0);
      expect(inventory?.bookedSlots).toBe(1);
    });

    it('支付回调幂等：重复支付不重复处理', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      const result1 = await appointmentService.payAppointment(appointment.id, patient.id);
      const result2 = await appointmentService.payAppointment(appointment.id, patient.id);

      expect(result1?.status).toBe(AppointmentStatus.PENDING_VISIT);
      expect(result2?.status).toBe(AppointmentStatus.PENDING_VISIT);

      const inventory = await prisma.slotInventory.findUnique({
        where: { scheduleId: schedule.id },
      });

      expect(inventory?.bookedSlots).toBe(1);
    });

    it('已取消的预约不能支付', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await appointmentService.cancelAppointment(
        appointment.id,
        patient.id,
        UserRole.PATIENT,
      );

      await expect(
        appointmentService.payAppointment(appointment.id, patient.id),
      ).rejects.toThrow();
    });
  });

  describe('cancelAppointment', () => {
    it('待支付的预约可以取消', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      const result = await appointmentService.cancelAppointment(
        appointment.id,
        patient.id,
        UserRole.PATIENT,
      );

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('取消后释放号源', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await appointmentService.cancelAppointment(
        appointment.id,
        patient.id,
        UserRole.PATIENT,
      );

      const inventory = await prisma.slotInventory.findUnique({
        where: { scheduleId: schedule.id },
      });

      expect(inventory?.availableSlots).toBe(5);
      expect(inventory?.lockedSlots).toBe(0);
    });

    it('待就诊的预约取消后生成退款记录', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await appointmentService.payAppointment(appointment.id, patient.id);

      const result = await appointmentService.cancelAppointment(
        appointment.id,
        patient.id,
        UserRole.PATIENT,
      );

      expect(result.status).toBe(AppointmentStatus.CANCELLED);

      const refunds = await prisma.refundRecord.findMany({
        where: { appointmentId: appointment.id },
      });

      expect(refunds.length).toBe(1);
      expect(refunds[0].amount).toBe(100);
    });
  });

  describe('并发预约', () => {
    it('并发预约不能超卖', async () => {
      const patients = [];
      for (let i = 0; i < 10; i++) {
        patients.push(await createTestPatient());
      }

      const promises = patients.map((p, i) =>
        appointmentService.createAppointment(
          p.id,
          schedule.id,
          `患者${i}`,
          `1101011990010100${i.toString().padStart(2, '0')}`,
          `139001390${i.toString().padStart(2, '0')}`,
        ),
      );

      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(successful + failed).toBe(10);
      expect(successful).toBeLessThanOrEqual(5);

      const inventory = await prisma.slotInventory.findUnique({
        where: { scheduleId: schedule.id },
      });

      expect(inventory?.availableSlots).toBeGreaterThanOrEqual(0);
      expect(inventory?.totalSlots).toBe(5);
      const total = (inventory?.bookedSlots || 0) + (inventory?.lockedSlots || 0) + (inventory?.availableSlots || 0);
      expect(total).toBe(5);
    });
  });

  describe('processTimeoutAppointments', () => {
    it('支付超时后应该释放号源', async () => {
      const appointment = await appointmentService.createAppointment(
        patient.id,
        schedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
      });

      const result = await appointmentService.processTimeoutAppointments();

      expect(result.processed).toBeGreaterThanOrEqual(1);

      const updated = await prisma.appointment.findUnique({
        where: { id: appointment.id },
      });

      expect(updated?.status).toBe(AppointmentStatus.TIMEOUT);

      const inventory = await prisma.slotInventory.findUnique({
        where: { scheduleId: schedule.id },
      });

      expect(inventory?.availableSlots).toBe(5);
      expect(inventory?.lockedSlots).toBe(0);
    });
  });
});
