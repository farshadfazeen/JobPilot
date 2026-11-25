
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import {
  dateValue,
  idSchema,
  optionalText,
  requiredText,
} from "../../utils/request.js";

export const interviewsRouter = Router();
interviewsRouter.use(requireAuth);

const interviewSchema = z.object({
  applicationId: z.uuid(),
  title: requiredText(200),
  scheduledAt: dateValue,
  durationMin: z.number().int().min(1).max(1440)
    .nullable().optional(),
  meetingUrl: z.url().nullable().optional(),
  location: optionalText(200),
  notes: optionalText(5000),
  outcome: optionalText(2000),
  status: z.enum([
    "SCHEDULED", "COMPLETED", "CANCELLED",
  ]).default("SCHEDULED"),
}).strict();

async function checkApplication(
  applicationId: string,
  ownerId: string
) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, ownerId },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }
}

interviewsRouter.get("/", async (_req, res) => {
  const interviews = await prisma.interview.findMany({
    where: {
      application: { ownerId: res.locals.user.id },
    },
    include: {
      application: {
        select: {
          id: true,
          jobTitle: true,
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });

  res.json({ success: true, data: interviews });
});

interviewsRouter.post("/", async (req, res) => {
  const input = interviewSchema.parse(req.body);

  await checkApplication(
    input.applicationId,
    res.locals.user.id
  );

  const interview = await prisma.interview.create({
    data: {
      ...input,
      scheduledAt: new Date(input.scheduledAt),
    },
  });

  res.status(201).json({
    success: true,
    data: interview,
  });
});

interviewsRouter.patch("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = interviewSchema.partial().parse(req.body);
  const ownerId = res.locals.user.id;

  const existing = await prisma.interview.findFirst({
    where: {
      id,
      application: { ownerId },
    },
  });

  if (!existing) {
    throw new AppError(404, "Interview not found");
  }

  if (input.applicationId) {
    await checkApplication(input.applicationId, ownerId);
  }

  const { scheduledAt, ...fields } = input;

  const interview = await prisma.interview.update({
    where: { id },
    data: {
      ...fields,
      ...(scheduledAt
        ? { scheduledAt: new Date(scheduledAt) }
        : {}),
    },
  });

  res.json({ success: true, data: interview });
});

interviewsRouter.delete("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const deleted = await prisma.interview.deleteMany({
    where: {
      id,
      application: { ownerId: res.locals.user.id },
    },
  });

  if (!deleted.count) {
    throw new AppError(404, "Interview not found");
  }

  res.json({
    success: true,
    message: "Interview deleted",
  });
});
