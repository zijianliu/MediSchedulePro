import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { AppointmentStatus, UserRole, LogType } from '../types/enums';
import { canTransition, validateTransition } from '../utils/stateMachine';
import { maskPatientData, maskPatientList } from '../utils/mask';
import { logStatusChange } from './log.service';
import { notifyAppointmentSuccess, notifyAppointmentCancelled } from './notification.service';

const MAX_RETRY = 3;
const PAYMENT_TIMEOUT_MINUTES = 30;

export async function createAppointment(
  patientId: string,
  scheduleId: string,
  patientName: string,
  patientIdCard: string,
  patientPhone: string,
) {
  if (!patientName.trim()) {
    throw new BadRequestError('请填写患者姓名');
  }
  if (!patientIdCard.trim()) {
    throw new BadRequestError('请填写身份证号');
  }
  if (!patientPhone.trim()) {
    throw new BadRequestError('请填写手机号');
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      slotInventory: true,
      doctor: { select: { realName: true } },
    },
  });

  if (!schedule) {
    throw new NotFoundError('排班不存在');
  }

  if (schedule.isCancelled) {
    throw new BadRequestError('该排班已停诊');
  }

  if (!schedule.slotInventory) {
    throw new BadRequestError('号源信息不存在');
  }

  const scheduleDate = new Date(schedule.date);
  scheduleDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (scheduleDate < today) {
    throw new BadRequestError('不能预约过去的号源');
  }

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      scheduleId,
      status: {
        in: [
          AppointmentStatus.PENDING_PAYMENT,
          AppointmentStatus.PENDING_VISIT,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_VISIT,
        ],
      },
    },
  });

  if (existingAppointment) {
    throw new ConflictError('您已预约该时段号源，不能重复预约');
  }

  const sameDayDeptAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      departmentId: schedule.departmentId,
      status: {
        in: [
          AppointmentStatus.PENDING_PAYMENT,
          AppointmentStatus.PENDING_VISIT,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_VISIT,
        ],
      },
    },
    include: { schedule: true },
  });

  for (const apt of sameDayDeptAppointments) {
    const aptDate = new Date(apt.schedule.date);
    aptDate.setHours(0, 0, 0, 0);
    if (aptDate.getTime() === scheduleDate.getTime()) {
      throw new ConflictError('同一天同一科室只能预约一个号源');
    }
  }

  let lastError;
  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const inventory = await tx.slotInventory.findUnique({
          where: { scheduleId },
        });

        if (!inventory) {
          throw new BadRequestError('号源信息不存在');
        }

        if (inventory.availableSlots <= 0) {
          throw new BadRequestError('号源不足');
        }

        const updateResult = await tx.slotInventory.updateMany({
          where: {
            scheduleId,
            availableSlots: { gt: 0 },
            version: inventory.version,
          },
          data: {
            availableSlots: { decrement: 1 },
            lockedSlots: { increment: 1 },
            version: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictError('号源已被锁定，请稍后重试');
        }

        const appointment = await tx.appointment.create({
          data: {
            patientId,
            scheduleId,
            departmentId: schedule.departmentId,
            status: AppointmentStatus.PENDING_PAYMENT,
            fee: schedule.fee,
            patientName,
            patientIdCard,
            patientPhone,
          },
          include: {
            schedule: {
              include: {
                doctor: { select: { realName: true } },
                department: { select: { name: true } },
              },
            },
          },
        });

        await tx.statusLog.create({
          data: {
            appointmentId: appointment.id,
            fromStatus: null,
            toStatus: AppointmentStatus.PENDING_PAYMENT,
            reason: '创建预约',
          },
        });

        return appointment;
      }, {
        maxWait: 10000,
        timeout: 15000,
      });

      return result;
    } catch (error: any) {
      lastError = error;
      if (error.name !== 'ConflictError' && error.code !== 'P2028') {
        throw error;
      }
    }
  }

  throw lastError || new BadRequestError('预约失败，请稍后重试');
}

