import { describe, it, expect } from "vitest";
import { parse, JestResultParseError } from "./parseJestResult";

// Minimal valid Jest --json report with two suites: one clean pass, one
// with a failure.
const validReport = {
  numTotalTests: 3,
  numPassedTests: 2,
  testResults: [
    {
      name: "/repo/src/auth.spec.ts",
      status: "passed",
      startTime: 1_000,
      endTime: 3_000,
      assertionResults: [
        { status: "passed", title: "logs in" },
        { status: "passed", title: "logs out" },
      ],
    },
    {
      name: "/repo/src/checkout.spec.ts",
      status: "failed",
      startTime: 4_000,
      endTime: 4_500,
      assertionResults: [{ status: "failed", title: "applies discount" }],
    },
  ],
};

describe("parse", () => {
  it("maps a well-formed Jest report to TestRuns + summary", () => {
    const { summary, testRuns } = parse(validReport);

    expect(testRuns).toHaveLength(2);
    expect(testRuns[0]).toMatchObject({
      suiteName: "auth.spec.ts",
      status: "pass",
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      durationSeconds: 2,
    });
    expect(testRuns[1]).toMatchObject({
      suiteName: "checkout.spec.ts",
      status: "fail",
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
    });

    expect(summary).toEqual({
      passRate: 66.7,
      totalRuns: 2,
      flakyCount: 0,
    });
  });

  it("accepts a raw JSON string and parses it the same way", () => {
    const { testRuns } = parse(JSON.stringify(validReport));
    expect(testRuns).toHaveLength(2);
  });

  it("flags a suite as flaky when a test passed after retries", () => {
    const report = {
      testResults: [
        {
          name: "search.spec.ts",
          status: "passed",
          startTime: 0,
          endTime: 1000,
          assertionResults: [
            { status: "passed", invocations: 2, retryReasons: ["timeout"] },
          ],
        },
      ],
    };

    const { testRuns, summary } = parse(report);
    expect(testRuns[0].status).toBe("flaky");
    expect(summary.flakyCount).toBe(1);
  });

  it("defaults missing fields instead of throwing", () => {
    const { summary, testRuns } = parse({ testResults: [{}] });

    expect(testRuns).toHaveLength(1);
    expect(testRuns[0]).toMatchObject({
      suiteName: "unknown-suite-1",
      status: "pass",
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    });
    expect(summary.passRate).toBe(0);
  });

  it("treats a suite that fails before any test runs as one failed run", () => {
    const report = {
      testResults: [
        {
          name: "broken.spec.ts",
          status: "failed",
          testExecError: { message: "SyntaxError: unexpected token" },
        },
      ],
    };

    const { testRuns } = parse(report);
    expect(testRuns[0]).toMatchObject({
      status: "fail",
      totalTests: 1,
      failedTests: 1,
    });
  });

  it("returns empty results for a non-object input", () => {
    expect(parse(null)).toEqual({
      summary: { passRate: 0, totalRuns: 0, flakyCount: 0 },
      testRuns: [],
    });
    expect(parse(undefined)).toEqual({
      summary: { passRate: 0, totalRuns: 0, flakyCount: 0 },
      testRuns: [],
    });
  });

  it("returns empty results when testResults is missing or not an array", () => {
    const { summary, testRuns } = parse({ numTotalTests: 5 });
    expect(testRuns).toEqual([]);
    expect(summary.totalRuns).toBe(0);
  });

  it("throws JestResultParseError for a string that isn't valid JSON", () => {
    expect(() => parse("{not valid json")).toThrow(JestResultParseError);
  });

  it("avoids divide-by-zero when there are zero total tests", () => {
    const { summary } = parse({ numTotalTests: 0, numPassedTests: 0, testResults: [] });
    expect(summary.passRate).toBe(0);
  });

  it("falls back to the epoch when startTime is not a valid number", () => {
    const { testRuns } = parse({
      testResults: [{ name: "weird.spec.ts", startTime: Number.NaN }],
    });
    expect(testRuns[0].ranAt).toBe(new Date(0).toISOString());
  });
});
