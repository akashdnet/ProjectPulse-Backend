import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SubmissionService } from './submission.service';
import AppError from '../../utils/AppError';

const createSubmission = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.id;
  if (!studentId) {
    throw new AppError(401, 'Unauthorized! User identity not found in request.');
  }

  const result = await SubmissionService.createSubmission(studentId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Project submitted successfully!',
    data: result,
  });
});

export const SubmissionController = {
  createSubmission,
};
