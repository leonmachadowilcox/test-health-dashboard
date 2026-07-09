import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
    it("renders the dashboard title", () => {
        render(<Header />);
        expect(
            screen.getByText("Test Suite Health Dashboard")
        ).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
        render(<Header />);
        expect(
            screen.getByText("Pass/fail rates, flaky tests, and trends across recent runs")
        ).toBeInTheDocument();
    });

    it("renders actions when provided", () => {
        render(<Header actions={<button>Test Action</button>} />);
        expect(screen.getByText("Test Action")).toBeInTheDocument();
    });

    it("does not render actions when not provided", () => {
        render(<Header />);
        expect(screen.queryByText("Test Action")).not.toBeInTheDocument();
    });
});