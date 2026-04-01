import { NextFunction, Request, Response } from "express";
import authService from "@services/authService";
import { AppError, successResponse } from "@utils/errors";

class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { schoolName, email, password } = req.body || {};

      if (
        typeof schoolName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        throw new AppError("schoolName, email, and password are required", 400);
      }

      const result = await authService.register({
        schoolName,
        email,
        password,
      });

      res
        .status(201)
        .json(
          successResponse(
            { tenantCode: result.tenantCode },
            "Registration successful",
          ),
        );
    } catch (error: any) {
      if (error?.status === 400) {
        return next(new AppError(error.message, 400));
      }
      if (error?.code === "23505") {
        return next(
          new AppError("An account with that email already exists", 409),
        );
      }
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body || {};
      // Accept both camelCase (frontend) and snake_case
      const tenant_code: unknown = body.tenant_code ?? body.tenantCode;
      const { email, password } = body;

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
