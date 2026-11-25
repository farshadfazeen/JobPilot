
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import type {
  LoginInput,
  RegisterInput,
} from "./auth.schema.js";

export const SESSION_DURATION_MS =
  7 * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await argon2.hash(data.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "USER",
      },
    });

    return publicUser(user);
  } catch (error) {
    // Handle concurrent registration with the same email.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Email is already registered");
    }
    throw error;
  }
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await argon2.verify(
    user.passwordHash,
    data.password
  );

  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  return {
    user: publicUser(user),
    token,
    expiresAt,
  };
}

export async function logoutUser(token: string) {
  await prisma.session.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}
