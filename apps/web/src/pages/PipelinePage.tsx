
import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  Columns3,
  ExternalLink,
  GripVertical,
  LayoutList,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import ApplicationForm from "../components/applications/ApplicationForm";

import {
  applicationsApi,
  formatDate,
  JOB_TYPES,
  STATUSES,
  STATUS_COLORS,
  statusLabel,
  toDateInput,
  WORK_MODES,
  type Application,
  type ApplicationStatus,
  type JobType,
  type WorkMode,
} from "../lib/applications";

// --------------------------------------------------
// Pipeline configuration
// --------------------------------------------------

type Stage = {
  id: ApplicationStatus;
  description: string;
};

const STAGES: Stage[] = [
  {
    id: "SAVED",
    description: "Opportunities worth exploring",
  },
  {
    id: "APPLIED",
    description: "Applications you've submitted",
  },
  {
    id: "SCREENING",
    description: "Recruiter reviews and initial calls",
  },
  {
    id: "INTERVIEW",
    description: "Interviews and assessments",
  },
  {
    id: "OFFER",
    description: "Offers awaiting a decision",
  },
  {
    id: "ACCEPTED",
    description: "Opportunities you've accepted",
  },
  {
    id: "REJECTED",
    description: "Applications that didn't progress",
  },
  {
    id: "WITHDRAWN",
    description: "Applications you chose to close",
  },
];

const CLOSED_STATUSES: ApplicationStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

type SortMode = "recent" | "oldest" | "deadline" | "company";

