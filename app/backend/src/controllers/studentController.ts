import { NextFunction, Response } from "express";
import studentService from "@services/studentService";
import { AppError, successResponse } from "@utils/errors";
import { AuthRequest, getAuthContextOrThrow } from "@middleware/auth";

class StudentController {
  async enrollStudent(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = getAuthContextOrThrow(req);

      const {
        firstName,
        lastName,
        otherNames,
        classId,
        status,
        allergies,
        disabilities,
        guardians,
      } = req.body;

      if (typeof firstName !== "string" || !firstName.trim()) {
        throw new AppError("firstName is required", 400);
      }

      if (typeof lastName !== "string" || !lastName.trim()) {
        throw new AppError("lastName is required", 400);
      }

      if (typeof classId !== "string" || !classId.trim()) {
        throw new AppError("classId is required", 400);
      }

      if (guardians !== undefined && !Array.isArray(guardians)) {
        throw new AppError("guardians must be an array", 400);
      }

      const result = await studentService.enrollStudent({
        tenantId: context.tenantId,
        firstName,
        lastName,
        otherNames,
        classId,
        status,
        allergies,
        disabilities,
        guardians,
      });

      res
        .status(201)
        .json(successResponse(result, "Student enrolled successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export default new StudentController();
