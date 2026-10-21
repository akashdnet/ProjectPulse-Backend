import { z } from 'zod';

const createSubmissionZodSchema = z.object({
  body: z.object({
    projectName: z
      .string({
        required_error: 'Project name is required',
      })
      .min(3, 'Project name must be at least 3 characters long'),
    repoUrl: z
      .string({
        required_error: 'Repository URL is required',
      })
      .url('repoUrl is an invalid URL'),
    liveLink: z
      .string({
        required_error: 'Live link is required',
      })
      .url('liveLink is an invalid URL'),
    description: z
      .string({
        required_error: 'Description is required',
      })
      .min(10, 'Description must be at least 10 characters long'),
  }),
});

export const SubmissionValidation = {
  createSubmissionZodSchema,
};
