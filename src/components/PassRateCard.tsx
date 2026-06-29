import type { PassRateSummary } from "../types/testRun";

interface PassRateCardProps {
  summary: PassRateSummary;
}

export default function PassRateCard({ summary }: PassRateCardProps) {
  const { passRate, totalRuns, flakyCount } = summary;

  // Color the headline number based on rate thresholds — quick visual signal
  // before anyone reads the surrounding text.
  const rateColorClass =
    passRate >= 90
      ? "text-status-pass"
      : passRate >= 70
        ? "text-status-flaky"
        : "text-status-fail";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Overall Pass Rate</p>
      <p className={`mt-2 text-6xl font-bold tabular-nums ${rateColorClass}`}>
        {passRate}%
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {totalRuns} runs &middot; {flakyCount} flaky{" "}
        {flakyCount === 1 ? "test" : "tests"}
      </p>
    </div>
  );
}
