import database from "@config/database";
import BaseService from "./baseService";
import { AppError } from "@utils/errors";

export interface TeacherAssignment {
  id: string;
  tenant_id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
}

interface AssignTeacherInput {
  tenantId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

class TeacherAssignmentService extends BaseService {
  private normalizeId(value: string): string {
    return (value || "").trim();
  }

  private assertUuid(value: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new AppError(`${fieldName} must be a valid UUID`, 400);
    }
  }

  private async assertTeacherExists(
    tenantId: string,
    teacherId: string,
  ): Promise<void> {
    const result = await database.query(
      `
        SELECT 1
        FROM users
        WHERE id = $1 AND tenant_id = $2
        LIMIT 1
      `,
      [teacherId, tenantId],
    );

    if (result.rowCount === 0) {
      throw new AppError("Teacher not found in tenant", 404);
    }
  }

  private async assertClassAndSubjectExist(
    tenantId: string,
    classId: string,
    subjectId: string,
  ): Promise<void> {
    const classResult = await database.query(
      `
        SELECT 1
        FROM classes
        WHERE id = $1 AND tenant_id = $2
        LIMIT 1
      `,
      [classId, tenantId],
    );

    if (classResult.rowCount === 0) {
      throw new AppError("Class not found for tenant", 404);
    }

    const subjectResult = await database.query(
      `
        SELECT 1
        FROM subjects
        WHERE id = $1 AND tenant_id = $2
        LIMIT 1
      `,
      [subjectId, tenantId],
    );

    if (subjectResult.rowCount === 0) {
      throw new AppError("Subject not found for tenant", 404);
    }
  }

  async assignTeacherToClassSubject(
    input: AssignTeacherInput,
  ): Promise<TeacherAssignment> {
    try {
      const tenantId = this.normalizeId(input.tenantId);
      const teacherId = this.normalizeId(input.teacherId);
      const classId = this.normalizeId(input.classId);
      const subjectId = this.normalizeId(input.subjectId);

      this.assertUuid(tenantId, "tenantId");
      this.assertUuid(teacherId, "teacherId");
      this.assertUuid(classId, "classId");
      this.assertUuid(subjectId, "subjectId");

      await this.assertTeacherExists(tenantId, teacherId);
      await this.assertClassAndSubjectExist(tenantId, classId, subjectId);

      const result = await database.query(
        `
          INSERT INTO teacher_assignments (tenant_id, teacher_id, class_id, subject_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id, tenant_id, teacher_id, class_id, subject_id, created_at
        `,
        [tenantId, teacherId, classId, subjectId],
      );

      return result.rows[0] as TeacherAssignment;
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError("Teacher assignment already exists", 409);
      }
      this.handleError(error);
    }
  }

  async getTeacherAssignments(
    teacherId: string,
    tenantId: string,
  ): Promise<TeacherAssignment[]> {
    try {
      const normalizedTeacherId = this.normalizeId(teacherId);
      const normalizedTenantId = this.normalizeId(tenantId);

      this.assertUuid(normalizedTeacherId, "teacherId");
      this.assertUuid(normalizedTenantId, "tenantId");

      const result = await database.query(
        `
          SELECT id, tenant_id, teacher_id, class_id, subject_id, created_at
          FROM teacher_assignments
          WHERE tenant_id = $1 AND teacher_id = $2
          ORDER BY created_at DESC
        `,
        [normalizedTenantId, normalizedTeacherId],
      );

      return result.rows as TeacherAssignment[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async teacherHasAssignment(
    tenantId: string,
    teacherId: string,
    classId: string,
    subjectId: string,
  ): Promise<boolean> {
    const result = await database.query(
      `
        SELECT 1
        FROM teacher_assignments
        WHERE tenant_id = $1
          AND teacher_id = $2
          AND class_id = $3
          AND subject_id = $4
        LIMIT 1
      `,
      [tenantId, teacherId, classId, subjectId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async validateClassAndSubjectExist(
    tenantId: string,
    classId: string,
    subjectId: string,
  ): Promise<void> {
    await this.assertClassAndSubjectExist(tenantId, classId, subjectId);
  }
}

export default new TeacherAssignmentService();
