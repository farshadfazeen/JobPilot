
import {
  useEffect,
  useState,
  type FormEvent,
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
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  ExternalLink,
  FilterX,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import ApplicationForm from "../components/applications/ApplicationForm";
import {
  applicationsApi,
  companiesApi,
  formatDate,
  STATUSES,
  STATUS_COLORS,
  statusLabel,
  type Application,
  type ApplicationFilters,
  type ApplicationStatus,
} from "../lib/applications";

function StatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const color = STATUS_COLORS[status];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
      style={{
        color,
        backgroundColor: `${color}15`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {statusLabel(status)}
    </span>
  );
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(
    params.get("search") || ""
  );
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);

  const createOpen = params.get("new") === "1";

  const pageParam = Number(params.get("page"));
  const page =
    Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

  const sortByValue = params.get("sortBy");

  const sortBy: ApplicationFilters["sortBy"] =
    sortByValue === "jobTitle" ||
    sortByValue === "deadline" ||
    sortByValue === "updatedAt"
      ? sortByValue
      : "createdAt";

  const filters: ApplicationFilters = {
    page,
    limit: 10,
    search: params.get("search") || "",
    status: params.get("status") || "",
    companyId: params.get("companyId") || "",
    sortBy,
    order: params.get("order") === "asc" ? "asc" : "desc",
  };

  useEffect(() => {
    setSearchInput(params.get("search") || "");
  }, [params]);

  function updateParams(
    changes: Record<string, string | null>,
    resetPage = true
  ) {
    const next = new URLSearchParams(params);

    for (const [key, value] of Object.entries(changes)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (resetPage) {
      next.delete("page");
    }

    setParams(next);
  }

  function openCreate() {
    updateParams({ new: "1" }, false);
  }

  function closeCreate() {
    updateParams({ new: null }, false);
  }

  function clearFilters() {
    setSearchInput("");

    updateParams({
      search: null,
      status: null,
      companyId: null,
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateParams({
      search: searchInput.trim() || null,
    });
  }

  const applicationsQuery = useQuery({
    queryKey: ["applications", filters],
    queryFn: () => applicationsApi.list(filters),
    placeholderData: (previous) => previous,
  });

  const companiesQuery = useQuery({
    queryKey: ["companies", "filters"],
    queryFn: () => companiesApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.remove(id),

    onSuccess: async () => {
      setDeleting(null);

      await Promise.all([
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

      toast.success("Application deleted");

      if (
        applicationsQuery.data?.data.length === 1 &&
        page > 1
      ) {
        updateParams({ page: String(page - 1) }, false);
      }
    },

    onError: (err) => toast.error(err.message),
  });

  const items = applicationsQuery.data?.data || [];
  const meta = applicationsQuery.data?.meta;

  const hasFilters = Boolean(
    filters.search || filters.status || filters.companyId
  );

  return (
    <div className="jp-fade-in space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            Your career workspace
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Applications<span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-2 text-sm">
            All your opportunities, organized in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/pipeline"
            className="jp-button-secondary"
          >
            View pipeline
            <ArrowRight size={16} />
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

      <section className="jp-card overflow-hidden p-0!">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <h2 className="text-sm font-extrabold">
                Application directory
              </h2>

              <p className="jp-muted mt-1 text-xs">
                {meta
                  ? `${meta.total} matching applications`
                  : "Your tracked opportunities"}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={applicationsQuery.isFetching}
            onClick={() => void applicationsQuery.refetch()}
            className="jp-button-secondary"
          >
            <RefreshCw
              size={16}
              className={
                applicationsQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 border-b border-[var(--border)] p-5 md:grid-cols-2 xl:grid-cols-4 sm:p-6">
          <form
            onSubmit={handleSearch}
            className="flex gap-2 xl:col-span-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="jp-muted absolute top-1/2 left-3.5 -translate-y-1/2"
              />

              <input
                type="search"
                aria-label="Search applications"
                placeholder="Search job titles or companies"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                className="jp-input pl-10!"
              />
            </div>

            <button
              type="submit"
              className="jp-button-secondary"
            >
              Search
            </button>
          </form>

          <select
            aria-label="Filter by status"
            className="jp-input"
            value={filters.status}
            onChange={(event) =>
              updateParams({
                status: event.target.value || null,
              })
            }
          >
            <option value="">All statuses</option>

            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort applications"
            className="jp-input"
            value={`${filters.sortBy}:${filters.order}`}
            onChange={(event) => {
              const [nextSort, nextOrder] =
                event.target.value.split(":");

              updateParams({
                sortBy: nextSort,
                order: nextOrder,
              });
            }}
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="updatedAt:desc">Recently updated</option>
            <option value="deadline:asc">Deadline first</option>
            <option value="jobTitle:asc">Job title A-Z</option>
            <option value="jobTitle:desc">Job title Z-A</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3 sm:px-6">
          <select
            aria-label="Filter by company"
            className="jp-input max-w-70"
            value={filters.companyId}
            onChange={(event) =>
              updateParams({
                companyId: event.target.value || null,
              })
            }
          >
            <option value="">All companies</option>

            {companiesQuery.data?.data.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-xs font-semibold text-blue-500"
            >
              <FilterX size={15} />
              Clear filters
            </button>
          )}
        </div>

        {applicationsQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-17 animate-pulse rounded-xl bg-[var(--surface-alt)]"
              />
            ))}
          </div>
        ) : applicationsQuery.isError ? (
          <div className="py-15 text-center">
            <p className="font-bold">
              Could not load applications
            </p>

            <p className="jp-muted mt-2 text-sm">
              Check the backend and try again.
            </p>

            <button
              type="button"
              onClick={() => void applicationsQuery.refetch()}
              className="jp-button mt-5"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <BriefcaseBusiness size={30} />
            </div>

            <h3 className="mt-5 text-lg font-extrabold">
              {hasFilters
                ? "No matching applications"
                : "Your next opportunity starts here"}
            </h3>

            <p className="jp-muted mx-auto mt-2 max-w-sm text-sm leading-6">
              {hasFilters
                ? "Try changing or clearing your filters."
                : "Create your first application to start tracking your opportunities."}
            </p>

            <button
              type="button"
              className="jp-button mt-6"
              onClick={hasFilters ? clearFilters : openCreate}
            >
              {hasFilters ? "Clear filters" : "Add application"}
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-195 text-left">
                <thead className="bg-[var(--surface-alt)] text-[11px] tracking-wider text-[var(--muted)] uppercase">
                  <tr>
                    <th className="px-5 py-4">Job / Company</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Applied</th>
                    <th className="px-4 py-4">Deadline</th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((application) => (
                    <tr
                      key={application.id}
                      className="transition hover:bg-[var(--surface-alt)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 font-extrabold text-blue-500">
                            {application.company.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <Link
                              to={`/applications/${application.id}`}
                              className="block max-w-65 truncate text-sm font-bold hover:text-blue-500"
                            >
                              {application.jobTitle}
                            </Link>

                            <p className="jp-muted mt-1 flex items-center gap-1 text-xs">
                              <Building2 size={12} />
                              {application.company.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={application.status} />
                      </td>

                      <td className="jp-muted px-4 py-4 text-xs">
                        {application.jobType
                          ? statusLabel(application.jobType)
                          : "â€”"}
                      </td>

                      <td className="jp-muted px-4 py-4 text-xs">
                        {application.location || "â€”"}
                      </td>

                      <td className="jp-muted px-4 py-4 text-xs whitespace-nowrap">
                        {formatDate(application.appliedAt)}
                      </td>

                      <td className="jp-muted px-4 py-4 text-xs whitespace-nowrap">
                        {formatDate(application.deadline)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          {application.jobUrl && (
                            <a
                              href={application.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open job posting"
                              aria-label="Open job posting"
                              className="jp-icon-button"
                            >
                              <ExternalLink size={17} />
                            </a>
                          )}

                          <button
                            type="button"
                            title="Edit application"
                            aria-label="Edit application"
                            onClick={() => setEditing(application)}
                            className="jp-icon-button"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete application"
                            aria-label="Delete application"
                            onClick={() => setDeleting(application)}
                            className="jp-icon-button hover:text-red-500!"
                          >
                            <Trash2 size={17} />
                          </button>

                          <Link
                            to={`/applications/${application.id}`}
                            title="View application details"
                            aria-label="View application details"
                            className="jp-icon-button"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] p-5">
              <p className="jp-muted text-xs">
                Page {meta?.page ?? 1} of{" "}
                {Math.max(meta?.totalPages ?? 1, 1)}
                {" Â· "}
                {meta?.total ?? 0} results
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    updateParams(
                      { page: String(page - 1) },
                      false
                    )
                  }
                  className="jp-button-secondary"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= (meta?.totalPages ?? 1)}
                  onClick={() =>
                    updateParams(
                      { page: String(page + 1) },
                      false
                    )
                  }
                  className="jp-button-secondary"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {createOpen && (
        <ApplicationForm
          onClose={closeCreate}
          onSuccess={(id) => {
            closeCreate();
            navigate(`/applications/${id}`);
          }}
        />
      )}

      {editing && (
        <ApplicationForm
          application={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            className="jp-card w-full max-w-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-application-title"
              className="text-xl font-extrabold"
            >
              Delete application?
            </h2>

            <p className="jp-muted mt-3 text-sm leading-6">
              This will permanently delete{" "}
              <strong className="text-[var(--foreground)]">
                {deleting.jobTitle}
              </strong>
              , including its notes, interviews and status history.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleting(null)}
                className="jp-button-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(deleting.id)
                }
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
