import { useEffect, useState } from "react";
import Header from "../components/Header";
import PassRateCard from "../components/PassRateCard";
import TestRunCard from "../components/TestRunCard";
import TrendChart from "../components/TrendChart";
import UploadButton from "../components/UploadButton";
import { fetchRunHistory } from "../utils/api";
import { mockPassRateSummary, mockRunHistory, mockTestRuns } from "../utils/mockData";
import type { ParsedJestResult } from "../utils/parseJestResult";

export default function Dashboard() {
  // Seeded with mock data; a successful upload — or an existing run history
  // on the backend — replaces it with real data.
  const [summary, setSummary] = useState(mockPassRateSummary);
  const [testRuns, setTestRuns] = useState(mockTestRuns);
  const [runHistory, setRunHistory] = useState(mockRunHistory);

  // On page load, pull whatever upload history the backend already has
  // (in-memory, so this is empty after a fresh backend restart) to
  // populate the trend chart and hydrate the current summary/test runs.
  useEffect(() => {
    let cancelled = false;

    fetchRunHistory()
      .then((history) => {
        if (cancelled || history.length === 0) return;
        setRunHistory(history);
        setSummary(history[0].summary);
        setTestRuns(history[0].testRuns);
      })
      .catch(() => {
        // Backend not reachable yet, or genuinely has no history — keep
        // the seeded mock data so the dashboard still looks presentable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleUploaded(result: ParsedJestResult) {
    setSummary(result.summary);
    setTestRuns(result.testRuns);

    // The upload response only carries this run's own data; re-fetch the
    // full history so the trend chart includes it.
    fetchRunHistory()
      .then((history) => {
        if (history.length > 0) setRunHistory(history);
      })
      .catch(() => {
        // Chart just won't refresh this cycle; the next successful fetch
        // (e.g. the next upload) will pick it up.
      });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header actions={<UploadButton onUploaded={handleUploaded} />} />

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PassRateCard summary={summary} />
          <TrendChart runs={runHistory} />
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
