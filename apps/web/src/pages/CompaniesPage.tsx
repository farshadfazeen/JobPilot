
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
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  companyColor,
  companyInitials,
  companyService,
  type CompanyInput,
  type CompanyRecord,
} from "../lib/companies";
import {
  formatDate,
  STATUS_COLORS,
  statusLabel,
} from "../lib/applications";

type FormMode = "create" | "edit";

function CompanyAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const color = companyColor(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl font-extrabold ${
        large
          ? "h-17 w-17 text-xl"
          : "h-13 w-13 text-base"
      }`}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}28`,
      }}
    >
      {companyInitials(name)}
    </div>
  );
}

function CompanyCard({
  company,
  onOpen,
  onEdit,
}: {
  company: CompanyRecord;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const color = companyColor(company.name);

  return (
    <article className="group relative flex min-h-65 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-lg">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{
          background: `linear-gradient(to right, ${color}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <CompanyAvatar name={company.name} />

        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${company.name}`}
          title="Edit company"
          className="jp-icon-button"
        >
          <Pencil size={17} />
        </button>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 text-left"
      >
        <h3 className="text-lg font-extrabold tracking-tight transition-colors group-hover:text-blue-500">
          {company.name}
        </h3>
      </button>

      <p className="jp-muted mt-2 text-xs">
        {company.industry || "Industry not specified"}
      </p>

      <div className="mt-5 space-y-3">
        <div className="jp-muted flex items-start gap-2 text-xs">
          <MapPin size={15} className="shrink-0" />
          <span>
            {company.location || "Location not specified"}
          </span>
        </div>

        <div className="jp-muted flex items-center gap-2 text-xs">
          <BriefcaseBusiness size={15} />
          <span>
            {company._count?.applications ?? 0} tracked applications
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline"
        >
          View company
          <ArrowRight size={15} />
        </button>

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${company.name} website`}
            title="Visit website"
            className="jp-icon-button h-8! w-8!"
          >
            <ArrowUpRight size={17} />
          </a>
        )}
      </div>
    </article>
  );
}

function CompanyForm({
  mode,
  company,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  company?: CompanyRecord;
  onClose: () => void;
  onSaved: (company: CompanyRecord) => void;
}) {
  const [name, setName] = useState(company?.name ?? "");
  const [website, setWebsite] = useState(
    company?.website ?? ""
  );
  const [location, setLocation] = useState(
    company?.location ?? ""
  );
  const [industry, setIndustry] = useState(
    company?.industry ?? ""
  );
  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: (data: CompanyInput) =>
      mode === "edit" && company
        ? companyService.update(company.id, data)
        : companyService.create(data),
  });

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanWebsite = website.trim();

    if (cleanName.length < 1) {
      setError("Company name is required.");
      return;
    }

    if (cleanWebsite) {
      try {
        const parsed = new URL(cleanWebsite);

        if (
          parsed.protocol !== "https:" &&
          parsed.protocol !== "http:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setError("Enter a valid http:// or https:// website URL.");
        return;
      }
    }

    try {
      const response = await saveMutation.mutateAsync({
        name: cleanName,
        website: cleanWebsite || null,
        location: location.trim() || null,
        industry: industry.trim() || null,
      });

      toast.success(
        mode === "edit"
          ? "Company updated"
          : "Company created"
      );

      onSaved(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save company."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-form-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="jp-eyebrow">
              {mode === "edit" ? "Update profile" : "Grow your network"}
            </p>

            <h2
              id="company-form-title"
              className="mt-1 text-xl font-extrabold"
            >
              {mode === "edit"
                ? "Edit company"
                : "Add a company"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close company form"
            className="jp-icon-button"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-5 p-6"
        >
          <div>
            <label
              htmlFor="company-name"
              className="mb-2 block text-sm font-semibold"
            >
              Company name *
            </label>

            <input
              id="company-name"
              required
              maxLength={150}
              className="jp-input"
              placeholder="e.g. Northstar Technologies"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div>
            <label
              htmlFor="company-website"
              className="mb-2 block text-sm font-semibold"
            >
              Website
            </label>

            <input
              id="company-website"
              type="url"
              className="jp-input"
              placeholder="https://example.com"
              value={website}
              onChange={(event) =>
                setWebsite(event.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="company-industry"
                className="mb-2 block text-sm font-semibold"
              >
                Industry
              </label>

              <input
                id="company-industry"
                maxLength={150}
                className="jp-input"
                placeholder="Technology"
                value={industry}
                onChange={(event) =>
                  setIndustry(event.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="company-location"
                className="mb-2 block text-sm font-semibold"
              >
                Location
              </label>

              <input
                id="company-location"
                maxLength={200}
                className="jp-input"
                placeholder="Colombo, Sri Lanka"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="jp-button-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="jp-button"
            >
              {saveMutation.isPending ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={17} />
              )}

              {saveMutation.isPending
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Create company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyDrawer({
  id,
  onClose,
  onEdit,
  onDelete,
}: {
  id: string;
  onClose: () => void;
  onEdit: (company: CompanyRecord) => void;
  onDelete: (company: CompanyRecord) => void;
}) {
  const [applicationPage, setApplicationPage] = useState(1);

  useEffect(() => {
    setApplicationPage(1);
  }, [id]);

  const companyQuery = useQuery({
    queryKey: ["company-detail", id],
    queryFn: () => companyService.get(id),
  });

  const applicationsQuery = useQuery({
    queryKey: ["company-applications", id, applicationPage],
    queryFn: () =>
      companyService.applications(id, applicationPage),
  });

  const company = companyQuery.data?.data;
  const applications = applicationsQuery.data;

  return (
    <div className="fixed inset-0 z-70 flex justify-end bg-black/55 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close company details"
        className="absolute inset-0"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Company details"
        className="relative z-10 flex h-full w-full max-w-155 flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <span className="jp-eyebrow">
            Company profile
          </span>

          <button
            type="button"
            onClick={onClose}
            className="jp-icon-button"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {companyQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-xl bg-[var(--surface-alt)]" />
              <div className="h-55 animate-pulse rounded-xl bg-[var(--surface-alt)]" />
            </div>
          ) : companyQuery.isError || !company ? (
            <div className="py-12 text-center">
              <p className="font-semibold">
                Unable to load company details.
              </p>

              <button
                type="button"
                onClick={() => void companyQuery.refetch()}
                className="jp-button mt-5"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-7">
              <div>
                <CompanyAvatar name={company.name} large />

                <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
                  {company.name}
                </h2>

                <p className="jp-muted mt-2 text-sm">
                  {company.industry || "Industry not specified"}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(company)}
                    className="jp-button"
                  >
                    <Pencil size={16} />
                    Edit profile
                  </button>

                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jp-button-secondary"
                    >
                      <ExternalLink size={16} />
                      Website
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-blue-500/8 p-4">
                  <BriefcaseBusiness
                    size={19}
                    className="text-blue-500"
                  />
                  <p className="mt-3 text-2xl font-extrabold">
                    {company._count?.applications ?? 0}
                  </p>
                  <p className="jp-muted mt-1 text-xs">
                    Applications
                  </p>
                </div>

                <div className="rounded-xl bg-violet-500/8 p-4">
                  <Users
                    size={19}
                    className="text-violet-500"
                  />
                  <p className="mt-3 text-2xl font-extrabold">
                    {company._count?.contacts ?? 0}
                  </p>
                  <p className="jp-muted mt-1 text-xs">
                    Contacts
                  </p>
                </div>
              </div>

              <section className="rounded-xl border border-[var(--border)] p-5">
                <h3 className="font-bold">
                  Company information
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-500"
                    />
                    <div>
                      <p className="jp-muted text-xs">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {company.location || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe2
                      size={17}
                      className="mt-0.5 shrink-0 text-teal-500"
                    />
                    <div className="min-w-0">
                      <p className="jp-muted text-xs">
                        Website
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold">
                        {company.website || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={17}
                      className="mt-0.5 shrink-0 text-violet-500"
                    />
                    <div>
                      <p className="jp-muted text-xs">
                        Added to JobPilot
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(company.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      Linked applications
                    </h3>

                    <p className="jp-muted mt-1 text-xs">
                      Job opportunities at this company
                    </p>
                  </div>
                </div>

                {applicationsQuery.isLoading ? (
                  <div className="mt-4 h-25 animate-pulse rounded-xl bg-[var(--surface-alt)]" />
                ) : applicationsQuery.isError ? (
                  <div className="mt-4 rounded-xl border border-[var(--border)] p-5">
                    <p className="text-sm">
                      Unable to load applications.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void applicationsQuery.refetch()
                      }
                      className="mt-3 text-sm font-semibold text-blue-500"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 space-y-2">
                      {applications?.data.length === 0 && (
                        <div className="rounded-xl bg-[var(--surface-alt)] p-6 text-center">
                          <BriefcaseBusiness
                            size={25}
                            className="mx-auto text-blue-500"
                          />

                          <p className="jp-muted mt-3 text-sm">
                            No applications linked yet.
                          </p>
                        </div>
                      )}

                      {applications?.data.map((application) => (
                        <Link
                          key={application.id}
                          to={`/applications/${application.id}`}
                          onClick={onClose}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:border-blue-500/30 hover:bg-[var(--surface-alt)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {application.jobTitle}
                            </p>

                            <p className="jp-muted mt-1 text-xs">
                              {formatDate(application.appliedAt)}
                            </p>
                          </div>

                          <span
                            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                            style={{
                              color: STATUS_COLORS[application.status],
                              backgroundColor: `${
                                STATUS_COLORS[application.status]
                              }15`,
                            }}
                          >
                            {statusLabel(application.status)}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {applications &&
                      applications.meta.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            disabled={applicationPage <= 1}
                            onClick={() =>
                              setApplicationPage((page) => page - 1)
                            }
                            className="jp-button-secondary"
                          >
                            <ArrowLeft size={15} />
                            Previous
                          </button>

                          <span className="jp-muted text-xs">
                            {applicationPage} /{" "}
                            {applications.meta.totalPages}
                          </span>

                          <button
                            type="button"
                            disabled={
                              applicationPage >=
                              applications.meta.totalPages
                            }
                            onClick={() =>
                              setApplicationPage((page) => page + 1)
                            }
                            className="jp-button-secondary"
                          >
                            Next
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      )}
                  </>
                )}
              </section>

              <div className="border-t border-[var(--border)] pt-6">
                <button
                  type="button"
                  onClick={() => onDelete(company)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:underline"
                >
                  <Trash2 size={16} />
                  Delete company
                </button>

                <p className="jp-muted mt-2 text-xs leading-5">
                  Companies with linked applications cannot
                  be deleted. Deleting a company also removes
                  its associated contact records.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editing, setEditing] = useState<CompanyRecord | undefined>();
  const [deleting, setDeleting] = useState<CompanyRecord | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["company-directory", page, search],
    queryFn: () => companyService.list(page, search),
  });

  const companies = companiesQuery.data?.data ?? [];
  const meta = companiesQuery.data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyService.remove(id),

    onSuccess: async () => {
      setDeleting(null);
      setSelectedId(null);

      await queryClient.invalidateQueries({
        queryKey: ["company-directory"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["companies"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      });

      toast.success("Company deleted");

      if (companies.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  function openCreate() {
    setEditing(undefined);
    setFormMode("create");
  }

  function openEdit(company: CompanyRecord) {
    setEditing(company);
    setFormMode("edit");
  }

  async function handleSaved(company: CompanyRecord) {
    setFormMode(null);
    setEditing(undefined);
    setSelectedId(company.id);

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["company-directory"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["company-detail"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["companies"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["applications"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["pipeline-applications"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      }),
    ]);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="jp-fade-in space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            Your professional network
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Companies<span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-3 text-sm">
            The organizations behind your opportunities.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="jp-button"
        >
          <Plus size={18} />
          Add company
        </button>
      </header>

      <section className="relative overflow-hidden rounded-2xl bg-[#121725] px-6 py-7 text-white sm:px-8">
        <div className="pointer-events-none absolute -top-18 -right-15 h-48 w-48 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-25 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-wider text-blue-300 uppercase">
              <Building2 size={15} />
              Your company directory
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight">
              Build meaningful connections.
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              Keep the companies you're interested in organized
              alongside the roles you've applied for.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-7 py-5 backdrop-blur-md">
            <p className="text-3xl font-extrabold">
              {search ? meta?.total ?? "â€”" : meta?.total ?? "â€”"}
            </p>

            <p className="mt-1 text-xs text-slate-300">
              {search ? "Matching companies" : "Tracked companies"}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-xl gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="jp-muted absolute top-1/2 left-4 -translate-y-1/2"
            />

            <input
              aria-label="Search companies"
              type="search"
              maxLength={150}
              placeholder="Search company names..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              className="jp-input pl-11!"
            />
          </div>

          <button
            type="submit"
            className="jp-button-secondary"
          >
            Search
          </button>
        </form>

        <button
          type="button"
          disabled={companiesQuery.isFetching}
          onClick={() => void companiesQuery.refetch()}
          className="jp-button-secondary"
        >
          <RefreshCw
            size={16}
            className={
              companiesQuery.isFetching
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </section>

      {search && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-500/8 px-4 py-3">
          <p className="text-xs text-blue-500">
            Showing results for "{search}"
          </p>

          <button
            type="button"
            onClick={clearSearch}
            className="flex items-center gap-1 text-xs font-bold text-blue-500"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}

      {companiesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-65 animate-pulse rounded-2xl bg-[var(--surface-alt)]"
            />
          ))}
        </div>
      ) : companiesQuery.isError ? (
        <div className="jp-card py-15 text-center">
          <p className="text-lg font-bold">
            Could not load companies.
          </p>

          <p className="jp-muted mt-2 text-sm">
            Check your backend connection and try again.
          </p>

          <button
            type="button"
            onClick={() => void companiesQuery.refetch()}
            className="jp-button mt-5"
          >
            Retry
          </button>
        </div>
      ) : companies.length === 0 ? (
        <div className="jp-card py-15 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <Building2 size={30} />
          </div>

          <h3 className="mt-5 text-xl font-extrabold">
            {search
              ? "No companies found"
              : "Your company directory starts here"}
          </h3>

          <p className="jp-muted mx-auto mt-3 max-w-sm text-sm leading-6">
            {search
              ? "Try searching for another company name."
              : "Add a company to start organizing opportunities and contacts."}
          </p>

          <button
            type="button"
            onClick={search ? clearSearch : openCreate}
            className="jp-button mt-6"
          >
            {search ? "Clear search" : "Add first company"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onOpen={() => setSelectedId(company.id)}
                onEdit={() => openEdit(company)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
            <p className="jp-muted text-xs">
              Page {meta?.page ?? page} of{" "}
              {Math.max(meta?.totalPages ?? 1, 1)}
              {" - "}
              {meta?.total ?? 0} results
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="jp-button-secondary"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= (meta?.totalPages ?? 1)}
                onClick={() => setPage((value) => value + 1)}
                className="jp-button-secondary"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
        <p className="jp-muted text-xs">
          Company profiles stay connected to your applications.
        </p>

        <Link
          to="/applications"
          className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline"
        >
          View applications
          <ArrowRight size={15} />
        </Link>
      </div>

      {selectedId && (
        <CompanyDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}

      {formMode && (
        <CompanyForm
          key={editing?.id ?? "new"}
          mode={formMode}
          company={editing}
          onClose={() => {
            setFormMode(null);
            setEditing(undefined);
          }}
          onSaved={(company) => {
            void handleSaved(company);
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-company-title"
            className="jp-card w-full max-w-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-company-title"
              className="text-xl font-extrabold"
            >
              Delete {deleting.name}?
            </h2>

            <p className="jp-muted mt-3 text-sm leading-6">
              The company will be permanently deleted,
              along with its associated contacts.
              Companies with linked applications cannot be deleted.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteMutation.isPending}
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
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {deleteMutation.isPending && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}
                Delete company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

