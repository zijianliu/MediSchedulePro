import { Response } from 'express';
import * as logService from '../services/log.service';
import { AuthRequest } from '../middleware/auth';

export async function listOperationLogs(req: AuthRequest, res: Response, next: any) {
  try {
    const { page, pageSize, type, targetType } = req.query;
    const logs = await logService.listOperationLogs({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      type: type as string | undefined,
      targetType: targetType as string | undefined,
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

export async function listStatusLogs(req: AuthRequest, res: Response, next: any) {
  try {
    const { appointmentId } = req.params;
    const logs = await logService.listStatusLogs(appointmentId);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}
