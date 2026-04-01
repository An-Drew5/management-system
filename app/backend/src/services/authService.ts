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

export interface RegisterInput {
  schoolName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  tenantCode: string;
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

  async register(input: RegisterInput): Promise<RegisterResult> {
    try {
      const schoolName = (input.schoolName || "").trim();
      const email = this.normalizeEmail(input.email || "");
      const password = input.password || "";

      if (!schoolName || !email || !password) {
        const error = new Error("All fields are required");
        (error as any).status = 400;
        throw error;
      }

      if (password.length < 8) {
        const error = new Error("Password must be at least 8 characters");
        (error as any).status = 400;
        throw error;
      }

      // Derive a tenant code from the school name
      const baseCode = schoolName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 20);

      if (!baseCode || baseCode.replace(/-/g, "").length < 2) {
        const error = new Error("School name is too short or invalid");
        (error as any).status = 400;
        throw error;
      }

      // Use a transaction so tenant + user + rbac seed are atomic
      const result = await database.withTransaction(async (client) => {
        // 1. Check tenant code uniqueness (with suffix if needed)
        let code = baseCode;
        const { rows: existing } = await client.query(
          "SELECT 1 FROM tenants WHERE code = $1",
          [code],
        );
        if (existing.length > 0) {
          const suffix = Math.floor(1000 + Math.random() * 9000);
          code = `${baseCode}-${suffix}`.slice(0, 24);
        }

        // 2. Create tenant
        const { rows: tenantRows } = await client.query(
          "INSERT INTO tenants (name, code) VALUES ($1, $2) RETURNING id, code",
          [schoolName, code],
        );
        const tenant = tenantRows[0] as { id: string; code: string };

        // 3. Hash password and create admin user
        const passwordHash = await bcrypt.hash(password, 12);
        const { rows: userRows } = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, role)
           VALUES ($1, $2, $3, 'admin')
           RETURNING id`,
          [tenant.id, email, passwordHash],
        );
        const userId = userRows[0].id as string;

        // 4. Seed default roles for this tenant
        const roleNames = ["admin", "teacher", "accountant", "staff"];
        for (const roleName of roleNames) {
          await client.query(
            `INSERT INTO roles (tenant_id, name) VALUES ($1, $2)
             ON CONFLICT (tenant_id, name) DO NOTHING`,
            [tenant.id, roleName],
          );
        }

        // 5. Assign admin user to the admin role
        const { rows: roleRows } = await client.query(
          "SELECT id FROM roles WHERE tenant_id = $1 AND name = 'admin'",
          [tenant.id],
        );
        if (roleRows.length > 0) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId, roleRows[0].id],
          );
        }

        // 6. Grant all existing permissions to the admin role
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, id FROM permissions
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleRows[0]?.id],
        );

        return { tenantCode: tenant.code };
      });

      return result as RegisterResult;
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
