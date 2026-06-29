import { useState } from "react";
import Header from "../components/Header";
import PassRateCard from "../components/PassRateCard";
import TestRunCard from "../components/TestRunCard";
import ChartPlaceholder from "../components/ChartPlaceholder";
import UploadButton from "../components/UploadButton";
import { mockPassRateSummary, mockTestRuns } from "../utils/mockData";
import type { ParsedJestResult } from "../utils/parseJestResult";

export default function Dashboard() {
  // Seeded with mock data; a successful upload replaces both with real
  // parsed results from the backend.
  const [summary, setSummary] = useState(mockPassRateSummary);
  const [testRuns, setTestRuns] = useState(mockTestRuns);

  function handleUploaded(result: ParsedJestResult) {
    setSummary(result.summary);
    setTestRuns(result.testRuns);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header actions={<UploadButton onUploaded={handleUploaded} />} />

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PassRateCard summary={summary} />
          <ChartPlaceholder />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-slate-500">
            Recent Test Runs
          </h2>
          <div className="space-y-3">
            {testRuns.map((run) => (
              <TestRunCard key={run.id} run={run} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
