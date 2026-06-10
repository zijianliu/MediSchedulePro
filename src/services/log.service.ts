import prisma from '../utils/prisma';

export async function logOperation(
  tx: any,
  type: string,
  operatorId: string,
  operatorRole: string,
  targetType: string,
  targetId?: string,
  content?: string,
) {
  await tx.operationLog.create({
    data: {
      type,
      operatorId,
      operatorRole,
      targetType,
      targetId,
      content,
    },
  });
}

export async function logStatusChange(
  tx: any,
  appointmentId: string,
  fromStatus: string | null,
  toStatus: string,
  reason?: string,
  operatorId?: string,
) {
  await tx.statusLog.create({
    data: {
      appointmentId,
      fromStatus,
      toStatus,
      reason,
    },
  });
}

export async function listOperationLogs(params: {
  page?: number;
  pageSize?: number;
  type?: string;
  operatorId?: string;
  targetType?: string;
}) {
  const { page = 1, pageSize = 20, type, operatorId, targetType } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (operatorId) {
    where.operatorId = operatorId;
  }

  if (targetType) {
    where.targetType = targetType;
  }

  const [list, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        operator: {
          select: {
            id: true,
            realName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.operationLog.count({ where }),
  ]);

  return {
    list,
    total,
    page,
    pageSize,
  };
}

export async function listStatusLogs(appointmentId: string) {
  return prisma.statusLog.findMany({
    where: { appointmentId },
    orderBy: { createdAt: 'asc' },
  });
}
