"""Integration tests for the FastAPI routes in main.py, including how
POST /upload/{format} and GET /runs interact through the run history store.
"""

import json

FAILING_REPORT = {
    "numTotalTests": 1,
    "numPassedTests": 0,
    "testResults": [
        {
            "name": "/repo/src/flaky.spec.ts",
            "status": "failed",
            "startTime": 1_000,
            "endTime": 1_500,
            "assertionResults": [{"status": "failed", "title": "does a thing"}],
        }
    ],
}

PASSING_REPORT = {
    "numTotalTests": 1,
    "numPassedTests": 1,
    "testResults": [
        {
            "name": "/repo/src/flaky.spec.ts",
            "status": "passed",
            "startTime": 2_000,
            "endTime": 2_200,
            "assertionResults": [{"status": "passed", "title": "does a thing"}],
        }
    ],
}


def upload(client, report: dict):
    body = json.dumps(report).encode("utf-8")
    return client.post(
        "/upload/jest",
        files={"file": ("report.json", body, "application/json")},
    )


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_returns_parsed_result(client):
    response = upload(client, PASSING_REPORT)

    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["totalRuns"] == 1
    assert body["testRuns"][0]["suiteName"] == "flaky.spec.ts"
    assert body["testRuns"][0]["flaky"] is False


def test_upload_unsupported_format_returns_400(client):
    response = upload(client, PASSING_REPORT)
    response = client.post(
        "/upload/junit",
        files={"file": ("report.xml", b"<xml/>", "application/xml")},
    )
    assert response.status_code == 400
    assert "Unsupported format" in response.json()["detail"]


def test_upload_invalid_json_returns_400(client):
    response = client.post(
        "/upload/jest",
        files={"file": ("report.json", b"{not valid json", "application/json")},
    )
    assert response.status_code == 400


def test_upload_non_utf8_returns_400(client):
    response = client.post(
        "/upload/jest",
        files={"file": ("report.json", b"\xff\xfe\x00\x01", "application/json")},
    )
    assert response.status_code == 400
    assert "UTF-8" in response.json()["detail"]


def test_runs_empty_before_any_upload(client):
    response = client.get("/runs")
    assert response.status_code == 200
    assert response.json() == []


def test_runs_populated_after_upload(client):
    upload(client, PASSING_REPORT)

    response = client.get("/runs")
    runs = response.json()
    assert len(runs) == 1
    assert runs[0]["runId"]
    assert runs[0]["uploadedAt"]
    assert runs[0]["testRuns"][0]["suiteName"] == "flaky.spec.ts"


def test_runs_flags_flaky_suite_across_uploads_newest_first(client):
    upload(client, FAILING_REPORT)
    second_response = upload(client, PASSING_REPORT)

    assert second_response.json()["summary"]["flakyCount"] == 1
    assert second_response.json()["testRuns"][0]["flaky"] is True

    runs = client.get("/runs").json()
    assert len(runs) == 2
    # Newest first: the second (passing, now-flagged-flaky) upload comes
    # before the first (failing, not-yet-flaky-at-the-time) upload.
    assert runs[0]["testRuns"][0]["flaky"] is True
    assert runs[1]["testRuns"][0]["flaky"] is False
