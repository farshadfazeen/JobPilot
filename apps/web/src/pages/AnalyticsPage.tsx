
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
} from "react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Layers3,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  fetchAnalytics,
  getAnalyticsMetrics,
  getInterviewStatusCounts,
  getJobTypeCounts,
  getMonthlyActivity,
  getTopCompanies,
  getWorkModeCounts,
  exportApplicationsCsv,
  exportInterviewsCsv,
  type CategoryPoint,
  type MonthPoint,
} from "../lib/analytics";
import {
  STATUSES,
  STATUS_COLORS,
  statusLabel,
} from "../lib/applications";

type Period = 6 | 12;

function NumberCard({
  label,
  value,
  detail,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  color: string;
  icon: typeof Activity;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/25 hover:shadow-md">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{
          background: `linear-gradient(to right, ${color}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <p className="jp-muted text-xs font-semibold">
          {label}
        </p>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${color}16`,
            color,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-extrabold tracking-tight">
        {value.toLocaleString()}
      </p>

      <p className="jp-muted mt-3 text-xs leading-5">
        {detail}
      </p>
    </article>
  );
}

function PanelHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="jp-eyebrow">{eyebrow}</p>

      <h2 className="mt-2 text-lg font-extrabold tracking-tight">
        {title}
      </h2>

      <p className="jp-muted mt-2 text-xs leading-5">
        {description}
      </p>
    </div>
  );
}

