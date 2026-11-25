
import {
  ArrowRight,
  Construction,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

interface PlaceholderPageProps {
  title: string;
  description: string;
  features: string[];
}

export default function PlaceholderPage({
  title,
  description,
  features,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-7">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-blue-500">
          <Sparkles size={15} />
          JOBPILOT WORKSPACE
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">
          {title}
        </h1>

        <p className="jp-muted mt-2 text-sm">
          {description}
        </p>
      </div>

      <div className="jp-card">
        <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
          <Construction size={25} />
        </div>

        <h2 className="text-xl font-bold">
          Coming in the next development batch
        </h2>

        <p className="jp-muted mt-2 max-w-xl text-sm leading-6">
          This section is part of the planned JobPilot frontend.
          Its functional interface will be built in Batch B.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {feature}
            </div>
          ))}
        </div>

        <Link
          to="/dashboard"
          className="jp-button mt-7"
        >
          Back to Dashboard
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
}
