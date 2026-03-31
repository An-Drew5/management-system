import { Router, Request, Response, NextFunction } from "express";
import healthController from "@controllers/healthController";

const router: Router = Router();

/**
 * Health Check Routes
 */
router.get("/health", (req: Request, res: Response, next: NextFunction) => {
  healthController.checkHealth(req, res, next);
});

export default router;
