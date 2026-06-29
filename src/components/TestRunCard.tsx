import type { TestRun } from "../types/testRun";
import StatusBadge from "./StatusBadge";

interface TestRunCardProps {
  run: TestRun;
}

// Formats an ISO timestamp into a short, readable local time string.
function formatRanAt(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TestRunCard({ run }: TestRunCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="font-medium text-slate-900">{run.suiteName}</p>
        <p className="text-xs text-slate-500">
          {run.passedTests}/{run.totalTests} passed &middot;{" "}
          {run.durationSeconds}s &middot; {formatRanAt(run.ranAt)}
        </p>
      </div>
      <StatusBadge status={run.status} />
    </div>
  );
}
