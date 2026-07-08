"""In-memory storage for uploaded test runs.

Each POST /upload/{format} is recorded here as a RunRecord, timestamped
server-side. A test suite is flagged `flaky` when it has both passed
(failedTests == 0) and failed (failedTests > 0) at least once across the
runs currently retained in history.

This is intentionally in-memory only, per the Day 4 spec: we're building a
portfolio piece, not a SaaS product, so history resets when the backend
process restarts. Swap this module out for a real datastore later without
touching main.py's route logic if persistence becomes a requirement.
"""

from __future__ import annotations

import itertools
from datetime import datetime, timezone

from models import ParsedResult, RunRecord, TestRun

# Bounds how many upload events we retain. Keeps memory flat for a
# long-running dev/demo session without needing real persistence. Flakiness
# is determined from whatever history is currently retained, so this also
# doubles as "how far back we look" for flaky detection.
MAX_RUNS = 50


class RunHistoryStore:
    """Records parsed uploads and annotates each test suite with whether
    it has been flaky across the retained run history."""

    def __init__(self) -> None:
        self._runs: list[RunRecord] = []  # newest first
        self._run_id_counter = itertools.count(1)

    def record(self, result: ParsedResult) -> RunRecord:
        """Stores `result` as a new run, flags flaky suites using history
        (including this run), and returns the annotated RunRecord."""
        passed_suites, failed_suites = self._suite_outcomes()

        annotated_runs: list[TestRun] = []
        for run in result.test_runs:
            if run.failed_tests == 0:
                passed_suites.add(run.suite_name)
            else:
                failed_suites.add(run.suite_name)
            flaky = run.suite_name in passed_suites and run.suite_name in failed_suites
            annotated_runs.append(run.model_copy(update={"flaky": flaky}))

        flaky_count = sum(1 for run in annotated_runs if run.flaky)
        summary = result.summary.model_copy(update={"flaky_count": flaky_count})

        record = RunRecord(
            run_id=f"run-{next(self._run_id_counter)}",
            uploaded_at=_now_iso(),
            summary=summary,
            test_runs=annotated_runs,
        )

        self._runs.insert(0, record)
        del self._runs[MAX_RUNS:]

        return record

    def list_runs(self) -> list[RunRecord]:
        """Returns stored runs, newest first."""
        return list(self._runs)

    def clear(self) -> None:
        """Resets history. Used by tests to isolate the module-level
        singleton between cases; not exposed via the API."""
        self._runs.clear()

    def _suite_outcomes(self) -> tuple[set[str], set[str]]:
        """Returns (suite names that have passed at least once, suite names
        that have failed at least once) across currently retained runs."""
        passed: set[str] = set()
        failed: set[str] = set()
        for record in self._runs:
            for run in record.test_runs:
                if run.failed_tests == 0:
                    passed.add(run.suite_name)
                else:
                    failed.add(run.suite_name)
        return passed, failed


def _now_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


# Module-level singleton — simplest possible in-memory store for an MVP
# with a single backend process. See module docstring for scope rationale.
store = RunHistoryStore()
