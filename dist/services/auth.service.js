"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getCurrentUser = getCurrentUser;
const prisma_1 = __importDefault(require("../utils/prisma"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
async function register(username, password, realName, role = enums_1.UserRole.PATIENT, departmentId, idCard, phone) {
    const existingUser = await prisma_1.default.user.findUnique({ where: { username } });
    if (existingUser) {
        throw new errors_1.BadRequestError('用户名已存在');
    }
    const hashedPassword = await (0, password_1.hashPassword)(password);
    const user = await prisma_1.default.user.create({
        data: {
            username,
            password: hashedPassword,
            realName,
            role,
            departmentId,
            idCard,
            phone,
        },
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            createdAt: true,
        },
    });
    const token = (0, jwt_1.signToken)({
        userId: user.id,
        role: user.role,
        username: user.username,
    });
    return { token, user };
}
async function login(username, password) {
    const user = await prisma_1.default.user.findUnique({ where: { username } });
    if (!user) {
        throw new errors_1.UnauthorizedError('用户名或密码错误');
    }
    const isValid = await (0, password_1.comparePassword)(password, user.password);
    if (!isValid) {
        throw new errors_1.UnauthorizedError('用户名或密码错误');
    }
    const token = (0, jwt_1.signToken)({
        userId: user.id,
        role: user.role,
        username: user.username,
    });
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            realName: user.realName,
            role: user.role,
            departmentId: user.departmentId,
        },
    };
}
async function getCurrentUser(userId) {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            realName: true,
            role: true,
            departmentId: true,
            phone: true,
            idCard: true,
            createdAt: true,
        },
    });
    if (!user) {
        throw new errors_1.NotFoundError('用户不存在');
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map