import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export async function register(req: Request, res: Response, next: any) {
  try {
    const { username, password, realName, role, departmentId, idCard, phone } = req.body;
    const result = await authService.register(username, password, realName, role, departmentId, idCard, phone);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: any) {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const user = await authService.getCurrentUser(req.user.userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
}
