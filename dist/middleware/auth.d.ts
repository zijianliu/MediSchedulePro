import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        username: string;
        departmentId?: string | null;
    };
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireRoles(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireDepartmentAccess(getDepartmentId?: (req: AuthRequest) => Promise<string | undefined> | string | undefined): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map