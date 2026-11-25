
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Save,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import ApplicationForm from "../components/applications/ApplicationForm";
import {
  applicationsApi,
  formatDate,
  formatSalary,
  notesApi,
  STATUSES,
  STATUS_COLORS,
  statusLabel,
  type Application,
  type ApplicationStatus,
  type Note,
} from "../lib/applications";

type Tab = "overview" | "notes" | "history" | "interviews";

function Information({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof BriefcaseBusiness;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-blue-500">
        <Icon size={18} />
      </div>

      <div>
        <p className="jp-muted text-xs">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Overview({
  application,
}: {
  application: Application;
}) {
  return (
    <div className="space-y-5">
      <section className="jp-card">
        <h2 className="text-lg font-extrabold">
          Opportunity details
        </h2>

        <p className="jp-muted mt-1 text-sm">
          Important information about this application.
        </p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <Information
            label="Company"
            value={application.company.name}
            icon={Building2}
          />

          <Information
            label="Job type"
            value={
              application.jobType
                ? statusLabel(application.jobType)
                : "Not specified"
            }
            icon={BriefcaseBusiness}
          />

          <Information
            label="Work mode"
            value={
              application.workMode
                ? statusLabel(application.workMode)
                : "Not specified"
            }
            icon={Globe}
          />

          <Information
            label="Location"
            value={application.location || "Not specified"}
            icon={MapPin}
          />

          <Information
            label="Applied date"
            value={formatDate(application.appliedAt)}
            icon={CalendarDays}
          />

          <Information
            label="Deadline"
            value={formatDate(application.deadline)}
            icon={CalendarDays}
          />

          <Information
            label="Salary range"
            value={formatSalary(application)}
            icon={BriefcaseBusiness}
          />

          <Information
            label="Last updated"
            value={formatDate(application.updatedAt)}
            icon={CalendarDays}
          />
        </div>
      </section>

      <section className="jp-card">
        <h2 className="text-lg font-extrabold">
          Job description
        </h2>

        <div className="mt-5">
          {application.description ? (
            <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">
              {application.description}
            </p>
          ) : (
            <div className="rounded-xl bg-[var(--surface-alt)] p-8 text-center">
              <FileText
                size={27}
                className="mx-auto text-blue-500"
              />

              <p className="mt-3 font-semibold">
                No description saved
              </p>

              <p className="jp-muted mt-2 text-sm">
                Edit the application to add requirements.
              </p>
            </div>
          )}
        </div>
      </section>

      {application.jobUrl && (
        <a
          href={application.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="jp-button-secondary"
        >
          <ExternalLink size={17} />
          Open job posting
        </a>
      )}
    </div>
  );
}

function NotesSection({
  application,
}: {
  application: Application;
}) {
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const notes = application.notes ?? [];

  async function refreshNotes() {
    await queryClient.invalidateQueries({
      queryKey: ["application", application.id],
    });
  }

  const createMutation = useMutation({
    mutationFn: () =>
      notesApi.create(application.id, newNote.trim()),

    onSuccess: async () => {
      setNewNote("");
      await refreshNotes();
      toast.success("Note added");
    },

    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("No note selected");

      return notesApi.update(editingId, editText.trim());
    },

    onSuccess: async () => {
      setEditingId(null);
      setEditText("");
      await refreshNotes();
      toast.success("Note updated");
    },

    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notesApi.remove(id),

    onSuccess: async () => {
      setDeleteTarget(null);
      await refreshNotes();
      toast.success("Note deleted");
    },

    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="jp-card">
      <h2 className="text-lg font-extrabold">
        Application notes
      </h2>

      <p className="jp-muted mt-2 text-sm">
        Keep important research, reminders and follow-ups.
      </p>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();

          if (newNote.trim()) {
            createMutation.mutate();
          }
        }}
      >
        <textarea
          aria-label="New application note"
          rows={4}
          maxLength={5000}
          className="jp-input resize-y"
          placeholder="Write an important note..."
          value={newNote}
          onChange={(event) => setNewNote(event.target.value)}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="jp-muted text-xs">
            {newNote.length} / 5000
          </span>

          <button
            type="submit"
            disabled={
              createMutation.isPending || !newNote.trim()
            }
            className="jp-button"
          >
            <Plus size={16} />
            Add note
          </button>
        </div>
      </form>

      <div className="mt-7 space-y-3 border-t border-[var(--border)] pt-6">
        <h3 className="text-sm font-bold">
          Saved notes ({notes.length})
        </h3>

        {notes.length === 0 && (
          <div className="rounded-xl bg-[var(--surface-alt)] p-8 text-center">
            <StickyNote
              size={28}
              className="mx-auto text-blue-500"
            />

            <p className="jp-muted mt-3 text-sm">
              No notes yet. Add your first note above.
            </p>
          </div>
        )}

        {notes.map((note) => (
          <article
            key={note.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5"
          >
            {editingId === note.id ? (
              <>
                <textarea
                  aria-label="Edit note"
                  rows={4}
                  maxLength={5000}
                  className="jp-input"
                  value={editText}
                  onChange={(event) =>
                    setEditText(event.target.value)
                  }
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    className="jp-button-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      updateMutation.isPending || !editText.trim()
                    }
                    onClick={() => updateMutation.mutate()}
                    className="jp-button"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">
                  {note.content}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                  <p className="jp-muted text-xs">
                    {formatDate(note.updatedAt)}
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditText(note.content);
                      }}
                      className="jp-muted flex items-center gap-1 text-xs hover:text-blue-500"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(note)}
                      className="jp-muted flex items-center gap-1 text-xs hover:text-red-500"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </article>
        ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            className="jp-card w-full max-w-sm"
          >
            <h3
              id="delete-note-title"
              className="text-lg font-bold"
            >
              Delete this note?
            </h3>

            <p className="jp-muted mt-2 text-sm">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
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
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HistorySection({
  application,
}: {
  application: Application;
}) {
  const history = application.statusHistory ?? [];

  return (
    <section className="jp-card">
      <h2 className="text-lg font-extrabold">
        Status history
      </h2>

      <p className="jp-muted mt-2 text-sm">
        The recorded journey of this application.
      </p>

      {history.length === 0 ? (
        <p className="jp-muted mt-8 text-sm">
          No status changes recorded yet.
        </p>
      ) : (
        <div className="mt-7 space-y-6">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4"
            >
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: STATUS_COLORS[item.toStatus],
                }}
              />

              <div>
                <h3 className="text-sm font-bold">
                  {statusLabel(item.toStatus)}
                </h3>

                {item.fromStatus && (
                  <p className="jp-muted mt-1 text-xs">
                    From {statusLabel(item.fromStatus)}
                  </p>
                )}

                {item.reason && (
                  <p className="jp-muted mt-2 text-sm">
                    {item.reason}
                  </p>
                )}

                <p className="jp-muted mt-2 text-xs">
                  {formatDate(item.changedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InterviewsSection({
  application,
}: {
  application: Application;
}) {
  const interviews = application.interviews ?? [];

  return (
    <section className="jp-card">
      <h2 className="text-lg font-extrabold">
        Related interviews
      </h2>

      <p className="jp-muted mt-2 text-sm">
        Interviews linked to this application.
      </p>

      {interviews.length === 0 ? (
        <div className="mt-6 rounded-xl bg-[var(--surface-alt)] p-8 text-center">
          <CalendarDays
            size={29}
            className="mx-auto text-violet-500"
          />

          <p className="mt-4 font-bold">
            No interviews scheduled
          </p>

          <p className="jp-muted mt-2 text-sm">
            Interview scheduling is managed in the Interviews section.
          </p>

          <Link
            to="/interviews"
            className="jp-button-secondary mt-5"
          >
            View Interviews
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="rounded-xl border border-[var(--border)] p-5"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-bold">{interview.title}</h3>

                  <p className="jp-muted mt-2 text-sm">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(interview.scheduledAt))}
                  </p>
                </div>

                <span className="h-fit rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-500">
                  {statusLabel(interview.status)}
                </span>
              </div>

              {interview.location && (
                <p className="jp-muted mt-3 text-sm">
                  Location: {interview.location}
                </p>
              )}

              {interview.meetingUrl && (
                <a
                  href={interview.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-500"
                >
                  <ExternalLink size={15} />
                  Meeting link
                </a>
              )}

              {interview.notes && (
                <p className="jp-muted mt-3 whitespace-pre-wrap text-sm">
                  {interview.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const applicationQuery = useQuery({
    queryKey: ["application", id],
    queryFn: () => applicationsApi.get(id!),
    enabled: Boolean(id),
  });

  const application = applicationQuery.data?.data;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["application", id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["applications"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["pipeline-applications"],
      }),
    ]);
  }

  const statusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      applicationsApi.update(id!, { status }),

    onSuccess: async () => {
      await refresh();
      toast.success("Application status updated");
    },

    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => applicationsApi.remove(id!),

    onSuccess: async () => {
      await refresh();
      toast.success("Application deleted");
      navigate("/applications", { replace: true });
    },

    onError: (error) => toast.error(error.message),
  });

  if (applicationQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-45 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
        <div className="h-75 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
      </div>
    );
  }

  if (applicationQuery.isError || !application) {
    return (
      <section className="jp-card py-15 text-center">
        <h2 className="text-xl font-extrabold">
          Application not available
        </h2>

        <p className="jp-muted mt-2 text-sm">
          It may have been deleted or isn't accessible.
        </p>

        <Link
          to="/applications"
          className="jp-button mt-5"
        >
          <ArrowLeft size={16} />
          Back to applications
        </Link>
      </section>
    );
  }

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: "overview", label: "Overview" },
    { value: "notes", label: `Notes (${application.notes?.length ?? 0})` },
    { value: "history", label: "Status history" },
    { value: "interviews", label: `Interviews (${application.interviews?.length ?? 0})` },
  ];

  return (
    <div className="jp-fade-in space-y-6">
      <Link
        to="/applications"
        className="jp-muted inline-flex items-center gap-2 text-sm font-semibold hover:text-blue-500"
      >
        <ArrowLeft size={17} />
        All applications
      </Link>

      <header className="jp-card overflow-hidden p-0!">
        <div className="h-1.5 bg-linear-to-r from-blue-600 via-violet-500 to-teal-400" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl font-extrabold text-blue-500">
              {application.company.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="jp-eyebrow">
                Opportunity details
              </p>

              <h1 className="mt-2 wrap-break-word text-2xl font-extrabold tracking-tight sm:text-3xl">
                {application.jobTitle}
              </h1>

              <p className="jp-muted mt-2 flex items-center gap-2 text-sm">
                <Building2 size={16} />
                {application.company.name}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="jp-button-secondary"
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="jp-button-secondary hover:text-red-500!"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-end gap-4 border-t border-[var(--border)] pt-5">
            <div>
              <label
                htmlFor="app-detail-status"
                className="jp-muted mb-2 block text-xs font-semibold"
              >
                Current status
              </label>

              <select
                id="app-detail-status"
                className="jp-input min-w-42"
                value={application.status}
                disabled={statusMutation.isPending}
                onChange={(event) =>
                  statusMutation.mutate(
                    event.target.value as ApplicationStatus
                  )
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pb-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: STATUS_COLORS[application.status],
                }}
              />

              <span className="jp-muted text-xs">
                {statusMutation.isPending
                  ? "Updating..."
                  : statusLabel(application.status)}
              </span>
            </div>

            {application.jobUrl && (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="jp-button-secondary"
              >
                <ExternalLink size={16} />
                Job posting
              </a>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Application sections"
        className="flex gap-1 overflow-x-auto border-b border-[var(--border)]"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === tab.value
                ? "border-blue-500 text-blue-500"
                : "jp-muted border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <Overview application={application} />
      )}

      {activeTab === "notes" && (
        <NotesSection application={application} />
      )}

      {activeTab === "history" && (
        <HistorySection application={application} />
      )}

      {activeTab === "interviews" && (
        <InterviewsSection application={application} />
      )}

      {editOpen && (
        <ApplicationForm
          application={application}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            void refresh();
          }}
        />
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="jp-card w-full max-w-md"
          >
            <h2
              id="confirm-delete-title"
              className="text-xl font-extrabold"
            >
              Delete application?
            </h2>

            <p className="jp-muted mt-3 text-sm leading-6">
              This permanently removes the application,
              notes, interviews and status history.
              This cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteOpen(false)}
                className="jp-button-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
