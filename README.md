# Test Suite Health Dashboard

## Setup

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Structure

```
src/
  components/   # Header, PassRateCard, TestRunCard, StatusBadge, ChartPlaceholder
  pages/        # Dashboard (composes components)
  utils/        # mockData.ts (placeholder data, swap for API later)
  types/        # shared TypeScript types
```

Currently using mock data in `src/utils/mockData.ts`. Backend (FastAPI) integration is a later phase.
