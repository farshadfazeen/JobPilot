
import { applicationsApi, STATUSES } from "./applications";
import type {
  Application,
  ApplicationStatus,
  JobType,
  WorkMode,
} from "./applications";
import {
  fetchAllInterviews,
  type Interview,
  type InterviewStatus,
} from "./interviews";

export type AnalyticsData = {
  applications: Application[];
  interviews: Interview[];
};

export type MonthPoint = {
  key: string;
  label: string;
  count: number;
};

export type CategoryPoint = {
  name: string;
  count: number;
};

const CLOSED: ApplicationStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const applications: Application[] = [];

  for (let page = 1; page <= 1000; page++) {
    const response = await applicationsApi.list({
      page,
      limit: 100,
      search: "",
      status: "",
      companyId: "",
      sortBy: "createdAt",
      order: "desc",
    });

    applications.push(...response.data);

    if (
      response.data.length === 0 ||
      page >= response.meta.totalPages
    ) {
      break;
    }
  }

  const interviews = await fetchAllInterviews();

  return {
    applications,
    interviews,
  };
}

export function getStatusCounts(
  applications: Application[]
): Record<ApplicationStatus, number> {
  const counts = Object.fromEntries(
    STATUSES.map((status) => [status, 0])
  ) as Record<ApplicationStatus, number>;

  for (const application of applications) {
    counts[application.status] += 1;
  }

  return counts;
}

export function getAnalyticsMetrics(data: AnalyticsData) {
  const { applications, interviews } = data;

  const statuses = getStatusCounts(applications);

  const active = applications.filter(
    (application) => !CLOSED.includes(application.status)
  ).length;

  const now = Date.now();

  const upcoming = interviews.filter(
    (interview) =>
      interview.status === "SCHEDULED" &&
      new Date(interview.scheduledAt).getTime() >= now
  ).length;

  const completed = interviews.filter(
    (interview) => interview.status === "COMPLETED"
  ).length;

  const cancelled = interviews.filter(
    (interview) => interview.status === "CANCELLED"
  ).length;

  const uniqueCompanies = new Set(
    applications.map((application) => application.companyId)
  ).size;

  return {
    total: applications.length,
    active,
    accepted: statuses.ACCEPTED,
    offers: statuses.OFFER,
    upcoming,
    completed,
    cancelled,
    totalInterviews: interviews.length,
    companiesWithApplications: uniqueCompanies,
    statuses,
  };
}

export function getMonthlyActivity(
  applications: Application[],
  months: number,
  today = new Date()
): MonthPoint[] {
  const values: MonthPoint[] = [];

  for (let index = months - 1; index >= 0; index--) {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - index,
      1
    );

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const count = applications.filter((application) => {
      const created = new Date(application.createdAt);

      return (
        created.getFullYear() === year &&
        created.getMonth() === month
      );
    }).length;

    values.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat(undefined, {
        month: "short",
        ...(months > 6 ? { year: "2-digit" } : {}),
      }).format(monthDate),
      count,
    });
  }

  return values;
}

export function getCategoryCounts<T extends string>(
  values: Array<T | null | undefined>,
  known: readonly T[],
  format: (value: T) => string
): CategoryPoint[] {
  return known.map((key) => ({
    name: format(key),
    count: values.filter((value) => value === key).length,
  }));
}

export function getJobTypeCounts(
  applications: Application[]
): CategoryPoint[] {
  const order: JobType[] = [
    "FULL_TIME",
    "PART_TIME",
    "INTERNSHIP",
    "CONTRACT",
    "FREELANCE",
  ];

  return getCategoryCounts(
    applications.map((application) => application.jobType),
    order,
    (value) =>
      value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function getWorkModeCounts(
  applications: Application[]
): CategoryPoint[] {
  const order: WorkMode[] = ["REMOTE", "HYBRID", "ONSITE"];

  return getCategoryCounts(
    applications.map((application) => application.workMode),
    order,
    (value) =>
      value.charAt(0) + value.slice(1).toLowerCase()
  );
}

export function getInterviewStatusCounts(
  interviews: Interview[]
): CategoryPoint[] {
  const statuses: InterviewStatus[] = [
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED",
  ];

  return getCategoryCounts(
    interviews.map((interview) => interview.status),
    statuses,
    (value) =>
      value.charAt(0) + value.slice(1).toLowerCase()
  );
}

export function getTopCompanies(
  applications: Application[],
  limit = 5
): CategoryPoint[] {
  const counts = new Map<string, CategoryPoint>();

  for (const application of applications) {
    const id = application.companyId;
    const entry = counts.get(id);

    if (entry) {
      entry.count += 1;
    } else {
      counts.set(id, {
        name: application.company.name,
        count: 1,
      });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Export values as CSV, correctly escaping quotes,
// commas and line breaks.
function csvCell(value: unknown): string {
  if (value == null) return "";

  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCsv(
  filename: string,
  headers: string[],
  records: unknown[][]
): void {
  const rows = [
    headers.map(csvCell).join(","),
    ...records.map((row) => row.map(csvCell).join(",")),
  ];

  const csv = "\uFEFF" + rows.join("\r\n");
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportApplicationsCsv(
  applications: Application[]
): void {
  downloadCsv(
    "jobpilot-applications.csv",
    [
      "Job Title",
      "Company",
      "Status",
      "Job Type",
      "Work Mode",
      "Location",
      "Applied Date",
      "Deadline",
      "Salary Min",
      "Salary Max",
      "Currency",
      "Job URL",
      "Created At",
    ],
    applications.map((application) => [
      application.jobTitle,
      application.company.name,
      application.status,
      application.jobType,
      application.workMode,
      application.location,
      application.appliedAt,
      application.deadline,
      application.salaryMin,
      application.salaryMax,
      application.currency,
      application.jobUrl,
      application.createdAt,
    ])
  );
}

export function exportInterviewsCsv(
  interviews: Interview[],
  applications: Application[]
): void {
  const applicationMap = new Map(
    applications.map((application) => [
      application.id,
      application,
    ])
  );

  downloadCsv(
    "jobpilot-interviews.csv",
    [
      "Title",
      "Application",
      "Company",
      "Scheduled At",
      "Duration Minutes",
      "Status",
      "Location",
      "Meeting URL",
      "Outcome",
      "Notes",
    ],
    interviews.map((interview) => {
      const application = applicationMap.get(interview.applicationId);

      return [
        interview.title,
        application?.jobTitle ?? interview.application?.jobTitle ?? "",
        application?.company.name ??
          interview.application?.company?.name ??
          "",
        interview.scheduledAt,
        interview.durationMin,
        interview.status,
        interview.location,
        interview.meetingUrl,
        interview.outcome,
        interview.notes,
      ];
    })
  );
}
