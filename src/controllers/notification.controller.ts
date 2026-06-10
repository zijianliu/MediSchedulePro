import { Response } from 'express';
import * as notificationService from '../services/notification.service';
import { AuthRequest } from '../middleware/auth';

export async function listUserNotifications(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { page, pageSize } = req.query;
    const notifications = await notificationService.listUserNotifications(
      req.user.userId,
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 20,
    );
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}
