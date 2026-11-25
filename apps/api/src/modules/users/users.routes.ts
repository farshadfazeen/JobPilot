
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import {
  requireAdmin,
  requireAuth,
} from "../../middleware/auth.middleware.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, (_req, res) => {
  res.json({
    success: true,
    data: res.locals.user,
  });
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/overview", async (_req, res) => {
  const [users, companies, applications, interviews] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.company.count(),
      prisma.application.count(),
      prisma.interview.count(),
    ]);

  res.json({
    success: true,
    data: {
      totalUsers: users,
      totalCompanies: companies,
      totalApplications: applications,
      totalInterviews: interviews,
    },
  });
});
    