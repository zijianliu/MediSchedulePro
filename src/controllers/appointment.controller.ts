import { Response } from 'express';
import * as appointmentService from '../services/appointment.service';
import * as visitService from '../services/visit.service';
import { AuthRequest } from '../middleware/auth';

export async function createAppointment(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { scheduleId, patientName, patientIdCard, patientPhone } = req.body;
    const appointment = await appointmentService.createAppointment(
      req.user.userId,
      scheduleId,
      patientName,
      patientIdCard,
      patientPhone,
    );
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}

export async function payAppointment(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const appointment = await appointmentService.payAppointment(id, req.user.userId);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointment(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const appointment = await appointmentService.cancelAppointment(
      id,
      req.user.userId,
      req.user.role,
    );
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

export async function getAppointment(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { id } = req.params;
    const appointment = await appointmentService.getAppointmentById(
      id,
      req.user.userId,
      req.user.role,
      req.user.departmentId,
    );
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

export async function listPatientAppointments(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { status } = req.query;
    const appointments = await appointmentService.listPatientAppointments(
      req.user.userId,
      status as string | undefined,
    );
    res.json(appointments);
  } catch (error) {
    next(error);
  }
}

export async function listDoctorAppointments(req: AuthRequest, res: Response, next: any) {
  try {
    if (!req.user) return;
    const { date, status } = req.query;
    const appointments = await appointmentService.listDoctorAppointments(
      req.user.userId,
      date as string | undefined,
      status as string | undefined,
    );
    res.json(appointments);
  } catch (error) {
    next(error);
  }
}

export async function processTimeouts(req: AuthRequest, res: Response, next: any) {
  try {
    const result = await appointmentService.processTimeoutAppointments();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

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
