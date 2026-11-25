
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import {
  idSchema,
  optionalText,
  requiredText,
} from "../../utils/request.js";

export const contactsRouter = Router();
contactsRouter.use(requireAuth);

const contactSchema = z.object({
  companyId: z.uuid(),
  name: requiredText(150),
  email: z.email().nullable().optional(),
  phone: optionalText(50),
  jobTitle: optionalText(150),
  notes: optionalText(3000),
}).strict();

async function verifyCompany(companyId: string, ownerId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, ownerId },
  });

  if (!company) throw new AppError(404, "Company not found");
}

contactsRouter.get("/", async (_req, res) => {
  const contacts = await prisma.contact.findMany({
    where: { ownerId: res.locals.user.id },
    include: {
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  res.json({ success: true, data: contacts });
});

contactsRouter.post("/", async (req, res) => {
  const input = contactSchema.parse(req.body);
  const ownerId = res.locals.user.id;

  await verifyCompany(input.companyId, ownerId);

  const contact = await prisma.contact.create({
    data: { ...input, ownerId },
  });

  res.status(201).json({ success: true, data: contact });
});

contactsRouter.patch("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = contactSchema.partial().parse(req.body);
  const ownerId = res.locals.user.id;

  if (input.companyId) {
    await verifyCompany(input.companyId, ownerId);
  }

  const result = await prisma.contact.updateMany({
    where: { id, ownerId },
    data: input,
  });

  if (!result.count) {
    throw new AppError(404, "Contact not found");
  }

  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  res.json({ success: true, data: contact });
});

contactsRouter.delete("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const result = await prisma.contact.deleteMany({
    where: { id, ownerId: res.locals.user.id },
  });

  if (!result.count) {
    throw new AppError(404, "Contact not found");
  }

  res.json({
    success: true,
    message: "Contact deleted",
  });
});
