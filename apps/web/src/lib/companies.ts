
import { api } from "./api";
import type { Application } from "./applications";

export interface CompanyRecord {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
    contacts?: number;
  };
}

export interface CompanyInput {
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PageResponse<T> {
  success: boolean;
  data: T[];
  meta: PageMeta;
}

export interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export const companyService = {
  list: (page: number, search: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "12",
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return api<PageResponse<CompanyRecord>>(
      `/companies?${params.toString()}`
    );
  },

  get: (id: string) =>
    api<ItemResponse<CompanyRecord>>(
      `/companies/${encodeURIComponent(id)}`
    ),

  create: (data: CompanyInput) =>
    api<ItemResponse<CompanyRecord>>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CompanyInput) =>
    api<ItemResponse<CompanyRecord>>(
      `/companies/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  remove: (id: string) =>
    api<MessageResponse>(
      `/companies/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    ),

  applications: (companyId: string, page: number) => {
    const params = new URLSearchParams({
      companyId,
      page: String(page),
      limit: "10",
      sortBy: "createdAt",
      order: "desc",
    });

    return api<PageResponse<Application>>(
      `/applications?${params.toString()}`
    );
  },
};

export const COMPANY_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#22c55e",
];

export function companyColor(name: string): string {
  let value = 0;

  for (const character of name) {
    value = (value * 31 + character.charCodeAt(0)) >>> 0;
  }

  return COMPANY_COLORS[value % COMPANY_COLORS.length];
}

export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
