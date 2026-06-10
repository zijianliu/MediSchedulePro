import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { RefundStatus, AppointmentStatus, UserRole } from '../types/enums';
import { validateTransition } from '../utils/stateMachine';
import { notifyRefundSuccess } from './notification.service';

export async function listRefunds(
  operatorId: string,
  operatorRole: string,
  operatorDeptId?: string | null,
) {
  const where: any = {};

  if (operatorRole === UserRole.PATIENT) {
    where.patientId = operatorId;
  }

  const refunds = await prisma.refundRecord.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          realName: true,
          phone: true,
        },
      },
      operator: {
        select: {
          id: true,
          realName: true,
        },
      },
      appointment: {
        include: {
          schedule: {
            include: {
              doctor: { select: { realName: true } },
              department: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return refunds;
}

export async function getRefundById(
  id: string,
  operatorId: string,
  operatorRole: string,
) {
  const refund = await prisma.refundRecord.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          realName: true,
          phone: true,
          idCard: true,
        },
      },
      operator: {
        select: {
          id: true,
          realName: true,
        },
      },
      appointment: {
        include: {
          schedule: {
            include: {
              doctor: { select: { realName: true } },
              department: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!refund) {
    throw new NotFoundError('退款记录不存在');
  }

  if (operatorRole === UserRole.PATIENT && refund.patientId !== operatorId) {
    throw new ForbiddenError('无权限查看他人退款记录');
  }

  return refund;
}

export async function processRefund(
  refundId: string,
  operatorId: string,
  operatorRole: string,
) {
  if (operatorRole !== UserRole.FINANCE && operatorRole !== UserRole.ADMIN) {
    throw new ForbiddenError('无权限处理退款');
  }

  const refund = await prisma.refundRecord.findUnique({
    where: { id: refundId },
    include: { appointment: true },
  });

  if (!refund) {
    throw new NotFoundError('退款记录不存在');
  }

  if (refund.status !== RefundStatus.PENDING) {
    throw new BadRequestError('当前状态不允许处理退款');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRefund = await tx.refundRecord.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.PROCESSING,
        operatorId,
      },
      include: {
        appointment: true,
      },
    });

    const appointment = await tx.appointment.findUnique({
      where: { id: refund.appointmentId },
    });

    if (
      appointment &&
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      await tx.appointment.update({
        where: { id: refund.appointmentId },
        data: { status: AppointmentStatus.REFUND_PROCESSING },
      });

      await tx.statusLog.create({
        data: {
          appointmentId: refund.appointmentId,
          fromStatus: AppointmentStatus.CANCELLED,
          toStatus: AppointmentStatus.REFUND_PROCESSING,
          reason: '开始退款处理',
        },
      });
    } else if (
      appointment &&
      appointment.status === AppointmentStatus.CLINIC_CANCELLED_REFUND
    ) {
      await tx.appointment.update({
        where: { id: refund.appointmentId },
        data: { status: AppointmentStatus.REFUND_PROCESSING },
      });

      await tx.statusLog.create({
        data: {
          appointmentId: refund.appointmentId,
          fromStatus: AppointmentStatus.CLINIC_CANCELLED_REFUND,
          toStatus: AppointmentStatus.REFUND_PROCESSING,
          reason: '开始退款处理',
        },
      });
    }

    return updatedRefund;
  });

  return result;
}

export async function completeRefund(
  refundId: string,
  operatorId: string,
  operatorRole: string,
) {
  if (operatorRole !== UserRole.FINANCE && operatorRole !== UserRole.ADMIN) {
    throw new ForbiddenError('无权限处理退款');
  }

  const refund = await prisma.refundRecord.findUnique({
    where: { id: refundId },
    include: { appointment: true },
  });

  if (!refund) {
    throw new NotFoundError('退款记录不存在');
  }

  if (refund.status !== RefundStatus.PROCESSING) {
    throw new BadRequestError('当前状态不允许完成退款');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRefund = await tx.refundRecord.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.COMPLETED,
        operatorId,
      },
      include: {
        appointment: true,
      },
    });

    const appointment = await tx.appointment.findUnique({
      where: { id: refund.appointmentId },
    });

    if (appointment && appointment.status === AppointmentStatus.REFUND_PROCESSING) {
      await tx.appointment.update({
        where: { id: refund.appointmentId },
        data: { status: AppointmentStatus.REFUNDED },
      });

      await tx.statusLog.create({
        data: {
          appointmentId: refund.appointmentId,
          fromStatus: AppointmentStatus.REFUND_PROCESSING,
          toStatus: AppointmentStatus.REFUNDED,
          reason: '退款完成',
        },
      });
    }

    return updatedRefund;
  });

  notifyRefundSuccess(refund.appointmentId).catch((err) => {
    console.error('退款成功通知发送失败:', err.message);
  });

  return result;
}
