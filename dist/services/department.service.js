"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDepartments = listDepartments;
exports.getDepartmentById = getDepartmentById;
exports.listDoctors = listDoctors;
exports.getDoctorById = getDoctorById;
exports.createDepartment = createDepartment;
exports.updateDepartment = updateDepartment;
exports.toggleDepartmentStatus = toggleDepartmentStatus;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
async function listDepartments(includeInactive = false) {
    const where = {};
    if (!includeInactive) {
        where.status = 'ACTIVE';
    }
    return prisma_1.default.department.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { doctors: true, schedules: true },
            },
        },
    });
}
async function getDepartmentById(id) {
    const dept = await prisma_1.default.department.findUnique({
        where: { id },
        include: {
            _count: {
                select: { doctors: true, schedules: true },
            },
        },
    });
    if (!dept) {
        throw new errors_1.NotFoundError('科室不存在');
    }
    return dept;
}
async function listDoctors(departmentId) {
    const where = {};
    if (departmentId) {
        where.departmentId = departmentId;
    }
    else {
        where.role = 'DOCTOR';
    }
    if (!where.role) {
        where.role = 'DOCTOR';
    }
    return prisma_1.default.user.findMany({
        where,
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            department: {
                select: { name: true },
            },
        },
        orderBy: { realName: 'asc' },
    });
}
async function getDoctorById(id) {
    const doctor = await prisma_1.default.user.findFirst({
        where: { id, role: 'DOCTOR' },
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            department: {
                select: { name: true },
            },
        },
    });
    if (!doctor) {
        throw new errors_1.NotFoundError('医生不存在');
    }
    return doctor;
}
async function createDepartment(name, code, description) {
    const existing = await prisma_1.default.department.findFirst({
        where: {
            OR: [
                { name },
                ...(code ? [{ code }] : []),
            ],
        },
    });
    if (existing) {
        throw new errors_1.BadRequestError(existing.name === name ? '科室名称已存在' : '科室编码已存在');
    }
    return prisma_1.default.department.create({
        data: { name, code, description, status: 'ACTIVE' },
    });
}
async function updateDepartment(id, data) {
    const dept = await prisma_1.default.department.findUnique({ where: { id } });
    if (!dept) {
        throw new errors_1.NotFoundError('科室不存在');
    }
    if (data.name && data.name !== dept.name) {
        const existing = await prisma_1.default.department.findFirst({ where: { name: data.name, id: { not: id } } });
        if (existing) {
            throw new errors_1.BadRequestError('科室名称已存在');
        }
    }
    if (data.code && data.code !== dept.code) {
        const existing = await prisma_1.default.department.findFirst({ where: { code: data.code, id: { not: id } } });
        if (existing) {
            throw new errors_1.BadRequestError('科室编码已存在');
        }
    }
    return prisma_1.default.department.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.code !== undefined && { code: data.code }),
            ...(data.description !== undefined && { description: data.description }),
        },
    });
}
async function toggleDepartmentStatus(id) {
    const dept = await prisma_1.default.department.findUnique({ where: { id } });
    if (!dept) {
        throw new errors_1.NotFoundError('科室不存在');
    }
    const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return prisma_1.default.department.update({
        where: { id },
        data: { status: newStatus },
    });
}
//# sourceMappingURL=department.service.js.map