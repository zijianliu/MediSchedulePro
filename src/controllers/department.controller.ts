import { Request, Response } from 'express';
import * as departmentService from '../services/department.service';

export async function listDepartments(req: Request, res: Response, next: any) {
  try {
    const departments = await departmentService.listDepartments();
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
    const { name, description } = req.body;
    const department = await departmentService.createDepartment(name, description);
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
}
