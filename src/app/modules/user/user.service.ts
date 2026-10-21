import bcrypt from 'bcrypt';
import { Prisma, Role, User, UserStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../utils/AppError';

export interface ICreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
  status?: UserStatus;
}

export interface IUpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  isDeleted?: boolean;
}

export interface IUserFilterQuery {
  role?: Role;
  status?: UserStatus;
  searchTerm?: string;
  includeDeleted?: string;
  page?: string;
  limit?: string;
}

const createUser = async (payload: ICreateUserPayload): Promise<Omit<User, 'password'>> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, 'User with this email already exists!');
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  // Default: if status passed, use it; otherwise default to ACTIVE (or PENDING if mentor and not specified)
  const userRole = payload.role || Role.STUDENT;
  const userStatus = payload.status || (userRole === Role.MENTOR ? UserStatus.PENDING : UserStatus.ACTIVE);

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: userRole,
      status: userStatus,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return newUser;
};

const getAllUsers = async (query: IUserFilterQuery) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const whereConditions: Prisma.UserWhereInput = {};

  // Handle soft-deleted filter
  if (query.includeDeleted !== 'true') {
    whereConditions.isDeleted = false;
  }

  // Filter by role
  if (query.role) {
    whereConditions.role = query.role;
  }

  // Filter by status (e.g. status=PENDING to find mentors awaiting approval)
  if (query.status) {
    whereConditions.status = query.status;
  }

  // Search by name or email
  if (query.searchTerm) {
    whereConditions.OR = [
      { name: { contains: query.searchTerm, mode: 'insensitive' } },
      { email: { contains: query.searchTerm, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: users,
  };
};

const getUserById = async (id: string): Promise<Omit<User, 'password'>> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      submissions: {
        select: {
          id: true,
          projectName: true,
          status: true,
          repoUrl: true,
          liveLink: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found!');
  }

  return user;
};

const updateUser = async (
  id: string,
  payload: IUpdateUserPayload
): Promise<Omit<User, 'password'>> => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found!');
  }

  // If email is being changed, check if new email is already taken
  if (payload.email && payload.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (emailTaken) {
      throw new AppError(409, 'User with this email already exists!');
    }
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.status !== undefined) updateData.status = payload.status;

  if (payload.password) {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    updateData.password = await bcrypt.hash(payload.password, saltRounds);
  }

  if (payload.isDeleted !== undefined) {
    updateData.isDeleted = payload.isDeleted;
    updateData.deletedAt = payload.isDeleted ? new Date() : null;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserStatus = async (
  id: string,
  status: UserStatus
): Promise<Omit<User, 'password'>> => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found!');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const softDeleteUser = async (id: string): Promise<Omit<User, 'password'>> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, 'User not found!');
  }

  if (user.isDeleted) {
    throw new AppError(400, 'User is already soft-deleted!');
  }

  // Prevent soft deleting the main configured super admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@admin.com';
  if (user.email === superAdminEmail) {
    throw new AppError(403, 'Cannot delete the primary Super Admin account!');
  }

  const deletedUser = await prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return deletedUser;
};

const restoreUser = async (id: string): Promise<Omit<User, 'password'>> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, 'User not found!');
  }

  if (!user.isDeleted) {
    throw new AppError(400, 'User is not deleted!');
  }

  const restoredUser = await prisma.user.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      isDeleted: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return restoredUser;
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  softDeleteUser,
  restoreUser,
};
