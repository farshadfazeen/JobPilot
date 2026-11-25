
import { describe, expect, it } from "vitest";
import {
  pagination,
  paginationMeta,
  paginationSchema,
  idSchema,
} from "../src/utils/request.js";

describe("Request utilities", () => {
  it("calculates pagination correctly", () => {
    expect(pagination(3, 10)).toEqual({
      skip: 20,
      take: 10,
    });
  });

  it("creates pagination metadata", () => {
    expect(paginationMeta(25, 2, 10)).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it("rejects invalid page numbers", () => {
    expect(() =>
      paginationSchema.parse({ page: -1 })
    ).toThrow();
  });

  it("rejects invalid identifiers", () => {
    expect(() => idSchema.parse("not-a-uuid")).toThrow();
  });
});
