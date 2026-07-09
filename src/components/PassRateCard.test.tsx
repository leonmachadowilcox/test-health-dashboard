import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PassRateCard from "./PassRateCard";

describe("PassRateCard", () => {
    it("renders pass rate percentage", () => {
        render(
            <PassRateCard summary={{ passRate: 85, totalRuns: 3, flakyCount: 0 }} />
        );
        expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("renders total runs count", () => {
        render(
            <PassRateCard summary={{ passRate: 85, totalRuns: 3, flakyCount: 0 }} />
        );
        expect(screen.getByText(/3 runs/)).toBeInTheDocument();
    });

    it("renders singular 'test' for one flaky test", () => {
        render(
            <PassRateCard summary={{ passRate: 80, totalRuns: 1, flakyCount: 1 }} />
        );
        expect(screen.getByText(/1 flaky test/)).toBeInTheDocument();
    });

    it("renders plural 'tests' for multiple flaky tests", () => {
        render(
            <PassRateCard summary={{ passRate: 70, totalRuns: 2, flakyCount: 3 }} />
        );
        expect(screen.getByText(/3 flaky tests/)).toBeInTheDocument();
    });
});