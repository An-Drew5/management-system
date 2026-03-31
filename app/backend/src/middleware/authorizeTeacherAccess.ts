import { NextFunction, Response } from "express";
import { AppError } from "@utils/errors";
import teacherAssignmentService from "@services/teacherAssignmentService";
import { AuthRequest, getAuthContextOrThrow } from "./auth";

const readValue = (req: AuthRequest, key: string): string => {
  const fromParams = req.params?.[key];
  const fromBody = req.body?.[key];
  const fromQuery = req.query?.[key];
  const value = fromParams ?? fromBody ?? fromQuery;

  return typeof value === "string" ? value.trim() : "";
};

/**
 * Middleware factory that ensures the authenticated teacher can only access
 * their assigned class + subject within the same tenant.
 */
export const authorizeTeacherAccess = (
  classIdKey: string = "classId",
  subjectIdKey: string = "subjectId",
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const context = getAuthContextOrThrow(req);
      const classId = readValue(req, classIdKey);
      const subjectId = readValue(req, subjectIdKey);

      if (!classId || !subjectId) {
        throw new AppError("classId and subjectId are required", 400);
      }

      // Validate class/subject under the authenticated tenant.
      await teacherAssignmentService.validateClassAndSubjectExist(
        context.tenantId,
        classId,
        subjectId,
      );

      const allowed = await teacherAssignmentService.teacherHasAssignment(
        context.tenantId,
        context.userId,
        classId,
        subjectId,
      );

      if (!allowed) {
        throw new AppError("Access forbidden", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorizeTeacherAccess;
