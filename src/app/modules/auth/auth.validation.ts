import { z } from 'zod';

const signupZodSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(1, 'Name cannot be empty'),
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
      .enum(['STUDENT', 'MENTOR'], {
        invalid_type_error: 'Role must be STUDENT or MENTOR',
      })
      .optional()
      .default('STUDENT'),
  }),
});

const loginZodSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address'),
    password: z.string({
      required_error: 'Password is required',
    }),
  }),
});

export const AuthValidation = {
  signupZodSchema,
  loginZodSchema,
};
