import { NextFunction, Request, Response, Router } from "express";
import tenantController from "@controllers/tenantController";

const router: Router = Router();

router.post("/tenants", (req: Request, res: Response, next: NextFunction) => {
  tenantController.createTenant(req, res, next);
});

router.get(
  "/tenants/:code",
  (req: Request, res: Response, next: NextFunction) => {
    tenantController.getTenantByCode(req, res, next);
  },
);

export default router;
