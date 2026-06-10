import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { UserRole } from '../types/enums';

export async function register(
  username: string,
  password: string,
  realName: string,
  role: string = UserRole.PATIENT,
  departmentId?: string,
  idCard?: string,
  phone?: string,
) {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    throw new BadRequestError('用户名已存在');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      realName,
      role,
      departmentId,
      idCard,
      phone,
    },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      departmentId: true,
      createdAt: true,
    },
  });

  const token = signToken({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  return { token, user };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new UnauthorizedError('用户名或密码错误');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError('用户名或密码错误');
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      departmentId: true,
      phone: true,
      idCard: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('用户不存在');
  }

  return user;
}
