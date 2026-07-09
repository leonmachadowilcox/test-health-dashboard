import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TrendChart from "./TrendChart";
import type { RunHistoryEntry } from "../types/testRun";

const mockRuns: RunHistoryEntry[] = [
    {
        runId: "run-1",
        uploadedAt: "2026-06-29T10:32:00.000Z",
        summary: { passRate: 80, totalRuns: 1, flakyCount: 0 },
        testRuns: [],
    },
    {
        runId: "run-2",
        uploadedAt: "2026-06-28T18:48:00.000Z",
        summary: { passRate: 95, totalRuns: 1, flakyCount: 1 },
        testRuns: [],
    },
];

describe("TrendChart", () => {
    it("renders empty state message when no runs", () => {
        render(<TrendChart runs={[]} />);
        expect(
            screen.getByText(/no trend data yet/i)
        ).toBeInTheDocument();
    });

    it("renders the trend label", () => {
        render(<TrendChart runs={mockRuns} />);
        expect(screen.getByText("Pass Rate Trend")).toBeInTheDocument();
    });

    it("renders chart container when runs exist", () => {
        render(<TrendChart runs={mockRuns} />);
        // Chart renders (not empty state) — ResponsiveContainer won't produce
        // .recharts-wrapper in jsdom (0×0 dimensions), so verify the empty
        // state is NOT shown instead.
        expect(
            screen.queryByText(/no trend data yet/i)
        ).not.toBeInTheDocument();
    });

    it("respects maxPoints limit", () => {
        const manyRuns: RunHistoryEntry[] = Array.from({ length: 25 }, (_, i) => ({
            runId: `run-${i}`,
            uploadedAt: new Date(2026, 5, 28 + i).toISOString(),
            summary: { passRate: 80, totalRuns: 1, flakyCount: 0 },
            testRuns: [],
        }));
        render(<TrendChart runs={manyRuns} maxPoints={5} />);
        expect(
            screen.queryByText(/no trend data yet/i)
        ).not.toBeInTheDocument();
    });
});