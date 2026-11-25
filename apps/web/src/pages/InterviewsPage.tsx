import { createPortal } from "react-dom";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  applicationsApi,
  type Application,
} from "../lib/applications";

import {
  fetchAllInterviews,
  INTERVIEW_COLORS,
  INTERVIEW_STATUSES,
  interviewDate,
  interviewTime,
  interviewsApi,
  localDateKey,
  statusLabel,
  toLocalDateTime,
  toUtcDateTime,
  type Interview,
  type InterviewInput,
  type InterviewStatus,
} from "../lib/interviews";

// ============================================
// Shared helpers
// ============================================

async function loadApplications(): Promise<Application[]> {
  const collected: Application[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 1000; page++) {
    const result = await applicationsApi.list({
      page,
      limit: 100,
      search: "",
      status: "",
      companyId: "",
      sortBy: "jobTitle",
      order: "asc",
    });

    for (const item of result.data) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        collected.push(item);
      }
    }

    if (
      result.data.length === 0 ||
      page >= result.meta.totalPages
    ) {
      break;
    }
  }

  return collected;
}

function applicationName(
  interview: Interview,
  applications: Application[]
): string {
  const match = applications.find(
    (item) => item.id === interview.applicationId
  );

  return (
    match?.jobTitle ||
    interview.application?.jobTitle ||
    "Unknown application"
  );
}

function companyName(
  interview: Interview,
  applications: Application[]
): string {
  const match = applications.find(
    (item) => item.id === interview.applicationId
  );

  return (
    match?.company.name ||
    interview.application?.company?.name ||
    "Company unavailable"
  );
}

function monthTitle(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCalendarDays(
  year: number,
  month: number
): Array<Date | null> {
  const start = new Date(year, month, 1);
  const offset = (start.getDay() + 6) % 7;
  const lastDay = new Date(year, month + 1, 0).getDate();

  const total = Math.ceil((offset + lastDay) / 7) * 7;

  return Array.from({ length: total }, (_, index) => {
    const day = index - offset + 1;

    return day > 0 && day <= lastDay
      ? new Date(year, month, day)
      : null;
  });
}

function validWebsite(value: string): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" ||
      url.protocol === "https:";
  } catch {
    return false;
  }
}

function StatusBadge({
  status,
}: {
  status: InterviewStatus;
}) {
  const color = INTERVIEW_COLORS[status];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{
        color,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {statusLabel(status)}
    </span>
  );
}

// ============================================
// Interview form
// ============================================

