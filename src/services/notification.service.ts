import prisma from '../utils/prisma';
import { NotificationType, NotificationStatus, AppointmentStatus } from '../types/enums';

const pendingNotifications: Promise<void>[] = [];

function trackNotification(promise: Promise<void>) {
  pendingNotifications.push(promise);
  promise.then(() => {
    const index = pendingNotifications.indexOf(promise);
    if (index > -1) {
      pendingNotifications.splice(index, 1);
    }
  }).catch(() => {
    const index = pendingNotifications.indexOf(promise);
    if (index > -1) {
      pendingNotifications.splice(index, 1);
    }
  });
}

export async function waitForAllNotifications(): Promise<void> {
  await Promise.allSettled(pendingNotifications.map(p => p.catch(() => {})));
  await new Promise(resolve => setTimeout(resolve, 10));
  if (pendingNotifications.length > 0) {
    await Promise.allSettled(pendingNotifications.map(p => p.catch(() => {})));
  }
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  content: string,
  appointmentId?: string,
) {
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      console.warn(`创建通知失败：用户 ${userId} 不存在`);
      return null;
    }

    if (appointmentId) {
      const aptExists = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true },
      });
      if (!aptExists) {
        console.warn(`创建通知失败：预约 ${appointmentId} 不存在`);
        return null;
      }
    }

    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        status: NotificationStatus.PENDING,
        appointmentId,
      },
    });
  } catch (error: any) {
    console.error('创建通知失败:', error.message);
    return null;
  }
}

async function sendNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, status: true },
    });

    if (!notification) {
      return;
    }

    if (notification.status !== NotificationStatus.PENDING) {
      return;
    }

    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (updateError: any) {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.FAILED,
            failReason: updateError.message,
          },
        });
      } catch {
      }
    }
  } catch (error: any) {
    console.error('发送通知异常:', error.message);
  }
}

export async function notifyAppointmentSuccess(appointmentId: string) {
  const promise = (async () => {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { select: { id: true, realName: true } },
          schedule: {
            include: {
              doctor: { select: { realName: true } },
              department: { select: { name: true } },
            },
          },
        },
      });

      if (!appointment) return;

      const title = '预约成功';
      const content = `您好，${appointment.patient.realName}。您已成功预约${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生的号，请按时就诊。`;

      const notification = await createNotification(
        appointment.patientId,
        NotificationType.APPOINTMENT_SUCCESS,
        title,
        content,
        appointmentId,
      );

      if (notification) {
        await sendNotification(notification.id);
      }
    } catch (error: any) {
      console.error('预约成功通知处理失败:', error.message);
    }
  })();

  trackNotification(promise);
}

export async function notifyAppointmentCancelled(appointmentId: string) {
  const promise = (async () => {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { select: { id: true, realName: true } },
          schedule: {
            include: {
              doctor: { select: { realName: true } },
              department: { select: { name: true } },
            },
          },
        },
      });

      if (!appointment) return;

      const title = '预约已取消';
      const content = `您好，${appointment.patient.realName}。您预约的${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生的号已取消，退款将在1-3个工作日内到账。`;

      const notification = await createNotification(
        appointment.patientId,
        NotificationType.APPOINTMENT_CANCELLED,
        title,
        content,
        appointmentId,
      );

      if (notification) {
        await sendNotification(notification.id);
      }
    } catch (error: any) {
      console.error('取消预约通知处理失败:', error.message);
    }
  })();

  trackNotification(promise);
}

export async function notifyClinicCancelled(scheduleId: string) {
  const promise = (async () => {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          scheduleId,
          status: {
            in: [
              AppointmentStatus.CLINIC_CANCELLED_REFUND,
              AppointmentStatus.PENDING_VISIT,
              AppointmentStatus.CHECKED_IN,
            ],
          },
        },
        include: {
          patient: { select: { id: true, realName: true } },
          schedule: {
            include: {
              doctor: { select: { realName: true } },
              department: { select: { name: true } },
            },
          },
        },
      });

      for (const appointment of appointments) {
        try {
          const title = '医生停诊通知';
          const content = `您好，${appointment.patient.realName}。您预约的${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生因特殊原因停诊，我们将为您办理全额退款，请留意账户变动。`;

          const notification = await createNotification(
            appointment.patientId,
            NotificationType.CLINIC_CANCELLED,
            title,
            content,
            appointment.id,
          );

          if (notification) {
            await sendNotification(notification.id);
          }
        } catch (e: any) {
          console.error('单条停诊通知处理失败:', e.message);
        }
      }
    } catch (error: any) {
      console.error('停诊通知处理失败:', error.message);
    }
  })();

  trackNotification(promise);
}

export async function notifyRefundSuccess(appointmentId: string) {
  const promise = (async () => {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { select: { id: true, realName: true } },
          schedule: {
            include: {
              doctor: { select: { realName: true } },
              department: { select: { name: true } },
            },
          },
        },
      });

      if (!appointment) return;

      const title = '退款成功';
      const content = `您好，${appointment.patient.realName}。您预约的${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生的号已退款，金额¥${appointment.fee}已退回您的账户。`;

      const notification = await createNotification(
        appointment.patientId,
        NotificationType.REFUND_SUCCESS,
        title,
        content,
        appointmentId,
      );

      if (notification) {
        await sendNotification(notification.id);
      }
    } catch (error: any) {
      console.error('退款成功通知处理失败:', error.message);
    }
  })();

  trackNotification(promise);
}

export async function listUserNotifications(userId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [list, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { list, total, page, pageSize };
}
