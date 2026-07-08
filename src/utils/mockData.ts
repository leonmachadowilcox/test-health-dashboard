import type { PassRateSummary, RunHistoryEntry, TestRun } from "../types/testRun";

// NOTE: Placeholder data only, shown until the backend has real upload
// history. Dashboard.tsx replaces it with live data from GET /runs (and
// POST /upload/{format} results) as soon as either succeeds.

export const mockPassRateSummary: PassRateSummary = {
  passRate: 92,
  totalRuns: 48,
  flakyCount: 3,
};

export const mockTestRuns: TestRun[] = [
  {
    id: "run-1",
    suiteName: "auth.spec.ts",
    status: "pass",
    totalTests: 24,
    passedTests: 24,
    failedTests: 0,
    ranAt: "2026-06-29T14:32:00Z",
    durationSeconds: 18,
    flaky: false,
  },
  {
    id: "run-2",
    suiteName: "checkout.spec.ts",
    status: "fail",
    totalTests: 31,
    passedTests: 27,
    failedTests: 4,
    ranAt: "2026-06-29T13:10:00Z",
    durationSeconds: 42,
    flaky: false,
  },
  {
    id: "run-3",
    suiteName: "search.spec.ts",
    status: "flaky",
    totalTests: 18,
    passedTests: 17,
    failedTests: 1,
    ranAt: "2026-06-29T11:55:00Z",
    durationSeconds: 12,
    flaky: true,
  },
  {
    id: "run-4",
    suiteName: "profile.spec.ts",
    status: "pass",
    totalTests: 12,
    passedTests: 12,
    failedTests: 0,
    ranAt: "2026-06-29T09:20:00Z",
    durationSeconds: 9,
    flaky: false,
  },
  {
    id: "run-5",
    suiteName: "billing.spec.ts",
    status: "pass",
    totalTests: 20,
    passedTests: 20,
    failedTests: 0,
    ranAt: "2026-06-28T22:48:00Z",
    durationSeconds: 16,
    flaky: false,
  },
];

// Mock trend data: a pass rate history spanning the red/yellow/green
// thresholds so the chart's color-coding is visible before any real
// uploads exist.
const MOCK_PASS_RATES = [68, 74, 71, 79, 83, 88, 91, 87, 94, 96];

export const mockRunHistory: RunHistoryEntry[] = MOCK_PASS_RATES.map(
  (passRate, i) => {
    const hoursAgo = (MOCK_PASS_RATES.length - 1 - i) * 6;
    const uploadedAt = new Date(
      Date.parse("2026-06-29T14:32:00Z") - hoursAgo * 60 * 60 * 1000
    ).toISOString();
    return {
      runId: `mock-run-${i + 1}`,
      uploadedAt,
      summary: { passRate, totalRuns: 5, flakyCount: passRate < 90 ? 1 : 0 },
      testRuns: mockTestRuns,
    };
  }
).reverse(); // newest first, matching GET /runs
