
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  login,
  logout,
  me,
  register,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
