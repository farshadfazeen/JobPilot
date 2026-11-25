import { Prisma } from "../generated/prisma/client.js";
import type {
  ErrorRequestHandler,
  RequestHandler,
} from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

// Handle unknown routes
export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.path}`));
};

// Global error handler
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req,
  res,
  _next
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues,
    });
    return;
  }

  // Prisma database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with these values already exists",
      });
      return;
    }

    if (err.code === "P2003") {
      res.status(409).json({
        success: false,
        message: "Database relationship constraint failed",
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found",
      });
      return;
    }
  }

  // Custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unexpected server errors
  console.error("Unexpected server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
