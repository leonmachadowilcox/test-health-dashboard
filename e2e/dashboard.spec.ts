import { test, expect } from "@playwright/test";

const VALID_JEST_REPORT = {
  numTotalTests: 5,
  numPassedTests: 4,
  numFailedTests: 1,
  testResults: [
    {
      name: "src/App.test.tsx",
      status: "failed",
      assertionResults: [
        { fullName: "renders the dashboard title", status: "passed" },
        { fullName: "shows pass rate card", status: "passed" },
        { fullName: "displays trend chart", status: "passed" },
        { fullName: "handles empty state", status: "passed" },
        { fullName: "flaky test example", status: "failed" },
      ],
    },
  ],
};

// Must match ParsedJestResult shape from parseJestResult.ts
const MOCK_PARSED_RESULT = {
  summary: {
    passRate: 80,
    totalRuns: 1,
    flakyCount: 0,
  },
  testRuns: [
    {
      id: "App.test.tsx-0-0",
      suiteName: "App.test.tsx",
      status: "fail",
      totalTests: 5,
      passedTests: 4,
      failedTests: 1,
      ranAt: new Date(0).toISOString(),
      durationSeconds: 0,
      flaky: false,
    },
  ],
};

test("dashboard loads with header", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});

test("upload and parse Jest JSON report", async ({ page }) => {
  // Route must match the actual endpoint: /upload/jest
  await page.route("**/upload/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_PARSED_RESULT),
    });
  });

  await page.goto("/");

  const fileContent = JSON.stringify(VALID_JEST_REPORT);
  await page.locator('input[type="file"]').setInputFiles({
    name: "jest-report.json",
    mimeType: "application/json",
    buffer: Buffer.from(fileContent),
  });

  // Button returns to idle when upload completes
  await expect(
    page.getByRole("button", { name: /upload test results/i })
  ).toBeVisible({ timeout: 5000 });

  // Verify parsed data rendered — passRate is 80 (4/5)
  await expect(page.getByText("80")).toBeVisible({ timeout: 5000 });
});

test("rejects invalid file upload", async ({ page }) => {
  await page.route("**/upload/**", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Invalid JSON format" }),
    });
  });

  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("not valid json"),
  });

  // safeReadErrorDetail extracts the "detail" field from the 400 response
  await expect(page.getByText("Invalid JSON format")).toBeVisible({
    timeout: 5000,
  });
});