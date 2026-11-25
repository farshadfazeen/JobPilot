
import { api } from "./api";
import type { Application } from "./applications";

export type ThemeChoice = "system" | "light" | "dark";

export interface JobPilotPreferences {
  theme: ThemeChoice;
  reducedMotion: boolean;
  compactMode: boolean;
  hideSalaries: boolean;
  currency: string;
  weeklyGoal: number;
  deadlineWindow: number;
  skills: string[];
}

export const DEFAULT_PREFERENCES: JobPilotPreferences = {
  theme: "system",
  reducedMotion: false,
  compactMode: false,
  hideSalaries: false,
  currency: "LKR",
  weeklyGoal: 10,
  deadlineWindow: 7,
  skills: [],
};

const STORAGE_KEY = "jobpilot.preferences.v1";
export const SETTINGS_EVENT = "jobpilot:settings-changed";

export function loadPreferences(): JobPilotPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, skills: [] };

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_PREFERENCES, skills: [] };
    }

    const p = parsed as Record<string, unknown>;

    return {
      theme:
        p.theme === "light" ||
        p.theme === "dark" ||
        p.theme === "system"
          ? p.theme
          : "system",
      reducedMotion: p.reducedMotion === true,
      compactMode: p.compactMode === true,
      hideSalaries: p.hideSalaries === true,
      currency:
        typeof p.currency === "string" &&
        /^[A-Z]{3}$/.test(p.currency)
          ? p.currency
          : "LKR",
      weeklyGoal:
        typeof p.weeklyGoal === "number" &&
        Number.isInteger(p.weeklyGoal) &&
        p.weeklyGoal >= 1 &&
        p.weeklyGoal <= 100
          ? p.weeklyGoal
          : 10,
      deadlineWindow:
        [3, 7, 14, 30].includes(Number(p.deadlineWindow))
          ? Number(p.deadlineWindow)
          : 7,
      skills: Array.isArray(p.skills)
        ? [...new Set(
            p.skills.filter(
              (s): s is string =>
                typeof s === "string" &&
                s.length > 0 &&
                s.length <= 80
            )
          )].slice(0, 100)
        : [],
    };
  } catch {
    return { ...DEFAULT_PREFERENCES, skills: [] };
  }
}

export function savePreferences(p: JobPilotPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  applyPreferences(p);
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function applyPreferences(p: JobPilotPreferences): void {
  const dark =
    p.theme === "dark" ||
    (p.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.jpCompact =
    String(p.compactMode);
  document.documentElement.dataset.jpReduceMotion =
    String(p.reducedMotion);
  document.documentElement.dataset.jpHideSalaries =
    String(p.hideSalaries);
}

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Accepts both our earlier frontend response format
// and the original Stage 4 backend response format.
export async function fetchWorkspaceApplications(): Promise<Application[]> {
  const all: Application[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 1000; page++) {
    const search = new URLSearchParams({
      page: String(page),
      limit: "100",
    });

    const response = await api<unknown>(
      `/applications?${search.toString()}`
    );

    if (!response || typeof response !== "object") {
      throw new Error("Invalid applications API response.");
    }

    const body = response as Record<string, unknown>;
    const records = body.data ?? body.items;

    if (!Array.isArray(records)) {
      throw new Error(
        "The API response does not contain an applications list."
      );
    }

    for (const record of records as Application[]) {
      if (!record || typeof record.id !== "string") continue;

      if (!seen.has(record.id)) {
        seen.add(record.id);
        all.push(record);
      }
    }

    const pageInfo = (body.meta ?? body.pagination) as
      | Record<string, unknown>
      | undefined;

    const pages = Number(
      pageInfo?.totalPages ?? pageInfo?.pages
    );

    if (
      records.length === 0 ||
      !Number.isFinite(pages) ||
      page >= pages
    ) {
      break;
    }
  }

  return all;
}

export function safeErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
