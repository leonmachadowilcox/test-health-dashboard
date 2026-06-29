"""Parses Jest's `--json` test result output into our domain types.

This is a line-for-line port of src/utils/parseJestResult.ts. Keep the two
implementations in sync — see backend/fixtures/ for golden JSON files used
to check parity between the TS and Python parsers (exercised once backend
route tests land in Phase 6).

Input is untrusted (a file the user uploaded), so every field is treated as
optional and missing/malformed data falls back to sane defaults rather than
throwing. We only throw when the input can't be interpreted as JSON/an
object at all — matching parseJestResult.ts's JestResultParseError contract.
"""

from __future__ import annotations

import json
import math
import re
from datetime import datetime, timezone
from typing import Any

from models import ParsedResult, PassRateSummary, TestRun, TestStatus

EMPTY_SUMMARY = PassRateSummary(pass_rate=0, total_runs=0, flaky_count=0)


class JestResultParseError(Exception):
    """Raised only when input cannot be treated as JSON/an object at all
    (e.g. a string that fails json.loads). Malformed-but-parseable shapes
    degrade to defaults instead — see parse()."""

    def __init__(self, message: str, cause: Exception | None = None):
        super().__init__(message)
        self.cause = cause


def parse(input_data: Any) -> ParsedResult:
    """Parse a Jest `--json` report into our dashboard's domain types.

    Accepts either the raw JSON text of a Jest result file, or an
    already-parsed dict. Raises JestResultParseError if a string input
    isn't valid JSON. All other malformed shapes degrade to defaults.
    """
    report = _normalize_input(input_data)

    if not isinstance(report, dict):
        return ParsedResult(summary=EMPTY_SUMMARY, test_runs=[])

    raw_suites = report.get("testResults")
    suites = raw_suites if isinstance(raw_suites, list) else []
    suites = [s if isinstance(s, dict) else {} for s in suites]

    test_runs = [_to_test_run(suite, index) for index, suite in enumerate(suites)]
    summary = _build_summary(report, test_runs)

    return ParsedResult(summary=summary, test_runs=test_runs)


def _normalize_input(input_data: Any) -> Any:
    """Accepts a raw JSON string or an already-parsed value. Raises
    JestResultParseError if a string input isn't valid JSON."""
    if not isinstance(input_data, str):
        return input_data
    try:
        return json.loads(input_data)
    except json.JSONDecodeError as err:
        raise JestResultParseError(
            "Could not parse Jest result file: input is not valid JSON.", err
        ) from err


def _to_test_run(suite: dict, index: int) -> TestRun:
    raw_assertions = suite.get("assertionResults")
    assertions = (
        [a if isinstance(a, dict) else {} for a in raw_assertions]
        if isinstance(raw_assertions, list)
        else []
    )

    has_assertions = len(assertions) > 0
    passed_tests = sum(1 for a in assertions if a.get("status") == "passed")
    failed_from_assertions = sum(1 for a in assertions if a.get("status") == "failed")

    # Suites that fail before any test runs (e.g. a syntax error in the test
    # file) report no assertionResults at all, but the suite itself still
    # counts as one failed run.
    failed_tests = (
        failed_from_assertions
        if has_assertions
        else (1 if suite.get("status") == "failed" else 0)
    )
    total_tests = len(assertions) if has_assertions else failed_tests

    start_time = suite.get("startTime") if _is_finite_number(suite.get("startTime")) else 0
    end_time = suite.get("endTime") if _is_finite_number(suite.get("endTime")) else start_time

    return TestRun(
        id=_build_id(suite, index),
        suite_name=_extract_suite_name(suite, index),
        status=_determine_status(suite, assertions, failed_tests),
        total_tests=total_tests,
        passed_tests=passed_tests,
        failed_tests=failed_tests,
        ran_at=_safe_iso_string(start_time),
        duration_seconds=max(0.0, (end_time - start_time) / 1000),
    )


def _determine_status(
    suite: dict, assertions: list[dict], failed_tests: int
) -> TestStatus:
    if suite.get("status") == "failed" or failed_tests > 0:
        return "fail"

    was_flaky = any(
        a.get("status") == "passed"
        and (
            (_is_finite_number(a.get("invocations")) and a.get("invocations") > 1)
            or (isinstance(a.get("retryReasons"), list) and len(a["retryReasons"]) > 0)
        )
        for a in assertions
    )

    return "flaky" if was_flaky else "pass"


def _extract_suite_name(suite: dict, index: int) -> str:
    name = suite.get("name")
    if isinstance(name, str) and name.strip():
        parts = re.split(r"[\\/]", name)
        return parts[-1] if parts[-1] else name
    return f"unknown-suite-{index + 1}"


def _build_id(suite: dict, index: int) -> str:
    base = _extract_suite_name(suite, index)
    time = suite.get("startTime") if _is_finite_number(suite.get("startTime")) else index
    return f"{base}-{time}-{index}"


def _is_finite_number(value: Any) -> bool:
    if isinstance(value, bool):
        return False
    if not isinstance(value, (int, float)):
        return False
    return math.isfinite(value)


def _safe_iso_string(epoch_ms: float) -> str:
    try:
        dt = datetime.fromtimestamp(epoch_ms / 1000, tz=timezone.utc)
    except (OverflowError, OSError, ValueError):
        dt = datetime.fromtimestamp(0, tz=timezone.utc)
    return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _round_half_up(value: float) -> float:
    """Math.round in JS rounds half away from zero; Python's built-in round()
    uses banker's rounding. Our inputs (percentages) are always >= 0, so
    floor(x + 0.5) reproduces JS's behavior exactly for this domain."""
    return math.floor(value + 0.5)


def _build_summary(raw: dict, test_runs: list[TestRun]) -> PassRateSummary:
    num_total = raw.get("numTotalTests")
    total_tests = (
        num_total
        if _is_finite_number(num_total)
        else sum(run.total_tests for run in test_runs)
    )

    num_passed = raw.get("numPassedTests")
    passed_tests = (
        num_passed
        if _is_finite_number(num_passed)
        else sum(run.passed_tests for run in test_runs)
    )

    pass_rate = (
        _round_half_up(passed_tests / total_tests * 1000) / 10 if total_tests > 0 else 0
    )

    return PassRateSummary(
        pass_rate=pass_rate,
        # One TestRun = one suite/file in this report, matching the TS port.
        total_runs=len(test_runs),
        flaky_count=sum(1 for run in test_runs if run.status == "flaky"),
    )
