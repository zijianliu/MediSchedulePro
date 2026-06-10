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
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
async function listDepartments() {
    return prisma_1.default.department.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { doctors: true },
            },
        },
    });
}
async function getDepartmentById(id) {
    const dept = await prisma_1.default.department.findUnique({
        where: { id },
        include: {
            _count: {
                select: { doctors: true },
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
async function createDepartment(name, description) {
    return prisma_1.default.department.create({
        data: { name, description },
    });
}
//# sourceMappingURL=department.service.js.map