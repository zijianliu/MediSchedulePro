import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function createAppointment(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function payAppointment(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function cancelAppointment(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function getAppointment(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function listPatientAppointments(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function listDoctorAppointments(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function processTimeouts(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function checkIn(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function markMissed(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function requeueMissed(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function completeVisit(req: AuthRequest, res: Response, next: any): Promise<void>;
//# sourceMappingURL=appointment.controller.d.ts.map