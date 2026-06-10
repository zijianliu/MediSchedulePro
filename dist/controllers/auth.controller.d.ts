import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function register(req: Request, res: Response, next: any): Promise<void>;
export declare function login(req: Request, res: Response, next: any): Promise<void>;
export declare function getCurrentUser(req: AuthRequest, res: Response, next: any): Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map