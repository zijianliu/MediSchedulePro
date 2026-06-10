import prisma from '../src/utils/prisma';
import * as appointmentService from '../src/services/appointment.service';
import * as scheduleService from '../src/services/schedule.service';
import * as visitService from '../src/services/visit.service';
import * as maskUtil from '../src/utils/mask';
import {
  createTestDepartment,
  createTestDoctor,
  createTestPatient,
  createTestUser,
  getTomorrowDateStr,
} from './helpers';
import { UserRole, TimeSlot, AppointmentStatus } from '../src/types/enums';

describe('Auth & Permission', () => {
  let department: any;
  let department2: any;
  let doctor: any;
  let doctor2: any;
  let patient: any;
  let patient2: any;
  let schedule: any;
  let appointment: any;
  let deptAdmin: any;
  let deptAdmin2: any;
  let adminUser: any;

  beforeEach(async () => {
    department = await createTestDepartment('内科');
    department2 = await createTestDepartment('外科');
    doctor = await createTestDoctor(department.id, '张医生');
    doctor2 = await createTestDoctor(department2.id, '李医生');
    patient = await createTestPatient();
    patient2 = await createTestPatient();
    deptAdmin = await createTestUser(UserRole.DEPT_ADMIN, 'dept_admin_1', department.id);
    deptAdmin2 = await createTestUser(UserRole.DEPT_ADMIN, 'dept_admin_2', department2.id);
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

  describe('患者权限', () => {
    it('患者只能查看自己的预约', async () => {
      const appointments = await appointmentService.listPatientAppointments(patient.id);
      expect(appointments.length).toBe(1);
      expect(appointments[0].patientId).toBe(patient.id);
    });

    it('患者不能查看他人预约详情', async () => {
      await expect(
        appointmentService.getAppointmentById(
          appointment.id,
          patient2.id,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow();
    });

    it('患者可以查看自己的预约详情', async () => {
      const apt = await appointmentService.getAppointmentById(
        appointment.id,
        patient.id,
        UserRole.PATIENT,
      );

      expect(apt).toBeDefined();
      expect(apt.id).toBe(appointment.id);
    });
  });

  describe('医生权限', () => {
    it('医生只能查看自己的患者队列', async () => {
      const queue = await visitService.getDoctorQueue(
        doctor.id,
        getTomorrowDateStr(),
      );

      queue.forEach((q: any) => {
        expect(q.schedule.doctorId).toBe(doctor.id);
      });
    });

    it('医生不能查看其他医生的患者', async () => {
      const queue2 = await visitService.getDoctorQueue(
        doctor2.id,
        getTomorrowDateStr(),
      );

      expect(queue2.length).toBe(0);
    });
  });

  describe('科室管理员权限', () => {
    it('科室管理员可以管理本科室排班', async () => {
      const schedules = await scheduleService.listSchedules({
        departmentId: department.id,
      });

      expect(schedules.length).toBe(1);
    });
  });

  describe('数据脱敏', () => {
    it('患者信息对非授权角色脱敏', () => {
      const patientData = {
        id: patient.id,
        realName: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        departmentId: department.id,
      };

      const masked = maskUtil.maskPatientData(
        patientData,
        UserRole.PATIENT,
        undefined,
        patient2.id,
      );

      expect(masked.realName).not.toBe('张三');
      expect(masked.idCard).toContain('*');
      expect(masked.phone).toContain('*');
    });

    it('患者本人可以看到完整信息', () => {
      const patientData = {
        id: patient.id,
        realName: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        departmentId: department.id,
      };

      const masked = maskUtil.maskPatientData(
        patientData,
        UserRole.PATIENT,
        undefined,
        patient.id,
      );

      expect(masked.realName).toBe('张三');
      expect(masked.idCard).toBe('110101199001011234');
      expect(masked.phone).toBe('13800138000');
    });

    it('同科室医生可以看到患者完整信息', () => {
      const patientData = {
        id: patient.id,
        realName: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        departmentId: department.id,
      };

      const masked = maskUtil.maskPatientData(
        patientData,
        UserRole.DOCTOR,
        department.id,
        undefined,
      );

      expect(masked.realName).toBe('张三');
    });

    it('不同科室医生看到的患者信息是脱敏的', () => {
      const patientData = {
        id: patient.id,
        realName: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        departmentId: department.id,
      };

      const masked = maskUtil.maskPatientData(
        patientData,
        UserRole.DOCTOR,
        department2.id,
        undefined,
      );

      expect(masked.realName).not.toBe('张三');
      expect(masked.idCard).toContain('*');
    });

    it('管理员可以看到完整信息', () => {
      const patientData = {
        id: patient.id,
        realName: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        departmentId: department.id,
      };

      const masked = maskUtil.maskPatientData(
        patientData,
        UserRole.ADMIN,
        undefined,
        undefined,
      );

      expect(masked.realName).toBe('张三');
    });
  });

  describe('状态流转控制', () => {
    it('已签到的预约不能取消', async () => {
      const todaySchedule = await scheduleService.createSchedule(
        doctor.id,
        department.id,
        new Date().toISOString().split('T')[0],
        TimeSlot.AFTERNOON,
        10,
        100,
        adminUser.id,
        adminUser.role,
      );

      const apt = await appointmentService.createAppointment(
        patient.id,
        todaySchedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await appointmentService.payAppointment(apt.id, patient.id);
      await visitService.checkIn(apt.id, patient.id);

      await expect(
        appointmentService.cancelAppointment(apt.id, patient.id, UserRole.PATIENT),
      ).rejects.toThrow();
    });

    it('已完成的预约不能取消', async () => {
      const todaySchedule = await scheduleService.createSchedule(
        doctor.id,
        department.id,
        new Date().toISOString().split('T')[0],
        TimeSlot.AFTERNOON,
        10,
        100,
        adminUser.id,
        adminUser.role,
      );

      const apt = await appointmentService.createAppointment(
        patient.id,
        todaySchedule.id,
        patient.realName,
        '110101199001015678',
        '13900139000',
      );

      await appointmentService.payAppointment(apt.id, patient.id);
      await visitService.checkIn(apt.id, patient.id);
      await visitService.callNextPatient(todaySchedule.id, doctor.id);
      await visitService.completeVisit(apt.id, doctor.id);

      await expect(
        appointmentService.cancelAppointment(apt.id, patient.id, UserRole.PATIENT),
      ).rejects.toThrow();
    });

    it('已取消的订单不能支付成功', async () => {
      const apt = await appointmentService.createAppointment(
        patient2.id,
        schedule.id,
        patient2.realName,
        '110101199001015679',
        '13900139001',
      );

      await appointmentService.cancelAppointment(apt.id, patient2.id, UserRole.PATIENT);

      await expect(
        appointmentService.payAppointment(apt.id, patient2.id),
      ).rejects.toThrow();
    });
  });

  describe('日志和通知', () => {
    it('预约成功应该有状态日志', async () => {
      const logs = await prisma.statusLog.findMany({
        where: { appointmentId: appointment.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].fromStatus).toBeNull();
      expect(logs[0].toStatus).toBe(AppointmentStatus.PENDING_PAYMENT);
    });

    it('停诊后应该生成通知', async () => {
      await scheduleService.cancelSchedule(
        schedule.id,
        '医生临时有事',
        adminUser.id,
        adminUser.role,
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      const notifications = await prisma.notification.findMany({
        where: { userId: patient.id },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('创建排班应该有操作日志', async () => {
      const logs = await prisma.operationLog.findMany({
        where: { type: 'SCHEDULE_CREATE', targetId: schedule.id },
      });

      expect(logs.length).toBe(1);
      expect(logs[0].operatorId).toBe(adminUser.id);
    });
  });
});
