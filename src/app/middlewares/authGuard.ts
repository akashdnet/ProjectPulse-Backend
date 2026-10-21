import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import AppError from '../utils/AppError';
import { IAuthUser, Role } from '../../types';

export const authGuard = (...requiredRoles: (Role | 'STUDENT' | 'MENTOR' | 'ADMIN' | string)[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'You are not authorized! Token is missing or invalid.');
      }

      const token = authHeader.split(' ')[1];
      const secret: Secret = process.env.JWT_SECRET as string;
      if (!secret) {
        throw new AppError(500, 'JWT_SECRET is not configured in environment variables');
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, secret) as JwtPayload;
      } catch (err) {
        throw new AppError(401, 'Unauthorized access! Invalid or expired token.');
      }

      const user = decoded as IAuthUser;
      req.user = user;

      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        throw new AppError(403, 'Forbidden! You do not have permission to access this resource.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authGuard;
