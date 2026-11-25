
import { companiesRouter } from "./modules/companies/companies.routes.js";
import { applicationsRouter } from "./modules/applications/applications.routes.js";
import { interviewsRouter } from "./modules/interviews/interviews.routes.js";
import { notesRouter } from "./modules/notes/notes.routes.js";
import { contactsRouter } from "./modules/contacts/contacts.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { usersRouter, adminRouter } from "./modules/users/users.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFound,
} from "./middleware/error.middleware.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    application: "JobPilot API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/companies", companiesRouter);
app.use("/api/v1/applications", applicationsRouter);
app.use("/api/v1/interviews", interviewsRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/contacts", contactsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/admin", adminRouter);
app.use(notFound);
app.use(errorHandler);
