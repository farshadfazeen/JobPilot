
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
  Building2,
  LoaderCircle,
  Plus,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  applicationsApi,
  companiesApi,
  fromDateInput,
  JOB_TYPES,
  STATUSES,
  statusLabel,
  toDateInput,
  WORK_MODES,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
  type JobType,
  type WorkMode,
} from "../../lib/applications";

interface Props {
  application?: Application;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

interface FormValues {
  jobTitle: string;
  companyId: string;
  status: ApplicationStatus;
  jobType: JobType | "";
  workMode: WorkMode | "";
  jobUrl: string;
  description: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  appliedAt: string;
  deadline: string;
}

function getInitialValues(application?: Application): FormValues {
  return {
    jobTitle: application?.jobTitle ?? "",
    companyId: application?.companyId ?? "",
    status: application?.status ?? "SAVED",
    jobType: application?.jobType ?? "",
    workMode: application?.workMode ?? "",
    jobUrl: application?.jobUrl ?? "",
    description: application?.description ?? "",
    location: application?.location ?? "",
    salaryMin:
      application?.salaryMin == null
        ? ""
        : String(application.salaryMin),
    salaryMax:
      application?.salaryMax == null
        ? ""
        : String(application.salaryMax),
    currency: application?.currency ?? "",
    appliedAt: toDateInput(application?.appliedAt),
    deadline: toDateInput(application?.deadline),
  };
}

export default function ApplicationForm({
  application,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormValues>(
    () => getInitialValues(application)
  );

  const [error, setError] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLocation, setNewCompanyLocation] = useState("");

  const editing = Boolean(application);

  const companiesQuery = useQuery({
    queryKey: ["companies", "form", companySearch],
    queryFn: () => companiesApi.list(companySearch),
  });

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function change<K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  const saveMutation = useMutation({
    mutationFn: (input: ApplicationInput) =>
      application
        ? applicationsApi.update(application.id, input)
        : applicationsApi.create(input),

    onSuccess: async (response) => {
      await Promise.all([
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
          queryKey: ["pipeline-applications"],
        }),
      ]);

      toast.success(
        editing
          ? "Application updated successfully"
          : "Application created successfully"
      );

      onSuccess(response.data.id);
    },
  });

  const companyMutation = useMutation({
    mutationFn: companiesApi.create,

    onSuccess: async (response) => {
      setCompanySearch("");

      queryClient.setQueryData(
        ["companies", "form", ""],
        (previous: {
          success: boolean;
          data: Array<{
            id: string;
            name: string;
          }>;
          meta: {
            total: number;
          };
        } | undefined) => {
          if (!previous) return previous;

          return {
            ...previous,
            data: [
              response.data,
              ...previous.data.filter(
                (company) => company.id !== response.data.id
              ),
            ].slice(0, 100),
            meta: {
              ...previous.meta,
              total: previous.meta.total + 1,
            },
          };
        }
      );

      change("companyId", response.data.id);
      setNewCompanyName("");
      setNewCompanyLocation("");
      setAddingCompany(false);

      await queryClient.invalidateQueries({
        queryKey: ["companies"],
      });

      toast.success("Company created");
    },
  });

  async function createCompany() {
    setError("");

    const name = newCompanyName.trim();

    if (!name) {
      setError("Please enter a company name.");
      return;
    }

    try {
      await companyMutation.mutateAsync({
        name,
        location: newCompanyLocation.trim() || null,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create company"
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!form.jobTitle.trim()) {
      setError("Please enter a job title.");
      return;
    }

    if (!form.companyId) {
      setError("Please select a company.");
      return;
    }

    const min =
      form.salaryMin.trim() === ""
        ? null
        : Number(form.salaryMin);

    const max =
      form.salaryMax.trim() === ""
        ? null
        : Number(form.salaryMax);

    if (
      (min !== null && (!Number.isFinite(min) || min < 0)) ||
      (max !== null && (!Number.isFinite(max) || max < 0))
    ) {
      setError("Salary amounts must be valid positive numbers.");
      return;
    }

    if (min !== null && max !== null && max < min) {
      setError("Maximum salary cannot be less than minimum salary.");
      return;
    }

    const currency = form.currency.trim().toUpperCase();

    if (currency && !/^[A-Z]{3}$/.test(currency)) {
      setError("Currency must be a three-letter code.");
      return;
    }

    if ((min !== null || max !== null) && !currency) {
      setError("Select a currency when entering salary.");
      return;
    }

    const input: ApplicationInput = {
      jobTitle: form.jobTitle.trim(),
      companyId: form.companyId,
      status: form.status,
      jobType: form.jobType || null,
      workMode: form.workMode || null,
      jobUrl: form.jobUrl.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      salaryMin: min,
      salaryMax: max,
      currency: currency || null,
      appliedAt: fromDateInput(form.appliedAt),
      deadline: fromDateInput(form.deadline),
    };

    try {
      await saveMutation.mutateAsync(input);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save application"
      );
    }
  }

  const labelClass = "mb-2 block text-sm font-semibold";

  return (
    <div className="fixed inset-0 z-80 flex justify-end bg-black/65">
      <button
        type="button"
        aria-label="Close form"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-form-title"
        className="relative z-10 flex h-full w-full max-w-175 flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-7">
          <div>
            <p className="jp-eyebrow">
              {editing ? "Update opportunity" : "New opportunity"}
            </p>

            <h2
              id="app-form-title"
              className="mt-1 text-xl font-extrabold"
            >
              {editing
                ? "Edit application"
                : "Add an application"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="jp-icon-button"
          >
            <X size={21} />
          </button>
        </header>

        <form
          id="jobpilot-application-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7"
        >
          <section className="space-y-5">
            <div>
              <h3 className="font-bold">Job information</h3>
              <p className="jp-muted mt-1 text-xs">
                Start with the role and company.
              </p>
            </div>

            <div>
              <label htmlFor="jobTitle" className={labelClass}>
                Job title *
              </label>

              <input
                id="jobTitle"
                required
                maxLength={200}
                className="jp-input"
                placeholder="Junior Software Engineer"
                value={form.jobTitle}
                onChange={(event) =>
                  change("jobTitle", event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="companyId" className={labelClass}>
                Company *
              </label>

              <div className="mb-3 flex gap-2">
                <input
                  aria-label="Find a company"
                  className="jp-input"
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={(event) =>
                    setCompanySearch(event.target.value)
                  }
                />

                <button
                  type="button"
                  aria-label="Add a new company"
                  onClick={() => setAddingCompany((value) => !value)}
                  className="jp-button-secondary shrink-0"
                >
                  <Plus size={17} />
                </button>
              </div>

              <select
                id="companyId"
                required
                className="jp-input"
                value={form.companyId}
                onChange={(event) =>
                  change("companyId", event.target.value)
                }
              >
                <option value="">Choose a company</option>

                {application?.company &&
                  !companiesQuery.data?.data.some(
                    (item) => item.id === application.companyId
                  ) && (
                    <option value={application.companyId}>
                      {application.company.name}
                    </option>
                  )}

                {companiesQuery.data?.data.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>

              {companiesQuery.isLoading && (
                <p className="jp-muted mt-2 text-xs">
                  Loading companies...
                </p>
              )}

              {companiesQuery.isError && (
                <button
                  type="button"
                  className="mt-2 text-xs text-red-500 underline"
                  onClick={() => void companiesQuery.refetch()}
                >
                  Couldn't load companies. Retry.
                </button>
              )}

              {addingCompany && (
                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <Building2 size={17} className="text-blue-500" />
                    Create a company
                  </div>

                  <div className="space-y-3">
                    <input
                      aria-label="New company name"
                      maxLength={150}
                      className="jp-input"
                      placeholder="Company name"
                      value={newCompanyName}
                      onChange={(event) =>
                        setNewCompanyName(event.target.value)
                      }
                    />

                    <input
                      aria-label="New company location"
                      maxLength={200}
                      className="jp-input"
                      placeholder="Location (optional)"
                      value={newCompanyLocation}
                      onChange={(event) =>
                        setNewCompanyLocation(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      disabled={companyMutation.isPending}
                      onClick={() => void createCompany()}
                      className="jp-button"
                    >
                      <Plus size={16} />
                      {companyMutation.isPending
                        ? "Creating..."
                        : "Save company"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="jobType" className={labelClass}>
                  Job type
                </label>

                <select
                  id="jobType"
                  className="jp-input"
                  value={form.jobType}
                  onChange={(event) =>
                    change(
                      "jobType",
                      event.target.value as JobType | ""
                    )
                  }
                >
                  <option value="">Not specified</option>

                  {JOB_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {statusLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="workMode" className={labelClass}>
                  Work mode
                </label>

                <select
                  id="workMode"
                  className="jp-input"
                  value={form.workMode}
                  onChange={(event) =>
                    change(
                      "workMode",
                      event.target.value as WorkMode | ""
                    )
                  }
                >
                  <option value="">Not specified</option>

                  {WORK_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {statusLabel(mode)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className={labelClass}>
                Location
              </label>

              <input
                id="location"
                className="jp-input"
                maxLength={200}
                placeholder="Colombo, Sri Lanka"
                value={form.location}
                onChange={(event) =>
                  change("location", event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="jobUrl" className={labelClass}>
                Job posting URL
              </label>

              <input
                id="jobUrl"
                type="url"
                className="jp-input"
                placeholder="https://company.com/careers"
                value={form.jobUrl}
                onChange={(event) =>
                  change("jobUrl", event.target.value)
                }
              />
            </div>
          </section>

          <div className="border-t border-[var(--border)]" />

          <section className="space-y-5">
            <h3 className="font-bold">Application progress</h3>

            <div>
              <label htmlFor="status" className={labelClass}>
                Status
              </label>

              <select
                id="status"
                className="jp-input"
                value={form.status}
                onChange={(event) =>
                  change(
                    "status",
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="appliedAt" className={labelClass}>
                  Applied date
                </label>

                <input
                  id="appliedAt"
                  type="date"
                  className="jp-input"
                  value={form.appliedAt}
                  onChange={(event) =>
                    change("appliedAt", event.target.value)
                  }
                />
              </div>

              <div>
                <label htmlFor="deadline" className={labelClass}>
                  Deadline
                </label>

                <input
                  id="deadline"
                  type="date"
                  className="jp-input"
                  value={form.deadline}
                  onChange={(event) =>
                    change("deadline", event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <div className="border-t border-[var(--border)]" />

          <section className="space-y-5">
            <h3 className="font-bold">Salary information</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="salaryMin" className={labelClass}>
                  Minimum salary
                </label>

                <input
                  id="salaryMin"
                  type="number"
                  min="0"
                  step="0.01"
                  className="jp-input"
                  placeholder="0"
                  value={form.salaryMin}
                  onChange={(event) =>
                    change("salaryMin", event.target.value)
                  }
                />
              </div>

              <div>
                <label htmlFor="salaryMax" className={labelClass}>
                  Maximum salary
                </label>

                <input
                  id="salaryMax"
                  type="number"
                  min="0"
                  step="0.01"
                  className="jp-input"
                  placeholder="0"
                  value={form.salaryMax}
                  onChange={(event) =>
                    change("salaryMax", event.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="currency" className={labelClass}>
                Currency
              </label>

              <input
                id="currency"
                className="jp-input"
                placeholder="LKR / USD / EUR"
                maxLength={3}
                value={form.currency}
                onChange={(event) =>
                  change(
                    "currency",
                    event.target.value.toUpperCase()
                  )
                }
              />
            </div>

            <p className="jp-muted text-xs">
              The current database does not store whether
              salary is monthly or annual.
            </p>
          </section>

          <div className="border-t border-[var(--border)]" />

          <section>
            <label htmlFor="description" className={labelClass}>
              Job description and requirements
            </label>

            <textarea
              id="description"
              rows={7}
              maxLength={20000}
              className="jp-input resize-y leading-6"
              placeholder="Paste the job description or write important requirements..."
              value={form.description}
              onChange={(event) =>
                change("description", event.target.value)
              }
            />

            <p className="jp-muted mt-2 text-right text-xs">
              {form.description.length} / 20,000
            </p>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500"
            >
              {error}
            </div>
          )}
        </form>

        <footer className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-5 py-4 sm:px-7">
          <button
            type="button"
            className="jp-button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="jobpilot-application-form"
            disabled={saveMutation.isPending}
            className="jp-button"
          >
            {saveMutation.isPending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saveMutation.isPending
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create application"}
          </button>
        </footer>
      </div>
    </div>
  );
}
