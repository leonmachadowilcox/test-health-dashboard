# Test Suite Health Dashboard

A React + FastAPI app that parses test result files (Jest JSON today, more
formats later), calculates pass/fail rates, flags flaky tests, and surfaces
trends. Two services run side by side in development: Vite (frontend) and
uvicorn (backend).

## Setup

### Frontend

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at http://localhost:8000 — try http://localhost:8000/docs for the
interactive OpenAPI UI.

### Running both together

Open two terminals: one running `npm run dev` from the project root, one
running `uvicorn main:app --reload --port 8000` from `backend/` (with its
venv active). The frontend reads the backend's URL from `VITE_API_BASE_URL`
(see `.env.example`); it defaults to `http://localhost:8000` if unset, so no
`.env` file is required for local development with the default ports.

## Build

```bash
npm run build
npm run preview
```

## Structure

```
src/
  components/   # Header, PassRateCard, TestRunCard, StatusBadge, TrendChart, UploadButton
  pages/        # Dashboard (composes components, holds upload + run-history state)
  utils/        # parseJestResult.ts (Jest --json parser), api.ts (backend client),
                # trendColor.ts (chart color thresholds), mockData.ts
  types/        # shared TypeScript types

backend/
  main.py            # FastAPI app: GET /health, POST /upload/{format}, GET /runs
  models.py           # Pydantic schemas mirroring src/types/testRun.ts
  store.py             # In-memory upload history + cross-run flaky detection
  parsers/
    jest_parser.py    # Python port of src/utils/parseJestResult.ts
    registry.py        # format -> parser lookup, extend here for new formats
  fixtures/            # golden JSON shared with the TS parser tests, for
                        # parity testing between the TS and Python parsers
  tests/               # pytest suite for store.py and main.py routes
```

## API

| Method | Path             | Description                                  |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/health`        | Liveness probe — returns `{"status": "ok"}`  |
| POST   | `/upload/{format}` | Parses an uploaded test result file and records it into run history. `format` is currently `jest`; returns `{ summary, testRuns }`, where `summary.flakyCount` and each run's `flaky` boolean reflect cross-run history (a suite is flaky once it's passed at least once and failed at least once). |
| GET    | `/runs`          | Returns upload history, newest first — `[{ runId, uploadedAt, summary, testRuns }]`. Powers the pass-rate trend chart. In-memory only; resets on backend restart. |

CORS is restricted to the origins in `CORS_ORIGINS` (comma-separated env
var on the backend), defaulting to the Vite dev server
(`http://localhost:5173`). Set it to your deployed frontend's origin in
production.

## Testing

Frontend: `npm run test` (Vitest) — parser, trend-color threshold, and
component logic.

Backend: from `backend/`, with the venv active, `pip install -r
requirements-dev.txt` then `pytest`. Covers `store.py`'s flaky-detection
logic directly and the `/upload` + `/runs` routes end-to-end via FastAPI's
TestClient. `backend/fixtures/` holds a golden Jest report shared with
`src/utils/parseJestResult.test.ts`'s fixture, so the TS and Python parsers
can be checked against the same input.

## Architecture note: why the parser is ported, not shared

The Jest result parser exists in both `src/utils/parseJestResult.ts` and
`backend/parsers/jest_parser.py`. This was a deliberate tradeoff: running
the file upload through the backend (rather than parsing client-side and
posting structured JSON) keeps the FastAPI service doing real work and
avoids bundling a Node runtime into the Python deployment just to reuse the
TS parser via subprocess. The cost is two implementations of the same
logic — bounded by keeping `backend/fixtures/` in sync with the TS test's
fixtures so both sides can be checked against identical input.