function ActivityChart({
  points,
}: {
  points: MonthPoint[];
}) {
  const maximum = Math.max(
    1,
    ...points.map((point) => point.count)
  );

  const total = points.reduce(
    (sum, point) => sum + point.count,
    0
  );

  return (
    <section className="jp-card min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PanelHeading
          eyebrow="Timeline"
          title="Application activity"
          description="Applications added to JobPilot each month."
        />

        <div className="text-right">
          <p className="text-2xl font-extrabold">
            {total}
          </p>

          <p className="jp-muted text-xs">
            Added in this period
          </p>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div
              key={line}
              className="border-t border-dashed border-[var(--border)]"
            />
          ))}
        </div>

        <div
          className="relative flex h-62 items-end gap-2 sm:gap-4"
          role="img"
          aria-label={`Monthly applications: ${points.map(
            (point) => `${point.label}, ${point.count}`
          ).join("; ")}`}
        >
          {points.map((point, index) => {
            const height =
              point.count === 0
                ? 0
                : Math.max(
                    5,
                    (point.count / maximum) * 100
                  );

            const latest = index === points.length - 1;

            return (
              <div
                key={point.key}
                className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                title={`${point.label}: ${point.count} applications`}
              >
                <div className="flex h-55 flex-col items-center justify-end">
                  <span className="mb-2 text-[11px] font-bold">
                    {point.count}
                  </span>

                  <div
                    className={`w-full max-w-11 rounded-t-lg transition-all duration-300 group-hover:opacity-80 ${
                      latest
                        ? "bg-blue-600"
                        : "bg-blue-500/35 dark:bg-blue-400/35"
                    }`}
                    style={{
                      height: `${height}%`,
                      minHeight:
                        point.count > 0 ? "5px" : "0px",
                    }}
                  />
                </div>

                <p className="jp-muted mt-3 truncate text-center text-[10px] sm:text-xs">
                  {point.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatusDistribution({
  counts,
  total,
}: {
  counts: Record<(typeof STATUSES)[number], number>;
  total: number;
}) {
  const segments = STATUSES.filter(
    (status) => counts[status] > 0
  );

  let position = 0;

  const stops = segments.map((status) => {
    const start = position;
    const width = total > 0
      ? (counts[status] / total) * 100
      : 0;

    position += width;

    return `${STATUS_COLORS[status]} ${start}% ${position}%`;
  });

  const background =
    total > 0
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(var(--surface-alt) 0% 100%)";

  return (
    <section className="jp-card">
      <PanelHeading
        eyebrow="Current snapshot"
        title="Application status"
        description="Where your applications are right now."
      />

      <div className="mt-8 flex flex-col items-center gap-7 sm:flex-row">
        <div
          role="img"
          aria-label="Current application status distribution"
          className="relative h-45 w-45 shrink-0 rounded-full"
          style={{ background }}
        >
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-[var(--surface)]">
            <span className="text-3xl font-extrabold">
              {total}
            </span>

            <span className="jp-muted mt-1 text-xs">
              Applications
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: STATUS_COLORS[status],
                  }}
                />

                <span className="jp-muted truncate text-xs">
                  {statusLabel(status)}
                </span>
              </div>

              <span className="text-xs font-extrabold">
                {counts[status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Breakdown({
  eyebrow,
  title,
  description,
  values,
  colors,
}: {
  eyebrow: string;
  title: string;
  description: string;
  values: CategoryPoint[];
  colors: string[];
}) {
  const maximum = Math.max(
    1,
    ...values.map((value) => value.count)
  );

  const total = values.reduce(
    (sum, value) => sum + value.count,
    0
  );

  return (
    <section className="jp-card">
      <PanelHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      {total === 0 ? (
        <div className="jp-muted mt-8 rounded-xl bg-[var(--surface-alt)] p-7 text-center text-sm">
          No matching records yet.
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {values.map((value, index) => (
            <div key={value.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold">
                  {value.name}
                </p>

                <span className="jp-muted text-xs font-bold">
                  {value.count}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-alt)]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (value.count / maximum) * 100
                    }%`,
                    backgroundColor:
                      colors[index % colors.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ExportButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-blue-500/30 hover:bg-[var(--surface-alt)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
        <FileSpreadsheet size={20} />
      </div>

      <span className="min-w-0 flex-1 text-sm font-semibold">
        {label}
      </span>

      <Download
        size={17}
        className="jp-muted transition group-hover:text-blue-500"
      />
    </button>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(6);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["analytics-data"],
    queryFn: fetchAnalytics,
    staleTime: 30_000,
  });

  const applications = useMemo(
    () => data?.applications ?? [],
    [data]
  );

  const interviews = useMemo(
    () => data?.interviews ?? [],
    [data]
  );

  const metrics = useMemo(
    () =>
      getAnalyticsMetrics({
        applications,
        interviews,
      }),
    [applications, interviews]
  );

  const monthly = useMemo(
    () => getMonthlyActivity(applications, period),
    [applications, period]
  );

  const jobTypes = useMemo(
    () => getJobTypeCounts(applications),
    [applications]
  );

  const workModes = useMemo(
    () => getWorkModeCounts(applications),
    [applications]
  );

  const interviewStatuses = useMemo(
    () => getInterviewStatusCounts(interviews),
    [interviews]
  );

  const topCompanies = useMemo(
    () => getTopCompanies(applications),
    [applications]
  );

  function handleExportApplications() {
    exportApplicationsCsv(applications);
    toast.success("Applications CSV prepared");
  }

  function handleExportInterviews() {
    exportInterviewsCsv(interviews, applications);
    toast.success("Interviews CSV prepared");
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-45 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-37 animate-pulse rounded-2xl bg-[var(--surface-alt)]"
            />
          ))}
        </div>

        <div className="h-70 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="jp-card py-16 text-center">
        <BarChart3
          size={34}
          className="mx-auto text-blue-500"
        />

        <h2 className="mt-5 text-xl font-extrabold">
          Analytics couldn't load
        </h2>

        <p className="jp-muted mx-auto mt-2 max-w-sm text-sm">
          Check your backend connection and try again.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="jp-button mt-6"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="jp-fade-in space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            Your career in numbers
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Analytics
            <span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-3 max-w-xl text-sm leading-6">
            Understand your job search through useful,
            straightforward data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="jp-button-secondary"
        >
          <RefreshCw
            size={16}
            className={isFetching ? "animate-spin" : ""}
          />
          Refresh report
        </button>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-[#13151e] px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -top-22 -right-17 h-66 w-66 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-30 right-25 h-55 w-55 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-300 uppercase">
              <Sparkles size={15} />
              JobPilot Insights
            </div>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Every application tells a story.
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              See what you've tracked, where opportunities
              stand and how your activity has developed.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/8 px-6 py-5 backdrop-blur-sm">
            <p className="text-4xl font-extrabold">
              {metrics.total}
            </p>

            <p className="mt-2 text-xs text-slate-300">
              Total tracked applications
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumberCard
          label="Applications"
          value={metrics.total}
          detail="All job applications in your workspace"
          color="#3b82f6"
          icon={BriefcaseBusiness}
        />

        <NumberCard
          label="Active opportunities"
          value={metrics.active}
          detail="Not accepted, rejected or withdrawn"
          color="#14b8a6"
          icon={Activity}
        />

        <NumberCard
          label="Upcoming interviews"
          value={metrics.upcoming}
          detail="Scheduled interviews in the future"
          color="#8b5cf6"
          icon={CalendarCheck2}
        />

        <NumberCard
          label="Accepted applications"
          value={metrics.accepted}
          detail="Applications currently marked accepted"
          color="#22c55e"
          icon={CheckCircle2}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            Activity report
          </p>

          <h2 className="mt-2 text-xl font-extrabold tracking-tight">
            Your job-search patterns
          </h2>
        </div>

        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {([6, 12] as const).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                period === value
                  ? "bg-blue-500/10 text-blue-500"
                  : "jp-muted"
              }`}
            >
              {value} months
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <ActivityChart points={monthly} />

        <StatusDistribution
          counts={metrics.statuses}
          total={metrics.total}
        />
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <Breakdown
          eyebrow="Employment preferences"
          title="Job types"
          description="Current applications grouped by employment type."
          values={jobTypes}
          colors={[
            "#3b82f6",
            "#8b5cf6",
            "#14b8a6",
            "#f59e0b",
            "#ec4899",
          ]}
        />

        <Breakdown
          eyebrow="Work environment"
          title="Work arrangements"
          description="Remote, hybrid and onsite roles you have tracked."
          values={workModes}
          colors={[
            "#14b8a6",
            "#8b5cf6",
            "#3b82f6",
          ]}
        />

        <Breakdown
          eyebrow="Interview schedule"
          title="Interview records"
          description="Scheduled, completed and cancelled interview records."
          values={interviewStatuses}
          colors={[
            "#3b82f6",
            "#10b981",
            "#f87171",
          ]}
        />

        <Breakdown
          eyebrow="Company activity"
          title="Most-tracked companies"
          description="Companies with the most saved applications, not company success rankings."
          values={topCompanies}
          colors={[
            "#3b82f6",
            "#8b5cf6",
            "#14b8a6",
            "#f59e0b",
            "#ec4899",
          ]}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="jp-card">
          <PanelHeading
            eyebrow="Data ownership"
            title="Export your records"
            description="Download your saved application and interview information as CSV files."
          />

          <div className="mt-6 space-y-3">
            <ExportButton
              label={`Applications (${applications.length})`}
              onClick={handleExportApplications}
            />

            <ExportButton
              label={`Interviews (${interviews.length})`}
              onClick={handleExportInterviews}
            />
          </div>

          <p className="jp-muted mt-5 text-xs leading-5">
            CSV files are generated in your browser using
            the records returned by your authenticated API.
            They may contain personal information.
          </p>
        </section>

        <section className="jp-card">
          <PanelHeading
            eyebrow="Next step"
            title="Turn insights into action"
            description="Your reports connect to the same applications and interviews you manage every day."
          />

          <div className="mt-6 space-y-3">
            <Link
              to="/applications"
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:bg-[var(--surface-alt)]"
            >
              <BriefcaseBusiness
                size={19}
                className="text-blue-500"
              />

              <span className="flex-1 text-sm font-semibold">
                Manage applications
              </span>

              <ArrowRight
                size={16}
                className="jp-muted transition group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/interviews"
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:bg-[var(--surface-alt)]"
            >
              <CalendarCheck2
                size={19}
                className="text-violet-500"
              />

              <span className="flex-1 text-sm font-semibold">
                Review interviews
              </span>

              <ArrowRight
                size={16}
                className="jp-muted transition group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/companies"
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:bg-[var(--surface-alt)]"
            >
              <Building2
                size={19}
                className="text-teal-500"
              />

              <span className="flex-1 text-sm font-semibold">
                Explore companies
              </span>

              <ArrowRight
                size={16}
                className="jp-muted transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-5 py-4">
        <div className="flex items-start gap-3">
          <Layers3
            size={18}
            className="mt-0.5 shrink-0 text-blue-500"
          />

          <p className="jp-muted text-xs leading-6">
            <strong className="text-[var(--foreground)]">
              About this report:
            </strong>{" "}
            The monthly chart counts records created in
            JobPilot. Status charts show current application
            stages, not historical conversion rates. Missing
            job types and work modes are excluded from those
            respective breakdowns. These figures describe
            saved data, not predictions of hiring success.
          </p>
        </div>
      </section>

      <footer className="jp-muted flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>
          JobPilot Analytics — derived from your workspace data
        </span>

        <span className="flex items-center gap-2">
          <TrendingUp size={15} />
          Updated when you refresh
        </span>
      </footer>
    </div>
  );
}
