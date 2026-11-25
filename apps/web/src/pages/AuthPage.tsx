
import {
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  Sun,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";

type Theme = "light" | "dark";

function getTheme(): Theme {
  const stored = localStorage.getItem("jobpilot-theme");

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? "dark"
    : "light";
}

export default function AuthPage({
  mode,
}: {
  mode: "login" | "register";
}) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  const [theme, setTheme] = useState(getTheme);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";

    setTheme(next);
    localStorage.setItem("jobpilot-theme", next);

    document.documentElement.classList.toggle(
      "dark",
      next === "dark"
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
        toast.success("Your workspace is ready");
      } else {
        await login(email.trim(), password);
        toast.success("Welcome back");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[52%_48%]">
      <section className="flex min-h-screen flex-col bg-[var(--background)] px-6 py-7 sm:px-10 xl:px-18">
        <div className="flex items-center justify-between">
          <Link to="/login">
            <Brand />
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle appearance"
            title="Switch appearance"
            className="jp-icon-button"
          >
            {theme === "dark"
              ? <Sun size={19} />
              : <Moon size={19} />}
          </button>
        </div>

        <main className="jp-fade-in mx-auto flex w-full max-w-105 flex-1 flex-col justify-center py-14">
          <div className="mb-9">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/8 px-3 py-1.5 text-xs font-semibold text-blue-500">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              YOUR CAREER, IN MOTION
            </div>

            <h1 className="text-[clamp(2.2rem,4vw,3.1rem)] leading-[1.1] font-extrabold tracking-[-0.065em]">
              {isRegister
                ? "Make your next move."
                : "Pick up where you"}
              {!isRegister && (
                <>
                  <br />
                  <span className="text-blue-500">
                    left off.
                  </span>
                </>
              )}
            </h1>

            <p className="jp-muted mt-4 max-w-sm text-sm leading-7">
              {isRegister
                ? "A clearer way to manage your job search, stay organized and build momentum."
                : "Your applications, interviews and next opportunities are right where you left them."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  className="jp-input"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="jp-input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isRegister ? 12 : 1}
                  maxLength={
                    isRegister ? 128 : undefined
                  }
                  autoComplete={
                    isRegister
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder={
                    isRegister
                      ? "At least 12 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="jp-input pr-12!"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="jp-muted absolute top-1/2 right-4 -translate-y-1/2"
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>
              </div>

              {isRegister && (
                <p className="jp-muted mt-2 text-xs">
                  Use at least 12 characters.
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-500"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="jp-button group mt-2 w-full py-3.5!"
            >
              {submitting
                ? "Please wait..."
                : isRegister
                  ? "Create my account"
                  : "Sign in to JobPilot"}

              {!submitting && (
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="jp-muted">
              {isRegister
                ? "Already have an account?"
                : "New to JobPilot?"}
            </span>

            {" "}

            <Link
              to={isRegister ? "/login" : "/register"}
              className="font-bold text-blue-500 hover:underline"
            >
              {isRegister
                ? "Sign in instead"
                : "Create an account"}
            </Link>
          </div>

          <div className="mt-12 flex items-start gap-3 border-t border-[var(--border)] pt-6">
            <LockKeyhole
              size={16}
              className="mt-0.5 shrink-0 text-emerald-500"
            />
            <p className="jp-muted text-xs leading-5">
              Your workspace is private. Your account
              uses secure password hashing and
              HTTP-only login cookies.
            </p>
          </div>
        </main>

        <footer className="jp-muted text-center text-xs">
          © 2026 JobPilot. Built for what's next.
        </footer>
      </section>

      <aside className="jp-auth-image relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="jp-grid-pattern pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex items-center justify-between px-12 pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            A better way forward
          </div>

          <TrendingUp
            size={23}
            className="text-white/70"
          />
        </div>

        <div className="relative z-10 px-12 pb-14 xl:px-16">
          <div className="mb-9 flex max-w-sm flex-col gap-3">
            {[
              "Keep every opportunity in sight",
              "Stay ready for every interview",
              "See how far you've come",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/12">
                  <Check
                    size={14}
                    className="text-emerald-300"
                  />
                </div>
                {item}
              </div>
            ))}
          </div>

          <div className="mb-5 h-1 w-12 rounded-full bg-blue-500" />

          <h2 className="max-w-lg text-[clamp(2.3rem,4vw,4.1rem)] leading-[1.08] font-extrabold tracking-[-0.065em] text-white">
            Your next chapter
            <br />
            starts here.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
            Less time juggling spreadsheets.
            More time moving toward the work you want.
          </p>

          <div className="mt-10 flex items-center gap-3 border-t border-white/15 pt-6">
            <div className="flex gap-1.5">
              <span className="h-1.5 w-7 rounded-full bg-blue-400" />
              <span className="h-1.5 w-3 rounded-full bg-white/25" />
              <span className="h-1.5 w-3 rounded-full bg-white/25" />
            </div>

            <span className="text-xs text-white/45">
              Track · Prepare · Progress
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
