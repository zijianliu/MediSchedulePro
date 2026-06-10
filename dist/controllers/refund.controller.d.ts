import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function listRefunds(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function getRefund(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function processRefund(req: AuthRequest, res: Response, next: any): Promise<void>;
export declare function completeRefund(req: AuthRequest, res: Response, next: any): Promise<void>;
//# sourceMappingURL=refund.controller.d.ts.map