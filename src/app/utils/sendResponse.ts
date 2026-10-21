import { Response } from 'express';

interface IMeta {
  page: number;
  limit: number;
  total: number;
}

interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IMeta;
  data: T;
}

export const sendResponse = <T>(res: Response, data: IApiResponse<T>) => {
  if (data.message) {
    console.log(`💬 [SUCCESS MESSAGE] ${data.message}`);
  }
  return res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    ...(data.meta ? { meta: data.meta } : {}),
    data: data.data,
  });
};

export default sendResponse;
