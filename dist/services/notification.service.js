"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForAllNotifications = waitForAllNotifications;
exports.notifyAppointmentSuccess = notifyAppointmentSuccess;
exports.notifyAppointmentCancelled = notifyAppointmentCancelled;
exports.notifyClinicCancelled = notifyClinicCancelled;
exports.notifyRefundSuccess = notifyRefundSuccess;
exports.listUserNotifications = listUserNotifications;
const prisma_1 = __importDefault(require("../utils/prisma"));
const enums_1 = require("../types/enums");
const pendingNotifications = [];
function trackNotification(promise) {
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
async function waitForAllNotifications() {
    await Promise.allSettled(pendingNotifications.map(p => p.catch(() => { })));
    await new Promise(resolve => setTimeout(resolve, 10));
    if (pendingNotifications.length > 0) {
        await Promise.allSettled(pendingNotifications.map(p => p.catch(() => { })));
    }
}
async function createNotification(userId, type, title, content, appointmentId) {
    try {
        const userExists = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!userExists) {
            console.warn(`创建通知失败：用户 ${userId} 不存在`);
            return null;
        }
        if (appointmentId) {
            const aptExists = await prisma_1.default.appointment.findUnique({
                where: { id: appointmentId },
                select: { id: true },
            });
            if (!aptExists) {
                console.warn(`创建通知失败：预约 ${appointmentId} 不存在`);
                return null;
            }
        }
        return await prisma_1.default.notification.create({
            data: {
                userId,
                type,
                title,
                content,
                status: enums_1.NotificationStatus.PENDING,
                appointmentId,
            },
        });
    }
    catch (error) {
        console.error('创建通知失败:', error.message);
        return null;
    }
}
async function sendNotification(notificationId) {
    try {
        const notification = await prisma_1.default.notification.findUnique({
            where: { id: notificationId },
            select: { id: true, status: true },
        });
        if (!notification) {
            return;
        }
        if (notification.status !== enums_1.NotificationStatus.PENDING) {
            return;
        }
        try {
            await prisma_1.default.notification.update({
                where: { id: notificationId },
                data: {
                    status: enums_1.NotificationStatus.SENT,
                    sentAt: new Date(),
                },
            });
        }
        catch (updateError) {
            try {
                await prisma_1.default.notification.update({
                    where: { id: notificationId },
                    data: {
                        status: enums_1.NotificationStatus.FAILED,
                        failReason: updateError.message,
                    },
                });
            }
            catch {
            }
        }
    }
    catch (error) {
        console.error('发送通知异常:', error.message);
    }
}
async function notifyAppointmentSuccess(appointmentId) {
    const promise = (async () => {
        try {
            const appointment = await prisma_1.default.appointment.findUnique({
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
            if (!appointment)
                return;
            const title = '预约成功';
            const content = `您好，${appointment.patient.realName}。您已成功预约${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生的号，请按时就诊。`;
            const notification = await createNotification(appointment.patientId, enums_1.NotificationType.APPOINTMENT_SUCCESS, title, content, appointmentId);
            if (notification) {
                await sendNotification(notification.id);
            }
        }
        catch (error) {
            console.error('预约成功通知处理失败:', error.message);
        }
    })();
    trackNotification(promise);
}
async function notifyAppointmentCancelled(appointmentId) {
    const promise = (async () => {
        try {
            const appointment = await prisma_1.default.appointment.findUnique({
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
            if (!appointment)
                return;
            const title = '预约已取消';
            const content = `您好，${appointment.patient.realName}。您预约的${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生的号已取消，退款将在1-3个工作日内到账。`;
            const notification = await createNotification(appointment.patientId, enums_1.NotificationType.APPOINTMENT_CANCELLED, title, content, appointmentId);
            if (notification) {
                await sendNotification(notification.id);
            }
        }
        catch (error) {
            console.error('取消预约通知处理失败:', error.message);
        }
    })();
    trackNotification(promise);
}
async function notifyClinicCancelled(scheduleId) {
    const promise = (async () => {
        try {
            const appointments = await prisma_1.default.appointment.findMany({
                where: {
                    scheduleId,
                    status: {
                        in: [
                            enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND,
                            enums_1.AppointmentStatus.PENDING_VISIT,
                            enums_1.AppointmentStatus.CHECKED_IN,
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
                    const notification = await createNotification(appointment.patientId, enums_1.NotificationType.CLINIC_CANCELLED, title, content, appointment.id);
                    if (notification) {
                        await sendNotification(notification.id);
                    }
                }
                catch (e) {
                    console.error('单条停诊通知处理失败:', e.message);
                }
            }
        }
        catch (error) {
            console.error('停诊通知处理失败:', error.message);
        }
    })();
    trackNotification(promise);
}
async function notifyRefundSuccess(appointmentId) {
    const promise = (async () => {
        try {
            const appointment = await prisma_1.default.appointment.findUnique({
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
            if (!appointment)
                return;
            const title = '退款成功';
            const content = `您好，${appointment.patient.realName}。您预约的${appointment.schedule.department.name} ${appointment.schedule.doctor.realName}医生的号已退款，金额¥${appointment.fee}已退回您的账户。`;
            const notification = await createNotification(appointment.patientId, enums_1.NotificationType.REFUND_SUCCESS, title, content, appointmentId);
            if (notification) {
                await sendNotification(notification.id);
            }
        }
        catch (error) {
            console.error('退款成功通知处理失败:', error.message);
        }
    })();
    trackNotification(promise);
}
async function listUserNotifications(userId, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
        prisma_1.default.notification.findMany({
            where: { userId },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.default.notification.count({ where: { userId } }),
    ]);
    return { list, total, page, pageSize };
}
//# sourceMappingURL=notification.service.js.map