export async function payAppointment(appointmentId: string, patientId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      schedule: {
        include: {
          doctor: { select: { realName: true } },
          department: { select: { name: true } },
        },
      },
    },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (appointment.patientId !== patientId) {
    throw new ForbiddenError('无权限操作他人预约');
  }

  if (appointment.status === AppointmentStatus.PENDING_VISIT) {
    return appointment;
  }

  if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
    throw new BadRequestError('当前状态不允许支付');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateCount = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        status: AppointmentStatus.PENDING_PAYMENT,
      },
      data: {
        status: AppointmentStatus.PENDING_VISIT,
      },
    });

    if (updateCount.count === 0) {
      const current = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (current?.status === AppointmentStatus.PENDING_VISIT) {
        return current;
      }
      throw new BadRequestError('支付失败，请稍后重试');
    }

    const inventory = await tx.slotInventory.findUnique({
      where: { scheduleId: appointment.scheduleId },
    });

    if (inventory && inventory.lockedSlots > 0) {
      await tx.slotInventory.updateMany({
        where: {
          scheduleId: appointment.scheduleId,
          lockedSlots: { gt: 0 },
          version: inventory.version,
        },
        data: {
          lockedSlots: { decrement: 1 },
          bookedSlots: { increment: 1 },
          version: { increment: 1 },
        },
      });
    }

    await tx.statusLog.create({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.PENDING_PAYMENT,
        toStatus: AppointmentStatus.PENDING_VISIT,
        reason: '支付成功',
      },
    });

    const updatedAppointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        schedule: {
          include: {
            doctor: { select: { realName: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    return updatedAppointment;
  });

  notifyAppointmentSuccess(appointmentId).catch((err) => {
    console.error('预约成功通知发送失败:', err.message);
  });

  return result;
}

export async function cancelAppointment(appointmentId: string, userId: string, userRole: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      schedule: { include: { doctor: { select: { realName: true } } } },
      patient: { select: { id: true, realName: true, departmentId: true } },
    },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (userRole === UserRole.PATIENT && appointment.patientId !== userId) {
    throw new ForbiddenError('无权限取消他人预约');
  }

  if (
    appointment.status !== AppointmentStatus.PENDING_PAYMENT &&
    appointment.status !== AppointmentStatus.PENDING_VISIT
  ) {
    throw new BadRequestError('当前状态不允许取消');
  }

  if (appointment.status === AppointmentStatus.PENDING_VISIT) {
    const scheduleDate = new Date(appointment.schedule.date);
    const now = new Date();
    const hoursBefore = (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursBefore < 2) {
      throw new BadRequestError('就诊前2小时内不能取消预约');
    }
  }

  validateTransition(appointment.status, AppointmentStatus.CANCELLED);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
      include: {
        schedule: {
          include: {
            doctor: { select: { realName: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    const inventory = await tx.slotInventory.findUnique({
      where: { scheduleId: appointment.scheduleId },
    });

    if (inventory) {
      if (appointment.status === AppointmentStatus.PENDING_PAYMENT && inventory.lockedSlots > 0) {
        await tx.slotInventory.updateMany({
          where: {
            scheduleId: appointment.scheduleId,
            lockedSlots: { gt: 0 },
            version: inventory.version,
          },
          data: {
            lockedSlots: { decrement: 1 },
            availableSlots: { increment: 1 },
            version: { increment: 1 },
          },
        });
      } else if (appointment.status === AppointmentStatus.PENDING_VISIT && inventory.bookedSlots > 0) {
        await tx.slotInventory.updateMany({
          where: {
            scheduleId: appointment.scheduleId,
            bookedSlots: { gt: 0 },
            version: inventory.version,
          },
          data: {
            bookedSlots: { decrement: 1 },
            availableSlots: { increment: 1 },
            version: { increment: 1 },
          },
        });
      }
    }

    if (appointment.status === AppointmentStatus.PENDING_VISIT) {
      await tx.refundRecord.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          amount: appointment.fee,
          reason: '患者取消预约',
          status: 'PENDING',
        },
      });
    }

    await tx.statusLog.create({
      data: {
        appointmentId,
        fromStatus: appointment.status,
        toStatus: AppointmentStatus.CANCELLED,
        reason: userRole === UserRole.PATIENT ? '患者取消' : '管理员取消',
      },
    });

    return updated;
  });

  if (appointment.status === AppointmentStatus.PENDING_VISIT) {
    notifyAppointmentCancelled(appointmentId).catch((err) => {
      console.error('取消预约通知发送失败:', err.message);
    });
  }

  return result;
}

