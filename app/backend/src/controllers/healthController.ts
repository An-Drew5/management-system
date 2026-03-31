import { Request, Response, NextFunction } from "express";

/**
 * Health check controller
 * This is a placeholder for the controller structure
 */
class HealthController {
  async checkHealth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new HealthController();
