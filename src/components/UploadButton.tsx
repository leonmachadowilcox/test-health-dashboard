import { useRef, useState } from "react";
import { uploadTestResultFile, UploadError } from "../utils/api";
import type { ParsedJestResult } from "../utils/parseJestResult";

interface UploadButtonProps {
  onUploaded: (result: ParsedJestResult) => void;
}

type Status = "idle" | "loading" | "error";

export default function UploadButton({ onUploaded }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;

    setStatus("loading");
    setError(null);

    try {
      const result = await uploadTestResultFile(file, "jest");
      onUploaded(result);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof UploadError ? err.message : "Upload failed.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "loading"}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {status === "loading" ? "Uploading…" : "Upload Test Results"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      {status === "error" && error && (
        <p className="max-w-xs text-right text-xs text-status-fail">{error}</p>
      )}
    </div>
  );
}
