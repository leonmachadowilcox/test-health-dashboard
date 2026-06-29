import type { TestStatus } from "../types/testRun";

interface StatusBadgeProps {
  status: TestStatus;
}

// Maps each status to its dot color + label. Centralized here so color
// choices stay consistent everywhere a status is rendered.
const STATUS_CONFIG: Record<TestStatus, { dotClass: string; label: string }> = {
  pass: { dotClass: "bg-status-pass", label: "Passing" },
  fail: { dotClass: "bg-status-fail", label: "Failing" },
  flaky: { dotClass: "bg-status-flaky", label: "Flaky" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { dotClass, label } = STATUS_CONFIG[status];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      {label}
    </span>
  );
}
