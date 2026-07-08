"""Unit tests for backend/store.py — the cross-run flaky detection logic
this dashboard is built around. A suite is "flaky" once it has both passed
(failedTests == 0) and failed (failedTests > 0) at least once across the
runs currently retained in history (see store.py's module docstring).
"""

import store as store_module
from models import ParsedResult, PassRateSummary, TestRun


def make_result(*results: tuple[str, int]) -> ParsedResult:
    """Builds a ParsedResult from (suite_name, failed_tests) pairs. Each
    suite gets 5 total tests, all passed unless failed_tests says otherwise.
    """
    test_runs = []
    for suite_name, failed_tests in results:
        total = 5
        passed = total - failed_tests
        test_runs.append(
            TestRun(
                id=f"{suite_name}-id",
                suite_name=suite_name,
                status="fail" if failed_tests > 0 else "pass",
                total_tests=total,
                passed_tests=passed,
                failed_tests=failed_tests,
                ran_at="2026-07-08T00:00:00.000Z",
                duration_seconds=1.0,
            )
        )
    passed_total = sum(r.passed_tests for r in test_runs)
    total_total = sum(r.total_tests for r in test_runs)
    summary = PassRateSummary(
        pass_rate=(passed_total / total_total * 100) if total_total else 0,
        total_runs=len(test_runs),
        flaky_count=0,  # store.record() recomputes this
    )
    return ParsedResult(summary=summary, test_runs=test_runs)


def test_first_upload_is_never_flaky(run_store):
    record = run_store.record(make_result(("auth.spec.ts", 0)))

    assert record.test_runs[0].flaky is False
    assert record.summary.flaky_count == 0


def test_flaky_when_suite_passes_then_fails(run_store):
    run_store.record(make_result(("auth.spec.ts", 0)))
    second = run_store.record(make_result(("auth.spec.ts", 2)))

    assert second.test_runs[0].flaky is True
    assert second.summary.flaky_count == 1


def test_flaky_when_suite_fails_then_passes(run_store):
    """Order shouldn't matter — fail-then-pass is just as flaky as
    pass-then-fail."""
    run_store.record(make_result(("auth.spec.ts", 3)))
    second = run_store.record(make_result(("auth.spec.ts", 0)))

    assert second.test_runs[0].flaky is True
    assert second.summary.flaky_count == 1


def test_not_flaky_when_only_ever_passed(run_store):
    run_store.record(make_result(("auth.spec.ts", 0)))
    run_store.record(make_result(("auth.spec.ts", 0)))
    third = run_store.record(make_result(("auth.spec.ts", 0)))

    assert third.test_runs[0].flaky is False
    assert third.summary.flaky_count == 0


def test_not_flaky_when_only_ever_failed(run_store):
    run_store.record(make_result(("auth.spec.ts", 1)))
    third = run_store.record(make_result(("auth.spec.ts", 4)))

    assert third.test_runs[0].flaky is False
    assert third.summary.flaky_count == 0


def test_earlier_records_are_not_retroactively_mutated(run_store):
    """A suite's flaky flag reflects history *as of that upload* — later
    uploads shouldn't reach back and flip earlier records."""
    first = run_store.record(make_result(("auth.spec.ts", 0)))
    run_store.record(make_result(("auth.spec.ts", 1)))

    assert first.test_runs[0].flaky is False


def test_flaky_count_only_counts_flaky_suites_in_that_upload(run_store):
    run_store.record(make_result(("auth.spec.ts", 1), ("checkout.spec.ts", 0)))
    second = run_store.record(
        make_result(("auth.spec.ts", 0), ("checkout.spec.ts", 0))
    )

    flaky_names = {r.suite_name for r in second.test_runs if r.flaky}
    assert flaky_names == {"auth.spec.ts"}
    assert second.summary.flaky_count == 1


def test_list_runs_returns_newest_first(run_store):
    run_store.record(make_result(("a.spec.ts", 0)))
    run_store.record(make_result(("b.spec.ts", 0)))
    third = run_store.record(make_result(("c.spec.ts", 0)))

    runs = run_store.list_runs()
    assert runs[0].run_id == third.run_id
    assert [r.test_runs[0].suite_name for r in runs] == [
        "c.spec.ts",
        "b.spec.ts",
        "a.spec.ts",
    ]


def test_history_is_bounded_at_max_runs(run_store):
    max_runs = store_module.MAX_RUNS
    for i in range(max_runs + 5):
        run_store.record(make_result((f"suite-{i}.spec.ts", 0)))

    runs = run_store.list_runs()
    assert len(runs) == max_runs
    # Newest-first, so the most recently recorded suites should be retained
    # and the oldest ones evicted.
    newest_suite = runs[0].test_runs[0].suite_name
    assert newest_suite == f"suite-{max_runs + 4}.spec.ts"


def test_clear_resets_history(run_store):
    run_store.record(make_result(("auth.spec.ts", 0)))
    run_store.clear()

    assert run_store.list_runs() == []
