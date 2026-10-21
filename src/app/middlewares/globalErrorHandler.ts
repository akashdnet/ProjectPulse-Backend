import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import AppError from '../utils/AppError';

export const globalErrorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorDetails: any[] = [];

  // 1. Zod Validation Error
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = error.issues.map((issue) => {
      const field = issue.path[issue.path.length - 1];
      return field ? `${String(field)}: ${issue.message}` : issue.message;
    });
  }
  // 2. Prisma Client Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.join(', ') : target || 'field';
      message = `Duplicate key error: Unique constraint failed on ${fields}`;
      errorDetails = [
        {
          code: error.code,
          message,
        },
      ];
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = (error.meta?.cause as string) || 'Record not found in the database';
      errorDetails = [
        {
          code: error.code,
          message,
        },
      ];
    } else {
      statusCode = 400;
      message = error.message;
      errorDetails = [
        {
          code: error.code,
          message: error.message,
        },
      ];
    }
  }
  // 3. Prisma Client Validation Error
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Prisma validation error';
    errorDetails = [error.message];
  }
  // 4. Custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorDetails = error.errorDetails || [];
  }
  // 5. Generic Error
  else if (error instanceof Error) {
    message = error.message;
    errorDetails = [error.message];
  }

  // Console error logging
  console.error(`💥 [ERROR HANDLER] ${req.method} ${req.originalUrl} -> Status: ${statusCode} | Message: ${message}`);
  if (errorDetails.length > 0) {
    console.error('   Error Details:', errorDetails);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
