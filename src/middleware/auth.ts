import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../types/enums';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    username: string;
    departmentId?: string | null;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('请先登录');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
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
      throw new UnauthorizedError('用户不存在');
    }

    req.user = {
      userId: user.id,
      role: user.role,
      username: user.username,
      departmentId: user.departmentId,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('请先登录');
    }

    if (roles.indexOf(req.user.role) === -1) {
      throw new ForbiddenError('无权限访问');
    }

    next();
  };
}

export function requireDepartmentAccess(
  getDepartmentId?: (req: AuthRequest) => Promise<string | undefined> | string | undefined,
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('请先登录');
      }

      if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.FINANCE) {
        next();
        return;
      }

      let targetDeptId: string | undefined;
      if (getDepartmentId) {
        targetDeptId = await getDepartmentId(req);
      }

      if (req.user.role === UserRole.DEPT_ADMIN || req.user.role === UserRole.DOCTOR) {
        if (!req.user.departmentId || req.user.departmentId !== targetDeptId) {
          throw new ForbiddenError('无权限操作其他科室的数据');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
