import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import database from "@config/database";
import config from "@config/index";
import BaseService from "./baseService";

export type UserRole = string;

interface AuthUser {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

export interface LoginInput {
  tenant_code: string;
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
}

export interface JwtPayload {
  user_id: string;
  tenant_id: string;
  role: UserRole;
}

class AuthService extends BaseService {
  private normalizeTenantCode(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9-]/g, "");
  }

  private normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  private buildInvalidCredentialsError(): Error {
    const error = new Error("Invalid credentials");
    (error as any).status = 401;
    return error;
  }

  async login(input: LoginInput): Promise<LoginResult> {
    try {
      const tenantCode = this.normalizeTenantCode(input.tenant_code || "");
      const email = this.normalizeEmail(input.email || "");
      const password = input.password || "";

      if (!tenantCode || !email || !password) {
        throw this.buildInvalidCredentialsError();
      }

      const tenantResult = await database.query(
        "SELECT id FROM tenants WHERE code = $1 LIMIT 1",
        [tenantCode],
      );

      if (tenantResult.rowCount === 0) {
        throw this.buildInvalidCredentialsError();
      }

      const tenantId = tenantResult.rows[0].id as string;

      const userResult = await database.query(
        `
          SELECT
            u.id,
            u.tenant_id,
            u.email,
            u.password_hash,
            COALESCE(r.name, u.role::text) AS role
          FROM users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON r.id = ur.role_id AND r.tenant_id = u.tenant_id
          WHERE u.tenant_id = $1 AND u.email = $2
          LIMIT 1
        `,
        [tenantId, email],
      );

      if (userResult.rowCount === 0) {
        throw this.buildInvalidCredentialsError();
      }

      const user = userResult.rows[0] as AuthUser;
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        throw this.buildInvalidCredentialsError();
      }

      const payload: JwtPayload = {
        user_id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
      };

      const signOptions: SignOptions = {
        expiresIn: config.auth.jwtExpiresIn as SignOptions["expiresIn"],
      };

      const token = jwt.sign(
        payload,
        config.auth.jwtSecret as Secret,
        signOptions,
      );

      return { token };
    } catch (error) {
      this.handleError(error);
    }
  }

  async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(plainPassword, saltRounds);
  }
}

export default new AuthService();
