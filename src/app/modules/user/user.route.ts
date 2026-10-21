import { Router } from 'express';
import { Role } from '@prisma/client';
import { authGuard } from '../../middlewares/authGuard';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';
import { UserController } from './user.controller';

const router = Router();

// Protect all user routes for ADMIN only
router.use(authGuard(Role.ADMIN));

router.post(
  '/',
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser
);

router.get('/', UserController.getAllUsers);

router.get('/:id', UserController.getUserById);

router.patch(
  '/:id',
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateUser
);

router.patch(
  '/:id/status',
  validateRequest(UserValidation.updateStatusZodSchema),
  UserController.updateUserStatus
);

router.delete('/:id', UserController.softDeleteUser);

router.patch('/:id/restore', UserController.restoreUser);

export const UserRoutes = router;
