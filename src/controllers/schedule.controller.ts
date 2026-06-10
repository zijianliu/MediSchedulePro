import { Response } from 'express';
import * as scheduleService from '../services/schedule.service';
import { AuthRequest } from '../middleware/auth';

export async function createSchedule(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { doctorId, departmentId, date, timeSlot, maxSlots, fee } = req.body;
    const schedule = await scheduleService.createSchedule(
      doctorId,
      departmentId,
      date,
      timeSlot,
      maxSlots,
      fee,
      req.user.userId,
      req.user.role,
    );
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
}

export async function cancelSchedule(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await scheduleService.cancelSchedule(
      id,
      reason,
      req.user.userId,
      req.user.role,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listSchedules(req: AuthRequest, res: Response, next: any) {
  try {
    const { departmentId, doctorId, startDate, endDate, includeCancelled } = req.query;
    const schedules = await scheduleService.listSchedules({
      departmentId: departmentId as string | undefined,
      doctorId: doctorId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      includeCancelled: includeCancelled === 'true',
    });
    res.json(schedules);
  } catch (error) {
    next(error);
  }
}

export async function getSchedule(req: AuthRequest, res: Response, next: any) {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(id);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
}

export async function getAvailableSchedules(req: AuthRequest, res: Response, next: any) {
  try {
    const { departmentId, doctorId, date } = req.query;
    const schedules = await scheduleService.getAvailableSchedules(
      departmentId as string | undefined,
      doctorId as string | undefined,
      date as string | undefined,
    );
    res.json(schedules);
  } catch (error) {
    next(error);
  }
}
