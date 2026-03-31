import { Request, Response, NextFunction } from "express";

/**
 * Request logger middleware for logging incoming requests
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
    console.log(log);
  });

  next();
};
