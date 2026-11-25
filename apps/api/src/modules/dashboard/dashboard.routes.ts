
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res) => {
  const ownerId = res.locals.user.id;
  const now = new Date();

  const [
    totalApplications,
    statusCounts,
    totalCompanies,
    upcomingInterviews,
    recentApplications,
  ] = await prisma.$transaction([
    prisma.application.count({
      where: { ownerId },
    }),

    prisma.application.groupBy({
      by: ["status"],
      where: { ownerId },
      _count: { _all: true },
    }),

    prisma.company.count({
      where: { ownerId },
    }),

    prisma.interview.count({
      where: {
        application: { ownerId },
        scheduledAt: { gte: now },
        status: "SCHEDULED",
      },
    }),

    prisma.application.findMany({
      where: { ownerId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        jobTitle: true,
        status: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    }),
  ]);

  const byStatus = Object.fromEntries(
    statusCounts.map((item) => [
      item.status,
      item._count._all,
    ])
  );

  const interviews =
    (byStatus.INTERVIEW ?? 0) +
    (byStatus.OFFER ?? 0) +
    (byStatus.ACCEPTED ?? 0);

  const responseRate = totalApplications
    ? Math.round((interviews / totalApplications) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      totalApplications,
      totalCompanies,
      upcomingInterviews,
      byStatus,
      interviewProgressionRate: responseRate,
      recentApplications,
    },
  });
});
