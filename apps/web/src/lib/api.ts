
export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export interface DashboardSummary {
  totalApplications: number;
  totalCompanies: number;
  upcomingInterviews: number;
  byStatus: Record<string, number>;
  interviewProgressionRate: number;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    status: string;
    createdAt: string;
    company: {
      name: string;
    };
  }>;
}


export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      result?.message || "Something went wrong"
    );
  }

  return result as T;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) =>
    api<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: {
    email: string;
    password: string;
  }) =>
    api<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => api<AuthResponse>("/auth/me"),

  logout: () =>
    api<{ success: boolean }>("/auth/logout", {
      method: "POST",
    }),
};

export const dashboardApi = {
  summary: () =>
    api<{
      success: boolean;
      data: DashboardSummary;
    }>("/dashboard/summary"),
};
