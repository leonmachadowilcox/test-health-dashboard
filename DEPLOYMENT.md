# Deployment Runbook

Deploys the frontend to Vercel and backend to Render, both free tiers.
Run everything below from your own machine (not this sandbox) so your
existing `vercel`/`render`/`git` logins are used.

## 0. Push the deploy config

`vercel.json`, `render.yaml`, and `.eslintrc.cjs` are already in the repo
working tree. Commit and push them first — Render's Blueprint deploy reads
`render.yaml` directly from GitHub.

```bash
git add vercel.json render.yaml .eslintrc.cjs
git commit -m "chore: add Vercel/Render deploy config and ESLint setup"
git push origin main
```

## 1. Deploy the backend to Render

Render doesn't have a mature CLI for first-time service creation — use the
dashboard's Blueprint flow, which reads `render.yaml` automatically.

1. Go to https://dashboard.render.com → **New +** → **Blueprint**
2. Connect the `leonmachadowilcox/test-health-dashboard` repo
3. Render detects `render.yaml` and proposes a `test-health-dashboard-api`
   web service (Python, rooted at `backend/`, free plan) — click **Apply**
4. Wait for the build/deploy to finish, then copy the service URL, e.g.
   `https://test-health-dashboard-api.onrender.com`
5. Verify it's live:

```bash
curl https://test-health-dashboard-api.onrender.com/health
# expect: {"status":"ok"}
```

Note: Render's free tier spins down after 15 minutes of inactivity — the
first request after idle can take ~30-60s to wake up.

## 2. Deploy the frontend to Vercel

```bash
npm i -g vercel        # skip if already installed
vercel login           # opens a browser to authenticate
vercel link             # first run: create a new project, accept defaults
vercel env add VITE_API_BASE_URL production
# paste: https://test-health-dashboard-api.onrender.com   (no trailing slash)

vercel --prod
```

`vercel --prod` prints the live URL, e.g.
`https://test-health-dashboard.vercel.app`. Save it — you need it for the
next step.

## 3. Point the backend's CORS at the deployed frontend

Back in the Render dashboard → your service → **Environment**:

- Edit `CORS_ORIGINS` → set to your Vercel URL from step 2, e.g.
  `https://test-health-dashboard.vercel.app`
- Save — Render auto-redeploys the service with the new env var

If you later add a Vercel preview domain too, use a comma-separated list:
`https://test-health-dashboard.vercel.app,https://test-health-dashboard-git-main-yourname.vercel.app`

## 4. Smoke test

Backend, via curl:

```bash
# Upload the fixture
curl -F "file=@backend/fixtures/jest_valid_report.json" \
  https://test-health-dashboard-api.onrender.com/upload/jest

# Confirm it's stored
curl https://test-health-dashboard-api.onrender.com/runs
# expect: a JSON array containing the run you just uploaded
```

Frontend, in the browser:

1. Open your Vercel URL
2. Upload `backend/fixtures/jest_valid_report.json` through the UI
3. Confirm: pass rate renders, any flaky tests show their badge, the trend
   chart renders with at least one data point
4. Refresh the page — `GET /runs` should repopulate history without a
   re-upload

## Environment variable reference

| Var | Where | Value |
|---|---|---|
| `VITE_API_BASE_URL` | Vercel → Project → Settings → Environment Variables | `https://test-health-dashboard-api.onrender.com` |
| `CORS_ORIGINS` | Render → Service → Environment | `https://test-health-dashboard.vercel.app` |

Both are already wired into the code — no source changes needed:
`src/utils/api.ts` reads `VITE_API_BASE_URL`, `backend/main.py` reads
`CORS_ORIGINS` (comma-separated).

## Troubleshooting

- **CORS error in browser console**: `CORS_ORIGINS` on Render doesn't match
  the Vercel URL exactly (check for trailing slash / http vs https).
- **Frontend shows "Could not reach the backend"**: `VITE_API_BASE_URL` was
  set after the last Vercel build — Vite bakes env vars in at build time,
  so re-run `vercel --prod` after changing it.
- **Render build fails on `pip install`**: confirm `rootDir: backend` in
  `render.yaml` picked up correctly; check the build log points at
  `backend/requirements.txt`, not the repo root.
- **First request very slow**: expected on Render free tier after idle
  spin-down, not a bug.
