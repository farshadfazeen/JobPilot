
import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashSessionToken } from "../modules/auth/auth.service.js";

export const requireAuth: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const token = req.cookies?.jobpilot_session;

    if (typeof token !== "string" || !token) {
      throw new AppError(401, "Authentication required");
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash: hashSessionToken(token),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new AppError(401, "Session expired or invalid");
    }

    res.locals.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin: RequestHandler = (
  _req,
  res,
  next
) => {
  if (res.locals.user?.role !== "ADMIN") {
    next(new AppError(403, "Admin access required"));
    return;
  }

  next();
};
