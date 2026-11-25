
import type { RequestHandler } from "express";
import {
  loginSchema,
  registerSchema,
} from "./auth.schema.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  SESSION_DURATION_MS,
} from "./auth.service.js";

const COOKIE_NAME = "jobpilot_session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const register: RequestHandler = async (
  req,
  res
) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user },
  });
};

export const login: RequestHandler = async (
  req,
  res
) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  res.cookie(COOKIE_NAME, result.token, {
    ...cookieOptions,
    maxAge: SESSION_DURATION_MS,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: result.user },
  });
};

export const logout: RequestHandler = async (
  req,
  res
) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (typeof token === "string") {
    await logoutUser(token);
  }

  res.clearCookie(COOKIE_NAME, cookieOptions);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const me: RequestHandler = (
  _req,
  res
) => {
  res.status(200).json({
    success: true,
    data: {
      user: res.locals.user,
    },
  });
};
