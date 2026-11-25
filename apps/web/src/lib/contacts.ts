
import { api } from "./api";

export interface ContactCompany {
  id: string;
  name: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
  ownerId: string;
  companyId: string;
  company: ContactCompany;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInput {
  name: string;
  companyId: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface ItemResponse<T> {
  success: boolean;
  data: T;
}

interface MessageResponse {
  success: boolean;
  message: string;
}

export const contactsApi = {
  list: () =>
    api<ListResponse<Contact>>("/contacts"),

  create: (data: ContactInput) =>
    api<ItemResponse<Contact>>("/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: ContactInput) =>
    api<ItemResponse<Contact>>(
      `/contacts/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  remove: (id: string) =>
    api<MessageResponse>(
      `/contacts/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    ),
};

export function contactInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const CONTACT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#22c55e",
];

export function contactColor(name: string): string {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return CONTACT_COLORS[hash % CONTACT_COLORS.length];
}

export function contactDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