interface FormProps {
  interview?: Interview;
  applications: Application[];
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

function InterviewForm({
  interview,
  applications,
  defaultDate,
  onClose,
  onSaved,
}: FormProps) {
  const queryClient = useQueryClient();

  const [applicationId, setApplicationId] = useState(
    interview?.applicationId ?? ""
  );

  const [title, setTitle] = useState(
    interview?.title ?? ""
  );

  const [scheduledAt, setScheduledAt] = useState(
    interview
      ? toLocalDateTime(interview.scheduledAt)
      : defaultDate
        ? `${defaultDate}T09:00`
        : ""
  );

  const [durationMin, setDurationMin] = useState(
    interview?.durationMin == null
      ? "30"
      : String(interview.durationMin)
  );

  const [status, setStatus] = useState<InterviewStatus>(
    interview?.status ?? "SCHEDULED"
  );

  const [meetingUrl, setMeetingUrl] = useState(
    interview?.meetingUrl ?? ""
  );

  const [location, setLocation] = useState(
    interview?.location ?? ""
  );

  const [notes, setNotes] = useState(
    interview?.notes ?? ""
  );

  const [outcome, setOutcome] = useState(
    interview?.outcome ?? ""
  );

  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (input: InterviewInput) =>
      interview
        ? interviewsApi.update(interview.id, input)
        : interviewsApi.create(input),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["interviews"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics-data"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-summary"],
        }),
      ]);

      toast.success(
        interview
          ? "Interview updated"
          : "Interview scheduled"
      );

      onSaved();
    },
  });

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!applicationId) {
      setError("Select a job application.");
      return;
    }

    if (!title.trim()) {
      setError("Enter an interview title.");
      return;
    }

    if (!scheduledAt) {
      setError("Select an interview date and time.");
      return;
    }

    if (!validWebsite(meetingUrl.trim())) {
      setError("Enter a valid meeting link.");
      return;
    }

    const duration = durationMin.trim()
      ? Number(durationMin)
      : null;

    if (
      duration !== null &&
      (!Number.isInteger(duration) ||
        duration < 1 ||
        duration > 1440)
    ) {
      setError("Duration must be between 1 and 1440 minutes.");
      return;
    }

    let isoDate: string;

    try {
      isoDate = toUtcDateTime(scheduledAt);
    } catch {
      setError("Enter a valid date and time.");
      return;
    }

    const input: InterviewInput = {
      applicationId,
      title: title.trim(),
      scheduledAt: isoDate,
      durationMin: duration,
      status,
      meetingUrl: meetingUrl.trim() || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
      outcome: outcome.trim() || null,
    };

    try {
      await mutation.mutateAsync(input);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save interview."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/65 px-3 py-5 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-form-title"
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-7">
          <div>
            <p className="jp-eyebrow">
              Interview studio
            </p>

            <h2
              id="interview-form-title"
              className="mt-1 text-xl font-extrabold"
            >
              {interview
                ? "Edit interview"
                : "Schedule an interview"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="jp-icon-button"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </header>

        <form
          id="interview-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"
        >
          <div>
            <label
              htmlFor="interview-application"
              className="mb-2 block text-sm font-semibold"
            >
              Related application *
            </label>

            <select
              id="interview-application"
              required
              value={applicationId}
              onChange={(event) =>
                setApplicationId(event.target.value)
              }
              className="jp-input"
            >
              <option value="">Select an application</option>

              {applications.map((application) => (
                <option
                  key={application.id}
                  value={application.id}
                >
                  {application.jobTitle} - {application.company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="interview-title"
              className="mb-2 block text-sm font-semibold"
            >
              Interview title *
            </label>

            <input
              id="interview-title"
              required
              maxLength={200}
              placeholder="Technical Interview - Round 1"
              className="jp-input"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="interview-date"
                className="mb-2 block text-sm font-semibold"
              >
                Date and time *
              </label>

              <input
                id="interview-date"
                type="datetime-local"
                required
                className="jp-input"
                value={scheduledAt}
                onChange={(event) =>
                  setScheduledAt(event.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="interview-duration"
                className="mb-2 block text-sm font-semibold"
              >
                Duration in minutes
              </label>

              <input
                id="interview-duration"
                type="number"
                min="1"
                max="1440"
                className="jp-input"
                value={durationMin}
                onChange={(event) =>
                  setDurationMin(event.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="interview-status"
              className="mb-2 block text-sm font-semibold"
            >
              Status
            </label>

            <select
              id="interview-status"
              className="jp-input"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as InterviewStatus)
              }
            >
              {INTERVIEW_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="interview-url"
                className="mb-2 block text-sm font-semibold"
              >
                Meeting URL
              </label>

              <input
                id="interview-url"
                type="url"
                placeholder="https://meet.google.com/..."
                className="jp-input"
                value={meetingUrl}
                onChange={(event) =>
                  setMeetingUrl(event.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="interview-location"
                className="mb-2 block text-sm font-semibold"
              >
                Location
              </label>

              <input
                id="interview-location"
                maxLength={200}
                placeholder="Office or online"
                className="jp-input"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="interview-notes"
              className="mb-2 block text-sm font-semibold"
            >
              Preparation notes
            </label>

            <textarea
              id="interview-notes"
              rows={5}
              maxLength={5000}
              placeholder="Topics to revise, questions to ask, company research..."
              className="jp-input resize-y"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />
          </div>

          <div>
            <label
              htmlFor="interview-outcome"
              className="mb-2 block text-sm font-semibold"
            >
              Outcome and feedback
            </label>

            <textarea
              id="interview-outcome"
              rows={3}
              maxLength={3000}
              placeholder="Interview feedback, next steps, outcome..."
              className="jp-input resize-y"
              value={outcome}
              onChange={(event) =>
                setOutcome(event.target.value)
              }
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/10 p-4 text-sm text-red-500"
            >
              {error}
            </div>
          )}
        </form>

        <footer className="flex shrink-0 justify-end gap-3 border-t border-[var(--border)] px-5 py-4 sm:px-7">
          <button
            type="button"
            className="jp-button-secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="interview-form"
            className="jp-button"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Check size={17} />
            )}

            {mutation.isPending
              ? "Saving..."
              : interview
                ? "Save changes"
                : "Schedule interview"}
          </button>
        </footer>
      </section>
    </div>
  );
}

// ============================================
// Interview details drawer
// ============================================

interface DetailsProps {
  interview: Interview;
  applications: Application[];
  saving: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: (status: InterviewStatus) => void;
}

function InterviewDetails({
  interview,
  applications,
  saving,
  onClose,
  onEdit,
  onDelete,
  onStatus,
}: DetailsProps) {
  const company = companyName(interview, applications);
  const job = applicationName(interview, applications);

  return (
    <div className="fixed inset-0 z-70 flex justify-end bg-black/55">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close interview details"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Interview details"
        className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <p className="jp-eyebrow">Interview profile</p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="jp-icon-button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
              <Video size={26} />
            </div>

            <StatusBadge status={interview.status} />

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
              {interview.title}
            </h2>

            <p className="jp-muted mt-3 text-sm">
              {company}
            </p>

            <p className="mt-1 text-sm font-semibold">
              {job}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--surface-alt)] p-5">
            <p className="jp-muted text-xs">
              Scheduled interview
            </p>

            <h3 className="mt-2 text-lg font-extrabold">
              {interviewDate(interview.scheduledAt)}
            </h3>

            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-blue-500">
              <Clock3 size={16} />
              {interviewTime(interview.scheduledAt)}
            </p>

            {interview.durationMin != null && (
              <p className="jp-muted mt-2 text-xs">
                Duration: {interview.durationMin} minutes
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="interview-detail-status"
              className="mb-2 block text-sm font-semibold"
            >
              Update status
            </label>

            <select
              id="interview-detail-status"
              className="jp-input"
              disabled={saving}
              value={interview.status}
              onChange={(event) =>
                onStatus(
                  event.target.value as InterviewStatus
                )
              }
            >
              {INTERVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <section className="space-y-4 rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-extrabold">
              Meeting information
            </h3>

            <div className="flex items-start gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-teal-500"
              />

              <div>
                <p className="jp-muted text-xs">
                  Location
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {interview.location || "Not specified"}
                </p>
              </div>
            </div>

            {interview.meetingUrl && (
              <a
                href={interview.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 hover:underline"
              >
                <ExternalLink size={16} />
                Open meeting link
              </a>
            )}

            <Link
              to={`/applications/${interview.applicationId}`}
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:underline"
            >
              <BriefcaseBusiness size={16} />
              View related application
              <ArrowUpRight size={14} />
            </Link>
          </section>

          <section className="rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2">
              <FileText
                size={18}
                className="text-amber-500"
              />

              <h3 className="font-extrabold">
                Preparation notes
              </h3>
            </div>

            <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-7">
              {interview.notes ||
                "No preparation notes added yet."}
            </p>
          </section>

          <section className="rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-extrabold">
              Outcome and feedback
            </h3>

            <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-7">
              {interview.outcome ||
                "No outcome recorded yet."}
            </p>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={onEdit}
              className="jp-button"
            >
              <Pencil size={16} />
              Edit interview
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="jp-button-secondary"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ============================================
// Agenda card
// ============================================

function AgendaCard({
  interview,
  applications,
  onOpen,
}: {
  interview: Interview;
  applications: Application[];
  onOpen: () => void;
}) {
  const date = new Date(interview.scheduledAt);
  const color = INTERVIEW_COLORS[interview.status];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md"
    >
      <div
        className="flex w-14 shrink-0 flex-col items-center rounded-xl p-3"
        style={{
          color,
          backgroundColor: `${color}14`,
        }}
      >
        <span className="text-xl font-extrabold">
          {date.getDate()}
        </span>

        <span className="text-[10px] font-bold uppercase">
          {new Intl.DateTimeFormat(undefined, {
            month: "short",
          }).format(date)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-extrabold">
            {interview.title}
          </h3>

          <StatusBadge status={interview.status} />
        </div>

        <p className="jp-muted mt-2 text-xs">
          {companyName(interview, applications)}
        </p>

        <p className="mt-1 truncate text-xs font-semibold">
          {applicationName(interview, applications)}
        </p>

        <div className="jp-muted mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Clock3 size={13} />
            {interviewTime(interview.scheduledAt)}
          </span>

          {interview.durationMin != null && (
            <span>
              {interview.durationMin} min
            </span>
          )}

          {interview.location && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {interview.location}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        size={18}
        className="jp-muted mt-1 shrink-0 transition-transform group-hover:translate-x-1"
      />
    </button>
  );
}

// ============================================
// Main page
// ============================================

type ViewMode = "calendar" | "agenda";
type StatusFilter = "ALL" | InterviewStatus;

export default function InterviewsPage() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<ViewMode>("calendar");

  const [month, setMonth] = useState(
    () => new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
  );

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] =
    useState<Interview | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Interview | null>(null);

  const interviewsQuery = useQuery({
    queryKey: ["interviews"],
    queryFn: fetchAllInterviews,
    staleTime: 30_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["interview-applications"],
    queryFn: loadApplications,
    staleTime: 60_000,
  });

  const interviews = useMemo(
    () => interviewsQuery.data ?? [],
    [interviewsQuery.data]
  );

  const applications = useMemo(
    () => applicationsQuery.data ?? [],
    [applicationsQuery.data]
  );

  const selectedInterview =
    interviews.find((item) => item.id === selectedId) ??
    null;

  const upcoming = useMemo(
    () => interviews
      .filter(
        (item) =>
          item.status === "SCHEDULED" &&
          new Date(item.scheduledAt).getTime() >= Date.now()
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime()
      ),
    [interviews]
  );

  const completed = interviews.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const cancelled = interviews.filter(
    (item) => item.status === "CANCELLED"
  ).length;

  const nextInterview = upcoming[0] ?? null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return interviews.filter((item) => {
      if (
        statusFilter !== "ALL" &&
        item.status !== statusFilter
      ) {
        return false;
      }

      if (
        selectedDate &&
        localDateKey(item.scheduledAt) !== selectedDate
      ) {
        return false;
      }

      if (!term) return true;

      return [
        item.title,
        item.location ?? "",
        item.notes ?? "",
        companyName(item, applications),
        applicationName(item, applications),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [
    interviews,
    applications,
    search,
    statusFilter,
    selectedDate,
  ]);

  const calendarDays = useMemo(
    () => getCalendarDays(
      month.getFullYear(),
      month.getMonth()
    ),
    [month]
  );

  const eventsByDate = useMemo(() => {
    const result = new Map<string, Interview[]>();

    for (const interview of interviews) {
      const key = localDateKey(interview.scheduledAt);
      const events = result.get(key) ?? [];

      events.push(interview);
      result.set(key, events);
    }

    return result;
  }, [interviews]);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: InterviewStatus;
    }) => interviewsApi.update(id, { status }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["interviews"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics-data"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-summary"],
        }),
      ]);

      toast.success("Interview status updated");
    },

    onError: (error) =>
      toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewsApi.remove(id),

    onSuccess: async () => {
      setDeleteTarget(null);
      setSelectedId(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["interviews"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics-data"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-summary"],
        }),
      ]);

      toast.success("Interview deleted");
    },

    onError: (error) =>
      toast.error(error.message),
  });

  function shiftMonth(amount: number) {
    setMonth(
      (previous) => new Date(
        previous.getFullYear(),
        previous.getMonth() + amount,
        1
      )
    );

    setSelectedDate(null);
  }

  function goToToday() {
    const today = new Date();

    setMonth(new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ));

    setSelectedDate(localDateKey(today));
  }

  function openCreate() {
    if (applicationsQuery.isLoading) {
      toast.info("Applications are still loading.");
      return;
    }

    if (applications.length === 0) {
      toast.info(
        "Create a job application before scheduling an interview."
      );
      return;
    }

    setCreateOpen(true);
  }

  const today = localDateKey(new Date());

  return (
    <div className="jp-fade-in space-y-7">
      {/* Heading */}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            Interview studio
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Interviews
            <span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-3 max-w-xl text-sm leading-6">
            A thoughtful space for every conversation,
            assessment and next step.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="jp-button"
        >
          <CalendarPlus size={18} />
          Schedule interview
        </button>
      </header>

      {/* Hero */}

      <section className="relative overflow-hidden rounded-3xl bg-[#151624] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-25 -right-18 h-70 w-70 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-30 right-30 h-60 w-60 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-violet-300 uppercase">
              <Video size={16} />
              Coming up next
            </div>

            {nextInterview ? (
              <>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {nextInterview.title}
                </h2>

                <p className="mt-3 text-sm text-slate-300">
                  {companyName(nextInterview, applications)}
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {applicationName(nextInterview, applications)}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    {interviewDate(nextInterview.scheduledAt)}
                  </span>

                  <span className="flex items-center gap-2">
                    <Clock3 size={16} />
                    {interviewTime(nextInterview.scheduledAt)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedId(nextInterview.id)
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#151624] transition hover:bg-blue-100"
                >
                  View interview
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Make your next conversation count.
                </h2>

                <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
                  You have no upcoming scheduled interviews.
                  Add one to start preparing.
                </p>

                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#151624]"
                >
                  <Plus size={16} />
                  Add an interview
                </button>
              </>
            )}
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-violet-300">
            <CalendarCheck2 size={30} />
          </div>
        </div>
      </section>

      {/* Summary */}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            name: "Upcoming",
            value: upcoming.length,
            color: "#3b82f6",
            icon: CalendarClock,
          },
          {
            name: "Completed",
            value: completed,
            color: "#10b981",
            icon: CheckCircle2,
          },
          {
            name: "Cancelled",
            value: cancelled,
            color: "#f87171",
            icon: X,
          },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.name}
              className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  color: metric.color,
                  backgroundColor: `${metric.color}15`,
                }}
              >
                <Icon size={22} />
              </div>

              <div>
                <p className="jp-muted text-xs">
                  {metric.name}
                </p>

                <p className="mt-1 text-2xl font-extrabold">
                  {metric.value}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Controls */}

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              view === "calendar"
                ? "bg-blue-500/10 text-blue-500"
                : "jp-muted"
            }`}
          >
            <CalendarDays size={17} />
            Calendar
          </button>

          <button
            type="button"
            onClick={() => setView("agenda")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              view === "agenda"
                ? "bg-blue-500/10 text-blue-500"
                : "jp-muted"
            }`}
          >
            <BriefcaseBusiness size={17} />
            Agenda
          </button>
        </div>

        <button
          type="button"
          onClick={() => void interviewsQuery.refetch()}
          disabled={interviewsQuery.isFetching}
          className="jp-button-secondary"
        >
          <RefreshCw
            size={16}
            className={
              interviewsQuery.isFetching
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </section>

      {/* Search */}

      <section className="grid gap-3 sm:grid-cols-[1fr_190px]">
        <div className="relative">
          <Search
            size={17}
            className="jp-muted absolute top-1/2 left-4 -translate-y-1/2"
          />

          <input
            type="search"
            aria-label="Search interviews"
            placeholder="Search interviews, companies or job titles..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="jp-input pl-11!"
          />
        </div>

        <select
          aria-label="Filter interview status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as StatusFilter
            )
          }
          className="jp-input"
        >
          <option value="ALL">All statuses</option>

          {INTERVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </section>

      {/* Calendar */}

      {view === "calendar" && (
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-7">
            <div>
              <p className="jp-eyebrow">
                Monthly overview
              </p>

              <h2 className="mt-2 text-xl font-extrabold">
                {monthTitle(month)}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="jp-button-secondary"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="jp-icon-button"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="jp-icon-button"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-7 bg-[var(--surface-alt)]">
            {[
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
              "Sun",
            ].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-[11px] font-bold text-[var(--muted)]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`blank-${index}`}
                    className="min-h-20 border-r border-b border-[var(--border)] bg-[var(--surface-alt)]/40 sm:min-h-27"
                  />
                );
              }

              const key = localDateKey(date);
              const events = eventsByDate.get(key) ?? [];
              const isToday = key === today;
              const isSelected = key === selectedDate;

              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`${key}: ${events.length} interviews`}
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelectedDate(
                      isSelected ? null : key
                    )
                  }
                  className={`flex min-h-20 flex-col items-start gap-2 border-r border-b border-[var(--border)] p-2 text-left transition hover:bg-blue-500/5 sm:min-h-27 sm:p-3 ${
                    isSelected
                      ? "bg-blue-500/10"
                      : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  <div className="flex flex-wrap gap-1">
                    {events.slice(0, 4).map((event) => (
                      <span
                        key={event.id}
                        title={event.title}
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            INTERVIEW_COLORS[event.status],
                        }}
                      />
                    ))}
                  </div>

                  {events.length > 0 && (
                    <span className="jp-muted text-[10px]">
                      {events.length} event
                      {events.length === 1 ? "" : "s"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Selected date */}

      {selectedDate && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/7 p-4">
          <div>
            <p className="text-sm font-bold">
              {interviewDate(
                `${selectedDate}T12:00:00`
              )}
            </p>

            <p className="jp-muted mt-1 text-xs">
              Showing interviews for the selected day.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="text-xs font-bold text-blue-500 hover:underline"
          >
            Clear date filter
          </button>
        </section>
      )}

      {/* Agenda */}

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">
              {selectedDate
                ? "Selected day"
                : "Interview agenda"}
            </h2>

            <p className="jp-muted mt-1 text-xs">
              {filtered.length} matching interview
              {filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {view === "calendar" && (
            <button
              type="button"
              onClick={() => setView("agenda")}
              className="text-xs font-bold text-blue-500 hover:underline"
            >
              Full agenda
            </button>
          )}
        </div>

        {interviewsQuery.isLoading ||
        applicationsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className="h-28 animate-pulse rounded-2xl bg-[var(--surface-alt)]"
              />
            ))}
          </div>
        ) : interviewsQuery.isError ||
          applicationsQuery.isError ? (
          <div className="jp-card py-14 text-center">
            <h3 className="font-extrabold">
              Unable to load interview information
            </h3>

            <p className="jp-muted mt-2 text-sm">
              Check your backend connection.
            </p>

            <button
              type="button"
              onClick={() => {
                void interviewsQuery.refetch();
                void applicationsQuery.refetch();
              }}
              className="jp-button mt-5"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="jp-card py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
              <CalendarDays size={28} />
            </div>

            <h3 className="mt-5 text-lg font-extrabold">
              {interviews.length === 0
                ? "Your calendar is ready"
                : "No interviews match"}
            </h3>

            <p className="jp-muted mx-auto mt-2 max-w-sm text-sm leading-6">
              {interviews.length === 0
                ? "Schedule an interview to start organizing your preparation."
                : "Try clearing the date filter or changing your search."}
            </p>

            {interviews.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="jp-button mt-5"
              >
                <Plus size={16} />
                Schedule interview
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((interview) => (
              <AgendaCard
                key={interview.id}
                interview={interview}
                applications={applications}
                onOpen={() =>
                  setSelectedId(interview.id)
                }
              />
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
        <p className="jp-muted text-xs">
          Interview times are displayed in your local timezone.
        </p>

        <Link
          to="/applications"
          className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline"
        >
          View applications
          <ArrowRight size={15} />
        </Link>
      </footer>

      {/* Details drawer */}

      {selectedInterview &&
  createPortal(
    <InterviewDetails
      interview={selectedInterview}
      applications={applications}
      saving={statusMutation.isPending}
      onClose={() => setSelectedId(null)}
      onEdit={() => setEditing(selectedInterview)}
      onDelete={() => setDeleteTarget(selectedInterview)}
      onStatus={(status) => {
        if (status !== selectedInterview.status) {
          statusMutation.mutate({
            id: selectedInterview.id,
            status,
          });
        }
      }}
    />,
    document.body
  )}
      {/* Create */}

      {createOpen && (
        <InterviewForm
          applications={applications}
          defaultDate={selectedDate ?? undefined}
          onClose={() => setCreateOpen(false)}
          onSaved={() => setCreateOpen(false)}
        />
      )}

      {/* Edit */}

      {editing && (
        <InterviewForm
          key={editing.id}
          interview={editing}
          applications={applications}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {/* Delete confirmation */}

      {deleteTarget && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-interview-title"
            className="jp-card w-full max-w-md"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-interview-title"
              className="text-xl font-extrabold"
            >
              Delete interview?
            </h2>

            <p className="jp-muted mt-3 text-sm leading-6">
              This permanently deletes{" "}
              <strong className="text-[var(--foreground)]">
                {deleteTarget.title}
              </strong>
              {" "}including its saved notes and outcome.
              The related application will remain.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
                className="jp-button-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(deleteTarget.id)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
