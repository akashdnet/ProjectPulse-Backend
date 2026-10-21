export class AppError extends Error {
  public statusCode: number;
  public errorDetails?: any[];

  constructor(statusCode: number, message: string, errorDetails?: any[], stack = '') {
    super(message);
    this.statusCode = statusCode;
    if (errorDetails) {
      this.errorDetails = errorDetails;
    }
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
