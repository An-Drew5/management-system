import { Request, Response, NextFunction } from "express";

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
  };
}

/**
 * Tenant middleware to extract tenant information from request headers or subdomain
 * Multi-tenant support preparation - can be extended with actual tenant lookup logic
 */
export const tenantMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Option 1: Extract from header (X-Tenant-ID)
    const tenantIdFromHeader = req.header("X-Tenant-ID");

    // Option 2: Extract from subdomain (optional)
    // const host = req.hostname;
    // const subdomain = host.split('.')[0];

    if (tenantIdFromHeader) {
      req.tenant = {
        id: tenantIdFromHeader,
        name: `tenant-${tenantIdFromHeader}`,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default tenantMiddleware;
