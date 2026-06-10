import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function createSchedule(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function cancelSchedule(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function listSchedules(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function getSchedule(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function getAvailableSchedules(req: AuthRequest, res: Response, next: any): Promise<void>;
//# sourceMappingURL=schedule.controller.d.ts.map