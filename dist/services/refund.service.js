"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRefunds = listRefunds;
exports.getRefundById = getRefundById;
exports.processRefund = processRefund;
exports.completeRefund = completeRefund;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
const notification_service_1 = require("./notification.service");
async function listRefunds(operatorId, operatorRole, operatorDeptId) {
    const where = {};
    if (operatorRole === enums_1.UserRole.PATIENT) {
        where.patientId = operatorId;
    }
    const refunds = await prisma_1.default.refundRecord.findMany({
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
async function getRefundById(id, operatorId, operatorRole) {
    const refund = await prisma_1.default.refundRecord.findUnique({
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
        throw new errors_1.NotFoundError('退款记录不存在');
    }
    if (operatorRole === enums_1.UserRole.PATIENT && refund.patientId !== operatorId) {
        throw new errors_1.ForbiddenError('无权限查看他人退款记录');
    }
    return refund;
}
async function processRefund(refundId, operatorId, operatorRole) {
    if (operatorRole !== enums_1.UserRole.FINANCE && operatorRole !== enums_1.UserRole.ADMIN) {
        throw new errors_1.ForbiddenError('无权限处理退款');
    }
    const refund = await prisma_1.default.refundRecord.findUnique({
        where: { id: refundId },
        include: { appointment: true },
    });
    if (!refund) {
        throw new errors_1.NotFoundError('退款记录不存在');
    }
    if (refund.status !== enums_1.RefundStatus.PENDING) {
        throw new errors_1.BadRequestError('当前状态不允许处理退款');
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updatedRefund = await tx.refundRecord.update({
            where: { id: refundId },
            data: {
                status: enums_1.RefundStatus.PROCESSING,
                operatorId,
            },
            include: {
                appointment: true,
            },
        });
        const appointment = await tx.appointment.findUnique({
            where: { id: refund.appointmentId },
        });
        if (appointment &&
            appointment.status === enums_1.AppointmentStatus.CANCELLED) {
            await tx.appointment.update({
                where: { id: refund.appointmentId },
                data: { status: enums_1.AppointmentStatus.REFUND_PROCESSING },
            });
            await tx.statusLog.create({
                data: {
                    appointmentId: refund.appointmentId,
                    fromStatus: enums_1.AppointmentStatus.CANCELLED,
                    toStatus: enums_1.AppointmentStatus.REFUND_PROCESSING,
                    reason: '开始退款处理',
                },
            });
        }
        else if (appointment &&
            appointment.status === enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND) {
            await tx.appointment.update({
                where: { id: refund.appointmentId },
                data: { status: enums_1.AppointmentStatus.REFUND_PROCESSING },
            });
            await tx.statusLog.create({
                data: {
                    appointmentId: refund.appointmentId,
                    fromStatus: enums_1.AppointmentStatus.CLINIC_CANCELLED_REFUND,
                    toStatus: enums_1.AppointmentStatus.REFUND_PROCESSING,
                    reason: '开始退款处理',
                },
            });
        }
        return updatedRefund;
    });
    return result;
}
async function completeRefund(refundId, operatorId, operatorRole) {
    if (operatorRole !== enums_1.UserRole.FINANCE && operatorRole !== enums_1.UserRole.ADMIN) {
        throw new errors_1.ForbiddenError('无权限处理退款');
    }
    const refund = await prisma_1.default.refundRecord.findUnique({
        where: { id: refundId },
        include: { appointment: true },
    });
    if (!refund) {
        throw new errors_1.NotFoundError('退款记录不存在');
    }
    if (refund.status !== enums_1.RefundStatus.PROCESSING) {
        throw new errors_1.BadRequestError('当前状态不允许完成退款');
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updatedRefund = await tx.refundRecord.update({
            where: { id: refundId },
            data: {
                status: enums_1.RefundStatus.COMPLETED,
                operatorId,
            },
            include: {
                appointment: true,
            },
        });
        const appointment = await tx.appointment.findUnique({
            where: { id: refund.appointmentId },
        });
        if (appointment && appointment.status === enums_1.AppointmentStatus.REFUND_PROCESSING) {
            await tx.appointment.update({
                where: { id: refund.appointmentId },
                data: { status: enums_1.AppointmentStatus.REFUNDED },
            });
            await tx.statusLog.create({
                data: {
                    appointmentId: refund.appointmentId,
                    fromStatus: enums_1.AppointmentStatus.REFUND_PROCESSING,
                    toStatus: enums_1.AppointmentStatus.REFUNDED,
                    reason: '退款完成',
                },
            });
        }
        return updatedRefund;
    });
    (0, notification_service_1.notifyRefundSuccess)(refund.appointmentId).catch((err) => {
        console.error('退款成功通知发送失败:', err.message);
    });
    return result;
}
//# sourceMappingURL=refund.service.js.map