
import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Eye,
  Gauge,
  Globe2,
  Monitor,
  Moon,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Target,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  getBrowserTimeZone,
  loadPreferences,
  savePreferences,
  type JobPilotPreferences,
  type ThemeChoice,
} from "../lib/jobpilotTools";

function SettingSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold tracking-tight">
          {title}
        </h2>
        <p className="jp-muted mt-2 text-xs leading-6">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-[var(--border)] py-4 last:border-0">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="jp-muted mt-1 block text-xs leading-5">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 accent-blue-600"
      />
    </label>
  );
}

function downloadSettings(settings: JobPilotPreferences) {
  const contents = JSON.stringify(
    {
      format: "jobpilot-browser-settings",
      version: 1,
      exportedAt: new Date().toISOString(),
      preferences: settings,
    },
    null,
    2
  );

  const blob = new Blob([contents], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "jobpilot-settings.json";
  anchor.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateImport(value: unknown): JobPilotPreferences {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid JSON settings file.");
  }

  const documentData = value as Record<string, unknown>;

  if (
    documentData.format !== "jobpilot-browser-settings" ||
    documentData.version !== 1
  ) {
    throw new Error("This is not a compatible JobPilot settings backup.");
  }

  const input = documentData.preferences;

  if (!input || typeof input !== "object") {
    throw new Error("The backup does not contain settings.");
  }

  const p = input as Record<string, unknown>;

  if (
    !["light", "dark", "system"].includes(String(p.theme)) ||
    typeof p.reducedMotion !== "boolean" ||
    typeof p.compactMode !== "boolean" ||
    typeof p.hideSalaries !== "boolean" ||
    typeof p.currency !== "string" ||
    !/^[A-Z]{3}$/.test(p.currency) ||
    typeof p.weeklyGoal !== "number" ||
    !Number.isInteger(p.weeklyGoal) ||
    p.weeklyGoal < 1 ||
    p.weeklyGoal > 100 ||
    ![3, 7, 14, 30].includes(Number(p.deadlineWindow)) ||
    !Array.isArray(p.skills) ||
    p.skills.length > 100 ||
    !p.skills.every(
      (item) =>
        typeof item === "string" &&
        item.length > 0 &&
        item.length <= 80
    )
  ) {
    throw new Error("The backup contains invalid preferences.");
  }

  return {
    theme: p.theme as ThemeChoice,
    reducedMotion: p.reducedMotion,
    compactMode: p.compactMode,
    hideSalaries: p.hideSalaries,
    currency: p.currency,
    weeklyGoal: p.weeklyGoal,
    deadlineWindow: Number(p.deadlineWindow),
    skills: [...new Set(p.skills as string[])],
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<JobPilotPreferences>(
    loadPreferences
  );
  const [skillInput, setSkillInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [activeSection, setActiveSection] = useState("appearance");

  useEffect(() => {
    applyPreferences(settings);

    if (settings.theme !== "system") return;

    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const listener = () => applyPreferences(settings);

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [settings]);

  function update(patch: Partial<JobPilotPreferences>) {
    const next = { ...settings, ...patch };

    try {
      savePreferences(next);
      setSettings(next);
    } catch {
      toast.error(
        "Unable to save preferences. Check browser storage settings."
      );
    }
  }

  function addSkill() {
    const value = skillInput.trim().replace(/\s+/g, " ");

    if (!value) return;

    if (value.length > 80) {
      toast.error("Skill names cannot exceed 80 characters.");
      return;
    }

    if (settings.skills.length >= 100) {
      toast.error("Maximum of 100 skills reached.");
      return;
    }

    if (
      settings.skills.some(
        (skill) => skill.toLowerCase() === value.toLowerCase()
      )
    ) {
      toast.info("That skill is already in your profile.");
      return;
    }

    update({ skills: [...settings.skills, value] });
    setSkillInput("");
    toast.success("Skill saved");
  }

  async function importSettings(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    if (file.size > 100_000) {
      toast.error("Settings file is too large.");
      return;
    }

    try {
      const content = await file.text();
      const next = validateImport(JSON.parse(content));

      savePreferences(next);
      setSettings(next);

      toast.success("Settings imported successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not import this file."
      );
    }
  }

  function resetPreferences() {
    const next: JobPilotPreferences = {
      ...DEFAULT_PREFERENCES,
      skills: [],
    };

    try {
      savePreferences(next);
      setSettings(next);
      setShowReset(false);
      toast.success("Browser settings reset");
    } catch {
      toast.error("Could not reset preferences.");
    }
  }

  const sections = [
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "productivity", label: "Productivity", icon: Target },
    { id: "skills", label: "Skill profile", icon: BookOpen },
    { id: "privacy", label: "Privacy", icon: ShieldCheck },
    { id: "backup", label: "Backup & reset", icon: Download },
  ];

  function jumpTo(id: string) {
    setActiveSection(id);
    document.getElementById(`settings-${id}`)?.scrollIntoView({
      behavior: settings.reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="jp-fade-in space-y-7">
      <header>
        <p className="jp-eyebrow">Your workspace / Preferences</p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Settings
          <span className="text-blue-500">.</span>
        </h1>

        <p className="jp-muted mt-3 max-w-xl text-sm leading-6">
          Make JobPilot work the way you prefer. Browser
          settings save automatically on this device.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-[#151a2a] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-25 -right-15 h-55 w-55 rounded-full bg-blue-600/25 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-300 uppercase">
              <SlidersHorizontal size={16} />
              Personal workspace
            </div>

            <h2 className="mt-4 text-2xl font-extrabold">
              Built around your workflow.
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              Choose your appearance, set realistic goals
              and maintain the skills that power your job analysis.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <Gauge size={30} className="text-blue-300" />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 lg:sticky lg:top-6">
          <nav aria-label="Settings sections" className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpTo(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    activeSection === section.id
                      ? "bg-blue-500/10 text-blue-500"
                      : "hover:bg-[var(--surface-alt)]"
                  }`}
                >
                  <Icon size={17} />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-5">
          <div id="settings-appearance" className="scroll-mt-6">
            <SettingSection
              title="Appearance"
              description="Choose how the JobPilot interface looks on this device."
            >
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as const).map((item) => {
                  const Icon = item.icon;
                  const selected = settings.theme === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update({ theme: item.value })}
                      className={`flex flex-col items-center gap-3 rounded-xl border p-4 transition ${
                        selected
                          ? "border-blue-500 bg-blue-500/8 text-blue-500"
                          : "border-[var(--border)] hover:border-blue-500/30"
                      }`}
                    >
                      <Icon size={22} />
                      <span className="text-xs font-bold">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <SwitchRow
                  title="Reduce motion"
                  description="Limit interface animations and transitions."
                  checked={settings.reducedMotion}
                  onChange={(value) => update({ reducedMotion: value })}
                />
                <SwitchRow
                  title="Compact mode"
                  description="Use tighter spacing in supported JobPilot cards."
                  checked={settings.compactMode}
                  onChange={(value) => update({ compactMode: value })}
                />
              </div>
            </SettingSection>
          </div>

          <div id="settings-productivity" className="scroll-mt-6">
            <SettingSection
              title="Productivity goals"
              description="Keep your personal job-search targets in one place."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="weekly-goal"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Weekly application target
                  </label>

                  <input
                    id="weekly-goal"
                    type="number"
                    min="1"
                    max="100"
                    className="jp-input"
                    value={settings.weeklyGoal}
                    onChange={(event) => {
                      const n = Number(event.target.value);

                      if (Number.isInteger(n) && n >= 1 && n <= 100) {
                        update({ weeklyGoal: n });
                      }
                    }}
                  />

                  <p className="jp-muted mt-2 text-xs">
                    Your planning target, not an automatic task.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="deadline-window"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Deadline attention window
                  </label>

                  <select
                    id="deadline-window"
                    className="jp-input"
                    value={settings.deadlineWindow}
                    onChange={(event) =>
                      update({
                        deadlineWindow: Number(event.target.value),
                      })
                    }
                  >
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="default-currency"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Preferred currency
                  </label>

                  <select
                    id="default-currency"
                    className="jp-input"
                    value={settings.currency}
                    onChange={(event) =>
                      update({ currency: event.target.value })
                    }
                  >
                    {["LKR", "USD", "EUR", "GBP", "INR", "AED", "SGD", "AUD", "CAD"].map(
                      (currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Browser timezone
                  </p>

                  <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 text-sm">
                    <Globe2 size={16} className="text-blue-500" />
                    {getBrowserTimeZone()}
                  </div>
                </div>
              </div>

              <p className="jp-muted mt-5 text-xs leading-6">
                These targets and defaults are saved preferences.
                Existing application records are not changed.
                Other modules will need to read these preferences
                before using them in their own calculations or forms.
              </p>
            </SettingSection>
          </div>

          <div id="settings-skills" className="scroll-mt-6">
            <SettingSection
              title="Your technical skill profile"
              description="The Job Analysis page uses these skills to identify confirmed matches."
            >
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  addSkill();
                }}
              >
                <input
                  aria-label="New skill"
                  className="jp-input"
                  maxLength={80}
                  placeholder="React, TypeScript, PostgreSQL..."
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                />

                <button type="submit" className="jp-button">
                  <Check size={17} />
                  Add
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {settings.skills.length === 0 ? (
                  <p className="jp-muted rounded-xl bg-[var(--surface-alt)] p-5 text-sm">
                    Your skill profile is empty. Add technologies
                    you've studied or used in projects.
                  </p>
                ) : (
                  settings.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs font-semibold"
                    >
                      {skill}

                      <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={() =>
                          update({
                            skills: settings.skills.filter(
                              (item) => item !== skill
                            ),
                          })
                        }
                        className="text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <Link
                to="/job-analysis"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-500"
              >
                Go to Job Analysis
                <ArrowRight size={16} />
              </Link>
            </SettingSection>
          </div>

          <div id="settings-privacy" className="scroll-mt-6">
            <SettingSection
              title="Privacy and display"
              description="Manage local display preferences. Account authentication remains controlled by your backend."
            >
              <SwitchRow
                title="Hide salary amounts"
                description="Mask salary values in compatible JobPilot interface elements."
                checked={settings.hideSalaries}
                onChange={(value) => update({ hideSalaries: value })}
              />

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-500/8 p-4">
                <Eye size={19} className="mt-0.5 shrink-0 text-blue-500" />
                <p className="jp-muted text-xs leading-6">
                  Hiding an amount is only visual privacy.
                  It does not encrypt or delete database records.
                  This preference does not yet cover every older page.
                </p>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--border)] p-4">
                <UserRound size={19} className="mt-0.5 shrink-0 text-teal-500" />
                <div>
                  <p className="text-sm font-bold">Account security</p>
                  <p className="jp-muted mt-2 text-xs leading-6">
                    Password changes, session management and
                    account deletion need authenticated backend
                    endpoints. They are not exposed here as
                    nonfunctional buttons.
                  </p>
                </div>
              </div>
            </SettingSection>
          </div>

          <div id="settings-backup" className="scroll-mt-6">
            <SettingSection
              title="Backup and reset"
              description="Keep a portable copy of your browser preferences and skill profile."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => downloadSettings(settings)}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 text-left transition hover:border-blue-500/30"
                >
                  <Download size={22} className="text-blue-500" />
                  <span>
                    <span className="block text-sm font-bold">
                      Export settings
                    </span>
                    <span className="jp-muted mt-1 block text-xs">
                      Download JSON backup
                    </span>
                  </span>
                </button>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:border-blue-500/30">
                  <Upload size={22} className="text-teal-500" />
                  <span>
                    <span className="block text-sm font-bold">
                      Import settings
                    </span>
                    <span className="jp-muted mt-1 block text-xs">
                      Restore a JSON backup
                    </span>
                  </span>

                  <input
                    type="file"
                    accept=".json,application/json"
                    className="sr-only"
                    onChange={(event) => void importSettings(event)}
                  />
                </label>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-red-500"
                >
                  <RotateCcw size={17} />
                  Reset browser preferences
                </button>

                <p className="jp-muted mt-2 text-xs leading-6">
                  This resets only settings and the local skill
                  profile. It does not delete your PostgreSQL
                  applications, companies or interviews.
                </p>
              </div>
            </SettingSection>
          </div>
        </div>
      </div>

      {showReset && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/65 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="settings-reset-title"
            className="jp-card w-full max-w-md"
          >
            <h2
              id="settings-reset-title"
              className="text-xl font-extrabold"
            >
              Reset your preferences?
            </h2>

            <p className="jp-muted mt-3 text-sm leading-6">
              Appearance, productivity targets, privacy
              preferences and your local skill profile
              will return to their defaults.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="jp-button-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={resetPreferences}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Reset settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
