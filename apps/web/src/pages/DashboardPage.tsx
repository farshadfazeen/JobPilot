
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  dashboardApi,
  type DashboardSummary,
} from "../lib/api";

const statusOrder = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

const statusColors: Record<string, string> = {
  SAVED: "#94a3b8",
  APPLIED: "#3b82f6",
  SCREENING: "#14b8a6",
  INTERVIEW: "#8b5cf6",
  OFFER: "#f59e0b",
  ACCEPTED: "#22c55e",
  REJECTED: "#f87171",
  WITHDRAWN: "#71717a",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof BriefcaseBusiness;
  color: string;
}) {
  return (
    <div className="jp-card jp-card-hover relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="jp-muted text-sm font-medium">
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold tracking-tight">
            {value.toLocaleString()}
          </p>
        </div>

        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: `${color}16`,
            color,
          }}
        >
          <Icon size={21} strokeWidth={1.9} />
        </div>
      </div>

      <p className="jp-muted mt-5 text-xs leading-5">
        {description}
      </p>
    </div>
  );
}

function Pipeline({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const statuses = statusOrder.filter(
    (status) => (summary.byStatus[status] || 0) > 0
  );

  const total = summary.totalApplications;

  return (
    <section className="jp-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">
            Application pipeline
          </h2>

          <p className="jp-muted mt-1 text-sm">
            Your current application stages
          </p>
        </div>

        <Link
          to="/pipeline"
          aria-label="View pipeline"
          className="jp-icon-button shrink-0"
        >
          <ArrowRight size={18} />
        </Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Compass
            size={30}
            className="text-blue-500"
          />

          <h3 className="mt-4 font-bold">
            Your journey starts here
          </h3>

          <p className="jp-muted mt-2 max-w-xs text-sm">
            Once you add applications, you'll see
            how they move through the hiring process.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mt-8 flex h-3.5 overflow-hidden rounded-full bg-[var(--surface-alt)]"
            aria-label="Application status distribution"
          >
            {statuses.map((status) => (
              <div
                key={status}
                title={`${formatStatus(status)}: ${summary.byStatus[status]}`}
                style={{
                  width: `${
                    (summary.byStatus[status] / total) * 100
                  }%`,
                  backgroundColor: statusColors[status],
                }}
              />
            ))}
          </div>

          <div className="mt-7 grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
            {statuses.map((status) => {
              const count = summary.byStatus[status];

              return (
                <div key={status}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: statusColors[status],
                        }}
                      />

                      {formatStatus(status)}
                    </span>

                    <span className="text-sm font-bold">
                      {count}
                    </span>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-alt)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / total) * 100}%`,
                        backgroundColor: statusColors[status],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function RecentApplications({
  applications,
}: {
  applications: DashboardSummary["recentApplications"];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      applications.filter((application) =>
        `${application.jobTitle} ${application.company.name} ${application.status}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      ),
    [applications, search]
  );

  return (
    <section className="jp-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">
            Recent applications
          </h2>

          <p className="jp-muted mt-1 text-sm">
            Your five most recently tracked roles
          </p>
        </div>

        <Link
          to="/applications"
          className="flex items-center gap-1 text-sm font-bold text-blue-500 hover:underline"
        >
          View all
          <ArrowRight size={15} />
        </Link>
      </div>

      {applications.length > 0 && (
        <div className="relative mt-6">
          <Search
            size={17}
            className="jp-muted absolute top-1/2 left-4 -translate-y-1/2"
          />

          <input
            aria-label="Filter recent applications"
            type="search"
            placeholder="Filter these recent applications..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="jp-input pl-11!"
          />
        </div>
      )}

      {applications.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <BriefcaseBusiness
            size={32}
            className="text-blue-500"
          />

          <h3 className="mt-4 font-bold">
            No applications tracked yet
          </h3>

          <p className="jp-muted mt-2 text-sm">
            Your most recent applications will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="jp-muted py-10 text-center text-sm">
          No matching recent applications.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-[var(--border)]">
          {filtered.map((application) => (
            <div
              key={application.id}
              className="flex items-center gap-3 py-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-500">
                {application.company.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {application.jobTitle}
                </p>

                <p className="jp-muted mt-1 truncate text-xs">
                  {application.company.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      statusColors[application.status] ||
                      "#64748b",
                  }}
                />

                <span className="jp-muted text-xs">
                  {formatStatus(application.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  const actions = [
    {
      title: "Applications",
      description: "View and organize your tracked roles",
      href: "/applications",
      icon: BriefcaseBusiness,
      color: "#3b82f6",
    },
    {
      title: "Interviews",
      description: "Review your interview schedule",
      href: "/interviews",
      icon: CalendarCheck,
      color: "#a78bfa",
    },
    {
      title: "Companies",
      description: "Explore your company directory",
      href: "/companies",
      icon: Building2,
      color: "#14b8a6",
    },
  ];

  return (
    <section className="jp-card">
      <h2 className="text-lg font-extrabold tracking-tight">
        Your workspace
      </h2>

      <p className="jp-muted mt-1 text-sm">
        Jump into the tools you need
      </p>

      <div className="mt-6 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              to={action.href}
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:bg-[var(--surface-alt)]"
            >
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: `${action.color}16`,
                  color: action.color,
                }}
              >
                <Icon size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {action.title}
                </p>

                <p className="jp-muted mt-1 text-xs">
                  {action.description}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="jp-muted shrink-0 transition-transform group-hover:translate-x-1"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-summary", user?.id],
    queryFn: dashboardApi.summary,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" aria-label="Loading dashboard">
        <div className="h-45 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((number) => (
            <div
              key={number}
              className="h-39 animate-pulse rounded-2xl bg-[var(--surface-alt)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="jp-card flex flex-col items-center py-16 text-center">
        <RefreshCw size={30} className="text-blue-500" />

        <h2 className="mt-5 text-xl font-bold">
          We couldn't load your dashboard
        </h2>

        <p className="jp-muted mt-2 max-w-sm text-sm">
          Make sure the JobPilot API is running,
          then try again.
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

  const summary = data.data;

  const offers =
    (summary.byStatus.OFFER || 0) +
    (summary.byStatus.ACCEPTED || 0);

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || "there";

  const formattedDate = new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  ).format(new Date());

  return (
    <div className="jp-fade-in space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-[#111827] px-6 py-9 text-white sm:px-10 sm:py-11">
        <div className="jp-grid-pattern pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute -top-24 -right-20 h-70 w-70 rounded-full bg-blue-600/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 right-20 h-60 w-60 rounded-full bg-violet-500/18 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-blue-300 uppercase">
            <Sparkles size={15} />
            Your career overview
          </div>

          <h1 className="max-w-2xl text-3xl leading-tight font-extrabold tracking-[-0.05em] sm:text-4xl">
            {greeting()}, {firstName}.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            A clearer view of your applications,
            progress and next opportunities.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/applications"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              <Plus size={18} />
              Manage applications
            </Link>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
            <Clock3 size={14} />
            {formattedDate}
          </div>
        </div>
      </section>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            At a glance
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">
            Your numbers
          </h2>
        </div>

        <p className="jp-muted hidden text-xs sm:block">
          Live information from your workspace
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Applications"
          value={summary.totalApplications}
          description="Total opportunities recorded"
          color="#3b82f6"
          icon={BriefcaseBusiness}
        />

        <MetricCard
          label="Upcoming interviews"
          value={summary.upcomingInterviews}
          description="Scheduled interviews ahead"
          color="#a78bfa"
          icon={CalendarCheck}
        />

        <MetricCard
          label="Offers & accepted"
          value={offers}
          description="Currently at offer or accepted stage"
          color="#22c55e"
          icon={CheckCircle2}
        />

        <MetricCard
          label="Companies"
          value={summary.totalCompanies}
          description="Companies in your workspace"
          color="#14b8a6"
          icon={Building2}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Pipeline summary={summary} />

        <section className="jp-card flex flex-col">
          <div>
            <p className="jp-eyebrow">
              Progress indicator
            </p>

            <h2 className="mt-2 text-lg font-extrabold tracking-tight">
              Interview progression
            </h2>

            <p className="jp-muted mt-2 text-sm">
              Based on applications currently at
              interview, offer or accepted stages.
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-10">
            <div className="relative flex h-39 w-39 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    #8b5cf6 0%,
                    #3b82f6 ${summary.interviewProgressionRate}%,
                    var(--surface-alt) ${summary.interviewProgressionRate}%,
                    var(--surface-alt) 100%
                  )`,
                }}
              />

              <div className="relative flex h-31 w-31 flex-col items-center justify-center rounded-full bg-[var(--surface)]">
                <span className="text-3xl font-extrabold tracking-tight">
                  {summary.interviewProgressionRate}%
                </span>
                <span className="jp-muted mt-1 text-xs">
                  Progression
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--surface-alt)] p-3">
            <div className="flex items-start gap-2">
              <TrendingUp
                size={17}
                className="mt-0.5 shrink-0 text-violet-500"
              />

              <p className="jp-muted text-xs leading-5">
                This is a simplified current-status
                metric, not your historical interview
                conversion rate.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <RecentApplications
          applications={summary.recentApplications}
        />

        <QuickActions />
      </div>
    </div>
  );
}
