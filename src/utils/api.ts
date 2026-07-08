// Thin client for the FastAPI backend. Keeps fetch/error-handling details
// out of components — UploadButton just calls uploadTestResultFile and
// handles the promise.

import type { ParsedJestResult } from "./parseJestResult";
import type { RunHistoryEntry } from "../types/testRun";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/** Formats supported by POST /upload/{format} on the backend. Extend as
 *  more parsers (e.g. "junit" for JUnit XML) land server-side. */
export type UploadFormat = "jest";

/** Base class for backend request failures — covers unreachable backend,
 *  non-2xx responses, and network errors. */
export class ApiError extends Error {}

export class UploadError extends ApiError {}

/**
 * Uploads a test result file to the backend for parsing.
 *
 * @throws {UploadError} if the backend responds with a non-2xx status, or
 *   the request fails outright (network error, backend not running, etc).
 */
export async function uploadTestResultFile(
  file: File,
  format: UploadFormat
): Promise<ParsedJestResult> {
  const body = new FormData();
  body.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/upload/${format}`, {
      method: "POST",
      body,
    });
  } catch {
    throw new UploadError(
      "Could not reach the backend. Is it running at " + API_BASE_URL + "?"
    );
  }

  if (!response.ok) {
    const detail = await safeReadErrorDetail(response);
    throw new UploadError(detail ?? `Upload failed with status ${response.status}.`);
  }

  return response.json();
}

/**
 * Fetches upload history (newest first) for the pass-rate trend chart.
 *
 * @throws {ApiError} if the backend responds with a non-2xx status, or the
 *   request fails outright (network error, backend not running, etc).
 */
export async function fetchRunHistory(): Promise<RunHistoryEntry[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/runs`);
  } catch {
    throw new ApiError(
      "Could not reach the backend. Is it running at " + API_BASE_URL + "?"
    );
  }

  if (!response.ok) {
    const detail = await safeReadErrorDetail(response);
    throw new ApiError(detail ?? `Fetching run history failed with status ${response.status}.`);
  }

  return response.json();
}

async function safeReadErrorDetail(response: Response): Promise<string | null> {
  try {
    const data: unknown = await response.json();
    if (
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
    ) {
      return (data as { detail: string }).detail;
    }
    return null;
  } catch {
    return null;
  }
}
