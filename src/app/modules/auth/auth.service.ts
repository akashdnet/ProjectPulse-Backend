import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import { Role, User } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../utils/AppError';

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
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

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: Role.STUDENT,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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
