import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function checkIn(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function callNextPatient(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function completeVisit(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function markMissed(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function requeueMissed(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function getDoctorQueue(req: AuthRequest, res: Response, next: any): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=visit.controller.d.ts.map