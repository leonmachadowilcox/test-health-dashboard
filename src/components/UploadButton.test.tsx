import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadButton from "./UploadButton";

vi.mock("../utils/api", () => ({
  uploadTestResultFile: vi.fn(),
  UploadError: class UploadError extends Error {},
}));

import { uploadTestResultFile } from "../utils/api";
const mockedUpload = vi.mocked(uploadTestResultFile);

const mockResult = {
  summary: { passRate: 80, totalRuns: 1, flakyCount: 0 },
  testRuns: [],
};

describe("UploadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload button with default label", () => {
    render(<UploadButton onUploaded={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /upload test results/i })
    ).toBeInTheDocument();
  });

  it("calls onUploaded with parsed result on successful upload", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    mockedUpload.mockResolvedValue(mockResult);

    const { container } = render(<UploadButton onUploaded={onUploaded} />);

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File([JSON.stringify({})], "report.json", {
      type: "application/json",
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith(mockResult);
    });
  });

  it("shows error message on upload failure", async () => {
    const user = userEvent.setup();
    const { UploadError } = await import("../utils/api");
    mockedUpload.mockRejectedValue(
      new UploadError("Could not reach backend.")
    );

    const { container } = render(<UploadButton onUploaded={vi.fn()} />);

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File([JSON.stringify({})], "report.json", {
      type: "application/json",
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("Could not reach backend.")).toBeInTheDocument();
    });
  });

  it("does nothing when no file is selected", async () => {
    const onUploaded = vi.fn();
    render(<UploadButton onUploaded={onUploaded} />);
    expect(onUploaded).not.toHaveBeenCalled();
  });
});