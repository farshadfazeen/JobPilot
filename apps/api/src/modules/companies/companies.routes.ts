
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import {
  idSchema,
  optionalText,
  pagination,
  paginationMeta,
  paginationSchema,
  requiredText,
} from "../../utils/request.js";

export const companiesRouter = Router();

companiesRouter.use(requireAuth);

const companySchema = z.object({
  name: requiredText(150),
  website: z.url().nullable().optional(),
  location: optionalText(200),
  industry: optionalText(150),
}).strict();

companiesRouter.get("/", async (req, res) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const search = z.string().max(150).optional()
    .parse(req.query.search);

  const ownerId = res.locals.user.id;

  const where = {
    ownerId,
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [companies, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      ...pagination(page, limit),
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  res.json({
    success: true,
    data: companies,
    meta: paginationMeta(total, page, limit),
  });
});

companiesRouter.get("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const company = await prisma.company.findFirst({
    where: { id, ownerId: res.locals.user.id },
    include: {
      _count: {
        select: { applications: true, contacts: true },
      },
    },
  });

  if (!company) throw new AppError(404, "Company not found");

  res.json({ success: true, data: company });
});

companiesRouter.post("/", async (req, res) => {
  const input = companySchema.parse(req.body);

  const company = await prisma.company.create({
    data: {
      ...input,
      ownerId: res.locals.user.id,
    },
  });

  res.status(201).json({ success: true, data: company });
});

companiesRouter.patch("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = companySchema.partial().parse(req.body);

  const result = await prisma.company.updateMany({
    where: { id, ownerId: res.locals.user.id },
    data: input,
  });

  if (!result.count) throw new AppError(404, "Company not found");

  const company = await prisma.company.findUnique({
    where: { id },
  });

  res.json({ success: true, data: company });
});

companiesRouter.delete("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const company = await prisma.company.findFirst({
    where: { id, ownerId: res.locals.user.id },
    include: {
      _count: { select: { applications: true } },
    },
  });

  if (!company) throw new AppError(404, "Company not found");

  if (company._count.applications > 0) {
    throw new AppError(
      409,
      "Delete or reassign this company's applications first"
    );
  }

  await prisma.company.delete({
    where: { id },
  });

  res.json({ success: true, message: "Company deleted" });
});
