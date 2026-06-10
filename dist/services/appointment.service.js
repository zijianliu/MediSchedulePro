"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointment = createAppointment;
exports.payAppointment = payAppointment;
exports.cancelAppointment = cancelAppointment;
exports.getAppointmentById = getAppointmentById;
exports.listPatientAppointments = listPatientAppointments;
exports.listDoctorAppointments = listDoctorAppointments;
exports.processTimeoutAppointments = processTimeoutAppointments;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
const stateMachine_1 = require("../utils/stateMachine");
const mask_1 = require("../utils/mask");
const notification_service_1 = require("./notification.service");
const MAX_RETRY = 3;
const PAYMENT_TIMEOUT_MINUTES = 30;
async function createAppointment(patientId, scheduleId, patientName, patientIdCard, patientPhone) {
    if (!patientName.trim()) {
        throw new errors_1.BadRequestError('请填写患者姓名');
    }
    if (!patientIdCard.trim()) {
        throw new errors_1.BadRequestError('请填写身份证号');
    }
    if (!patientPhone.trim()) {
        throw new errors_1.BadRequestError('请填写手机号');
    }
    const schedule = await prisma_1.default.schedule.findUnique({
        where: { id: scheduleId },
        include: {
            slotInventory: true,
            doctor: { select: { realName: true } },
        },
    });
    if (!schedule) {
        throw new errors_1.NotFoundError('排班不存在');
    }
    if (schedule.isCancelled) {
        throw new errors_1.BadRequestError('该排班已停诊');
    }
    if (!schedule.slotInventory) {
        throw new errors_1.BadRequestError('号源信息不存在');
    }
    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduleDate < today) {
        throw new errors_1.BadRequestError('不能预约过去的号源');
    }
    const existingAppointment = await prisma_1.default.appointment.findFirst({
        where: {
            patientId,
            scheduleId,
            status: {
                in: [
                    enums_1.AppointmentStatus.PENDING_PAYMENT,
                    enums_1.AppointmentStatus.PENDING_VISIT,
                    enums_1.AppointmentStatus.CHECKED_IN,
                    enums_1.AppointmentStatus.IN_VISIT,
                ],
            },
        },
    });
    if (existingAppointment) {
        throw new errors_1.ConflictError('您已预约该时段号源，不能重复预约');
    }
    const sameDayDeptAppointments = await prisma_1.default.appointment.findMany({
        where: {
            patientId,
            departmentId: schedule.departmentId,
            status: {
                in: [
                    enums_1.AppointmentStatus.PENDING_PAYMENT,
                    enums_1.AppointmentStatus.PENDING_VISIT,
                    enums_1.AppointmentStatus.CHECKED_IN,
                    enums_1.AppointmentStatus.IN_VISIT,
                ],
            },
        },
        include: { schedule: true },
    });
    for (const apt of sameDayDeptAppointments) {
        const aptDate = new Date(apt.schedule.date);
        aptDate.setHours(0, 0, 0, 0);
        if (aptDate.getTime() === scheduleDate.getTime()) {
            throw new errors_1.ConflictError('同一天同一科室只能预约一个号源');
        }
    }
    let lastError;
    for (let i = 0; i < MAX_RETRY; i++) {
        try {
            const result = await prisma_1.default.$transaction(async (tx) => {
                const inventory = await tx.slotInventory.findUnique({
                    where: { scheduleId },
                });
                if (!inventory) {
                    throw new errors_1.BadRequestError('号源信息不存在');
                }
                if (inventory.availableSlots <= 0) {
                    throw new errors_1.BadRequestError('号源不足');
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
                    throw new errors_1.ConflictError('号源已被锁定，请稍后重试');
                }
                const appointment = await tx.appointment.create({
                    data: {
                        patientId,
                        scheduleId,
                        departmentId: schedule.departmentId,
                        status: enums_1.AppointmentStatus.PENDING_PAYMENT,
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
                        toStatus: enums_1.AppointmentStatus.PENDING_PAYMENT,
                        reason: '创建预约',
                    },
                });
                return appointment;
            });
            return result;
        }
        catch (error) {
            lastError = error;
            if (error.name !== 'ConflictError' && error.code !== 'P2028') {
                throw error;
            }
        }
    }
    throw lastError || new errors_1.BadRequestError('预约失败，请稍后重试');
}
async function payAppointment(appointmentId, patientId) {
    const appointment = await prisma_1.default.appointment.findUnique({
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
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (appointment.patientId !== patientId) {
        throw new errors_1.ForbiddenError('无权限操作他人预约');
    }
    if (appointment.status === enums_1.AppointmentStatus.PENDING_VISIT) {
        return appointment;
    }
    if (appointment.status !== enums_1.AppointmentStatus.PENDING_PAYMENT) {
        throw new errors_1.BadRequestError('当前状态不允许支付');
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updateCount = await tx.appointment.updateMany({
            where: {
                id: appointmentId,
                status: enums_1.AppointmentStatus.PENDING_PAYMENT,
            },
            data: {
                status: enums_1.AppointmentStatus.PENDING_VISIT,
            },
        });
        if (updateCount.count === 0) {
            const current = await tx.appointment.findUnique({ where: { id: appointmentId } });
            if (current?.status === enums_1.AppointmentStatus.PENDING_VISIT) {
                return current;
            }
            throw new errors_1.BadRequestError('支付失败，请稍后重试');
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
                fromStatus: enums_1.AppointmentStatus.PENDING_PAYMENT,
                toStatus: enums_1.AppointmentStatus.PENDING_VISIT,
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
    (0, notification_service_1.notifyAppointmentSuccess)(appointmentId).catch((err) => {
        console.error('预约成功通知发送失败:', err.message);
    });
    return result;
}
async function cancelAppointment(appointmentId, userId, userRole) {
    const appointment = await prisma_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            schedule: { include: { doctor: { select: { realName: true } } } },
            patient: { select: { id: true, realName: true, departmentId: true } },
        },
    });
    if (!appointment) {
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (userRole === enums_1.UserRole.PATIENT && appointment.patientId !== userId) {
        throw new errors_1.ForbiddenError('无权限取消他人预约');
    }
    if (appointment.status !== enums_1.AppointmentStatus.PENDING_PAYMENT &&
        appointment.status !== enums_1.AppointmentStatus.PENDING_VISIT) {
        throw new errors_1.BadRequestError('当前状态不允许取消');
    }
    if (appointment.status === enums_1.AppointmentStatus.PENDING_VISIT) {
        const scheduleDate = new Date(appointment.schedule.date);
        const now = new Date();
        const hoursBefore = (scheduleDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursBefore < 2) {
            throw new errors_1.BadRequestError('就诊前2小时内不能取消预约');
        }
    }
    (0, stateMachine_1.validateTransition)(appointment.status, enums_1.AppointmentStatus.CANCELLED);
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updated = await tx.appointment.update({
            where: { id: appointmentId },
            data: {
                status: enums_1.AppointmentStatus.CANCELLED,
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
            if (appointment.status === enums_1.AppointmentStatus.PENDING_PAYMENT && inventory.lockedSlots > 0) {
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
            else if (appointment.status === enums_1.AppointmentStatus.PENDING_VISIT && inventory.bookedSlots > 0) {
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
        if (appointment.status === enums_1.AppointmentStatus.PENDING_VISIT) {
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
                toStatus: enums_1.AppointmentStatus.CANCELLED,
                reason: userRole === enums_1.UserRole.PATIENT ? '患者取消' : '管理员取消',
            },
        });
        return updated;
    });
    if (appointment.status === enums_1.AppointmentStatus.PENDING_VISIT) {
        (0, notification_service_1.notifyAppointmentCancelled)(appointmentId).catch((err) => {
            console.error('取消预约通知发送失败:', err.message);
        });
    }
    return result;
}
async function getAppointmentById(id, userId, userRole, userDeptId) {
    const appointment = await prisma_1.default.appointment.findUnique({
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
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (userRole === enums_1.UserRole.PATIENT && appointment.patientId !== userId) {
        throw new errors_1.ForbiddenError('无权限查看他人预约');
    }
    if (userRole === enums_1.UserRole.DOCTOR && appointment.schedule.doctor.id !== userId) {
        throw new errors_1.ForbiddenError('无权限查看非本人患者预约');
    }
    if (userRole === enums_1.UserRole.DEPT_ADMIN &&
        appointment.departmentId !== userDeptId) {
        throw new errors_1.ForbiddenError('无权限查看其他科室预约');
    }
    const maskedPatient = (0, mask_1.maskPatientData)(appointment.patient, userRole, userDeptId || undefined, userId);
    return { ...appointment, patient: maskedPatient };
}
async function listPatientAppointments(patientId, status) {
    const where = { patientId };
    if (status) {
        where.status = status;
    }
    const appointments = await prisma_1.default.appointment.findMany({
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
async function listDoctorAppointments(doctorId, date, status) {
    const where = {
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
    const appointments = await prisma_1.default.appointment.findMany({
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
    return (0, mask_1.maskPatientList)(appointments, 'DOCTOR', undefined, undefined);
}
async function processTimeoutAppointments() {
    const timeoutThreshold = new Date();
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - PAYMENT_TIMEOUT_MINUTES);
    const pendingAppointments = await prisma_1.default.appointment.findMany({
        where: {
            status: enums_1.AppointmentStatus.PENDING_PAYMENT,
            createdAt: { lte: timeoutThreshold },
        },
    });
    let processedCount = 0;
    for (const appointment of pendingAppointments) {
        try {
            await prisma_1.default.$transaction(async (tx) => {
                const updateCount = await tx.appointment.updateMany({
                    where: {
                        id: appointment.id,
                        status: enums_1.AppointmentStatus.PENDING_PAYMENT,
                    },
                    data: {
                        status: enums_1.AppointmentStatus.TIMEOUT,
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
                            fromStatus: enums_1.AppointmentStatus.PENDING_PAYMENT,
                            toStatus: enums_1.AppointmentStatus.TIMEOUT,
                            reason: '支付超时',
                        },
                    });
                    processedCount++;
                }
            });
        }
        catch (error) {
            console.error('处理超时订单失败:', appointment.id, error);
        }
    }
    return { processed: processedCount };
}
//# sourceMappingURL=appointment.service.js.map