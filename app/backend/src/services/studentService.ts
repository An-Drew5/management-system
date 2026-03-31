import { PoolClient } from "pg";
import database from "@config/database";
import BaseService from "./baseService";
import { AppError } from "@utils/errors";

export type StudentStatus =
  | "active"
  | "graduated"
  | "transferred"
  | "repeating";

export interface Student {
  id: string;
  tenant_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  other_names: string | null;
  class_id: string;
  status: StudentStatus;
  allergies: string | null;
  disabilities: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  classId: string;
  status?: StudentStatus;
  allergies?: string;
  disabilities?: string;
}

class StudentService extends BaseService {
  private static readonly STUDENT_NUMBER_PAD = 5;

  private normalizeText(input: string | undefined, maxLength: number): string {
    return (input || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  }

  private normalizeOptionalText(
    input: string | undefined,
    maxLength: number,
  ): string | null {
    const normalized = this.normalizeText(input, maxLength);
    return normalized.length > 0 ? normalized : null;
  }

  private assertValidUuid(value: string, field: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test((value || "").trim())) {
      throw new AppError(`${field} must be a valid UUID`, 400);
    }
  }

  private async assertClassInTenant(
    client: PoolClient,
    tenantId: string,
    classId: string,
  ): Promise<void> {
    const result = await client.query(
      `
        SELECT 1
        FROM classes
        WHERE id = $1 AND tenant_id = $2
        LIMIT 1
      `,
      [classId, tenantId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new AppError("Class not found for tenant", 404);
    }
  }

  private async getTenantPrefix(
    client: PoolClient,
    tenantId: string,
  ): Promise<string> {
    const result = await client.query(
      `
        SELECT code
        FROM tenants
        WHERE id = $1
        LIMIT 1
      `,
      [tenantId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new AppError("Tenant not found", 404);
    }

    const code = String(result.rows[0].code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (!code) {
      throw new AppError("Tenant code is missing or invalid", 400);
    }

    return code;
  }

  private async generateStudentIdWithClient(
    client: PoolClient,
    tenantId: string,
  ): Promise<string> {
    const prefix = await this.getTenantPrefix(client, tenantId);

    await client.query(
      `
        INSERT INTO student_id_counters (tenant_id, last_number)
        VALUES ($1, 0)
        ON CONFLICT (tenant_id) DO NOTHING
      `,
      [tenantId],
    );

    const counterResult = await client.query(
      `
        UPDATE student_id_counters
        SET last_number = last_number + 1,
            updated_at = NOW()
        WHERE tenant_id = $1
        RETURNING last_number
      `,
      [tenantId],
    );

    const nextNumber = Number(counterResult.rows[0].last_number);
    const formattedNumber = String(nextNumber).padStart(
      StudentService.STUDENT_NUMBER_PAD,
      "0",
    );

    return `${prefix}${formattedNumber}`;
  }

  async generateStudentId(tenantId: string): Promise<string> {
    try {
      const normalizedTenantId = (tenantId || "").trim();
      this.assertValidUuid(normalizedTenantId, "tenantId");

      return await database.withTransaction(async (client) => {
        return await this.generateStudentIdWithClient(
          client,
          normalizedTenantId,
        );
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async createStudent(input: CreateStudentInput): Promise<Student> {
    try {
      const tenantId = (input.tenantId || "").trim();
      const classId = (input.classId || "").trim();
      const firstName = this.normalizeText(input.firstName, 120);
      const lastName = this.normalizeText(input.lastName, 120);
      const otherNames = this.normalizeOptionalText(input.otherNames, 180);
      const allergies = this.normalizeOptionalText(input.allergies, 3000);
      const disabilities = this.normalizeOptionalText(input.disabilities, 3000);
      const status: StudentStatus = input.status || "active";

      this.assertValidUuid(tenantId, "tenantId");
      this.assertValidUuid(classId, "classId");

      if (!firstName || !lastName) {
        throw new AppError("firstName and lastName are required", 400);
      }

      const allowedStatuses: StudentStatus[] = [
        "active",
        "graduated",
        "transferred",
        "repeating",
      ];

      if (!allowedStatuses.includes(status)) {
        throw new AppError("Invalid student status", 400);
      }

      return await database.withTransaction(async (client) => {
        await this.assertClassInTenant(client, tenantId, classId);

        const studentId = await this.generateStudentIdWithClient(
          client,
          tenantId,
        );

        const insertResult = await client.query(
          `
            INSERT INTO students (
              tenant_id,
              student_id,
              first_name,
              last_name,
              other_names,
              class_id,
              status,
              allergies,
              disabilities
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING
              id,
              tenant_id,
              student_id,
              first_name,
              last_name,
              other_names,
              class_id,
              status,
              allergies,
              disabilities,
              created_at,
              updated_at
          `,
          [
            tenantId,
            studentId,
            firstName,
            lastName,
            otherNames,
            classId,
            status,
            allergies,
            disabilities,
          ],
        );

        return insertResult.rows[0] as Student;
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError("Student ID already exists for tenant", 409);
      }
      this.handleError(error);
    }
  }

  async getStudentById(
    tenantId: string,
    studentId: string,
  ): Promise<Student | null> {
    try {
      const normalizedTenantId = (tenantId || "").trim();
      const normalizedStudentId = (studentId || "").trim().toUpperCase();

      this.assertValidUuid(normalizedTenantId, "tenantId");

      if (!normalizedStudentId) {
        throw new AppError("studentId is required", 400);
      }

      const result = await database.query(
        `
          SELECT
            id,
            tenant_id,
            student_id,
            first_name,
            last_name,
            other_names,
            class_id,
            status,
            allergies,
            disabilities,
            created_at,
            updated_at
          FROM students
          WHERE tenant_id = $1 AND student_id = $2
          LIMIT 1
        `,
        [normalizedTenantId, normalizedStudentId],
      );

      return (result.rows[0] as Student) || null;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default new StudentService();
