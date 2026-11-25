
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(255).transform(
    (email) => email.toLowerCase()
  ),
  password: z.string()
    .min(12, "Password must contain at least 12 characters")
    .max(128),
}).strict();

export const loginSchema = z.object({
  email: z.email().transform(
    (email) => email.toLowerCase()
  ),
  password: z.string().min(1),
}).strict();

export type RegisterInput =
  z.infer<typeof registerSchema>;

export type LoginInput =
  z.infer<typeof loginSchema>;
