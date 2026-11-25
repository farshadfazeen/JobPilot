
import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "./Brand";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Applications",
    path: "/applications",
    icon: BriefcaseBusiness,
  },
  {
    label: "Pipeline",
    path: "/pipeline",
    icon: Workflow,
  },
  {
    label: "Companies",
    path: "/companies",
    icon: Building2,
  },
  {
    label: "Contacts",
    path: "/contacts",
    icon: Users,
  },
  {
    label: "Interviews",
    path: "/interviews",
    icon: CalendarDays,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Job Analysis",
    path: "/job-analysis",
    icon: Sparkles,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function getTheme(): "dark" | "light" {
  const saved = localStorage.getItem("jobpilot-theme");

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? "dark"
    : "light";
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(getTheme);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    localStorage.setItem("jobpilot-theme", theme);
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const activeItem = navItems.find(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
  );

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const sidebarWidth = collapsed ? "lg:w-20" : "lg:w-67";
  const contentMargin = collapsed ? "lg:pl-20" : "lg:pl-67";

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
      toast.success("Signed out");
    } catch {
      toast.error("Couldn't sign out");
    }
  }

  return (
    <div className="min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/65 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-67 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-200 ${sidebarWidth} ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-21 items-center justify-between border-b border-[var(--border)] px-4">
          <Brand compact={collapsed} />

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="jp-icon-button lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {!collapsed && (
            <p className="jp-muted px-3 pt-4 pb-3 text-[10px] font-bold tracking-[0.16em] uppercase">
              Workspace
            </p>
          )}

          {navItems.slice(0, 8).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "jp-muted hover:bg-[var(--surface-alt)] hover:text-[var(--foreground)]"
                  }`
                }
              >
                <Icon
                  size={19}
                  className="shrink-0"
                  strokeWidth={1.85}
                />
                {!collapsed && item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-[var(--border)] p-3">
          <NavLink
            to="/settings"
            title="Settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                isActive
                  ? "bg-blue-500/10 text-blue-500"
                  : "jp-muted hover:bg-[var(--surface-alt)]"
              }`
            }
          >
            <Settings size={19} />
            {!collapsed && "Settings"}
          </NavLink>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="jp-muted hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[var(--surface-alt)] lg:flex"
          >
            {collapsed
              ? <ChevronRight size={19} />
              : <ChevronLeft size={19} />}

            {!collapsed && "Collapse sidebar"}
          </button>

          <div className="flex items-center gap-3 border-t border-[var(--border)] px-2 pt-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 font-bold text-violet-500">
              {user?.name.charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {user?.name}
                </p>
                <p className="jp-muted truncate text-xs">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`min-h-screen transition-all duration-200 ${contentMargin}`}>
        <header className="sticky top-0 z-30 flex h-21 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="jp-icon-button lg:hidden"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="jp-muted hidden text-[11px] sm:block">
              Workspace / {activeItem?.label ?? "JobPilot"}
            </p>

            <h1 className="truncate text-sm font-extrabold tracking-tight sm:text-base">
              {activeItem?.label ?? "JobPilot"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="jp-button-secondary hidden min-w-45 justify-between! gap-4 text-[var(--muted)]! md:inline-flex"
          >
            <span className="flex items-center gap-2">
              <Search size={16} />
              Quick search
            </span>
            <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px]">
              Ctrl K
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search pages"
            className="jp-icon-button md:hidden"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="jp-icon-button"
          >
            {theme === "dark"
              ? <Sun size={19} />
              : <Moon size={19} />}
          </button>

          <button
            type="button"
            onClick={() => navigate("/applications")}
            className="jp-button hidden sm:inline-flex"
          >
            <Plus size={17} />
            New application
          </button>
        </header>

        <main className="mx-auto max-w-350 px-4 py-7 sm:px-8 sm:py-9">
          <Outlet />
        </main>

        <footer className="mx-auto flex max-w-350 items-center justify-between gap-4 px-4 pb-8 sm:px-8">
          <p className="jp-muted text-xs">
            JobPilot © 2026
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="jp-muted flex items-center gap-2 text-xs hover:text-red-500"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </footer>
      </div>

      {searchOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSearchOpen(false);
            }
          }}
          className="fixed inset-0 z-100 flex justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick navigation"
            className="jp-fade-in h-fit w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] p-4">
              <Search
                size={20}
                className="text-blue-500"
              />

              <input
                autoFocus
                type="search"
                aria-label="Search JobPilot pages"
                placeholder="Where would you like to go?"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    filteredItems.length > 0
                  ) {
                    navigate(filteredItems[0].path);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />

              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="jp-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <p className="jp-muted p-5 text-center text-sm">
                  No matching pages.
                </p>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm hover:bg-[var(--surface-alt)]"
                    >
                      <Icon
                        size={18}
                        className="text-blue-500"
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      <ChevronRight
                        size={16}
                        className="jp-muted"
                      />
                    </button>
                  );
                })
              )}
            </div>

            <div className="jp-muted flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs">
              <span>Quick navigation</span>
              <span className="flex items-center gap-1">
                <Command size={13} />
                Esc to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
