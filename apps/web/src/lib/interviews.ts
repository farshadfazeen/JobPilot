
import { api } from "./api";

export const INTERVIEW_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type InterviewStatus =
  (typeof INTERVIEW_STATUSES)[number];

export interface Interview {
  id: string;
  applicationId: string;
  title: string;
  scheduledAt: string;
  durationMin: number | null;
  meetingUrl: string | null;
  location: string | null;
  notes: string | null;
  outcome: string | null;
  status: InterviewStatus;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    jobTitle: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

export interface InterviewInput {
  applicationId: string;
  title: string;
  scheduledAt: string;
  durationMin: number | null;
  meetingUrl: string | null;
  location: string | null;
  notes: string | null;
  outcome: string | null;
  status: InterviewStatus;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ItemResponse<T> {
  success: boolean;
  data: T;
}

interface MessageResponse {
  success: boolean;
  message: string;
}

export const INTERVIEW_COLORS: Record<
  InterviewStatus,
  string
> = {
  SCHEDULED: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#f87171",
};

export function interviewDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function interviewTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function localDateKey(value: string | Date): string {
  const date =
    typeof value === "string" ? new Date(value) : value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toLocalDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${localDateKey(date)}T${hours}:${minutes}`;
}

export function toUtcDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid interview date and time.");
  }

  return date.toISOString();
}

export function statusLabel(status: InterviewStatus): string {
  return (
    status.charAt(0) +
    status.slice(1).toLowerCase()
  );
}

export async function fetchAllInterviews(): Promise<Interview[]> {
  const interviews: Interview[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 1000; page++) {
    const params = new URLSearchParams({
      page: String(page),
      limit: "100",
    });

    const result = await api<ListResponse<Interview>>(
      `/interviews?${params.toString()}`
    );

    if (!Array.isArray(result.data)) {
      throw new Error("Invalid interviews response.");
    }

    for (const interview of result.data) {
      if (!seen.has(interview.id)) {
        seen.add(interview.id);
        interviews.push(interview);
      }
    }

    if (
      result.data.length === 0 ||
      !result.meta ||
      page >= result.meta.totalPages
    ) {
      break;
    }
  }

  return interviews.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() -
      new Date(b.scheduledAt).getTime()
  );
}

export const interviewsApi = {
  list: fetchAllInterviews,

  create: (data: InterviewInput) =>
    api<ItemResponse<Interview>>("/interviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<InterviewInput>
  ) =>
    api<ItemResponse<Interview>>(
      `/interviews/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  remove: (id: string) =>
    api<MessageResponse>(
      `/interviews/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    ),
};
