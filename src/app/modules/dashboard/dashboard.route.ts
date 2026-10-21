import { Router } from 'express';
import { Role } from '@prisma/client';
import authGuard from '../../middlewares/authGuard';
import validateRequest from '../../middlewares/validateRequest';
import { DashboardValidation } from './dashboard.validation';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get(
  '/submissions',
  authGuard(Role.MENTOR),
  DashboardController.getAllSubmissions
);

router.patch(
  '/submissions/:id/status',
  authGuard(Role.MENTOR),
  validateRequest(DashboardValidation.updateStatusZodSchema),
  DashboardController.updateSubmissionStatus
);

router.get(
  '/stats',
  authGuard(Role.MENTOR),
  DashboardController.getDashboardStats
);

export const DashboardRoutes = router;
