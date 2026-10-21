import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const updateStatusZodSchema = z.object({
  body: z.object({
    status: z.enum([ProjectStatus.APPROVED, ProjectStatus.REJECTED], {
      required_error: 'Status is required and must be either APPROVED or REJECTED',
    }),
  }),
});

export const DashboardValidation = {
  updateStatusZodSchema,
};
