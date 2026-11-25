
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import {
  idSchema,
  requiredText,
} from "../../utils/request.js";

export const notesRouter = Router();
notesRouter.use(requireAuth);

const noteSchema = z.object({
  applicationId: z.uuid(),
  content: requiredText(5000),
}).strict();

notesRouter.get("/application/:applicationId", async (req, res) => {
  const applicationId = idSchema.parse(
    req.params.applicationId
  );

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      ownerId: res.locals.user.id,
    },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  const notes = await prisma.note.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: notes });
});

notesRouter.post("/", async (req, res) => {
  const input = noteSchema.parse(req.body);

  const application = await prisma.application.findFirst({
    where: {
      id: input.applicationId,
      ownerId: res.locals.user.id,
    },
  });

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  const note = await prisma.note.create({
    data: input,
  });

  res.status(201).json({ success: true, data: note });
});

notesRouter.patch("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const { content } = z.object({
    content: requiredText(5000),
  }).strict().parse(req.body);

  const updated = await prisma.note.updateMany({
    where: {
      id,
      application: { ownerId: res.locals.user.id },
    },
    data: { content },
  });

  if (!updated.count) {
    throw new AppError(404, "Note not found");
  }

  const note = await prisma.note.findUnique({
    where: { id },
  });

  res.json({ success: true, data: note });
});

notesRouter.delete("/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);

  const result = await prisma.note.deleteMany({
    where: {
      id,
      application: { ownerId: res.locals.user.id },
    },
  });

  if (!result.count) {
    throw new AppError(404, "Note not found");
  }

  res.json({
    success: true,
    message: "Note deleted",
  });
});