export async function getAppointmentById(
  id: string,
  userId: string,
  userRole: string,
  userDeptId?: string | null,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      schedule: {
        include: {
          doctor: { select: { id: true, realName: true } },
          department: { select: { id: true, name: true } },
          slotInventory: true,
        },
      },
      patient: {
        select: {
          id: true,
          realName: true,
          phone: true,
          idCard: true,
          departmentId: true,
        },
      },
      statusLogs: {
        orderBy: { createdAt: 'asc' },
      },
      refundRecords: true,
    },
  });

  if (!appointment) {
    throw new NotFoundError('预约不存在');
  }

  if (userRole === UserRole.PATIENT && appointment.patientId !== userId) {
    throw new ForbiddenError('无权限查看他人预约');
  }

  if (userRole === UserRole.DOCTOR && appointment.schedule.doctor.id !== userId) {
    throw new ForbiddenError('无权限查看非本人患者预约');
  }

  if (
    userRole === UserRole.DEPT_ADMIN &&
    appointment.departmentId !== userDeptId
  ) {
    throw new ForbiddenError('无权限查看其他科室预约');
  }

  const maskedPatient = maskPatientData(
    appointment.patient,
    userRole,
    userDeptId || undefined,
    userId,
  );

  return { ...appointment, patient: maskedPatient };
}

export async function listPatientAppointments(patientId: string, status?: string) {
  const where: any = { patientId };

  if (status) {
    where.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      schedule: {
        include: {
          doctor: { select: { id: true, realName: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return appointments;
}

export async function listDoctorAppointments(
  doctorId: string,
  date?: string,
  status?: string,
) {
  const where: any = {
    schedule: {
      doctorId,
    },
  };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.schedule.date = { gte: start, lte: end };
  }

  if (status) {
    where.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          realName: true,
          phone: true,
          idCard: true,
        },
      },
      schedule: {
        include: {
          department: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { schedule: { date: 'asc' } },
      { queueNumber: 'asc' },
    ],
  });

  return maskPatientList(appointments, 'DOCTOR', undefined, undefined);
}

export async function processTimeoutAppointments() {
  const timeoutThreshold = new Date();
  timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - PAYMENT_TIMEOUT_MINUTES);

  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.PENDING_PAYMENT,
      createdAt: { lte: timeoutThreshold },
    },
  });

  let processedCount = 0;

  for (const appointment of pendingAppointments) {
    try {
      await prisma.$transaction(async (tx) => {
        const updateCount = await tx.appointment.updateMany({
          where: {
            id: appointment.id,
            status: AppointmentStatus.PENDING_PAYMENT,
          },
          data: {
            status: AppointmentStatus.TIMEOUT,
          },
        });

        if (updateCount.count > 0) {
          const inventory = await tx.slotInventory.findUnique({
            where: { scheduleId: appointment.scheduleId },
          });

          if (inventory && inventory.lockedSlots > 0) {
            await tx.slotInventory.updateMany({
              where: {
                scheduleId: appointment.scheduleId,
                lockedSlots: { gt: 0 },
                version: inventory.version,
              },
              data: {
                lockedSlots: { decrement: 1 },
                availableSlots: { increment: 1 },
                version: { increment: 1 },
              },
            });
          }

          await tx.statusLog.create({
            data: {
              appointmentId: appointment.id,
              fromStatus: AppointmentStatus.PENDING_PAYMENT,
              toStatus: AppointmentStatus.TIMEOUT,
              reason: '支付超时',
            },
          });

          processedCount++;
        }
      });
    } catch (error) {
      console.error('处理超时订单失败:', appointment.id, error);
    }
  }

  return { processed: processedCount };
}
