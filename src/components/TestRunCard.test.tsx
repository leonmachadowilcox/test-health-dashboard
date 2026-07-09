import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TestRunCard from "./TestRunCard";
import type { TestRun } from "../types/testRun";

const baseRun: TestRun = {
    id: "test-1",
    suiteName: "App.test.tsx",
    status: "pass",
    totalTests: 5,
    passedTests: 5,
    failedTests: 0,
    ranAt: "2026-06-29T10:32:00.000Z",
    durationSeconds: 18,
    flaky: false,
};

describe("TestRunCard", () => {
    it("renders suite name", () => {
        render(<TestRunCard run={baseRun} />);
        expect(screen.getByText("App.test.tsx")).toBeInTheDocument();
    });

    it("renders passed/total count", () => {
        render(<TestRunCard run={baseRun} />);
        expect(screen.getByText(/5\/5 passed/)).toBeInTheDocument();
    });

    it("renders duration", () => {
        render(<TestRunCard run={baseRun} />);
        expect(screen.getByText(/18s/)).toBeInTheDocument();
    });

    it("shows status badge", () => {
        render(<TestRunCard run={baseRun} />);
        expect(screen.getByText("Passing")).toBeInTheDocument();
    });

    it("shows flaky badge when run is flaky", () => {
        render(<TestRunCard run={{ ...baseRun, flaky: true, status: "flaky" }} />);
        expect(screen.getAllByText("Flaky")).toHaveLength(2);
    });

    it("does not show flaky badge when run is not flaky", () => {
        render(<TestRunCard run={baseRun} />);
        expect(screen.queryByText("Flaky")).not.toBeInTheDocument();
    });
});