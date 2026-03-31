import { NextFunction, Request, Response } from "express";
import authService from "@services/authService";
import { AppError, successResponse } from "@utils/errors";

class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenant_code, email, password } = req.body || {};

      if (
        typeof tenant_code !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        throw new AppError("Invalid credentials", 401);
      }

      const result = await authService.login({ tenant_code, email, password });

      res
        .status(200)
        .json(successResponse({ token: result.token }, "Login successful"));
    } catch (error: any) {
      if (error?.status === 401) {
        return next(new AppError("Invalid credentials", 401));
      }
      next(error);
    }
  }
}

export default new AuthController();
