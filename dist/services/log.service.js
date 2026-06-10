"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOperation = logOperation;
exports.logStatusChange = logStatusChange;
exports.listOperationLogs = listOperationLogs;
exports.listStatusLogs = listStatusLogs;
const prisma_1 = __importDefault(require("../utils/prisma"));
async function logOperation(tx, type, operatorId, operatorRole, targetType, targetId, content) {
    await tx.operationLog.create({
        data: {
            type,
            operatorId,
            operatorRole,
            targetType,
            targetId,
            content,
        },
    });
}
async function logStatusChange(tx, appointmentId, fromStatus, toStatus, reason, operatorId) {
    await tx.statusLog.create({
        data: {
            appointmentId,
            fromStatus,
            toStatus,
            reason,
        },
    });
}
async function listOperationLogs(params) {
    const { page = 1, pageSize = 20, type, operatorId, targetType } = params;
    const skip = (page - 1) * pageSize;
    const where = {};
    if (type) {
        where.type = type;
    }
    if (operatorId) {
        where.operatorId = operatorId;
    }
    if (targetType) {
        where.targetType = targetType;
    }
    const [list, total] = await Promise.all([
        prisma_1.default.operationLog.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                operator: {
                    select: {
                        id: true,
                        realName: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.default.operationLog.count({ where }),
    ]);
    return {
        list,
        total,
        page,
        pageSize,
    };
}
async function listStatusLogs(appointmentId) {
    return prisma_1.default.statusLog.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'asc' },
    });
}
//# sourceMappingURL=log.service.js.map