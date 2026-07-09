import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./utils/api", () => ({
    fetchRunHistory: vi.fn().mockResolvedValue([]),
    uploadTestResultFile: vi.fn(),
    UploadError: class UploadError extends Error { },
}));

describe("App", () => {
    it("renders the dashboard", () => {
        render(<App />);
        expect(
            screen.getByText("Test Suite Health Dashboard")
        ).toBeInTheDocument();
    });
});