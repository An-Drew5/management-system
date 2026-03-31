import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  status?: number;
  details?: any;
}

class ErrorHandler {
  static handle(
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const status = error.status || 500;
    const message = error.message || "Internal Server Error";
    const details = error.details || {};

    console.error(`[${new Date().toISOString()}] Error: ${message}`, details);

    res.status(status).json({
      error: {
        status,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
}

// Error handling middleware
export const errorHandlingMiddleware = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  ErrorHandler.handle(error, req, res, next);
};

// 404 Not Found middleware
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const error: ApiError = new Error(`Route ${req.path} not found`);
  error.status = 404;
  next(error);
};

export default ErrorHandler;
