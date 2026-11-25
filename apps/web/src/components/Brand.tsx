
import { Send } from "lucide-react";

type BrandProps = {
  compact?: boolean;
  light?: boolean;
};

export function Brand({
  compact = false,
  light = false,
}: BrandProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
        <img
          src="/images/jobpilot-mark.png"
          alt=""
          className="h-full w-full object-contain"
        />
      </div>

      {!compact && (
        <div className="min-w-0">
          <div
            className={`text-xl font-extrabold tracking-[-0.055em] ${
              light ? "text-white" : "text-[var(--foreground)]"
            }`}
          >
            Job<span className="text-blue-500">Pilot</span>
          </div>
          <div
            className={`text-[10px] font-medium tracking-[0.16em] uppercase ${
              light ? "text-white/50" : "text-[var(--muted)]"
            }`}
          >
            Career workspace
          </div>
        </div>
      )}
    </div>
  );
}

export function FlightLoader() {
  return (
    <div
      role="status"
      aria-label="Loading JobPilot"
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]"
    >
      <div className="relative mb-7 flex h-27 w-27 items-center justify-center">
        <div className="jp-loader-orbit absolute inset-0 rounded-full border border-blue-500/20" />

        <div className="jp-loader-plane absolute text-blue-500">
          <Send size={22} fill="currentColor" />
        </div>

        <img
          src="/images/jobpilot-mark.png"
          alt=""
          className="jp-loader-logo relative h-20 w-20 object-contain"
        />
      </div>

      <div className="text-xl font-extrabold tracking-tight">
        Job<span className="text-blue-500">Pilot</span>
      </div>

      <p className="mt-2 text-xs text-[var(--muted)]">
        Preparing your workspace
      </p>
    </div>
  );
}
