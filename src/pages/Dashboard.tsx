import Header from "../components/Header";
import PassRateCard from "../components/PassRateCard";
import TestRunCard from "../components/TestRunCard";
import ChartPlaceholder from "../components/ChartPlaceholder";
import { mockPassRateSummary, mockTestRuns } from "../utils/mockData";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PassRateCard summary={mockPassRateSummary} />
          <ChartPlaceholder />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-slate-500">
            Recent Test Runs
          </h2>
          <div className="space-y-3">
            {mockTestRuns.map((run) => (
              <TestRunCard key={run.id} run={run} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
