import { Router } from 'express';
import { Role } from '@prisma/client';
import authGuard from '../../middlewares/authGuard';
import rateLimiter from '../../middlewares/rateLimiter';
import validateRequest from '../../middlewares/validateRequest';
import { SubmissionValidation } from './submission.validation';
import { SubmissionController } from './submission.controller';

const router = Router();

router.post(
  '/',
  authGuard(Role.STUDENT),
  rateLimiter,
  validateRequest(SubmissionValidation.createSubmissionZodSchema),
  SubmissionController.createSubmission
);

export const SubmissionRoutes = router;
