// Parses Jest's `--json` test result output into our internal domain types
// (TestRun, PassRateSummary). Input is untrusted (a file the user dropped in),
// so every field is treated as optional and missing/malformed data falls
// back to sane defaults rather than throwing. We only throw when the input
// can't be interpreted as JSON/an object at all.

import type { PassRateSummary, TestRun, TestStatus } from "../types/testRun";

/** Shape of a single assertion (test case) inside a Jest suite result.
 *  All fields optional — third-party tool output is never fully trusted. */
interface JestAssertionResult {
  status?: string;
  title?: string;
  duration?: number | null;
  /** Present when Jest retries (jest.retryTimes / jest-circus). >1 means
   *  the test failed at least once before eventually passing. */
  invocations?: number;
  /** Present alongside invocations on some Jest versions; non-empty means
   *  at least one retry attempt failed. */
  retryReasons?: unknown[];
}

/** Shape of a single suite (test file) result inside `testResults[]`. */
interface JestSuiteResult {
  name?: string;
  status?: string;
  startTime?: number;
  endTime?: number;
  assertionResults?: JestAssertionResult[];
  /** Set when the whole file failed to execute (e.g. a syntax error),
   *  in which case assertionResults is typically empty. */
  testExecError?: { message?: string };
}

/** Top-level shape of a `jest --json` report. */
interface JestRawReport {
  numTotalTests?: number;
  numPassedTests?: number;
  testResults?: JestSuiteResult[];
}

export interface ParsedJestResult {
  summary: PassRateSummary;
  testRuns: TestRun[];
}

/**
 * Thrown only when the input cannot be treated as JSON/an object at all
 * (e.g. a string input that fails JSON.parse). Missing or malformed fields
 * inside an otherwise-parseable object are handled gracefully and do NOT
 * throw — see `parse()`.
 */
export class JestResultParseError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "JestResultParseError";
  }
}

const EMPTY_SUMMARY: PassRateSummary = {
  passRate: 0,
  totalRuns: 0,
  flakyCount: 0,
};

/**
 * Parse a Jest `--json` report into our dashboard's domain types.
 *
 * @param input Either the raw JSON text of a Jest result file, or an
 *   already-parsed object (e.g. from `JSON.parse` or `response.json()`).
 * @throws {JestResultParseError} if `input` is a string that isn't valid
 *   JSON. All other malformed shapes degrade to defaults instead.
 */
export function parse(input: unknown): ParsedJestResult {
  const report = normalizeInput(input);

  if (!report || typeof report !== "object") {
    return { summary: EMPTY_SUMMARY, testRuns: [] };
  }

  const raw = report as JestRawReport;
  const suites = Array.isArray(raw.testResults) ? raw.testResults : [];

  const testRuns = suites.map((suite, index) => toTestRun(suite, index));
  const summary = buildSummary(raw, testRuns);

  return { summary, testRuns };
}

/** Accepts a raw JSON string or an already-parsed value. Throws
 *  JestResultParseError if a string input isn't valid JSON. */
function normalizeInput(input: unknown): unknown {
  if (typeof input !== "string") {
    return input;
  }
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new JestResultParseError(
      "Could not parse Jest result file: input is not valid JSON.",
      err
    );
  }
}

function toTestRun(suite: JestSuiteResult, index: number): TestRun {
  const assertions = Array.isArray(suite.assertionResults)
    ? suite.assertionResults
    : [];

  const hasAssertions = assertions.length > 0;
  const passedTests = assertions.filter((a) => a.status === "passed").length;
  const failedFromAssertions = assertions.filter(
    (a) => a.status === "failed"
  ).length;

  // Suites that fail before any test runs (e.g. a syntax error in the test
  // file) report no assertionResults at all, but the suite itself still
  // counts as one failed run.
  const failedTests = hasAssertions
    ? failedFromAssertions
    : suite.status === "failed"
      ? 1
      : 0;
  const totalTests = hasAssertions ? assertions.length : failedTests;

  const startTime = isFiniteNumber(suite.startTime) ? suite.startTime : 0;
  const endTime = isFiniteNumber(suite.endTime) ? suite.endTime : startTime;

  return {
    id: buildId(suite, index),
    suiteName: extractSuiteName(suite, index),
    status: determineStatus(suite, assertions, failedTests),
    totalTests,
    passedTests,
    failedTests,
    ranAt: safeIsoString(startTime),
    durationSeconds: Math.max(0, (endTime - startTime) / 1000),
  };
}

function determineStatus(
  suite: JestSuiteResult,
  assertions: JestAssertionResult[],
  failedTests: number
): TestStatus {
  if (suite.status === "failed" || failedTests > 0) {
    return "fail";
  }

  const wasFlaky = assertions.some(
    (a) =>
      a.status === "passed" &&
      ((typeof a.invocations === "number" && a.invocations > 1) ||
        (Array.isArray(a.retryReasons) && a.retryReasons.length > 0))
  );

  return wasFlaky ? "flaky" : "pass";
}

function extractSuiteName(suite: JestSuiteResult, index: number): string {
  if (typeof suite.name === "string" && suite.name.trim().length > 0) {
    const parts = suite.name.split(/[\\/]/);
    return parts[parts.length - 1] || suite.name;
  }
  return `unknown-suite-${index + 1}`;
}

function buildId(suite: JestSuiteResult, index: number): string {
  const base = extractSuiteName(suite, index);
  const time = isFiniteNumber(suite.startTime) ? suite.startTime : index;
  return `${base}-${time}-${index}`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function safeIsoString(epochMs: number): string {
  const date = new Date(epochMs);
  return Number.isNaN(date.getTime())
    ? new Date(0).toISOString()
    : date.toISOString();
}

function buildSummary(
  raw: JestRawReport,
  testRuns: TestRun[]
): PassRateSummary {
  const totalTests =
    typeof raw.numTotalTests === "number"
      ? raw.numTotalTests
      : testRuns.reduce((sum, run) => sum + run.totalTests, 0);

  const passedTests =
    typeof raw.numPassedTests === "number"
      ? raw.numPassedTests
      : testRuns.reduce((sum, run) => sum + run.passedTests, 0);

  const passRate =
    totalTests > 0
      ? Math.round((passedTests / totalTests) * 1000) / 10
      : 0;

  return {
    passRate,
    // One TestRun = one suite/file in this report. Revisit this mapping if
    // the backend later defines "run" as a whole CI invocation instead.
    totalRuns: testRuns.length,
    flakyCount: testRuns.filter((run) => run.status === "flaky").length,
  };
}
