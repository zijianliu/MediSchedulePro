import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { AppointmentStatus, UserRole } from '../types/enums';
import { validateTransition } from '../utils/stateMachine';
import { maskPatientList } from '../utils/mask';

export async function checkIn(appointmentId: string, patientId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      schedule: true,
      patient: { select: { id: true } },
    },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (appointment.patientId !== patientId) {
    throw new ForbiddenError('无权限操作他人预约');
  }

  if (appointment.status !== AppointmentStatus.PENDING_VISIT) {
    throw new BadRequestError('当前状态不允许签到');
  }

  const scheduleDate = new Date(appointment.schedule.date);
  const today = new Date();
  scheduleDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (scheduleDate.getTime() !== today.getTime()) {
    throw new BadRequestError('只能在就诊当天签到');
  }

  validateTransition(appointment.status, AppointmentStatus.CHECKED_IN);

  let queueNumber: number;
  
  const result = await prisma.$transaction(async (tx) => {
    const updateCount = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: AppointmentStatus.PENDING_VISIT,
      },
      data: {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });

    if (updateCount.count === 0) {
      throw new BadRequestError('签到失败，请稍后重试');
    }

    const checkedInCount = await tx.appointment.count({
      where: {
        scheduleId: appointment.scheduleId,
        status: AppointmentStatus.CHECKED_IN,
      },
    });

    const inVisitCount = await tx.appointment.count({
      where: {
        scheduleId: appointment.scheduleId,
        status: AppointmentStatus.IN_VISIT,
      },
    });

    queueNumber = checkedInCount + inVisitCount;

    await tx.appointment.update({
      where: { id: appointmentId },
      data: { queueNumber },
    });

    await tx.statusLog.create({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.PENDING_VISIT,
        toStatus: AppointmentStatus.CHECKED_IN,
        reason: '患者签到',
      },
    });

    return { appointmentId, queueNumber };
  });

  return result;
}

export async function callNextPatient(scheduleId: string, doctorId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new NotFoundError('排班不存在');
  }

  if (schedule.doctorId !== doctorId) {
    throw new ForbiddenError('无权限操作非本人排班');
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentInVisit = await tx.appointment.findFirst({
      where: {
        scheduleId,
        status: AppointmentStatus.IN_VISIT,
      },
    });

    if (currentInVisit) {
      throw new BadRequestError('当前有患者正在就诊中，请先完成就诊');
    }

    const nextPatient = await tx.appointment.findFirst({
      where: {
        scheduleId,
        status: AppointmentStatus.CHECKED_IN,
      },
      orderBy: { queueNumber: 'asc' },
      include: {
        patient: {
          select: { id: true, realName: true },
        },
      },
    });

    if (!nextPatient) {
      throw new BadRequestError('没有等待中的患者');
    }

    const updateCount = await tx.appointment.updateMany({
      where: {
        id: nextPatient.id,
        status: AppointmentStatus.CHECKED_IN,
      },
      data: {
        status: AppointmentStatus.IN_VISIT,
      },
    });

    if (updateCount.count === 0) {
      throw new BadRequestError('叫号失败，请稍后重试');
    }

    await tx.statusLog.create({
      data: {
        appointmentId: nextPatient.id,
        fromStatus: AppointmentStatus.CHECKED_IN,
        toStatus: AppointmentStatus.IN_VISIT,
        reason: '医生叫号',
      },
    });

    const updatedPatient = await tx.appointment.findUnique({
      where: { id: nextPatient.id },
      include: {
        patient: {
          select: { id: true, realName: true },
        },
      },
    });

    return updatedPatient;
  });

  return result;
}

export async function completeVisit(appointmentId: string, doctorId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { schedule: true },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (appointment.schedule.doctorId !== doctorId) {
    throw new ForbiddenError('无权限操作非本人患者');
  }

  if (appointment.status !== AppointmentStatus.IN_VISIT) {
    throw new BadRequestError('当前状态不允许完成就诊');
  }

  validateTransition(appointment.status, AppointmentStatus.COMPLETED);

  const result = await prisma.$transaction(async (tx) => {
    const updateCount = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: AppointmentStatus.IN_VISIT,
      },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (updateCount.count === 0) {
      throw new BadRequestError('操作失败，请稍后重试');
    }

    await tx.statusLog.create({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.IN_VISIT,
        toStatus: AppointmentStatus.COMPLETED,
        reason: '医生完成就诊',
      },
    });

    return { success: true };
  });

  return result;
}

export async function markMissed(appointmentId: string, doctorId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { schedule: true },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (appointment.schedule.doctorId !== doctorId) {
    throw new ForbiddenError('无权限操作非本人患者');
  }

  if (
    appointment.status !== AppointmentStatus.CHECKED_IN &&
    appointment.status !== AppointmentStatus.IN_VISIT
  ) {
    throw new BadRequestError('当前状态不允许标记过号');
  }

  validateTransition(appointment.status, AppointmentStatus.MISSED);

  const result = await prisma.$transaction(async (tx) => {
    const updateCount = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: {
          in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_VISIT],
        },
      },
      data: {
        status: AppointmentStatus.MISSED,
      },
    });

    if (updateCount.count === 0) {
      throw new BadRequestError('操作失败，请稍后重试');
    }

    await tx.statusLog.create({
      data: {
        appointmentId,
        fromStatus: appointment.status,
        toStatus: AppointmentStatus.MISSED,
        reason: '医生标记过号',
      },
    });

    return { success: true };
  });

  return result;
}

export async function requeueMissed(appointmentId: string, doctorId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { schedule: true },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (appointment.schedule.doctorId !== doctorId) {
    throw new ForbiddenError('无权限操作非本人患者');
  }

  if (appointment.status !== AppointmentStatus.MISSED) {
    throw new BadRequestError('只有过号的患者可以重新排队');
  }

  validateTransition(appointment.status, AppointmentStatus.CHECKED_IN);

  const result = await prisma.$transaction(async (tx) => {
    const updateCount = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: AppointmentStatus.MISSED,
      },
      data: {
        status: AppointmentStatus.CHECKED_IN,
      },
    });

    if (updateCount.count === 0) {
      throw new BadRequestError('操作失败，请稍后重试');
    }

    const maxQueueNumber = await tx.appointment.findFirst({
      where: {
        scheduleId: appointment.scheduleId,
        status: { in: [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_VISIT] },
        queueNumber: { not: null },
      },
      orderBy: { queueNumber: 'desc' },
      select: { queueNumber: true },
    });

    const newQueueNumber = (maxQueueNumber?.queueNumber || 0) + 1;

    await tx.appointment.update({
      where: { id: appointmentId },
      data: { queueNumber: newQueueNumber },
    });

    await tx.statusLog.create({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.MISSED,
        toStatus: AppointmentStatus.CHECKED_IN,
        reason: '过号重排',
      },
    });

    return { success: true, queueNumber: newQueueNumber };
  });

  return result;
}

export async function getDoctorQueue(doctorId: string, date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId,
      date: { gte: start, lte: end },
      isCancelled: false,
    },
    select: { id: true, timeSlot: true, fee: true },
  });

  const scheduleIds = schedules.map(s => s.id);

  if (scheduleIds.length === 0) {
    return [];
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduleId: { in: scheduleIds },
      status: {
        not: AppointmentStatus.CANCELLED,
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          realName: true,
          phone: true,
          idCard: true,
        },
      },
      schedule: true,
    },
    orderBy: [
      { schedule: { timeSlot: 'asc' } },
      { queueNumber: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return maskPatientList(appointments, 'DOCTOR', undefined, undefined);
}
