"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchedule = createSchedule;
exports.cancelSchedule = cancelSchedule;
exports.listSchedules = listSchedules;
exports.getScheduleById = getScheduleById;
exports.getAvailableSchedules = getAvailableSchedules;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
const log_service_1 = require("./log.service");
const notification_service_1 = require("./notification.service");
async function createSchedule(doctorId, departmentId, date, timeSlot, maxSlots, fee, operatorId, operatorRole) {
    if (maxSlots <= 0) {
        throw new errors_1.BadRequestError('号源数量必须大于0');
    }
    if (fee < 0) {
        throw new errors_1.BadRequestError('挂号费用不能为负数');
    }
    const doctor = await prisma_1.default.user.findUnique({
        where: { id: doctorId },
        select: { id: true, role: true, departmentId: true, realName: true },
    });
    if (!doctor || doctor.role !== 'DOCTOR') {
        throw new errors_1.BadRequestError('医生不存在');
    }
    const scheduleDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduleDate < today) {
        throw new errors_1.BadRequestError('不能创建过去日期的排班');
    }
    try {
        const result = await prisma_1.default.$transaction(async (tx) => {
            const existing = await tx.schedule.findFirst({
                where: {
                    doctorId,
                    date: scheduleDate,
                    timeSlot,
                    isCancelled: false,
                },
            });
            if (existing) {
                throw new errors_1.ConflictError('该医生该时段已有排班');
            }
            const schedule = await tx.schedule.create({
                data: {
                    doctorId,
                    departmentId,
                    date: scheduleDate,
                    timeSlot,
                    maxSlots,
                    fee,
                },
                include: {
                    doctor: { select: { realName: true } },
                    department: { select: { name: true } },
                    slotInventory: true,
                },
            });
            const inventory = await tx.slotInventory.create({
                data: {
                    scheduleId: schedule.id,
                    totalSlots: maxSlots,
                    availableSlots: maxSlots,
                },
            });
            await (0, log_service_1.logOperation)(tx, enums_1.LogType.SCHEDULE_CREATE, operatorId, operatorRole, 'Schedule', schedule.id, `创建排班：${doctor.realName} - ${date} ${timeSlot}，号源数：${maxSlots}`);
            return { ...schedule, slotInventory: inventory };
        });
        return result;
    }
    catch (error) {
        if (error.code === 'P2002' || error.name === 'ConflictError') {
            throw new errors_1.ConflictError('该医生该时段已有排班');
        }
        throw error;
    }
}
async function cancelSchedule(scheduleId, reason, operatorId, operatorRole) {
    if (!reason || !reason.trim()) {
        throw new errors_1.BadRequestError('请填写停诊原因');
    }
    const schedule = await prisma_1.default.schedule.findUnique({
        where: { id: scheduleId },
        include: {
            doctor: { select: { realName: true, id: true } },
            slotInventory: true,
        },
    });
    if (!schedule) {
        throw new errors_1.NotFoundError('排班不存在');
    }
    if (schedule.isCancelled) {
        throw new errors_1.BadRequestError('该排班已停诊');
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const cancelledSchedule = await tx.schedule.update({
            where: { id: scheduleId },
            data: {
                isCancelled: true,
                cancelReason: reason,
            },
            include: {
                doctor: { select: { realName: true } },
                department: { select: { name: true } },
            },
        });
        if (schedule.slotInventory) {
            const booked = schedule.slotInventory.bookedSlots;
            const locked = schedule.slotInventory.lockedSlots;
            const totalReleased = booked + locked;
            if (totalReleased > 0) {
                await tx.slotInventory.updateMany({
                    where: {
                        scheduleId,
                        version: schedule.slotInventory.version,
                    },
                    data: {
                        bookedSlots: 0,
                        lockedSlots: 0,
                        availableSlots: schedule.slotInventory.totalSlots,
                        version: { increment: 1 },
                    },
                });
            }
        }
        const appointments = await tx.appointment.findMany({
            where: {
                scheduleId,
                status: {
                    in: [
                        enums_1.AppointmentStatus.PENDING_PAYMENT,
                        enums_1.AppointmentStatus.PENDING_VISIT,
                        enums_1.AppointmentStatus.CHECKED_IN,
                    ],
                },
            },
        });
        for (const appointment of appointments) {
            await tx.appointment.update({
                where: { id: appointment.id },
                data: {
                    status: enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND,
                },
            });
            await tx.refundRecord.create({
                data: {
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    amount: appointment.fee,
                    reason: `医生停诊：${reason}`,
                    status: 'PENDING',
                },
            });
            await tx.statusLog.create({
                data: {
                    appointmentId: appointment.id,
                    fromStatus: appointment.status,
                    toStatus: enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND,
                    reason: `医生停诊：${reason}`,
                },
            });
        }
        await (0, log_service_1.logOperation)(tx, enums_1.LogType.SCHEDULE_CANCEL, operatorId, operatorRole, 'Schedule', scheduleId, `停诊：${schedule.doctor.realName} - ${schedule.date.toISOString().split('T')[0]} ${schedule.timeSlot}，原因：${reason}`);
        return { schedule: cancelledSchedule, affectedAppointments: appointments.length };
    });
    (0, notification_service_1.notifyClinicCancelled)(scheduleId).catch((err) => {
        console.error('停诊通知发送失败:', err.message);
    });
    return result;
}
async function listSchedules(params) {
    const where = {};
    if (params.departmentId) {
        where.departmentId = params.departmentId;
    }
    if (params.doctorId) {
        where.doctorId = params.doctorId;
    }
    if (!params.includeCancelled) {
        where.isCancelled = false;
    }
    if (params.startDate || params.endDate) {
        where.date = {};
        if (params.startDate) {
            where.date.gte = new Date(params.startDate);
        }
        if (params.endDate) {
            const end = new Date(params.endDate);
            end.setHours(23, 59, 59, 999);
            where.date.lte = end;
        }
    }
    return prisma_1.default.schedule.findMany({
        where,
        include: {
            doctor: {
                select: { id: true, realName: true },
            },
            department: {
                select: { id: true, name: true },
            },
            slotInventory: true,
        },
        orderBy: [
            { date: 'asc' },
            { doctor: { realName: 'asc' } },
        ],
    });
}
async function getScheduleById(id) {
    const schedule = await prisma_1.default.schedule.findUnique({
        where: { id },
        include: {
            doctor: {
                select: { id: true, realName: true },
            },
            department: {
                select: { id: true, name: true },
            },
            slotInventory: true,
        },
    });
    if (!schedule) {
        throw new errors_1.NotFoundError('排班不存在');
    }
    return schedule;
}
async function getAvailableSchedules(departmentId, doctorId, date) {
    const where = {
        isCancelled: false,
    };
    if (departmentId) {
        where.departmentId = departmentId;
    }
    if (doctorId) {
        where.doctorId = doctorId;
    }
    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.date = { gte: start, lte: end };
    }
    else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        where.date = { gte: today };
    }
    return prisma_1.default.schedule.findMany({
        where,
        include: {
            doctor: {
                select: { id: true, realName: true },
            },
            department: {
                select: { id: true, name: true },
            },
            slotInventory: true,
        },
        orderBy: [
            { date: 'asc' },
            { doctor: { realName: 'asc' } },
        ],
    });
}
//# sourceMappingURL=schedule.service.js.map