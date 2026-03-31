import { Request, Response, NextFunction } from "express";
import { AppError } from "@utils/errors";
import jwt from "jsonwebtoken";
import config from "@config/index";

type UserRole = string;

interface TokenPayload {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  context?: {
    userId: string;
    tenantId: string;
    role: UserRole;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const decoded = jwt.verify(token, config.auth.jwtSecret) as TokenPayload;

    if (!decoded.user_id || !decoded.tenant_id || !decoded.role) {
      throw new AppError("Unauthorized", 401);
    }

    req.context = {
      userId: decoded.user_id,
      tenantId: decoded.tenant_id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new AppError("Unauthorized", 401));
  }
};

export const getAuthContextOrThrow = (
  req: AuthRequest,
): {
  userId: string;
  tenantId: string;
  role: UserRole;
} => {
  if (!req.context) {
    throw new AppError("Unauthorized", 401);
  }
  return req.context;
};

export default authMiddleware;
