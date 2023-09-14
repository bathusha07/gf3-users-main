import BaseDomainError from '../../domain/errors/BaseDomainError';
import ValidationError from '../../controllers/errors/ValidationError';
import { NextFunction, Request, Response } from 'express';

interface ErrorResponse {
  status_code: number;
  error: string;
  meta?: unknown;
}
const isHandledError = (err: unknown): err is BaseDomainError | ValidationError =>
  err instanceof BaseDomainError || err instanceof ValidationError;

const errorHandler = (err: Error, req: Request, res: Response, _: NextFunction): void => {
  try {
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
  } catch (error) {
    // Ignore circular JSON errors if they occur for any reason
  }
  const errorResponse: ErrorResponse = {
    status_code: isHandledError(err) ? err.statusCode : 500,
    error: err.message || 'Server Error',
    ...(err instanceof BaseDomainError && { meta: err.meta }),
  };

  res.status(errorResponse.status_code).json(errorResponse);
};

export default errorHandler;
