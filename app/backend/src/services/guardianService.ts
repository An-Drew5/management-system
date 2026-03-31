import { PoolClient } from "pg";
import database from "@config/database";
import BaseService from "./baseService";
import { AppError } from "@utils/errors";
import authService from "./authService";

const ALLOWED_RELATIONSHIPS = ["father", "mother", "guardian"] as const;
type GuardianRelationship = (typeof ALLOWED_RELATIONSHIPS)[number];

export interface Guardian {
  id: string;
  tenant_id: string;
  user_id: string;
  email: string;
  relationship: GuardianRelationship;
  created_at: string;
}

export interface CreateGuardianInput {
  tenantId: string;
  email: string;
  password: string;
  relationship: string;
}

export interface AssignGuardianToStudentInput {
  tenantId: string;
  studentId: string;
  guardianId: string;
}

class GuardianService extends BaseService {
  private normalizeUuid(value: string, fieldName: string): string {
    const normalized = (value || "").trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(normalized)) {
      throw new AppError(`${fieldName} must be a valid UUID`, 400);
    }

    return normalized;
  }

  private normalizeEmail(email: string): string {
    const normalized = (email || "").trim().toLowerCase();

    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError("A valid email is required", 400);
    }

    return normalized;
  }

  private normalizeRelationship(value: string): GuardianRelationship {
    const normalized = (value || "")
      .trim()
      .toLowerCase() as GuardianRelationship;

    if (!ALLOWED_RELATIONSHIPS.includes(normalized)) {
      throw new AppError(
        `relationship must be one of: ${ALLOWED_RELATIONSHIPS.join(", ")}`,
        400,
      );
    }

    return normalized;
  }

  private ensurePassword(value: string): string {
    const password = value || "";

    if (password.trim().length < 8) {
      throw new AppError("password must be at least 8 characters", 400);
    }

    return password;
  }

  private async ensureTenantExists(
    client: PoolClient,
    tenantId: string,
  ): Promise<void> {
    const result = await client.query(
      `SELECT 1 FROM tenants WHERE id = $1 LIMIT 1`,
      [tenantId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new AppError("Tenant not found", 404);
    }
  }

  private async ensureGuardianRole(
    client: PoolClient,
    tenantId: string,
  ): Promise<string> {
    await client.query(
      `
        INSERT INTO roles (tenant_id, name)
        VALUES ($1, 'guardian')
        ON CONFLICT (tenant_id, name) DO NOTHING
      `,
      [tenantId],
    );

    const roleResult = await client.query(
      `
        SELECT id
        FROM roles
        WHERE tenant_id = $1 AND name = 'guardian'
        LIMIT 1
      `,
      [tenantId],
    );

    if ((roleResult.rowCount ?? 0) === 0) {
      throw new AppError("Guardian role not found", 500);
    }

    return roleResult.rows[0].id as string;
  }

  private async ensureStudentInTenant(
    client: PoolClient,
    tenantId: string,
    studentId: string,
  ): Promise<void> {
    const result = await client.query(
      `
        SELECT id
        FROM students
        WHERE id = $1 AND tenant_id = $2
        FOR UPDATE
      `,
      [studentId, tenantId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new AppError("Student not found for tenant", 404);
    }
  }

  private async ensureGuardianInTenant(
    client: PoolClient,
    tenantId: string,
    guardianId: string,
  ): Promise<void> {
    const result = await client.query(
      `
        SELECT g.id
        FROM guardians g
        JOIN users u ON u.id = g.user_id
        WHERE g.id = $1
          AND g.tenant_id = $2
          AND u.tenant_id = $2
        LIMIT 1
      `,
      [guardianId, tenantId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new AppError("Guardian not found for tenant", 404);
    }
  }

  async createGuardian(input: CreateGuardianInput): Promise<Guardian> {
    try {
      const tenantId = this.normalizeUuid(input.tenantId, "tenantId");
      const email = this.normalizeEmail(input.email);
      const relationship = this.normalizeRelationship(input.relationship);
      const password = this.ensurePassword(input.password);

      return await database.withTransaction(async (client) => {
        await this.ensureTenantExists(client, tenantId);

        const existingUserResult = await client.query(
          `
            SELECT 1
            FROM users
            WHERE tenant_id = $1 AND email = $2
            LIMIT 1
          `,
          [tenantId, email],
        );

        if ((existingUserResult.rowCount ?? 0) > 0) {
          throw new AppError(
            "A user with this email already exists in the tenant",
            409,
          );
        }

        const passwordHash = await authService.hashPassword(password);

        const userResult = await client.query(
          `
            INSERT INTO users (tenant_id, email, password_hash, role)
            VALUES ($1, $2, $3, 'guardian')
            RETURNING id, tenant_id, email
          `,
          [tenantId, email, passwordHash],
        );

        const userId = userResult.rows[0].id as string;
        const guardianRoleId = await this.ensureGuardianRole(client, tenantId);

        await client.query(
          `
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id) DO UPDATE SET role_id = EXCLUDED.role_id
          `,
          [userId, guardianRoleId],
        );

        const guardianResult = await client.query(
          `
            INSERT INTO guardians (tenant_id, user_id, relationship)
            VALUES ($1, $2, $3)
            RETURNING id, tenant_id, user_id, relationship, created_at
          `,
          [tenantId, userId, relationship],
        );

        return {
          ...(guardianResult.rows[0] as Omit<Guardian, "email">),
          email,
        } as Guardian;
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError(
          "Guardian already exists or duplicate guardian data",
          409,
        );
      }
      this.handleError(error);
    }
  }

  async assignGuardianToStudent(
    input: AssignGuardianToStudentInput,
  ): Promise<{
    id: string;
    student_id: string;
    guardian_id: string;
    created_at: string;
  }> {
    try {
      const tenantId = this.normalizeUuid(input.tenantId, "tenantId");
      const studentId = this.normalizeUuid(input.studentId, "studentId");
      const guardianId = this.normalizeUuid(input.guardianId, "guardianId");

      return await database.withTransaction(async (client) => {
        await this.ensureStudentInTenant(client, tenantId, studentId);
        await this.ensureGuardianInTenant(client, tenantId, guardianId);

        const countResult = await client.query(
          `
            SELECT COUNT(*)::int AS guardian_count
            FROM student_guardians sg
            JOIN guardians g ON g.id = sg.guardian_id
            WHERE sg.student_id = $1
              AND g.tenant_id = $2
          `,
          [studentId, tenantId],
        );

        const guardianCount = Number(countResult.rows[0].guardian_count || 0);

        if (guardianCount >= 2) {
          throw new AppError("A student can have at most 2 guardians", 400);
        }

        const assignmentResult = await client.query(
          `
            INSERT INTO student_guardians (student_id, guardian_id)
            VALUES ($1, $2)
            RETURNING id, student_id, guardian_id, created_at
          `,
          [studentId, guardianId],
        );

        return assignmentResult.rows[0] as {
          id: string;
          student_id: string;
          guardian_id: string;
          created_at: string;
        };
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError("Guardian is already assigned to this student", 409);
      }
      this.handleError(error);
    }
  }

  async getStudentGuardians(
    studentId: string,
    tenantId: string,
  ): Promise<Guardian[]> {
    try {
      const normalizedStudentId = this.normalizeUuid(studentId, "studentId");
      const normalizedTenantId = this.normalizeUuid(tenantId, "tenantId");

      const result = await database.query(
        `
          SELECT
            g.id,
            g.tenant_id,
            g.user_id,
            u.email,
            g.relationship,
            g.created_at
          FROM student_guardians sg
          JOIN guardians g ON g.id = sg.guardian_id
          JOIN users u ON u.id = g.user_id
          JOIN students s ON s.id = sg.student_id
          WHERE sg.student_id = $1
            AND g.tenant_id = $2
            AND u.tenant_id = $2
            AND s.tenant_id = $2
          ORDER BY g.created_at ASC
        `,
        [normalizedStudentId, normalizedTenantId],
      );

      return result.rows as Guardian[];
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default new GuardianService();
