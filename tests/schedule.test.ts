import prisma from '../src/utils/prisma';
import * as scheduleService from '../src/services/schedule.service';
import * as departmentService from '../src/services/department.service';
import {
  createTestDepartment,
  createTestDoctor,
  createTestUser,
  getTomorrowDateStr,
} from './helpers';
import { UserRole, TimeSlot } from '../src/types/enums';

describe('Schedule Service', () => {
  let department: any;
  let doctor: any;
  let adminUser: any;

  beforeEach(async () => {
    department = await createTestDepartment();
    doctor = await createTestDoctor(department.id);
    adminUser = await createTestUser(UserRole.ADMIN);
  });

  describe('createSchedule', () => {
    it('应该成功创建排班并生成号源', async () => {
      const date = getTomorrowDateStr();
      const result = await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.MORNING,
        20,
        100,
        adminUser.id,
        adminUser.role,
      );

      expect(result).toBeDefined();
      expect(result.doctorId).toBe(doctor.id);
      expect(result.departmentId).toBe(department.id);
      expect(result.isCancelled).toBe(false);
      expect(result.slotInventory).toBeDefined();
      expect(result.slotInventory?.totalSlots).toBe(20);
      expect(result.slotInventory?.availableSlots).toBe(20);
      expect(result.slotInventory?.bookedSlots).toBe(0);
      expect(result.slotInventory?.lockedSlots).toBe(0);
    });

    it('同一医生同一日期同一时间段不能重复排班', async () => {
      const date = getTomorrowDateStr();

      await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.MORNING,
        20,
        100,
        adminUser.id,
        adminUser.role,
      );

      await expect(
        scheduleService.createSchedule(
          doctor.id,
          department.id,
          date,
          TimeSlot.MORNING,
          15,
          80,
          adminUser.id,
          adminUser.role,
        ),
      ).rejects.toThrow();
    });

    it('号源数量必须大于0', async () => {
      const date = getTomorrowDateStr();

      await expect(
        scheduleService.createSchedule(
          doctor.id,
          department.id,
          date,
          TimeSlot.MORNING,
          0,
          100,
          adminUser.id,
          adminUser.role,
        ),
      ).rejects.toThrow();
    });

    it('不能创建过去日期的排班', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await expect(
        scheduleService.createSchedule(
          doctor.id,
          department.id,
          dateStr,
          TimeSlot.MORNING,
          10,
          100,
          adminUser.id,
          adminUser.role,
        ),
      ).rejects.toThrow();
    });

    it('创建排班后应该记录操作日志', async () => {
      const date = getTomorrowDateStr();
      const result = await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.MORNING,
        20,
        100,
        adminUser.id,
        adminUser.role,
      );

      const logs = await prisma.operationLog.findMany({
        where: { targetId: result.id, targetType: 'Schedule' },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].type).toBe('SCHEDULE_CREATE');
      expect(logs[0].operatorId).toBe(adminUser.id);
    });
  });

  describe('cancelSchedule', () => {
    let schedule: any;

    beforeEach(async () => {
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
    });

    it('应该成功停诊并释放号源', async () => {
      const result = await scheduleService.cancelSchedule(
        schedule.id,
        '医生有事',
        adminUser.id,
        adminUser.role,
      );

      expect(result.schedule.isCancelled).toBe(true);
      expect(result.schedule.cancelReason).toBe('医生有事');
    });

    it('停诊必须填写原因', async () => {
      await expect(
        scheduleService.cancelSchedule(schedule.id, '', adminUser.id, adminUser.role),
      ).rejects.toThrow();
    });

    it('已停诊的排班不能再次停诊', async () => {
      await scheduleService.cancelSchedule(schedule.id, '医生有事', adminUser.id, adminUser.role);

      await expect(
        scheduleService.cancelSchedule(schedule.id, '又有事', adminUser.id, adminUser.role),
      ).rejects.toThrow();
    });

    it('停诊后应该记录操作日志', async () => {
      await scheduleService.cancelSchedule(schedule.id, '医生有事', adminUser.id, adminUser.role);

      const logs = await prisma.operationLog.findMany({
        where: { targetId: schedule.id, type: 'SCHEDULE_CANCEL' },
      });

      expect(logs.length).toBe(1);
    });
  });

  describe('listSchedules', () => {
    it('应该列出排班列表', async () => {
      const date = getTomorrowDateStr();
      await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.MORNING,
        10,
        100,
        adminUser.id,
        adminUser.role,
      );

      const schedules = await scheduleService.listSchedules({
        departmentId: department.id,
      });

      expect(schedules.length).toBe(1);
    });

    it('默认不包含已停诊的排班', async () => {
      const date = getTomorrowDateStr();
      const schedule = await scheduleService.createSchedule(
        doctor.id,
        department.id,
        date,
        TimeSlot.MORNING,
        10,
        100,
        adminUser.id,
        adminUser.role,
      );

      await scheduleService.cancelSchedule(schedule.id, '停诊', adminUser.id, adminUser.role);

      const schedules = await scheduleService.listSchedules({
        departmentId: department.id,
      });

      expect(schedules.length).toBe(0);
    });
  });
});
