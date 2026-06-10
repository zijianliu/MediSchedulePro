"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRoles = requireRoles;
exports.requireDepartmentAccess = requireDepartmentAccess;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../utils/prisma"));
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('请先登录');
        }
        const token = authHeader.substring(7);
        const payload = (0, jwt_1.verifyToken)(token);
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                username: true,
                role: true,
                departmentId: true,
                realName: true,
            },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('用户不存在');
        }
        req.user = {
            userId: user.id,
            role: user.role,
            username: user.username,
            departmentId: user.departmentId,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('请先登录');
        }
        if (roles.indexOf(req.user.role) === -1) {
            throw new errors_1.ForbiddenError('无权限访问');
        }
        next();
    };
}
function requireDepartmentAccess(getDepartmentId) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError('请先登录');
            }
            if (req.user.role === enums_1.UserRole.ADMIN || req.user.role === enums_1.UserRole.FINANCE) {
                next();
                return;
            }
            let targetDeptId;
            if (getDepartmentId) {
                targetDeptId = await getDepartmentId(req);
            }
            if (req.user.role === enums_1.UserRole.DEPT_ADMIN || req.user.role === enums_1.UserRole.DOCTOR) {
                if (!req.user.departmentId || req.user.departmentId !== targetDeptId) {
                    throw new errors_1.ForbiddenError('无权限操作其他科室的数据');
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=auth.js.map