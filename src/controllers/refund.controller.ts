import { Response } from 'express';
import * as refundService from '../services/refund.service';
import { AuthRequest } from '../middleware/auth';

export async function listRefunds(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const refunds = await refundService.listRefunds(
      req.user.userId,
      req.user.role,
      req.user.departmentId,
    );
    res.json(refunds);
  } catch (error) {
    next(error);
  }
}

export async function getRefund(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const refund = await refundService.getRefundById(
      id,
      req.user.userId,
      req.user.role,
    );
    res.json(refund);
  } catch (error) {
    next(error);
  }
}

export async function processRefund(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const refund = await refundService.processRefund(
      id,
      req.user.userId,
      req.user.role,
    );
    res.json(refund);
  } catch (error) {
    next(error);
  }
}

export async function completeRefund(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const refund = await refundService.completeRefund(
      id,
      req.user.userId,
      req.user.role,
    );
    res.json(refund);
  } catch (error) {
    next(error);
  }
}
