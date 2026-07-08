"""FastAPI entrypoint for the Test Suite Health Dashboard backend.

Run with: uvicorn main:app --reload --port 8000
(from inside backend/, with the venv from requirements.txt active)
"""

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models import ParsedResult, RunRecord
from parsers.jest_parser import JestResultParseError
from parsers.registry import UnsupportedFormatError, get_parser
from store import store

app = FastAPI(title="Test Suite Health Dashboard API", version="0.1.0")

# Vite's dev server runs on 5173 by default. Add the deployed frontend's
# origin via CORS_ORIGINS (comma-separated) once it's hosted, e.g. on Vercel.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Basic liveness probe."""
    return {"status": "ok"}


@app.post("/upload/{format}", response_model=ParsedResult)
async def upload(format: str, file: UploadFile = File(...)) -> ParsedResult:
    """Accepts a test result file and returns it parsed into our domain
    types (summary + testRuns). `format` selects the parser, e.g. "jest".

    The parsed result is also recorded into the in-memory run history (see
    store.py), which annotates each suite's `flaky` flag by comparing this
    upload against prior ones and folds the resulting count into
    `summary.flakyCount`. GET /runs exposes the full history for trend
    charts.
    """
    try:
        parse = get_parser(format)
    except UnsupportedFormatError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    raw_bytes = await file.read()
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as err:
        raise HTTPException(
            status_code=400, detail="File must be UTF-8 encoded text."
        ) from err

    try:
        parsed = parse(text)
    except JestResultParseError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    record = store.record(parsed)
    return ParsedResult(summary=record.summary, test_runs=record.test_runs)


@app.get("/runs", response_model=list[RunRecord])
def list_runs() -> list[RunRecord]:
    """Returns upload history, newest first, for populating the pass-rate
    trend chart. In-memory only — resets on backend restart."""
    return store.list_runs()
