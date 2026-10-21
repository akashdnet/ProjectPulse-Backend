import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';

const router = Router();

router.post(
  '/signup',
  validateRequest(AuthValidation.signupZodSchema),
  AuthController.signup
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

export const AuthRoutes = router;
