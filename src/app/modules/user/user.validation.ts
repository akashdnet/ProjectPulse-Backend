import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

const createUserZodSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(1, 'Name cannot be empty'),
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address'),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, 'Password must be at least 6 characters long'),
    role: z
      .nativeEnum(Role, {
        invalid_type_error: 'Role must be STUDENT, MENTOR, or ADMIN',
      })
      .optional(),
    status: z
      .nativeEnum(UserStatus, {
        invalid_type_error: 'Status must be PENDING, ACTIVE, or BLOCKED',
      })
      .optional(),
  }),
});

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .optional(),
    role: z
      .nativeEnum(Role, {
        invalid_type_error: 'Role must be STUDENT, MENTOR, or ADMIN',
      })
      .optional(),
    status: z
      .nativeEnum(UserStatus, {
        invalid_type_error: 'Status must be PENDING, ACTIVE, or BLOCKED',
      })
      .optional(),
    isDeleted: z.boolean().optional(),
  }),
});

const updateStatusZodSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus, {
      required_error: 'Status is required (PENDING, ACTIVE, or BLOCKED)',
      invalid_type_error: 'Status must be PENDING, ACTIVE, or BLOCKED',
    }),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  updateStatusZodSchema,
};
