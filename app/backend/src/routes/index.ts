import { Router } from "express";
import healthRoutes from "./health";
import tenantRoutes from "./tenants";
import authRoutes from "./auth";
import studentRoutes from "./students";

const router: Router = Router();

/**
 * API v1 Routes
 */
router.use("/v1", healthRoutes);
router.use("/v1", tenantRoutes);
router.use("/v1", authRoutes);
router.use("/v1", studentRoutes);

/**
 * Health check at root level
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
