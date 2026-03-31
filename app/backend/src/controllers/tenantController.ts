import { NextFunction, Request, Response } from "express";
import tenantService from "@services/tenantService";
import { AppError, successResponse } from "@utils/errors";

class TenantController {
  async createTenant(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name } = req.body;

      if (typeof name !== "string") {
        throw new AppError("name must be a string", 400);
      }

      const tenant = await tenantService.createTenant(name);
      res
        .status(201)
        .json(successResponse(tenant, "Tenant created successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getTenantByCode(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code } = req.params;
      const tenant = await tenantService.getTenantByCode(code);

      if (!tenant) {
        throw new AppError("Tenant not found", 404);
      }

      res
        .status(200)
        .json(successResponse(tenant, "Tenant fetched successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export default new TenantController();
