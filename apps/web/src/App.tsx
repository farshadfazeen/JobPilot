
import {
  useEffect,
  type ReactNode,
} from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";

import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import PipelinePage from "./pages/PipelinePage";
import CompaniesPage from "./pages/CompaniesPage";
import ContactsPage from "./pages/ContactsPage";
import InterviewsPage from "./pages/InterviewsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import JobAnalysisPage from "./pages/JobAnalysisPage";
import SettingsPage from "./pages/SettingsPage";
import TimedLoader from "./components/TimedLoader";
import {
  applyPreferences,
  loadPreferences,
  SETTINGS_EVENT,
} from "./lib/jobpilotTools";

import "./settings-effects.css";

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  return (
    <TimedLoader loading={loading}>
      {user ? children : <Navigate to="/login" replace />}
    </TimedLoader>
  );
}

function PublicRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  return (
    <TimedLoader loading={loading}>
      {user ? <Navigate to="/dashboard" replace /> : children}
    </TimedLoader>
  );
}

export default function App() {
  useEffect(() => {
    const sync = () => {
      applyPreferences(loadPreferences());
    };

    sync();

    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    window.addEventListener(SETTINGS_EVENT, sync);
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, sync);
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage mode="login" />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthPage mode="register" />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/applications"
          element={<ApplicationsPage />}
        />

        <Route
          path="/applications/:id"
          element={<ApplicationDetailPage />}
        />

        <Route
          path="/pipeline"
          element={<PipelinePage />}
        />

        <Route
          path="/companies"
          element={<CompaniesPage />}
        />

        <Route
          path="/contacts"
          element={<ContactsPage />}
        />

        <Route
          path="/interviews"
          element={<InterviewsPage />}
        />

        <Route
          path="/analytics"
          element={<AnalyticsPage />}
        />

        <Route
          path="/job-analysis"
          element={<JobAnalysisPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
