import { NextFunction, Request, Response, Router } from "express";
import authController from "@controllers/authController";

const router: Router = Router();

router.post(
  "/auth/login",
  (req: Request, res: Response, next: NextFunction) => {
    authController.login(req, res, next);
  },
);

export default router;
