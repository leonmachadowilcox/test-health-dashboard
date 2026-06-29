import type { ReactNode } from "react";

interface HeaderProps {
  /** Rendered on the right side of the header, e.g. the upload button. */
  actions?: ReactNode;
}

export default function Header({ actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Test Suite Health Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Pass/fail rates, flaky tests, and trends across recent runs
        </p>
      </div>
      {actions}
    </header>
  );
}
