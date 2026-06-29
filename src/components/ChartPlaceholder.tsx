// Placeholder for the trend chart. Will be swapped for a real charting
// library (e.g. Recharts) once historical run data is wired up via the
// FastAPI backend.
export default function ChartPlaceholder() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Pass Rate Trend</p>
      <div className="mt-4 flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-400">Chart coming soon</p>
      </div>
    </div>
  );
}
