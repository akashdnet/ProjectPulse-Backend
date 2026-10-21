import { Router } from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { SubmissionRoutes } from '../app/modules/submission/submission.route';
import { DashboardRoutes } from '../app/modules/dashboard/dashboard.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/submissions',
    route: SubmissionRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
