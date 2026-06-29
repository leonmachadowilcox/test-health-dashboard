export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Test Suite Health Dashboard
      </h1>
      <p className="text-sm text-slate-500">
        Pass/fail rates, flaky tests, and trends across recent runs
      </p>
    </header>
  );
}
