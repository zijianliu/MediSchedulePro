"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIn = checkIn;
exports.callNextPatient = callNextPatient;
exports.completeVisit = completeVisit;
exports.markMissed = markMissed;
exports.requeueMissed = requeueMissed;
exports.getDoctorQueue = getDoctorQueue;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
const stateMachine_1 = require("../utils/stateMachine");
const mask_1 = require("../utils/mask");
async function checkIn(appointmentId, patientId) {
    const appointment = await prisma_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            schedule: true,
            patient: { select: { id: true } },
        },
    });
    if (!appointment) {
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (appointment.patientId !== patientId) {
        throw new errors_1.ForbiddenError('无权限操作他人预约');
    }
    if (appointment.status !== enums_1.AppointmentStatus.PENDING_VISIT) {
        throw new errors_1.BadRequestError('当前状态不允许签到');
    }
    const scheduleDate = new Date(appointment.schedule.date);
    const today = new Date();
    scheduleDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (scheduleDate.getTime() !== today.getTime()) {
        throw new errors_1.BadRequestError('只能在就诊当天签到');
    }
    (0, stateMachine_1.validateTransition)(appointment.status, enums_1.AppointmentStatus.CHECKED_IN);
    let queueNumber;
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updateCount = await tx.appointment.updateMany({
            where: {
                id: appointmentId,
                status: enums_1.AppointmentStatus.PENDING_VISIT,
            },
            data: {
                status: enums_1.AppointmentStatus.CHECKED_IN,
                checkedInAt: new Date(),
            },
        });
        if (updateCount.count === 0) {
            throw new errors_1.BadRequestError('签到失败，请稍后重试');
        }
        const checkedInCount = await tx.appointment.count({
            where: {
                scheduleId: appointment.scheduleId,
                status: enums_1.AppointmentStatus.CHECKED_IN,
            },
        });
        const inVisitCount = await tx.appointment.count({
            where: {
                scheduleId: appointment.scheduleId,
                status: enums_1.AppointmentStatus.IN_VISIT,
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
                fromStatus: enums_1.AppointmentStatus.PENDING_VISIT,
                toStatus: enums_1.AppointmentStatus.CHECKED_IN,
                reason: '患者签到',
            },
        });
        return { appointmentId, queueNumber };
    });
    return result;
}
async function callNextPatient(scheduleId, doctorId) {
    const schedule = await prisma_1.default.schedule.findUnique({
        where: { id: scheduleId },
    });
    if (!schedule) {
        throw new errors_1.NotFoundError('排班不存在');
    }
    if (schedule.doctorId !== doctorId) {
        throw new errors_1.ForbiddenError('无权限操作非本人排班');
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const currentInVisit = await tx.appointment.findFirst({
            where: {
                scheduleId,
                status: enums_1.AppointmentStatus.IN_VISIT,
            },
        });
        if (currentInVisit) {
            throw new errors_1.BadRequestError('当前有患者正在就诊中，请先完成就诊');
        }
        const nextPatient = await tx.appointment.findFirst({
            where: {
                scheduleId,
                status: enums_1.AppointmentStatus.CHECKED_IN,
            },
            orderBy: { queueNumber: 'asc' },
            include: {
                patient: {
                    select: { id: true, realName: true },
                },
            },
        });
        if (!nextPatient) {
            throw new errors_1.BadRequestError('没有等待中的患者');
        }
        const updateCount = await tx.appointment.updateMany({
            where: {
                id: nextPatient.id,
                status: enums_1.AppointmentStatus.CHECKED_IN,
            },
            data: {
                status: enums_1.AppointmentStatus.IN_VISIT,
            },
        });
        if (updateCount.count === 0) {
            throw new errors_1.BadRequestError('叫号失败，请稍后重试');
        }
        await tx.statusLog.create({
            data: {
                appointmentId: nextPatient.id,
                fromStatus: enums_1.AppointmentStatus.CHECKED_IN,
                toStatus: enums_1.AppointmentStatus.IN_VISIT,
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
async function completeVisit(appointmentId, doctorId) {
    const appointment = await prisma_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { schedule: true },
    });
    if (!appointment) {
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (appointment.schedule.doctorId !== doctorId) {
        throw new errors_1.ForbiddenError('无权限操作非本人患者');
    }
    if (appointment.status !== enums_1.AppointmentStatus.IN_VISIT) {
        throw new errors_1.BadRequestError('当前状态不允许完成就诊');
    }
    (0, stateMachine_1.validateTransition)(appointment.status, enums_1.AppointmentStatus.COMPLETED);
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updateCount = await tx.appointment.updateMany({
            where: {
                id: appointmentId,
                status: enums_1.AppointmentStatus.IN_VISIT,
            },
            data: {
                status: enums_1.AppointmentStatus.COMPLETED,
                completedAt: new Date(),
            },
        });
        if (updateCount.count === 0) {
            throw new errors_1.BadRequestError('操作失败，请稍后重试');
        }
        await tx.statusLog.create({
            data: {
                appointmentId,
                fromStatus: enums_1.AppointmentStatus.IN_VISIT,
                toStatus: enums_1.AppointmentStatus.COMPLETED,
                reason: '医生完成就诊',
            },
        });
        return { success: true };
    });
    return result;
}
async function markMissed(appointmentId, doctorId) {
    const appointment = await prisma_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { schedule: true },
    });
    if (!appointment) {
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (appointment.schedule.doctorId !== doctorId) {
        throw new errors_1.ForbiddenError('无权限操作非本人患者');
    }
    if (appointment.status !== enums_1.AppointmentStatus.CHECKED_IN &&
        appointment.status !== enums_1.AppointmentStatus.IN_VISIT) {
        throw new errors_1.BadRequestError('当前状态不允许标记过号');
    }
    (0, stateMachine_1.validateTransition)(appointment.status, enums_1.AppointmentStatus.MISSED);
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updateCount = await tx.appointment.updateMany({
            where: {
                id: appointmentId,
                status: {
                    in: [enums_1.AppointmentStatus.CHECKED_IN, enums_1.AppointmentStatus.IN_VISIT],
                },
            },
            data: {
                status: enums_1.AppointmentStatus.MISSED,
            },
        });
        if (updateCount.count === 0) {
            throw new errors_1.BadRequestError('操作失败，请稍后重试');
        }
        await tx.statusLog.create({
            data: {
                appointmentId,
                fromStatus: appointment.status,
                toStatus: enums_1.AppointmentStatus.MISSED,
                reason: '医生标记过号',
            },
        });
        return { success: true };
    });
    return result;
}
async function requeueMissed(appointmentId, doctorId) {
    const appointment = await prisma_1.default.appointment.findUnique({
        where: { id: appointmentId },
        include: { schedule: true },
    });
    if (!appointment) {
        throw new errors_1.NotFoundError('预约不存在');
    }
    if (appointment.schedule.doctorId !== doctorId) {
        throw new errors_1.ForbiddenError('无权限操作非本人患者');
    }
    if (appointment.status !== enums_1.AppointmentStatus.MISSED) {
        throw new errors_1.BadRequestError('只有过号的患者可以重新排队');
    }
    (0, stateMachine_1.validateTransition)(appointment.status, enums_1.AppointmentStatus.CHECKED_IN);
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updateCount = await tx.appointment.updateMany({
            where: {
                id: appointmentId,
                status: enums_1.AppointmentStatus.MISSED,
            },
            data: {
                status: enums_1.AppointmentStatus.CHECKED_IN,
            },
        });
        if (updateCount.count === 0) {
            throw new errors_1.BadRequestError('操作失败，请稍后重试');
        }
        const maxQueueNumber = await tx.appointment.findFirst({
            where: {
                scheduleId: appointment.scheduleId,
                status: { in: [enums_1.AppointmentStatus.CHECKED_IN, enums_1.AppointmentStatus.IN_VISIT] },
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
                fromStatus: enums_1.AppointmentStatus.MISSED,
                toStatus: enums_1.AppointmentStatus.CHECKED_IN,
                reason: '过号重排',
            },
        });
        return { success: true, queueNumber: newQueueNumber };
    });
    return result;
}
async function getDoctorQueue(doctorId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const schedules = await prisma_1.default.schedule.findMany({
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
    const appointments = await prisma_1.default.appointment.findMany({
        where: {
            scheduleId: { in: scheduleIds },
            status: {
                not: enums_1.AppointmentStatus.CANCELLED,
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
    return (0, mask_1.maskPatientList)(appointments, 'DOCTOR', undefined, undefined);
}
//# sourceMappingURL=visit.service.js.map