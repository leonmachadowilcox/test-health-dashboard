import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
    it("renders Passing label for pass status", () => {
        render(<StatusBadge status="pass" />);
        expect(screen.getByText("Passing")).toBeInTheDocument();
    });

    it("renders Failing label for fail status", () => {
        render(<StatusBadge status="fail" />);
        expect(screen.getByText("Failing")).toBeInTheDocument();
    });

    it("renders Flaky label for flaky status", () => {
        render(<StatusBadge status="flaky" />);
        expect(screen.getByText("Flaky")).toBeInTheDocument();
    });
});