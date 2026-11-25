
import {
  useEffect,
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
  Building2,
  CalendarDays,
  Check,
  Copy,
  FilterX,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  StickyNote,
  Trash2,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { companiesApi } from "../lib/applications";
import {
  contactColor,
  contactDate,
  contactInitials,
  contactsApi,
  type Contact,
  type ContactInput,
} from "../lib/contacts";

// ==========================================
// Reusable contact avatar
// ==========================================

function ContactAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const color = contactColor(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl font-extrabold ${
        large
          ? "h-18 w-18 text-xl"
          : "h-12 w-12 text-sm"
      }`}
      style={{
        color,
        backgroundColor: `${color}16`,
        border: `1px solid ${color}25`,
      }}
    >
      {contactInitials(name)}
    </div>
  );
}

// ==========================================
// Contact create / edit form
// ==========================================

function ContactForm({
  contact,
  onClose,
  onSaved,
}: {
  contact?: Contact;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const editing = Boolean(contact);

  const [name, setName] = useState(contact?.name ?? "");
  const [companyId, setCompanyId] = useState(
    contact?.companyId ?? ""
  );
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [jobTitle, setJobTitle] = useState(
    contact?.jobTitle ?? ""
  );
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [error, setError] = useState("");

  const companiesQuery = useQuery({
    queryKey: ["companies", "contacts-form"],
    queryFn: () => companiesApi.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: ContactInput) =>
      contact
        ? contactsApi.update(contact.id, data)
        : contactsApi.create(data),

    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["contacts"],
      });

      toast.success(
        editing
          ? "Contact updated successfully"
          : "Contact created successfully"
      );

      onSaved(response.data.id);
    },
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Contact name is required.");
      return;
    }

    if (!companyId) {
      setError("Please select a company.");
      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setError("Enter a valid email address.");
      return;
    }

    const input: ContactInput = {
      name: cleanName,
      companyId,
      email: cleanEmail || null,
      phone: phone.trim() || null,
      jobTitle: jobTitle.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      await saveMutation.mutateAsync(input);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save contact."
      );
    }
  }

  const labelClass = "mb-2 block text-sm font-semibold";

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/65 px-4 py-5 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-form-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-7">
          <div>
            <p className="jp-eyebrow">
              {editing
                ? "Update your network"
                : "Build your network"}
            </p>

            <h2
              id="contact-form-title"
              className="mt-1 text-xl font-extrabold"
            >
              {editing ? "Edit contact" : "Add a contact"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact form"
            className="jp-icon-button"
          >
            <X size={20} />
          </button>
        </div>

        <form
          id="jobpilot-contact-form"
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto px-5 py-6 sm:px-7"
        >
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              Full name *
            </label>

            <input
              id="contact-name"
              required
              maxLength={150}
              autoComplete="name"
              className="jp-input"
              placeholder="e.g. Sarah Morgan"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div>
            <label
              htmlFor="contact-company"
              className={labelClass}
            >
              Company *
            </label>

            <select
              id="contact-company"
              required
              className="jp-input"
              value={companyId}
              onChange={(event) =>
                setCompanyId(event.target.value)
              }
            >
              <option value="">Select a company</option>

              {contact &&
                !companiesQuery.data?.data.some(
                  (company) => company.id === contact.companyId
                ) && (
                  <option value={contact.companyId}>
                    {contact.company.name}
                  </option>
                )}

              {companiesQuery.data?.data.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
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
                onClick={() =>
                  void companiesQuery.refetch()
                }
              >
                Couldn't load companies. Retry.
              </button>
            )}

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="jp-muted text-xs">
                Every contact belongs to a company.
              </p>

              <Link
                to="/companies"
                onClick={onClose}
                className="shrink-0 text-xs font-semibold text-blue-500 hover:underline"
              >
                Manage companies
              </Link>
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-job-title"
              className={labelClass}
            >
              Position or job title
            </label>

            <input
              id="contact-job-title"
              maxLength={150}
              className="jp-input"
              placeholder="e.g. Technical Recruiter"
              value={jobTitle}
              onChange={(event) =>
                setJobTitle(event.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-email"
                className={labelClass}
              >
                Email address
              </label>

              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                className="jp-input"
                placeholder="name@company.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="contact-phone"
                className={labelClass}
              >
                Phone number
              </label>

              <input
                id="contact-phone"
                type="tel"
                autoComplete="tel"
                maxLength={50}
                className="jp-input"
                placeholder="+94 77 123 4567"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-notes"
              className={labelClass}
            >
              Professional notes
            </label>

            <textarea
              id="contact-notes"
              rows={5}
              maxLength={3000}
              className="jp-input resize-y leading-6"
              placeholder="How you met, hiring conversations, follow-up reminders or useful information..."
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />

            <p className="jp-muted mt-2 text-right text-xs">
              {notes.length} / 3000
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500"
            >
              {error}
            </div>
          )}
        </form>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--border)] px-5 py-4 sm:px-7">
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
            form="jobpilot-contact-form"
            disabled={
              saveMutation.isPending ||
              companiesQuery.isError
            }
            className="jp-button"
          >
            {saveMutation.isPending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Check size={17} />
            )}

            {saveMutation.isPending
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Create contact"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Contact profile
// ==========================================

function ContactProfile({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = contactColor(contact.name);

  async function copyText(
    label: string,
    value: string
  ) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  }

  return (
    <div className="jp-fade-in space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div
          className="h-22"
          style={{
            background: `linear-gradient(110deg, ${color}27, transparent 75%)`,
          }}
        />

        <div className="relative px-6 pb-6">
          <div className="-mt-9">
            <ContactAvatar name={contact.name} large />
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="jp-eyebrow">
                Contact profile
              </p>

              <h2 className="mt-2 wrap-break-word text-2xl font-extrabold tracking-tight">
                {contact.name}
              </h2>

              <p className="jp-muted mt-2 text-sm">
                {contact.jobTitle || "Position not specified"}
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <Building2
                  size={16}
                  className="text-blue-500"
                />
                {contact.company.name}
              </div>
            </div>

            <button
              type="button"
              onClick={onEdit}
              className="jp-button-secondary"
            >
              <Pencil size={16} />
              Edit profile
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="jp-button"
              >
                <Send size={16} />
                Send email
              </a>
            )}

            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                className="jp-button-secondary"
              >
                <Phone size={16} />
                Call contact
              </a>
            )}

            {!contact.email && !contact.phone && (
              <p className="jp-muted text-xs">
                Add an email address or phone number to enable quick contact actions.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="text-base font-extrabold">
          Contact information
        </h3>

        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Mail size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="jp-muted text-xs">
                Email address
              </p>

              <p className="mt-1 break-all text-sm font-semibold">
                {contact.email || "Not provided"}
              </p>
            </div>

            {contact.email && (
              <button
                type="button"
                onClick={() =>
                  void copyText("Email", contact.email!)
                }
                aria-label="Copy email"
                title="Copy email"
                className="jp-icon-button"
              >
                <Copy size={17} />
              </button>
            )}
          </div>

          <div className="border-t border-[var(--border)]" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
              <Phone size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="jp-muted text-xs">
                Phone number
              </p>

              <p className="mt-1 text-sm font-semibold">
                {contact.phone || "Not provided"}
              </p>
            </div>

            {contact.phone && (
              <button
                type="button"
                onClick={() =>
                  void copyText("Phone number", contact.phone!)
                }
                aria-label="Copy phone number"
                title="Copy phone number"
                className="jp-icon-button"
              >
                <Copy size={17} />
              </button>
            )}
          </div>

          <div className="border-t border-[var(--border)]" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <BriefcaseBusiness size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="jp-muted text-xs">
                Company
              </p>

              <p className="mt-1 text-sm font-semibold">
                {contact.company.name}
              </p>
            </div>

            <Link
              to="/companies"
              title="Open company directory"
              aria-label="Open company directory"
              className="jp-icon-button"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-2">
          <StickyNote
            size={19}
            className="text-amber-500"
          />

          <h3 className="text-base font-extrabold">
            Your notes
          </h3>
        </div>

        {contact.notes ? (
          <p className="mt-5 whitespace-pre-wrap wrap-break-word text-sm leading-7">
            {contact.notes}
          </p>
        ) : (
          <div className="mt-5 rounded-xl bg-[var(--surface-alt)] p-6 text-center">
            <p className="text-sm font-semibold">
              No notes yet
            </p>

            <p className="jp-muted mt-2 text-xs">
              Save useful details about conversations or follow-ups.
            </p>

            <button
              type="button"
              onClick={onEdit}
              className="mt-4 text-xs font-bold text-blue-500 hover:underline"
            >
              Add a note
            </button>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
        <div className="jp-muted flex items-center gap-2 text-xs">
          <CalendarDays size={15} />
          Added {contactDate(contact.createdAt)}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 text-xs font-semibold text-red-500 hover:underline"
        >
          <Trash2 size={16} />
          Delete contact
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Main contacts page
// ==========================================

type SortOption = "name" | "recent" | "company";

export default function ContactsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("name");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] =
    useState<Contact | undefined>();
  const [deleteContact, setDeleteContact] =
    useState<Contact | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: contactsApi.list,
    staleTime: 30_000,
  });

  const contacts = useMemo(
    () => contactsQuery.data?.data ?? [],
    [contactsQuery.data]
  );

  const companies = useMemo(() => {
    const unique = new Map<string, string>();

    for (const contact of contacts) {
      unique.set(
        contact.companyId,
        contact.company.name
      );
    }

    return Array.from(unique, ([id, name]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    const result = contacts.filter((contact) => {
      if (
        companyFilter &&
        contact.companyId !== companyFilter
      ) {
        return false;
      }

      if (!term) return true;

      return [
        contact.name,
        contact.email ?? "",
        contact.phone ?? "",
        contact.jobTitle ?? "",
        contact.company.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    return result.sort((a, b) => {
      if (sort === "company") {
        return (
          a.company.name.localeCompare(b.company.name) ||
          a.name.localeCompare(b.name)
        );
      }

      if (sort === "recent") {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      }

      return a.name.localeCompare(b.name);
    });
  }, [contacts, search, companyFilter, sort]);

  const selected =
    filtered.find((contact) => contact.id === selectedId) ??
    filtered[0] ??
    null;

  const contactsWithEmail = contacts.filter(
    (contact) => Boolean(contact.email)
  ).length;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),

    onSuccess: async () => {
      setDeleteContact(null);
      setSelectedId(null);

      await queryClient.invalidateQueries({
        queryKey: ["contacts"],
      });

      toast.success("Contact deleted successfully");
    },

    onError: (err) => {
      toast.error(err.message);
    },
  });

  function openCreate() {
    setEditingContact(undefined);
    setFormOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditingContact(contact);
    setFormOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setCompanyFilter("");
    setSort("name");
  }

  const hasFilters = Boolean(search || companyFilter);

  return (
    <div className="jp-fade-in space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            People behind opportunities
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your contacts
            <span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-3 max-w-xl text-sm leading-6">
            Organize recruiters, hiring managers and professional connections.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="jp-button"
        >
          <UserRoundPlus size={18} />
          Add contact
        </button>
      </header>

      {/* A compact, distinct summary strip */}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <p className="jp-muted text-xs font-medium">
              Saved contacts
            </p>
            <UsersRound
              size={19}
              className="text-blue-500"
            />
          </div>

          <p className="mt-3 text-3xl font-extrabold">
            {contacts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <p className="jp-muted text-xs font-medium">
              Connected companies
            </p>
            <Building2
              size={19}
              className="text-violet-500"
            />
          </div>

          <p className="mt-3 text-3xl font-extrabold">
            {companies.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <p className="jp-muted text-xs font-medium">
              Email-ready contacts
            </p>
            <Mail
              size={19}
              className="text-teal-500"
            />
          </div>

          <p className="mt-3 text-3xl font-extrabold">
            {contactsWithEmail}
          </p>
        </div>
      </section>

      {/* Search and sorting */}

      <section className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search
            size={18}
            className="jp-muted absolute top-1/2 left-4 -translate-y-1/2"
          />

          <input
            type="search"
            aria-label="Search contacts"
            placeholder="Search people, roles, companies..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="jp-input pl-11!"
          />
        </div>

        <select
          aria-label="Filter contacts by company"
          value={companyFilter}
          onChange={(event) =>
            setCompanyFilter(event.target.value)
          }
          className="jp-input w-full sm:w-55"
        >
          <option value="">All companies</option>

          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort contacts"
          value={sort}
          onChange={(event) =>
            setSort(event.target.value as SortOption)
          }
          className="jp-input w-full sm:w-43"
        >
          <option value="name">Name A-Z</option>
          <option value="recent">Recently added</option>
          <option value="company">Company A-Z</option>
        </select>

        <button
          type="button"
          disabled={contactsQuery.isFetching}
          onClick={() => void contactsQuery.refetch()}
          aria-label="Refresh contacts"
          title="Refresh contacts"
          className="jp-button-secondary"
        >
          <RefreshCw
            size={17}
            className={
              contactsQuery.isFetching
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </section>

      {hasFilters && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-500/8 px-4 py-3">
          <p className="text-xs font-medium text-blue-500">
            Showing {filtered.length} matching contacts
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-500"
          >
            <FilterX size={15} />
            Clear filters
          </button>
        </div>
      )}

      {/* Directory + profile workspace */}

      {contactsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="h-110 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
          <div className="h-110 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
        </div>
      ) : contactsQuery.isError ? (
        <div className="jp-card py-15 text-center">
          <h2 className="text-lg font-extrabold">
            Could not load your contacts
          </h2>

          <p className="jp-muted mt-2 text-sm">
            Make sure the JobPilot backend is running.
          </p>

          <button
            type="button"
            onClick={() => void contactsQuery.refetch()}
            className="jp-button mt-5"
          >
            Retry
          </button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="jp-card py-15 text-center">
          <div className="mx-auto flex h-17 w-17 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <UsersRound size={31} />
          </div>

          <h2 className="mt-5 text-xl font-extrabold">
            Start building your network
          </h2>

          <p className="jp-muted mx-auto mt-3 max-w-md text-sm leading-6">
            Save the people you meet throughout your job search.
            Keep their contact details and important notes together.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="jp-button mt-6"
          >
            <Plus size={17} />
            Add your first contact
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="jp-card py-14 text-center">
          <Search
            size={29}
            className="mx-auto text-blue-500"
          />

          <h2 className="mt-4 font-extrabold">
            No matching contacts
          </h2>

          <p className="jp-muted mt-2 text-sm">
            Try another search or clear your filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="jp-button mt-5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left directory */}

          <aside className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="text-sm font-extrabold">
                People directory
              </h2>

              <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-500">
                {filtered.length}
              </span>
            </div>

            <div className="max-h-[650px] overflow-y-auto p-2">
              {filtered.map((contact) => {
                const active = selected?.id === contact.id;

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedId(contact.id)}
                    aria-pressed={active}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      active
                        ? "border border-blue-500/20 bg-blue-500/8"
                        : "border border-transparent hover:bg-[var(--surface-alt)]"
                    }`}
                  >
                    <ContactAvatar name={contact.name} />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold ${
                          active ? "text-blue-500" : ""
                        }`}
                      >
                        {contact.name}
                      </p>

                      <p className="jp-muted mt-1 truncate text-xs">
                        {contact.jobTitle || "Contact"}
                      </p>

                      <p className="jp-muted mt-1 truncate text-[11px]">
                        {contact.company.name}
                      </p>
                    </div>

                    <ArrowRight
                      size={16}
                      className={
                        active
                          ? "shrink-0 text-blue-500"
                          : "jp-muted shrink-0"
                      }
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right profile */}

          <main className="min-w-0">
            {selected && (
              <ContactProfile
                key={selected.id}
                contact={selected}
                onEdit={() => openEdit(selected)}
                onDelete={() => setDeleteContact(selected)}
              />
            )}
          </main>
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
        <p className="jp-muted text-xs">
          Your professional connections, organized privately.
        </p>

        <Link
          to="/companies"
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:underline"
        >
          Explore companies
          <ArrowRight size={15} />
        </Link>
      </footer>

      {/* Create / edit modal */}

      {formOpen && (
        <ContactForm
          key={editingContact?.id ?? "new-contact"}
          contact={editingContact}
          onClose={() => {
            setFormOpen(false);
            setEditingContact(undefined);
          }}
          onSaved={(id) => {
            setFormOpen(false);
            setEditingContact(undefined);
            setSelectedId(id);
          }}
        />
      )}

      {/* Delete confirmation */}

      {deleteContact && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            className="jp-card w-full max-w-md"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-contact-title"
              className="text-xl font-extrabold"
            >
              Delete contact?
            </h2>

            <p className="jp-muted mt-3 text-sm leading-6">
              You're about to permanently delete{" "}
              <strong className="text-[var(--foreground)]">
                {deleteContact.name}
              </strong>
              , including their saved contact notes.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteContact(null)}
                disabled={deleteMutation.isPending}
                className="jp-button-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(deleteContact.id)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                Delete contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
