import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

export async function listDepartments(includeInactive = false) {
  const where: any = {};
  if (!includeInactive) {
    where.status = 'ACTIVE';
  }
  return prisma.department.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { doctors: true, schedules: true },
      },
    },
  });
}

export async function getDepartmentById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { doctors: true, schedules: true },
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

export async function createDepartment(name: string, code?: string, description?: string) {
  const existing = await prisma.department.findFirst({
    where: {
      OR: [
        { name },
        ...(code ? [{ code }] : []),
      ],
    },
  });
  if (existing) {
    throw new BadRequestError(existing.name === name ? '科室名称已存在' : '科室编码已存在');
  }

  return prisma.department.create({
    data: { name, code, description, status: 'ACTIVE' },
  });
}

export async function updateDepartment(id: string, data: { name?: string; code?: string; description?: string }) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) {
    throw new NotFoundError('科室不存在');
  }

  if (data.name && data.name !== dept.name) {
    const existing = await prisma.department.findFirst({ where: { name: data.name, id: { not: id } } });
    if (existing) {
      throw new BadRequestError('科室名称已存在');
    }
  }

  if (data.code && data.code !== dept.code) {
    const existing = await prisma.department.findFirst({ where: { code: data.code, id: { not: id } } });
    if (existing) {
      throw new BadRequestError('科室编码已存在');
    }
  }

  return prisma.department.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
}

export async function toggleDepartmentStatus(id: string) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) {
    throw new NotFoundError('科室不存在');
  }

  const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  return prisma.department.update({
    where: { id },
    data: { status: newStatus },
  });
}
