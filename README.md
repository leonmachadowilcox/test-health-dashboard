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
  components/   # Header, PassRateCard, TestRunCard, StatusBadge, ChartPlaceholder, UploadButton
  pages/        # Dashboard (composes components, holds upload state)
  utils/        # parseJestResult.ts (Jest --json parser), api.ts (backend client), mockData.ts
  types/        # shared TypeScript types

backend/
  main.py            # FastAPI app: GET /health, POST /upload/{format}
  models.py           # Pydantic schemas mirroring src/types/testRun.ts
  parsers/
    jest_parser.py    # Python port of src/utils/parseJestResult.ts
    registry.py        # format -> parser lookup, extend here for new formats
  fixtures/            # golden JSON shared with the TS parser tests, for
                        # future parity testing (see Testing below)
```

## API

| Method | Path             | Description                                  |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/health`        | Liveness probe — returns `{"status": "ok"}`  |
| POST   | `/upload/{format}` | Parses an uploaded test result file. `format` is currently `jest`; returns `{ summary, testRuns }`. |

CORS is restricted to the origins in `CORS_ORIGINS` (comma-separated env
var on the backend), defaulting to the Vite dev server
(`http://localhost:5173`). Set it to your deployed frontend's origin in
production.

## Testing

Frontend: `npm run test` (Vitest). Backend route/parser tests are planned
for Phase 6 once deployment flows are stable — `backend/fixtures/` already
holds a golden Jest report shared with `src/utils/parseJestResult.test.ts`'s
fixture, so both the TypeScript and Python parsers can be checked against
the same input once those tests land.

## Architecture note: why the parser is ported, not shared

The Jest result parser exists in both `src/utils/parseJestResult.ts` and
`backend/parsers/jest_parser.py`. This was a deliberate tradeoff: running
the file upload through the backend (rather than parsing client-side and
posting structured JSON) keeps the FastAPI service doing real work and
avoids bundling a Node runtime into the Python deployment just to reuse the
TS parser via subprocess. The cost is two implementations of the same
logic — bounded by keeping `backend/fixtures/` in sync with the TS test's
fixtures so both sides can be checked against identical input.
