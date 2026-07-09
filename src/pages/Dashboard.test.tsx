import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard";

vi.mock("../utils/api", () => ({
    fetchRunHistory: vi.fn(),
    uploadTestResultFile: vi.fn(),
    UploadError: class UploadError extends Error { },
}));

import { fetchRunHistory, uploadTestResultFile } from "../utils/api";
const mockedFetchRunHistory = vi.mocked(fetchRunHistory);
const mockedUpload = vi.mocked(uploadTestResultFile);

const mockHistory = [
    {
        runId: "run-1",
        uploadedAt: "2026-06-29T10:32:00.000Z",
        summary: { passRate: 92, totalRuns: 3, flakyCount: 0 },
        testRuns: [
            {
                id: "test-1",
                suiteName: "App.test.tsx",
                status: "pass" as const,
                totalTests: 5,
                passedTests: 5,
                failedTests: 0,
                ranAt: "2026-06-29T10:32:00.000Z",
                durationSeconds: 18,
                flaky: false,
            },
        ],
    },
];

describe("Dashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedFetchRunHistory.mockResolvedValue([]);
    });

    it("renders header with title", () => {
        render(<Dashboard />);
        expect(
            screen.getByText("Test Suite Health Dashboard")
        ).toBeInTheDocument();
    });

    it("renders pass rate card", () => {
        render(<Dashboard />);
        expect(screen.getByText("Overall Pass Rate")).toBeInTheDocument();
    });

    it("renders recent test runs section", () => {
        render(<Dashboard />);
        expect(screen.getByText("Recent Test Runs")).toBeInTheDocument();
    });

    it("fetches run history on mount", () => {
        render(<Dashboard />);
        expect(fetchRunHistory).toHaveBeenCalledTimes(1);
    });

    it("updates with real data when history is fetched", async () => {
        mockedFetchRunHistory.mockResolvedValue(mockHistory);
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText("92%")).toBeInTheDocument();
        });
    });

    it("keeps mock data when backend returns empty history", async () => {
        mockedFetchRunHistory.mockResolvedValue([]);
        render(<Dashboard />);

        expect(screen.getByText("Overall Pass Rate")).toBeInTheDocument();
    });

    it("handles upload and updates display", async () => {
        const user = userEvent.setup();
        mockedUpload.mockResolvedValue({
            summary: { passRate: 75, totalRuns: 2, flakyCount: 1 },
            testRuns: [],
        });

        const { container } = render(<Dashboard />);

        const input = container.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;

        const file = new File([JSON.stringify({})], "report.json", {
            type: "application/json",
        });

        await user.upload(input, file);

        await waitFor(() => {
            expect(screen.getByText("75%")).toBeInTheDocument();
        });
    });
});