import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function listDepartments() {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { doctors: true },
      },
    },
  });
}

export async function getDepartmentById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { doctors: true },
      },
    },
  });

  if (!dept) {
    throw new NotFoundError('科室不存在');
  }

  return dept;
}

export async function listDoctors(departmentId?: string) {
  const where: any = {};
  
  if (departmentId) {
    where.departmentId = departmentId;
  } else {
    where.role = 'DOCTOR';
  }

  if (!where.role) {
    where.role = 'DOCTOR';
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      departmentId: true,
      department: {
        select: { name: true },
      },
    },
    orderBy: { realName: 'asc' },
  });
}

export async function getDoctorById(id: string) {
  const doctor = await prisma.user.findFirst({
    where: { id, role: 'DOCTOR' },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      departmentId: true,
      department: {
        select: { name: true },
      },
    },
  });

  if (!doctor) {
    throw new NotFoundError('医生不存在');
  }

  return doctor;
}

export async function createDepartment(name: string, description?: string) {
  return prisma.department.create({
    data: { name, description },
  });
}
