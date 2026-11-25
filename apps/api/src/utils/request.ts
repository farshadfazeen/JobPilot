
import { z } from "zod";

export const idSchema = z.uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export function pagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function paginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const optionalText = (maximum = 1000) =>
  z.string().trim().max(maximum).nullable().optional();

export const requiredText = (maximum = 255) =>
  z.string().trim().min(1).max(maximum);

export const dateValue = z.iso.datetime({
  offset: true,
});
