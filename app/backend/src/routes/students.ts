import { NextFunction, Response, Router } from "express";
import studentController from "@controllers/studentController";
import { authMiddleware, AuthRequest } from "@middleware/auth";
import { authorize } from "@middleware/authorize";

const router: Router = Router();

router.post(
  "/students/enroll",
  authMiddleware,
  authorize("students.create"),
  (req: AuthRequest, res: Response, next: NextFunction) => {
    studentController.enrollStudent(req, res, next);
  },
);

export default router;
