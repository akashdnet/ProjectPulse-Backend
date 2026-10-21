import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created successfully by Admin!',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully!',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.updateUser(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully!',
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.softDeleteUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User soft-deleted successfully!',
    data: result,
  });
});

const restoreUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.restoreUser(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User restored successfully!',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User status updated to '${status}' successfully!`,
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  softDeleteUser,
  restoreUser,
};
