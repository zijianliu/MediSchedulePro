import { Request, Response } from 'express';
import * as departmentService from '../services/department.service';

export async function listDepartments(req: Request, res: Response, next: any) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const departments = await departmentService.listDepartments(includeInactive);
    res.json(departments);
  } catch (error) {
    next(error);
  }
}

export async function getDepartment(req: Request, res: Response, next: any) {
  try {
    const { id } = req.params;
    const department = await departmentService.getDepartmentById(id);
    res.json(department);
  } catch (error) {
    next(error);
  }
}

export async function listDoctors(req: Request, res: Response, next: any) {
  try {
    const { departmentId } = req.query;
    const doctors = await departmentService.listDoctors(departmentId as string | undefined);
    res.json(doctors);
  } catch (error) {
    next(error);
  }
}

export async function getDoctor(req: Request, res: Response, next: any) {
  try {
    const { id } = req.params;
    const doctor = await departmentService.getDoctorById(id);
    res.json(doctor);
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req: Request, res: Response, next: any) {
  try {
    const { name, code, description } = req.body;
    const department = await departmentService.createDepartment(name, code, description);
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req: Request, res: Response, next: any) {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;
    const department = await departmentService.updateDepartment(id, { name, code, description });
    res.json(department);
  } catch (error) {
    next(error);
  }
}

export async function toggleDepartmentStatus(req: Request, res: Response, next: any) {
  try {
    const { id } = req.params;
    const department = await departmentService.toggleDepartmentStatus(id);
    res.json(department);
  } catch (error) {
    next(error);
  }
}
