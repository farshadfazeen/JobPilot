
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  FileSearch,
  Info,
  LoaderCircle,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import {
  fetchWorkspaceApplications,
  loadPreferences,
  savePreferences,
  safeErrorMessage,
} from "../lib/jobpilotTools";
import type { Application } from "../lib/applications";

type Skill = {
  name: string;
  patterns: RegExp[];
  category: string;
};

const SKILLS: Skill[] = [
  { name: "HTML", category: "Frontend", patterns: [/\bhtml5?\b/i] },
  { name: "CSS", category: "Frontend", patterns: [/\bcss3?\b/i] },
  { name: "JavaScript", category: "Languages", patterns: [/\bjavascript\b/i, /\becmascript\b/i] },
  { name: "TypeScript", category: "Languages", patterns: [/\btypescript\b/i] },
  { name: "Python", category: "Languages", patterns: [/\bpython\b/i] },
  { name: "Java", category: "Languages", patterns: [/\bjava\b(?!script)/i] },
  { name: "C#", category: "Languages", patterns: [/\bc#\b/i, /\bc sharp\b/i, /\bc#(?=\s|$|[,.)])/i] },
  { name: "Go", category: "Languages", patterns: [/\bgolang\b/i, /\bgo language\b/i] },
  { name: "PHP", category: "Languages", patterns: [/\bphp\b/i] },
  { name: "SQL", category: "Databases", patterns: [/\bsql\b/i] },
  { name: "React", category: "Frontend", patterns: [/\breact(?:\.js|js)?\b/i] },
  { name: "Next.js", category: "Frontend", patterns: [/\bnext(?:\.js|js)\b/i] },
  { name: "Vue", category: "Frontend", patterns: [/\bvue(?:\.js|js)?\b/i] },
  { name: "Angular", category: "Frontend", patterns: [/\bangular\b/i] },
  { name: "Tailwind CSS", category: "Frontend", patterns: [/\btailwind(?:\s*css)?\b/i] },
  { name: "Node.js", category: "Backend", patterns: [/\bnode(?:\.js|js)\b/i] },
  { name: "Express", category: "Backend", patterns: [/\bexpress(?:\.js|js)?\b/i] },
  { name: "NestJS", category: "Backend", patterns: [/\bnest(?:\.js|js)\b/i] },
  { name: "Django", category: "Backend", patterns: [/\bdjango\b/i] },
  { name: "FastAPI", category: "Backend", patterns: [/\bfastapi\b/i] },
  { name: "Spring Boot", category: "Backend", patterns: [/\bspring\s*boot\b/i] },
  { name: ".NET", category: "Backend", patterns: [/\basp\.net\b/i, /(?<![a-z])\.net\b/i] },
  { name: "PostgreSQL", category: "Databases", patterns: [/\bpostgres(?:ql)?\b/i] },
  { name: "MySQL", category: "Databases", patterns: [/\bmysql\b/i] },
  { name: "MongoDB", category: "Databases", patterns: [/\bmongodb\b/i] },
  { name: "Redis", category: "Databases", patterns: [/\bredis\b/i] },
  { name: "Prisma", category: "Backend", patterns: [/\bprisma\b/i] },
  { name: "REST API", category: "Backend", patterns: [/\brest(?:ful)?\s*api(?:s)?\b/i] },
  { name: "GraphQL", category: "Backend", patterns: [/\bgraphql\b/i] },
  { name: "Git", category: "Developer Tools", patterns: [/\bgit\b/i] },
  { name: "GitHub", category: "Developer Tools", patterns: [/\bgithub\b/i] },
  { name: "Docker", category: "DevOps", patterns: [/\bdocker\b/i] },
  { name: "Kubernetes", category: "DevOps", patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { name: "CI/CD", category: "DevOps", patterns: [/\bci\s*\/\s*cd\b/i, /\bcontinuous integration\b/i] },
  { name: "AWS", category: "Cloud", patterns: [/\baws\b/i, /\bamazon web services\b/i] },
  { name: "Azure", category: "Cloud", patterns: [/\bazure\b/i] },
  { name: "Google Cloud", category: "Cloud", patterns: [/\bgcp\b/i, /\bgoogle cloud\b/i] },
  { name: "Linux", category: "Developer Tools", patterns: [/\blinux\b/i] },
  { name: "Jest", category: "Testing", patterns: [/\bjest\b/i] },
  { name: "Vitest", category: "Testing", patterns: [/\bvitest\b/i] },
  { name: "Playwright", category: "Testing", patterns: [/\bplaywright\b/i] },
  { name: "Cypress", category: "Testing", patterns: [/\bcypress\b/i] },
  { name: "PyTorch", category: "Data & AI", patterns: [/\bpytorch\b/i] },
  { name: "TensorFlow", category: "Data & AI", patterns: [/\btensorflow\b/i] },
  { name: "Pandas", category: "Data & AI", patterns: [/\bpandas\b/i] },
  { name: "scikit-learn", category: "Data & AI", patterns: [/\bscikit[- ]learn\b/i, /\bsklearn\b/i] },
];

const SUGGESTED_SKILLS = SKILLS.map((s) => s.name);

type Finding = {
  skill: string;
  category: string;
  evidence: string;
  matched: boolean;
};

function extractEvidence(text: string, pattern: RegExp): string {
  const match = pattern.exec(text);

  if (!match) return "";

  const start = Math.max(0, match.index - 65);
  const end = Math.min(
    text.length,
    match.index + match[0].length + 85
  );

  const excerpt = text
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim();

  return `${start > 0 ? "..." : ""}${excerpt}${
    end < text.length ? "..." : ""
  }`;
}

function analyzeDescription(
  text: string,
  knownSkills: string[]
): Finding[] {
  const known = new Set(
    knownSkills.map((skill) => skill.toLowerCase())
  );

  return SKILLS.flatMap((skill) => {
    const pattern = skill.patterns.find((p) => p.test(text));

    if (!pattern) return [];

    return [{
      skill: skill.name,
      category: skill.category,
      evidence: extractEvidence(text, pattern),
      matched: known.has(skill.name.toLowerCase()),
    }];
  });
}

function SkillChip({
  name,
  selected,
  onClick,
}: {
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        selected
          ? "border-blue-500 bg-blue-500/10 text-blue-500"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/40"
      }`}
    >
      {selected ? "âœ“ " : "+ "}
      {name}
    </button>
  );
}

export default function JobAnalysisPage() {
  const [description, setDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState("");
  const [skills, setSkills] = useState<string[]>(
    () => loadPreferences().skills
  );
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkills, setShowSkills] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [analyzedTitle, setAnalyzedTitle] = useState("");

  const applicationsQuery = useQuery({
    queryKey: ["job-analysis-applications"],
    queryFn: fetchWorkspaceApplications,
    staleTime: 30_000,
  });

  useEffect(() => {
    function syncSkills() {
      setSkills(loadPreferences().skills);
    }

    window.addEventListener(
      "jobpilot:settings-changed",
      syncSkills
    );

    return () => window.removeEventListener(
      "jobpilot:settings-changed",
      syncSkills
    );
  }, []);

  const availableSkills = useMemo(
    () => SUGGESTED_SKILLS.filter((skill) =>
      skill.toLowerCase().includes(skillSearch.toLowerCase())
    ),
    [skillSearch]
  );

  const matched = findings?.filter((item) => item.matched) ?? [];
  const missing = findings?.filter((item) => !item.matched) ?? [];

  function toggleSkill(name: string) {
    const updated = skills.includes(name)
      ? skills.filter((item) => item !== name)
      : [...skills, name];

    setSkills(updated);

    const preferences = loadPreferences();
    savePreferences({ ...preferences, skills: updated });

    // Recompute if the skill profile changes.
    if (findings !== null) {
      setFindings(analyzeDescription(description, updated));
    }
  }

  function selectApplication(id: string) {
    setSelectedApplication(id);
    setFindings(null);

    if (!id) return;

    const item = applicationsQuery.data?.find(
      (application: Application) => application.id === id
    );

    if (!item) return;

    setJobTitle(item.jobTitle);
    setDescription(item.description ?? "");

    if (!item.description) {
      toast.info(
        "This application has no description. Paste one to analyze."
      );
    }
  }

  function runAnalysis() {
    if (description.trim().length < 30) {
      toast.error(
        "Please enter at least 30 characters of job description."
      );
      return;
    }

    setFindings(analyzeDescription(description, skills));
    setAnalyzedTitle(jobTitle.trim() || "Job description");
    toast.success("Requirements extracted");
  }

  function clearAnalysis() {
    setDescription("");
    setJobTitle("");
    setSelectedApplication("");
    setFindings(null);
    setAnalyzedTitle("");
  }

  const coverage = findings && findings.length > 0
    ? Math.round((matched.length / findings.length) * 100)
    : null;

  return (
    <div className="jp-fade-in space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jp-eyebrow">
            JobPilot Intelligence / Rule-based analysis
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Job analysis
            <span className="text-blue-500">.</span>
          </h1>

          <p className="jp-muted mt-3 max-w-2xl text-sm leading-6">
            Extract technical requirements and compare them
            with skills you've confirmed. Every detection
            comes with supporting text from the job posting.
          </p>
        </div>

        <Link
          to="/settings"
          className="jp-button-secondary"
        >
          <Settings2 size={17} />
          Skill profile
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-[#141827] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-violet-600/25 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-violet-300 uppercase">
              <FileSearch size={17} />
              Read the requirements
            </div>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
              Know what a role asks for.
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              Check the evidence, identify possible skill
              gaps and prepare for the opportunity.
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-violet-300">
            <Target size={30} />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="jp-card space-y-5">
          <div>
            <p className="jp-eyebrow">Step 01</p>
            <h2 className="mt-2 text-lg font-extrabold">
              Add the job description
            </h2>
          </div>

          <div>
            <label htmlFor="saved-job" className="mb-2 block text-sm font-semibold">
              Load a saved application (optional)
            </label>

            <select
              id="saved-job"
              className="jp-input"
              value={selectedApplication}
              onChange={(event) => selectApplication(event.target.value)}
            >
              <option value="">Paste a new description instead</option>
              {applicationsQuery.data?.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.jobTitle} - {app.company?.name ?? "Company"}
                </option>
              ))}
            </select>

            {applicationsQuery.isLoading && (
              <p className="jp-muted mt-2 text-xs">
                <LoaderCircle size={12} className="mr-1 inline animate-spin" />
                Loading saved applications...
              </p>
            )}

            {applicationsQuery.isError && (
              <p className="mt-2 text-xs text-amber-500">
                Could not load saved applications:{" "}
                {safeErrorMessage(applicationsQuery.error)}.
                You can still paste a description.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="analysis-title" className="mb-2 block text-sm font-semibold">
              Role name
            </label>
            <input
              id="analysis-title"
              className="jp-input"
              maxLength={180}
              placeholder="e.g. Junior Full Stack Developer"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="analysis-description" className="mb-2 block text-sm font-semibold">
              Job description
            </label>

            <textarea
              id="analysis-description"
              rows={15}
              maxLength={20000}
              className="jp-input resize-y leading-7"
              placeholder="Paste the responsibilities, requirements and technology stack from the job posting..."
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFindings(null);
              }}
            />

            <p className="jp-muted mt-2 text-right text-xs">
              {description.length} / 20,000 characters
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearAnalysis}
              className="jp-button-secondary"
            >
              <RotateCcw size={16} />
              Clear
            </button>

            <button
              type="button"
              onClick={runAnalysis}
              className="jp-button"
            >
              <Search size={17} />
              Analyze requirements
            </button>
          </div>
        </section>

        <section className="jp-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="jp-eyebrow">Step 02</p>
              <h2 className="mt-2 text-lg font-extrabold">
                Your skill profile
              </h2>
              <p className="jp-muted mt-2 text-xs leading-5">
                Only select skills you can genuinely demonstrate.
              </p>
            </div>
            <ShieldCheck size={22} className="text-teal-500" />
          </div>

          <div className="mt-5 rounded-xl bg-blue-500/8 p-4">
            <p className="text-2xl font-extrabold text-blue-500">
              {skills.length}
            </p>
            <p className="jp-muted mt-1 text-xs">
              Skills you've selected
            </p>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowSkills((v) => !v)}
              className="jp-button-secondary w-full justify-between!"
            >
              Manage technical skills
              <ChevronDown size={17} />
            </button>

            {showSkills && (
              <div className="mt-4 space-y-3">
                <input
                  type="search"
                  aria-label="Search available skills"
                  placeholder="Find a skill..."
                  className="jp-input"
                  value={skillSearch}
                  onChange={(event) => setSkillSearch(event.target.value)}
                />

                <div className="flex max-h-75 flex-wrap gap-2 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <SkillChip
                      key={skill}
                      name={skill}
                      selected={skills.includes(skill)}
                      onClick={() => toggleSkill(skill)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {skills.length === 0 ? (
              <p className="jp-muted text-xs">
                No skills selected yet. You can still extract
                requirements, but matching needs your profile.
              </p>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-alt)] px-2.5 py-1.5 text-xs font-semibold"
                >
                  <Check size={12} className="text-teal-500" />
                  {skill}
                </span>
              ))
            )}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-[var(--border)] p-4">
            <Info size={17} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="jp-muted text-xs leading-6">
              This version detects named technologies,
              not proficiency, years of experience,
              qualifications or hiring suitability.
              A skill not selected here is unconfirmed,
              not necessarily missing.
            </p>
          </div>
        </section>
      </div>

      {findings !== null && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="jp-eyebrow">Step 03 / Analysis results</p>
              <h2 className="mt-2 text-2xl font-extrabold">
                {analyzedTitle}
              </h2>
            </div>
            <span className="rounded-full bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-500">
              <CheckCircle2 size={15} className="mr-1 inline" />
              Analysis complete
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Technologies detected", findings.length, "#3b82f6"],
              ["In your skill profile", matched.length, "#10b981"],
              ["Not yet confirmed", missing.length, "#f59e0b"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="jp-card">
                <p className="jp-muted text-xs">{label}</p>
                <p
                  className="mt-3 text-3xl font-extrabold"
                  style={{ color: String(color) }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {coverage !== null && (
            <div className="jp-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold">Listed-skill overlap</h3>
                  <p className="jp-muted mt-1 text-xs">
                    Confirmed skills divided by detected technologies.
                    This is not a hiring probability.
                  </p>
                </div>
                <span className="text-2xl font-extrabold text-blue-500">
                  {coverage}%
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-alt)]">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${coverage}%` }}
                />
              </div>
            </div>
          )}

          {findings.length === 0 ? (
            <div className="jp-card py-12 text-center">
              <FileSearch size={30} className="mx-auto text-blue-500" />
              <h3 className="mt-4 text-lg font-extrabold">
                No technologies from our dictionary detected
              </h3>
              <p className="jp-muted mx-auto mt-2 max-w-md text-sm leading-6">
                The job may use different terms, or emphasize
                responsibilities rather than technologies.
                Review the original description manually.
              </p>
            </div>
          ) : (
            <div className="grid items-start gap-5 lg:grid-cols-2">
              {[
                {
                  title: "Confirmed matches",
                  subtitle: "Skills you've explicitly selected",
                  items: matched,
                  color: "#10b981",
                  icon: CheckCircle2,
                },
                {
                  title: "Skills to verify or study",
                  subtitle: "Mentioned in the job but not confirmed",
                  items: missing,
                  color: "#f59e0b",
                  icon: BookOpen,
                },
              ].map((group) => {
                const Icon = group.icon;

                return (
                  <section key={group.title} className="jp-card">
                    <div className="flex items-center gap-3">
                      <Icon size={21} style={{ color: group.color }} />
                      <div>
                        <h3 className="font-extrabold">{group.title}</h3>
                        <p className="jp-muted mt-1 text-xs">
                          {group.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {group.items.length === 0 ? (
                        <p className="jp-muted rounded-xl bg-[var(--surface-alt)] p-5 text-sm">
                          No skills in this group.
                        </p>
                      ) : (
                        group.items.map((item) => (
                          <article
                            key={item.skill}
                            className="rounded-xl border border-[var(--border)] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-sm font-bold">
                                {item.skill}
                              </h4>
                              <span className="jp-muted rounded-lg bg-[var(--surface-alt)] px-2 py-1 text-[10px]">
                                {item.category}
                              </span>
                            </div>

                            <p className="jp-muted mt-3 text-xs leading-6">
                              <strong className="text-[var(--foreground)]">
                                Evidence:
                              </strong>{" "}
                              {item.evidence}
                            </p>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-5">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-teal-500"
            />
            <p className="jp-muted text-xs leading-6">
              <strong className="text-[var(--foreground)]">
                Accuracy note:
              </strong>{" "}
              The analyzer uses exact technology-name patterns.
              It may miss synonyms, implicit requirements,
              negation such as "React not required", and context
              about whether a skill is preferred versus required.
              Always check the source evidence before using the
              result to make a career decision.
            </p>
          </div>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
        <p className="jp-muted flex items-center gap-2 text-xs">
          <ClipboardPaste size={15} />
          Pasted descriptions are analyzed in your browser,
          not uploaded to a separate AI service.
        </p>

        <Link
          to="/applications"
          className="flex items-center gap-2 text-xs font-bold text-blue-500"
        >
          Applications
          <ArrowRight size={15} />
        </Link>
      </footer>
    </div>
  );
}
