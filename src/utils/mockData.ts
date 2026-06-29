import type { PassRateSummary, TestRun } from "../types/testRun";

// NOTE: Placeholder data only. Replace with FastAPI fetch calls once the
// backend parsing endpoints (JSON/XML test result ingestion) are ready.

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
  },
];
