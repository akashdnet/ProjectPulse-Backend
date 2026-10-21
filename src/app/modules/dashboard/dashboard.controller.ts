import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DashboardService } from './dashboard.service';
import { ProjectStatus } from '@prisma/client';

const getAllSubmissions = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query;

  const result = await DashboardService.getAllSubmissions({
    page: page as string,
    limit: limit as string,
    status: status as ProjectStatus,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Submissions retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateSubmissionStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await DashboardService.updateSubmissionStatus(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Submission status updated successfully!',
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard statistics retrieved successfully!',
    data: result,
  });
});

export const DashboardController = {
  getAllSubmissions,
  updateSubmissionStatus,
  getDashboardStats,
};
