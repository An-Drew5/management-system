import { NextFunction, Response } from "express";
import database from "@config/database";
import { AppError } from "@utils/errors";
import { AuthRequest, getAuthContextOrThrow } from "./auth";

/**
 * Permission-based authorization middleware.
 * Always resolves permissions using tenant_id from verified JWT context.
 */
export const authorize = (permissionName: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const context = getAuthContextOrThrow(req);

      const result = await database.query(
        `
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          JOIN role_permissions rp ON rp.role_id = r.id
          JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = $1
            AND r.tenant_id = $2
            AND p.name = $3
          LIMIT 1
        `,
        [context.userId, context.tenantId, permissionName],
      );

      if (result.rowCount === 0) {
        throw new AppError("Access forbidden", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorize;
