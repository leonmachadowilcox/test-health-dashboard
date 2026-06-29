"""Pydantic schemas for the Test Suite Health Dashboard API.

Field names mirror src/types/testRun.ts exactly (down to camelCase on the
wire) so the frontend can deserialize responses with zero translation layer.
Python-side code uses snake_case attributes; CamelModel's alias generator
handles the camelCase <-> snake_case mapping for (de)serialization.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict


def _to_camel(snake_str: str) -> str:
    first, *rest = snake_str.split("_")
    return first + "".join(word.capitalize() for word in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)


# Mirrors TestStatus in src/types/testRun.ts
TestStatus = Literal["pass", "fail", "flaky"]


class TestRun(CamelModel):
    """Mirrors the TestRun interface in src/types/testRun.ts."""

    id: str
    suite_name: str
    status: TestStatus
    total_tests: int
    passed_tests: int
    failed_tests: int
    ran_at: str  # ISO 8601 timestamp string
    duration_seconds: float


class PassRateSummary(CamelModel):
    """Mirrors the PassRateSummary interface in src/types/testRun.ts."""

    pass_rate: float  # 0-100 percentage
    total_runs: int
    flaky_count: int


class ParsedResult(CamelModel):
    """Response shape for POST /upload/{format} — mirrors ParsedJestResult
    in src/utils/parseJestResult.ts (summary + testRuns)."""

    summary: PassRateSummary
    test_runs: list[TestRun]