function isClosed(status: ApplicationStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

function getToday(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysUntilDeadline(value: string | null): number | null {
  const date = toDateInput(value);

  if (!date) return null;

  const difference =
    Date.parse(`${date}T00:00:00Z`) -
    Date.parse(`${getToday()}T00:00:00Z`);

  return Math.round(difference / 86_400_000);
}

function isDueSoon(application: Application): boolean {
  if (isClosed(application.status)) return false;

  const days = daysUntilDeadline(application.deadline);

  return days !== null && days >= 0 && days <= 7;
}

function deadlineLabel(
  application: Application
): { text: string; urgent: boolean } | null {
  if (isClosed(application.status)) return null;

  const days = daysUntilDeadline(application.deadline);

  if (days === null) return null;

  if (days < 0) {
    return { text: "Deadline passed", urgent: true };
  }

  if (days === 0) {
    return { text: "Due today", urgent: true };
  }

  if (days === 1) {
    return { text: "Due tomorrow", urgent: true };
  }

  if (days <= 7) {
    return { text: `Due in ${days} days`, urgent: false };
  }

  return null;
}

// Fetch every page from the existing API.
// The backend returns a maximum of 100 per request.
async function fetchAllApplications(): Promise<Application[]> {
  const results: Application[] = [];
  let page = 1;

  while (true) {
    const response = await applicationsApi.list({
      page,
      limit: 100,
      search: "",
      status: "",
      companyId: "",
      sortBy: "updatedAt",
      order: "desc",
    });

    results.push(...response.data);

    if (
      response.data.length === 0 ||
      page >= response.meta.totalPages
    ) {
      break;
    }

    page += 1;
  }

  return results;
}

// --------------------------------------------------
// Application card
// --------------------------------------------------

interface CardProps {
  application: Application;
  saving: boolean;
  dragging: boolean;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    application: Application
  ) => void;
  onDragEnd: () => void;
  onEdit: (application: Application) => void;
  onMove: (
    application: Application,
    status: ApplicationStatus
  ) => void;
}

function PipelineCard({
  application,
  saving,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onMove,
}: CardProps) {
  const color = STATUS_COLORS[application.status];
  const deadline = deadlineLabel(application);

  return (
    <article
      draggable={!saving}
      onDragStart={(event) => onDragStart(event, application)}
      onDragEnd={onDragEnd}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md ${
        dragging ? "opacity-35" : ""
      } ${saving ? "opacity-65" : ""}`}
    >
      <div
        className="absolute top-0 left-0 h-full w-0.75 rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
          style={{
            color,
            backgroundColor: `${color}17`,
          }}
        >
          {application.company.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">
            {application.company.name}
          </p>

          <p className="jp-muted mt-1 text-[11px]">
            {application.jobType
              ? statusLabel(application.jobType)
              : "Job opportunity"}
          </p>
        </div>

        <div
          aria-hidden="true"
          title="Drag the card to another stage"
          className="jp-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        >
          <GripVertical size={19} />
        </div>
      </div>

      <Link
        to={`/applications/${application.id}`}
        className="mt-4 block wrap-break-word text-sm leading-5 font-extrabold tracking-tight transition-colors hover:text-blue-500"
      >
        {application.jobTitle}
      </Link>

      {application.location && (
        <p className="jp-muted mt-3 flex items-start gap-1.5 text-xs">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">
            {application.location}
          </span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {application.workMode && (
          <span className="rounded-md bg-[var(--surface-alt)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]">
            {statusLabel(application.workMode)}
          </span>
        )}

        {deadline && (
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
              deadline.urgent
                ? "bg-red-500/10 text-red-500"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            <CalendarClock size={12} />
            {deadline.text}
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="jp-muted text-[10px]">
              {application.appliedAt
                ? "Applied"
                : "Updated"}
            </p>

            <p className="mt-1 text-xs font-semibold">
              {formatDate(
                application.appliedAt || application.updatedAt
              )}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {application.jobUrl && (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open job posting"
                aria-label={`Open job posting for ${application.jobTitle}`}
                className="jp-icon-button h-8! w-8!"
              >
                <ExternalLink size={15} />
              </a>
            )}

            <button
              type="button"
              onClick={() => onEdit(application)}
              title="Edit application"
              aria-label={`Edit ${application.jobTitle}`}
              className="jp-icon-button h-8! w-8!"
            >
              <Pencil size={15} />
            </button>

            <Link
              to={`/applications/${application.id}`}
              title="View details"
              aria-label={`View ${application.jobTitle}`}
              className="jp-icon-button h-8! w-8!"
            >
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        <label
          htmlFor={`pipeline-status-${application.id}`}
          className="jp-muted mt-4 block text-[11px] font-semibold"
        >
          Move to stage
        </label>

        <select
          id={`pipeline-status-${application.id}`}
          value={application.status}
          disabled={saving}
          onChange={(event) =>
            onMove(
              application,
              event.target.value as ApplicationStatus
            )
          }
          className="jp-input mt-1.5 py-2! text-xs!"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

// --------------------------------------------------
// Kanban column
// --------------------------------------------------

interface ColumnProps {
  stage: Stage;
  applications: Application[];
  saving: boolean;
  draggedId: string | null;
  activeDrop: ApplicationStatus | null;
  onDragStart: CardProps["onDragStart"];
  onDragEnd: () => void;
  onDragEnter: (status: ApplicationStatus) => void;
  onDragLeave: () => void;
  onDrop: (
    event: DragEvent<HTMLElement>,
    status: ApplicationStatus
  ) => void;
  onEdit: CardProps["onEdit"];
  onMove: CardProps["onMove"];
}

function PipelineColumn({
  stage,
  applications,
  saving,
  draggedId,
  activeDrop,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDrop,
  onEdit,
  onMove,
}: ColumnProps) {
  const color = STATUS_COLORS[stage.id];
  const highlighted = activeDrop === stage.id;

  return (
    <section
      id={`stage-${stage.id}`}
      aria-label={`${statusLabel(stage.id)} applications`}
      onDragOver={(event) => {
        if (saving) return;
        if (!event.dataTransfer.types.includes("text/plain")) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragEnter(stage.id);
      }}
      onDragLeave={(event) => {
        const related = event.relatedTarget;

        if (
          related instanceof Node &&
          event.currentTarget.contains(related)
        ) {
          return;
        }

        onDragLeave();
      }}
      onDrop={(event) => onDrop(event, stage.id)}
      className={`flex w-72 shrink-0 snap-start flex-col rounded-2xl border p-3 transition-colors duration-200 ${
        highlighted
          ? "border-blue-500 bg-blue-500/7 ring-2 ring-blue-500/10"
          : "border-[var(--border)] bg-[var(--surface-alt)]/70"
      }`}
    >
      <div className="px-1 pt-1 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 0 4px ${color}18`,
              }}
            />

            <h2 className="text-sm font-extrabold">
              {statusLabel(stage.id)}
            </h2>
          </div>

          <span
            className="rounded-lg px-2.5 py-1 text-xs font-extrabold"
            style={{
              color,
              backgroundColor: `${color}16`,
            }}
          >
            {applications.length}
          </span>
        </div>

        <p className="jp-muted mt-2 min-h-8 text-[11px] leading-4">
          {stage.description}
        </p>
      </div>

      <div
        className="mb-3 h-0.75 rounded-full"
        style={{
          background: `linear-gradient(to right, ${color}, transparent)`,
        }}
      />

      <div className="flex min-h-36 flex-1 flex-col gap-3">
        {applications.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-4 py-6 text-center">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                color,
                backgroundColor: `${color}14`,
              }}
            >
              {highlighted ? (
                <Check size={20} />
              ) : (
                <BriefcaseBusiness size={19} />
              )}
            </div>

            <p className="text-xs font-bold">
              {highlighted
                ? "Drop application here"
                : "Nothing here yet"}
            </p>

            <p className="jp-muted mt-2 text-[11px] leading-4">
              {highlighted
                ? "Release to change its status"
                : "Move an application into this stage"}
            </p>
          </div>
        ) : (
          applications.map((application) => (
            <PipelineCard
              key={application.id}
              application={application}
              saving={saving}
              dragging={draggedId === application.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onEdit={onEdit}
              onMove={onMove}
            />
          ))
        )}

        {highlighted && applications.length > 0 && (
          <div className="rounded-xl border border-dashed border-blue-500/50 bg-blue-500/8 p-5 text-center text-xs font-bold text-blue-500">
            Release to move here
          </div>
        )}
      </div>
    </section>
  );
}

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function PipelinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [dueSoonOnly, setDueSoonOnly] = useState(false);
  const [showClosed, setShowClosed] = useState(true);

  const dragIdRef = useRef<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDrop, setActiveDrop] =
    useState<ApplicationStatus | null>(null);

  const [editing, setEditing] = useState<Application | null>(null);

  const createOpen = params.get("new") === "1";

  function openCreate() {
    const next = new URLSearchParams(params);
    next.set("new", "1");
    setParams(next);
  }

  function closeCreate() {
    const next = new URLSearchParams(params);
    next.delete("new");
    setParams(next, { replace: true });
  }

  const pipelineQuery = useQuery({
    queryKey: ["pipeline-applications"],
    queryFn: fetchAllApplications,
    staleTime: 30_000,
  });

  const applications = useMemo(
    () => pipelineQuery.data ?? [],
    [pipelineQuery.data]
  );

  const companies = useMemo(() => {
    const unique = new Map<string, string>();

    for (const application of applications) {
      unique.set(
        application.companyId,
        application.company.name
      );
    }

    return Array.from(unique, ([id, name]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [applications]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matching = applications.filter((application) => {
      if (
        term &&
        ![
          application.jobTitle,
          application.company.name,
          application.location || "",
          application.description || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }

      if (companyId && application.companyId !== companyId) {
        return false;
      }

      if (jobType && application.jobType !== jobType) {
        return false;
      }

      if (workMode && application.workMode !== workMode) {
        return false;
      }

      if (dueSoonOnly && !isDueSoon(application)) {
        return false;
      }

      return true;
    });

    return matching.sort((a, b) => {
      if (sortMode === "company") {
        return a.company.name.localeCompare(b.company.name);
      }

      if (sortMode === "deadline") {
        const aDate = a.deadline
          ? new Date(a.deadline).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bDate = b.deadline
          ? new Date(b.deadline).getTime()
          : Number.MAX_SAFE_INTEGER;

        return aDate - bDate;
      }

      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();

      return sortMode === "oldest"
        ? aDate - bDate
        : bDate - aDate;
    });
  }, [
    applications,
    search,
    companyId,
    jobType,
    workMode,
    dueSoonOnly,
    sortMode,
  ]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      STATUSES.map((status) => [status, 0])
    ) as Record<ApplicationStatus, number>;

    for (const application of filtered) {
      result[application.status] += 1;
    }

    return result;
  }, [filtered]);

  const activeCount = filtered.filter(
    (application) => !isClosed(application.status)
  ).length;

  const upcomingDeadlines = filtered.filter(isDueSoon).length;

  const hasFilters = Boolean(
    search || companyId || jobType || workMode || dueSoonOnly
  );

  const visibleStages = showClosed
    ? STAGES
    : STAGES.filter((stage) => !isClosed(stage.id));

  function clearFilters() {
    setSearch("");
    setCompanyId("");
    setJobType("");
    setWorkMode("");
    setSortMode("recent");
    setDueSoonOnly(false);
  }

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ApplicationStatus;
    }) => applicationsApi.update(id, { status }),

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pipeline-applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["applications"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-summary"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics-data"],
        }),
      ]);

      toast.success(
        `Application moved to ${statusLabel(variables.status)}`
      );
    },

    onError: (error) => {
      toast.error(error.message);
    },

    onSettled: () => {
      setDraggedId(null);
      setActiveDrop(null);
    },
  });

  function moveApplication(
    application: Application,
    status: ApplicationStatus
  ) {
    if (
      application.status === status ||
      statusMutation.isPending
    ) {
      return;
    }

    statusMutation.mutate({
      id: application.id,
      status,
    });
  }

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    application: Application
  ) {
    if (statusMutation.isPending) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      application.id
    );

    dragIdRef.current = application.id;
    setDraggedId(application.id);
  }

  function handleDragEnd() {
    dragIdRef.current = null;
    setDraggedId(null);
    setActiveDrop(null);
  }

  function handleDrop(
    event: DragEvent<HTMLElement>,
    status: ApplicationStatus
  ) {
    event.preventDefault();

    const id = event.dataTransfer.getData("text/plain") || dragIdRef.current;

    const application = applications.find(
      (item) => item.id === id
    );

    if (application) {
      moveApplication(application, status);
    }

    dragIdRef.current = null;
    setDraggedId(null);
    setActiveDrop(null);
  }

  function jumpToStage(status: ApplicationStatus) {
    if (isClosed(status) && !showClosed) {
      setShowClosed(true);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document
            .getElementById(`stage-${status}`)
            ?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "start",
            });
        });
      });

      return;
    }

    document
      .getElementById(`stage-${status}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
  }

  return (
    <div className="jp-fade-in space-y-7">
      {/* Page heading */}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            Your career, in motion
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your pipeline
            <span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-3 max-w-xl text-sm leading-6">
            Follow every opportunity from your first
            application to your next career milestone.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/applications"
            className="jp-button-secondary"
          >
            <LayoutList size={17} />
            Table view
          </Link>

          <button
            type="button"
            onClick={openCreate}
            className="jp-button"
          >
            <Plus size={17} />
            New application
          </button>
        </div>
      </header>

      {/* Pipeline summary */}

      <section className="jp-card relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-15 h-55 w-55 rounded-full bg-blue-500/8 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Columns3 size={19} className="text-blue-500" />

              <h2 className="text-base font-extrabold">
                Pipeline snapshot
              </h2>
            </div>

            <p className="jp-muted mt-2 text-sm">
              Your opportunities across the hiring process.
            </p>
          </div>

          <button
            type="button"
            disabled={pipelineQuery.isFetching}
            onClick={() => void pipelineQuery.refetch()}
            className="jp-button-secondary"
          >
            <RefreshCw
              size={16}
              className={
                pipelineQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-5 border-t border-[var(--border)] pt-6 sm:grid-cols-4">
          {[
            {
              name: "Total applications",
              value: applications.length,
              color: "#3b82f6",
            },
            {
              name: "Active opportunities",
              value: activeCount,
              color: "#14b8a6",
            },
            {
              name: "Upcoming deadlines",
              value: upcomingDeadlines,
              color: "#f59e0b",
            },
            {
              name: "Accepted",
              value: counts.ACCEPTED,
              color: "#22c55e",
            },
          ].map((metric) => (
            <div key={metric.name}>
              <p className="jp-muted text-xs">
                {metric.name}
              </p>

              <p
                className="mt-2 text-3xl font-extrabold"
                style={{ color: metric.color }}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-[var(--surface-alt)]">
          {filtered.length > 0 &&
            STAGES.map((stage) =>
              counts[stage.id] > 0 ? (
                <div
                  key={stage.id}
                  title={`${statusLabel(stage.id)}: ${counts[stage.id]}`}
                  style={{
                    width: `${
                      (counts[stage.id] / filtered.length) * 100
                    }%`,
                    backgroundColor: STATUS_COLORS[stage.id],
                  }}
                />
              ) : null
            )}
        </div>
      </section>

      {/* Search and filters */}

      <section className="jp-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={18}
              className="text-blue-500"
            />

            <h2 className="text-sm font-extrabold">
              Find your opportunities
            </h2>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline"
            >
              <X size={15} />
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search
              size={17}
              className="jp-muted absolute top-1/2 left-3.5 -translate-y-1/2"
            />

            <input
              type="search"
              aria-label="Search pipeline"
              placeholder="Search jobs, companies, locations..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="jp-input pl-10!"
            />
          </div>

          <select
            aria-label="Filter companies"
            className="jp-input"
            value={companyId}
            onChange={(event) =>
              setCompanyId(event.target.value)
            }
          >
            <option value="">All companies</option>

            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter job type"
            className="jp-input"
            value={jobType}
            onChange={(event) =>
              setJobType(event.target.value as JobType | "")
            }
          >
            <option value="">All job types</option>

            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {statusLabel(type)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter work mode"
            className="jp-input"
            value={workMode}
            onChange={(event) =>
              setWorkMode(event.target.value as WorkMode | "")
            }
          >
            <option value="">All work modes</option>

            {WORK_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {statusLabel(mode)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={dueSoonOnly}
                onChange={(event) =>
                  setDueSoonOnly(event.target.checked)
                }
                className="h-4 w-4 accent-blue-600"
              />
              Due in 7 days
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(event) =>
                  setShowClosed(event.target.checked)
                }
                className="h-4 w-4 accent-blue-600"
              />
              Show closed outcomes
            </label>
          </div>

          <select
            aria-label="Sort pipeline cards"
            value={sortMode}
            onChange={(event) =>
              setSortMode(event.target.value as SortMode)
            }
            className="jp-input w-full sm:w-auto"
          >
            <option value="recent">Recently updated</option>
            <option value="oldest">Oldest updated</option>
            <option value="deadline">Earliest deadline</option>
            <option value="company">Company A-Z</option>
          </select>
        </div>

        <div className="jp-muted mt-4 text-xs">
          Showing {filtered.length} of {applications.length} applications
        </div>
      </section>

      {/* Stage tabs */}

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">
              Hiring stages
            </h2>

            <p className="jp-muted mt-1 text-xs">
              Drag the handle on a card, or use its
              status dropdown to move it.
            </p>
          </div>

          {statusMutation.isPending && (
            <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
              Saving changes...
            </div>
          )}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <button
              type="button"
              key={stage.id}
              onClick={() => jumpToStage(stage.id)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold transition hover:border-blue-500/30 hover:bg-[var(--surface-alt)]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: STATUS_COLORS[stage.id],
                }}
              />

              {statusLabel(stage.id)}

              <span className="jp-muted">
                {counts[stage.id]}
              </span>

              <ChevronRight size={12} />
            </button>
          ))}
        </div>

        {/* Kanban board */}

        {pipelineQuery.isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-90 w-72 shrink-0 animate-pulse rounded-2xl bg-[var(--surface-alt)]"
              />
            ))}
          </div>
        ) : pipelineQuery.isError ? (
          <div className="jp-card py-15 text-center">
            <CircleAlert
              size={30}
              className="mx-auto text-red-500"
            />

            <h3 className="mt-4 text-lg font-bold">
              Couldn't load your pipeline
            </h3>

            <p className="jp-muted mt-2 text-sm">
              Check that the backend is running.
            </p>

            <button
              type="button"
              onClick={() => void pipelineQuery.refetch()}
              className="jp-button mt-5"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="jp-card py-15 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Columns3 size={30} />
            </div>

            <h3 className="mt-5 text-xl font-extrabold">
              Your journey starts here
            </h3>

            <p className="jp-muted mx-auto mt-3 max-w-sm text-sm">
              Add your first application to begin
              tracking opportunities across hiring stages.
            </p>

            <button
              type="button"
              onClick={openCreate}
              className="jp-button mt-6"
            >
              <Plus size={17} />
              Add an application
            </button>
          </div>
        ) : (
          <>
            {filtered.length === 0 && (
              <div className="jp-card mb-5">
                <p className="font-bold">
                  No applications match your filters
                </p>

                <p className="jp-muted mt-2 text-sm">
                  Try another search or clear your filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="jp-button-secondary mt-4"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div
              aria-label="Application Kanban board"
              className="flex snap-x snap-proximity items-stretch gap-4 overflow-x-auto pb-6"
            >
              {visibleStages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  applications={filtered.filter(
                    (application) =>
                      application.status === stage.id
                  )}
                  saving={statusMutation.isPending}
                  draggedId={draggedId}
                  activeDrop={activeDrop}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragEnter={setActiveDrop}
                  onDragLeave={() => setActiveDrop(null)}
                  onDrop={handleDrop}
                  onEdit={setEditing}
                  onMove={moveApplication}
                />
              ))}
            </div>

            <p className="jp-muted mt-2 flex items-center gap-2 text-xs">
              <ArrowRight size={14} />
              Scroll sideways to view all eight stages.
              On mobile, use the card's status dropdown.
            </p>
          </>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
        <p className="jp-muted flex items-center gap-2 text-xs">
          <Sparkles size={16} className="text-blue-500" />
          Every application stays connected to your workspace.
        </p>

        <Link
          to="/applications"
          className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline"
        >
          Manage all applications
          <ArrowRight size={15} />
        </Link>
      </footer>

      {/* Create application */}

      {createOpen && (
        <ApplicationForm
          onClose={closeCreate}
          onSuccess={(id) => {
            closeCreate();

            void queryClient.invalidateQueries({
              queryKey: ["pipeline-applications"],
            });

            navigate(`/applications/${id}`);
          }}
        />
      )}

      {/* Edit application */}

      {editing && (
        <ApplicationForm
          application={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);

            void queryClient.invalidateQueries({
              queryKey: ["pipeline-applications"],
            });
          }}
        />
      )}
    </div>
  );
}
