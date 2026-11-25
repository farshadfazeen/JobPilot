
import { api } from "./api";

export const STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "CONTRACT",
  "FREELANCE",
] as const;

export const WORK_MODES = [
  "REMOTE",
  "HYBRID",
  "ONSITE",
] as const;

export type ApplicationStatus = (typeof STATUSES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];

export interface Company {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number | null;
  meetingUrl: string | null;
  location: string | null;
  notes: string | null;
  outcome: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export interface StatusHistory {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  reason: string | null;
  changedAt: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  companyId: string;
  company: Company;
  status: ApplicationStatus;
  jobType: JobType | null;
  workMode: WorkMode | null;
  jobUrl: string | null;
  description: string | null;
  location: string | null;
  salaryMin: string | number | null;
  salaryMax: string | number | null;
  currency: string | null;
  appliedAt: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
  interviews?: Interview[];
  statusHistory?: StatusHistory[];
}

export interface ApplicationInput {
  jobTitle: string;
  companyId: string;
  status: ApplicationStatus;
  jobType: JobType | null;
  workMode: WorkMode | null;
  jobUrl: string | null;
  description: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  appliedAt: string | null;
  deadline: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export type ApplicationFilters = {
  page: number;
  limit: number;
  search: string;
  status: string;
  companyId: string;
  sortBy: "createdAt" | "updatedAt" | "deadline" | "jobTitle";
  order: "asc" | "desc";
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "#94a3b8",
  APPLIED: "#3b82f6",
  SCREENING: "#14b8a6",
  INTERVIEW: "#8b5cf6",
  OFFER: "#f59e0b",
  ACCEPTED: "#22c55e",
  REJECTED: "#f87171",
  WITHDRAWN: "#71717a",
};

export function statusLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function fromDateInput(value: string): string | null {
  if (!value) return null;

  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function formatSalary(application: Application): string {
  const min = application.salaryMin;
  const max = application.salaryMax;

  if (min == null && max == null) {
    return "Not specified";
  }

  const currency = application.currency || "";

  const number = (value: string | number): string =>
    Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  if (min != null && max != null) {
    return `${currency} ${number(min)} – ${number(max)}`.trim();
  }

  if (min != null) {
    return `${currency} ${number(min)}+`.trim();
  }

  return `Up to ${currency} ${number(max!)}`.trim();
}

export const companiesApi = {
  list: (search = "") => {
    const params = new URLSearchParams({
      page: "1",
      limit: "100",
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return api<ListResponse<Company>>(
      `/companies?${params.toString()}`
    );
  },

  create: (data: {
    name: string;
    website?: string | null;
    location?: string | null;
    industry?: string | null;
  }) =>
    api<ItemResponse<Company>>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const applicationsApi = {
  list: (filters: ApplicationFilters) => {
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
      sortBy: filters.sortBy,
      order: filters.order,
    });

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.companyId) {
      params.set("companyId", filters.companyId);
    }

    return api<ListResponse<Application>>(
      `/applications?${params.toString()}`
    );
  },

  get: (id: string) =>
    api<ItemResponse<Application>>(
      `/applications/${encodeURIComponent(id)}`
    ),

  create: (data: ApplicationInput) =>
    api<ItemResponse<Application>>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<ApplicationInput>) =>
    api<ItemResponse<Application>>(
      `/applications/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  remove: (id: string) =>
    api<MessageResponse>(
      `/applications/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    ),
};

export const notesApi = {
  create: (applicationId: string, content: string) =>
    api<ItemResponse<Note>>("/notes", {
      method: "POST",
      body: JSON.stringify({
        applicationId,
        content,
      }),
    }),

  update: (id: string, content: string) =>
    api<ItemResponse<Note>>(
      `/notes/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ content }),
      }
    ),

  remove: (id: string) =>
    api<MessageResponse>(
      `/notes/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    ),
};
