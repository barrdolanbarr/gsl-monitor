# Great Salt Lake — Situation Monitor

A real-time monitor for the Great Salt Lake basin: live USGS stream-gauge discharge, lake-stage elevation, watershed catchment properties, and cloud-seeding impact context — all on a topographic map.

**No API keys required.** Map tiles are from Esri/OpenTopoMap (free), and all hydrology data comes from the public USGS National Water Information System.

## What it shows

- **Lake elevation** (Saltair south-arm gage 10010000) vs. the 4,198 ft healthy target, live.
- **Live tributary inflow** — combined discharge across major + minor gauges, converted to AF/day and annualized, against the historical ~2.9 M AF/yr river average.
- **Stream gauges** — Bear, Weber, Goggin Drain, Farmington Bay + minor inflows, each with current discharge and a 1-year daily history sparkline (in the map popups).
- **Watershed catchments** — Bear / Weber / Jordan basins with inflow share, drainage area, headwaters, and catchment physics notes; drawn as map overlays.
- **Cloud-seeding impact context** — bottom-up generation → delivery → lake effect, framed against the deficit.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel (≈2 minutes)

**Option A — GitHub + Vercel dashboard (easiest):**
1. Create a new GitHub repo and push this folder:
   ```bash
   git init && git add . && git commit -m "GSL monitor"
   git branch -M main
   git remote add origin https://github.com/<you>/gsl-monitor.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, click **Deploy**. No env vars needed.

**Option B — Vercel CLI:**
```bash
npm i -g vercel
vercel        # follow prompts; accept defaults
vercel --prod # promote to production
```

That's it — Vercel auto-detects Next.js, builds, and serves the `/api/usgs` proxy as a serverless function.

## How the data flows

The browser calls `/api/usgs` (a Next.js route handler running server-side on Vercel), which fetches from `waterservices.usgs.gov` and returns clean JSON. This avoids CORS issues and keeps fetching reliable in production. The page auto-refreshes current values every 5 minutes; popup history loads on demand.

## Notes & honesty

- Gauges sit several miles upstream of the lake, so summed gauge flow ≠ true at-lake inflow (the last mile was historically unmeasured; the state is adding gauges).
- The annualized inflow figure assumes the current instantaneous flow held constant — a snapshot, not a forecast.
- Watershed polygons are illustrative outlines, not survey-grade boundaries.
- Seeding-impact numbers are a bottom-up estimate from Rainmaker's disclosed validation, not official company figures.
