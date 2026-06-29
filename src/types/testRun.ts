// Shared domain types for test run data.
// These mirror the shape we expect once the FastAPI backend replaces mock data,
// so swapping the data source later shouldn't require touching component code.

/** Status of an individual test run, used to drive badge color. */
export type TestStatus = "pass" | "fail" | "flaky";

export interface TestRun {
  id: string;
  /** Name of the suite or test file, e.g. "auth.spec.ts" */
  suiteName: string;
  status: TestStatus;
  /** Total tests executed in this run */
  totalTests: number;
  passedTests: number;
  failedTests: number;
  /** ISO 8601 timestamp string */
  ranAt: string;
  /** Duration of the run in seconds */
  durationSeconds: number;
}

export interface PassRateSummary {
  /** 0-100 percentage */
  passRate: number;
  totalRuns: number;
  flakyCount: number;
}
