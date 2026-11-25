
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import {
  idSchema,
  requiredText,
  optionalText,
  dateValue,
  pagination,
  paginationMeta,
  paginationSchema,
} from "../../utils/request.js";

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

const statusSchema = z.enum([
  "SAVED", "APPLIED", "SCREENING", "INTERVIEW",
  "OFFER", "REJECTED", "WITHDRAWN", "ACCEPTED",
]);

const applicationSchema = z.object({
  jobTitle: requiredText(200),
  companyId: z.uuid(),
  jobUrl: z.url().nullable().optional(),
  description: optionalText(20000),
  status: statusSchema.default("SAVED"),
  jobType: z.enum([
    "FULL_TIME", "PART_TIME", "INTERNSHIP",
    "CONTRACT", "FREELANCE",
  ]).nullable().optional(),
  workMode: z.enum([
    "REMOTE", "HYBRID", "ONSITE",
  ]).nullable().optional(),
  location: optionalText(200),
  salaryMin: z.number().nonnegative().nullable().optional(),
  salaryMax: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).toUpperCase()
    .nullable().optional(),
  appliedAt: dateValue.nullable().optional(),
  deadline: dateValue.nullable().optional(),
}).strict().refine(
  (value) =>
    value.salaryMin == null ||
    value.salaryMax == null ||
    value.salaryMax >= value.salaryMin,
  { message: "Maximum salary cannot be lower than minimum salary" }
);

async function ownedApplication(id: string, ownerId: string) {
  const application = await prisma.application.findFirst({
    where: { id, ownerId },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  return application;
}

async function verifyCompany(id: string, ownerId: string) {
  const company = await prisma.company.findFirst({
    where: { id, ownerId },
  });

  if (!company) {
    throw new AppError(400, "Invalid company");
  }
}

applicationsRouter.get("/", async (req, res) => {
  const filters = z.object({
    page: paginationSchema.shape.page,
    limit: paginationSchema.shape.limit,
    status: statusSchema.optional(),
    companyId: z.uuid().optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum([
      "createdAt", "updatedAt", "deadline", "jobTitle",
    ]).default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  }).parse(req.query);

  const {
    page, limit, status, companyId, search, sortBy, order,
  } = filters;

  const where: Prisma.ApplicationWhereInput = {
    ownerId: res.locals.user.id,
    ...(status ? { status } : {}),
    ...(companyId ? { companyId } : {}),
    ...(search ? {
      OR: [
        { jobTitle: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const [applications, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      include: { company: true },
      orderBy: { [sortBy]: order },
      ...pagination(page, limit),
    }),
    prisma.application.count({ where }),
  ]);

  res.json({
    success: true,
    data: applications,
    meta: paginationMeta(total, page, limit),
  });
});

applicationsRouter.get("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const ownerId = res.locals.user.id;

  const application = await prisma.application.findFirst({
    where: { id, ownerId },
    include: {
      company: true,
      notes: { orderBy: { createdAt: "desc" } },
      interviews: { orderBy: { scheduledAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  res.json({ success: true, data: application });
});

applicationsRouter.post("/", async (req, res) => {
  const input = applicationSchema.parse(req.body);
  const ownerId = res.locals.user.id;

  await verifyCompany(input.companyId, ownerId);

  const { appliedAt, deadline, ...fields } = input;

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        ...fields,
        ownerId,
        appliedAt: appliedAt ? new Date(appliedAt) : null,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    await tx.statusHistory.create({
      data: {
        applicationId: created.id,
        toStatus: created.status,
        reason: "Application created",
      },
    });

    return created;
  });

  res.status(201).json({ success: true, data: application });
});

applicationsRouter.patch("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const ownerId = res.locals.user.id;
  const input = applicationSchema.safeExtend({})
    .partial().parse(req.body);

  const existing = await ownedApplication(id, ownerId);

  if (input.companyId) {
    await verifyCompany(input.companyId, ownerId);
  }

  const { appliedAt, deadline, ...fields } = input;

  const data = {
    ...fields,
    ...(appliedAt !== undefined
      ? { appliedAt: appliedAt ? new Date(appliedAt) : null }
      : {}),
    ...(deadline !== undefined
      ? { deadline: deadline ? new Date(deadline) : null }
      : {}),
  };

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.application.updateMany({
      where: { id, ownerId },
      data,
    });

    if (!result.count) {
      throw new AppError(404, "Application not found");
    }

    if (input.status && input.status !== existing.status) {
      await tx.statusHistory.create({
        data: {
          applicationId: id,
          fromStatus: existing.status,
          toStatus: input.status,
          reason: "Status updated",
        },
      });
    }

    return tx.application.findUniqueOrThrow({ where: { id } });
  });

  res.json({ success: true, data: updated });
});

applicationsRouter.delete("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const deleted = await prisma.application.deleteMany({
    where: { id, ownerId: res.locals.user.id },
  });

  if (!deleted.count) {
    throw new AppError(404, "Application not found");
  }

  res.json({
    success: true,
    message: "Application deleted",
  });
});
