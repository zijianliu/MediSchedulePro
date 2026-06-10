import { Response } from 'express';
import * as visitService from '../services/visit.service';
import { AuthRequest } from '../middleware/auth';

export async function checkIn(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const result = await visitService.checkIn(id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function callNextPatient(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { scheduleId } = req.body;
    const result = await visitService.callNextPatient(scheduleId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function completeVisit(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const result = await visitService.completeVisit(id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function markMissed(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const result = await visitService.markMissed(id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function requeueMissed(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const result = await visitService.requeueMissed(id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorQueue(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { doctorId } = req.params;
    const { date } = req.query;

    if (req.user.role === 'DOCTOR' && req.user.userId !== doctorId) {
      return res.status(403).json({ code: 'FORBIDDEN', message: '无权限查看其他医生队列' });
    }

    const queue = await visitService.getDoctorQueue(
      doctorId,
      (date as string) || new Date().toISOString().split('T')[0],
    );
    res.json(queue);
  } catch (error) {
    next(error);
  }
}
