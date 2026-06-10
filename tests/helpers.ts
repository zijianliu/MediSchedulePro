import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';
import { UserRole, TimeSlot } from '../src/types/enums';

export async function createTestUser(role: string, username?: string, deptId?: string) {
  const password = await hashPassword('test123456');
  const user = await prisma.user.create({
    data: {
      username: username || `test_${role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      password,
      realName: `${role}用户`,
      role,
      departmentId: deptId,
      phone: '13800138000',
      idCard: '110101199001011234',
    },
  });
  return user;
}

export async function createTestDepartment(name?: string) {
  return prisma.department.create({
    data: {
      name: name || `测试科室_${Date.now()}`,
      description: '测试科室描述',
    },
  });
}

export async function createTestDoctor(deptId: string, name?: string) {
  const password = await hashPassword('doctor123');
  return prisma.user.create({
    data: {
      username: `doctor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      password,
      realName: name || '张医生',
      role: UserRole.DOCTOR,
      departmentId: deptId,
    },
  });
}

export async function createTestPatient(deptId?: string) {
  const password = await hashPassword('patient123');
  return prisma.user.create({
    data: {
      username: `patient_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      password,
      realName: '张三',
      role: UserRole.PATIENT,
      departmentId: deptId,
      phone: '13900139000',
      idCard: '110101199001015678',
    },
  });
}

export async function createTestSchedule(
  doctorId: string,
  deptId: string,
  date?: string,
  timeSlot?: string,
  maxSlots = 10,
  fee = 100,
) {
  const scheduleDate = date ? new Date(date) : new Date();
  scheduleDate.setHours(0, 0, 0, 0);

  const schedule = await prisma.schedule.create({
    data: {
      doctorId,
      departmentId: deptId,
      date: scheduleDate,
      timeSlot: timeSlot || TimeSlot.MORNING,
      maxSlots,
      fee,
    },
  });

  await prisma.slotInventory.create({
    data: {
      scheduleId: schedule.id,
      totalSlots: maxSlots,
      availableSlots: maxSlots,
    },
  });

  return prisma.schedule.findUnique({
    where: { id: schedule.id },
    include: { slotInventory: true },
  });
}

export function getTomorrowDateStr(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function getNextWeekDateStr(): string {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek.toISOString().split('T')[0];
}
