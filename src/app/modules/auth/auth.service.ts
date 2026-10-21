import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import { Role, User, UserStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../utils/AppError';

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

const signup = async (payload: ISignupPayload): Promise<Omit<User, 'password'>> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, 'User with this email already exists!');
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  // Student accounts are instantly ACTIVE; Mentor accounts remain PENDING until approved by admin
  const requestedRole = payload.role === Role.MENTOR ? Role.MENTOR : Role.STUDENT;
  const initialStatus = requestedRole === Role.MENTOR ? UserStatus.PENDING : UserStatus.ACTIVE;

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: requestedRole,
      status: initialStatus,
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

const login = async (
  payload: ILoginPayload
): Promise<{ token: string; user: Omit<User, 'password'> }> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(404, 'User does not exist with this email!');
  }

  if (user.isDeleted) {
    throw new AppError(403, 'This account has been deactivated or deleted!');
  }

  // Block login if mentor account is still PENDING approval
  if (user.status === UserStatus.PENDING) {
    throw new AppError(
      403,
      'Your mentor account is pending approval by an administrator. Please wait until an admin approves your account.'
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(403, 'Your account has been suspended or blocked.');
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Password does not match!');
  }

  const jwtSecret: Secret = process.env.JWT_SECRET as string;
  if (!jwtSecret) {
    throw new AppError(500, 'JWT_SECRET is not configured in environment variables');
  }
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    jwtSecret,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    }
  );

  const { password, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
};

export const AuthService = {
  signup,
  login,
};
