"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { STATIONS, WATERSHEDS, LAKE_FACTS, SEEDING_CONTEXT } from "@/lib/data";

const GSLMap = dynamic(() => import("./components/GSLMap"), { ssr: false, loading: () => <div className="loading">loading map…</div> });

function fmt(n: any, d = 0) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

export default function Page() {
  const [data, setData] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [grid, setGrid] = useState<any>(null);
  const [updated, setUpdated] = useState<string>("");

  async function load() {
    try {
      const r = await fetch("/api/usgs?mode=current", { cache: "no-store" });
      const j = await r.json();
      setData(j);
      setUpdated(new Date().toLocaleTimeString());
    } catch {}
  }
  useEffect(() => {
    load();
    // GSL-SWY+ model outputs are precomputed offline and written to public/
    fetch("/model_outputs.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => setModel(m))
      .catch(() => {});
    // Per-cell seeding-to-lake efficiency surface (spatial GIS layers)
    fetch("/bear_seeding_grid.geojson", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => setGrid(g))
      .catch(() => {});
    const t = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(t);
  }, []);

  const mCal = model?.calibration;
  const mSeedLake = model?.seeding_uncertainty?.seeding_delta_af_to_lake;
  const mSeedStage = model?.seeding_uncertainty?.seeding_delta_stage_inches_per_year;
  const mLake = model?.lake_context;

  const sites = data?.sites ?? {};
  const saltair = sites["10010000"]?.params?.["62614"]?.value;
  const lakeElev = saltair ?? LAKE_FACTS.recentSouthArmFt;

  // level bar: map 4188 → 4205 onto 0–100%
  const lo = 4188, hi = 4205;
  const pct = Math.max(0, Math.min(100, ((lakeElev - lo) / (hi - lo)) * 100));
  const targetPct = ((LAKE_FACTS.healthyElevFt - lo) / (hi - lo)) * 100;
  const deficitFt = LAKE_FACTS.healthyElevFt - lakeElev;

  // Discharge can't be negative; USGS emits a large negative sentinel (e.g. -999999)
  // when a gauge has no current value. Treat anything < 0 or absurdly large as no-data
  // so one bad gauge can't poison the combined-flow sum.
  const cfsOf = (id: string): number | undefined => {
    const v = sites[id]?.params?.["00060"]?.value;
    if (v === undefined || v === null || isNaN(v) || v < 0 || v > 1e6) return undefined;
    return v;
  };

  // total live inflow (sum of major + minor discharge, cfs) → AF/day
  const inflowSites = STATIONS.filter((s) => s.type !== "lake_stage");
  let totalCfs = 0; let counted = 0;
  for (const s of inflowSites) {
    const v = cfsOf(s.id);
    if (v !== undefined) { totalCfs += v; counted++; }
  }
  const afPerDay = totalCfs * 1.9835; // 1 cfs ≈ 1.9835 AF/day
  const afPerYear = afPerDay * 365;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h1>Great Salt Lake — Situation Monitor</h1>
          <div className="sub">live USGS gauges · Bear River model · cloud-seeding hotspots</div>
          <div className="live"><span className="dot" /> live {updated && `· updated ${updated}`}</div>
        </div>

        {/* LAKE HERO */}
        <div className="section">
          <h2>South-arm lake elevation</h2>
          <div className="hero">
            <span className="val">{fmt(lakeElev, 2)}</span>
            <span className="unit">ft (Saltair)</span>
            <span className={`delta ${deficitFt > 0 ? "below" : "above"}`}>
              {deficitFt > 0 ? `▼ ${fmt(deficitFt, 2)} ft below healthy` : `▲ ${fmt(-deficitFt, 2)} ft above`}
            </span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: `${pct}%` }} />
            <div className="target" style={{ left: `${targetPct}%` }} title="healthy 4,198 ft" />
          </div>
          <div className="scale"><span>4,188</span><span>healthy 4,198 ▲</span><span>4,205</span></div>
          <div className="note">
            {saltair ? "Live USGS gauge 10010000." : "Last reported value (live fetch pending)."} Healthy range 4,198–4,205 ft.
          </div>
        </div>

        {/* LIVE INFLOW SUMMARY */}
        <div className="section">
          <h2>Live tributary inflow ({counted} gauges)</h2>
          <div className="statgrid">
            <div className="stat"><div className="k">Combined flow</div><div className="v">{fmt(totalCfs, 0)} <small>cfs</small></div></div>
            <div className="stat"><div className="k">≈ Volume / day</div><div className="v">{fmt(afPerDay, 0)} <small>AF</small></div></div>
            <div className="stat"><div className="k">≈ Annualized</div><div className="v">{fmt(afPerYear / 1000, 0)}<small>K AF/yr</small></div></div>
            <div className="stat"><div className="k">Hist. avg river</div><div className="v">{fmt(LAKE_FACTS.avgAnnualRiverInflowAF / 1e6, 1)}<small>M AF/yr</small></div></div>
          </div>
          <div className="note">Today's flow at upstream gauges. Annualized is a snapshot at this rate, not a forecast.</div>
        </div>

        {/* GAUGE LIST */}
        <div className="section">
          <h2>Stream gauges — current</h2>
          {STATIONS.filter((s) => s.type !== "lake_stage").map((s) => {
            const v = cfsOf(s.id);
            const c = s.type === "inflow_major" ? "#1f6f8b" : "#6fb0c4";
            return (
              <div className="gauge" key={s.id}>
                <span className="sw" style={{ background: c }} />
                <div className="nm">{s.short}<small>{s.name.split(",")[0]}</small></div>
                <div className="fl">{fmt(v, 1)}<small>cfs</small></div>
              </div>
            );
          })}
        </div>

        {/* WATERSHED CATCHMENT PHYSICS */}
        <div className="section">
          <h2>Watershed catchments</h2>
          {WATERSHEDS.map((w) => (
            <div className="gauge" key={w.short} style={{ cursor: "default" }}>
              <span className="sw" style={{ background: w.short === "Bear" ? "#1f6f8b" : w.short === "Weber" ? "#b88a1e" : "#0f7b54" }} />
              <div className="nm">{w.name.replace(" Watershed", "")}<small>{fmt(w.areaSqMi)} sq mi · {w.headwaters.split("(")[0]}</small></div>
              <div className="fl">{w.inflowSharePct}%<small>of inflow</small></div>
            </div>
          ))}
          <div className="note">
            Three rivers supply most inflow; ~{LAKE_FACTS.directPrecipSharePct}% falls directly on the lake. Total catchment ≈ {fmt(LAKE_FACTS.catchmentSqMi)} sq mi.
          </div>
        </div>

        {/* SEEDING IMPACT CONTEXT */}
        <div className="section">
          <h2>Cloud-seeding impact context</h2>
          <div className="seed-row"><span>Per validated event</span><b>{SEEDING_CONTEXT.perEventValidatedAF} AF</b></div>
          <div className="seed-row"><span>Full-deploy generation</span><b>{fmt(SEEDING_CONTEXT.fullDeployGenLowAF)}–{fmt(SEEDING_CONTEXT.fullDeployGenHighAF)} AF/yr</b></div>
          <div className="seed-row"><span>Delivery factor → lake</span><b>×{SEEDING_CONTEXT.deliveryFactorToLake}</b></div>
          <div className="seed-row"><span>Net to lake</span><b>{fmt(SEEDING_CONTEXT.toLakeLowAF)}–{fmt(SEEDING_CONTEXT.toLakeHighAF)} AF/yr</b></div>
          <div className="seed-row"><span>Share of structural shortfall</span><span className="pct">~0.1–0.25%</span></div>
          <div className="note">
            Even at full deployment, seeding adds far less than 1% of the yearly shortfall — too little to refill the lake. Its real value is water for farms and ski areas.
          </div>
        </div>

        {/* GSL-SWY+ MODEL RESULTS */}
        {model && (
          <div className="section">
            <h2>GSL-SWY+ model — Bear River pilot</h2>
            <div className="statgrid">
              <div className="stat"><div className="k">Modeled yield</div><div className="v">{fmt(mCal?.modeled_annual_af / 1000)}<small>K AF/yr</small></div></div>
              <div className="stat"><div className="k">Observed yield</div><div className="v">{fmt(mCal?.observed_annual_af / 1000)}<small>K AF/yr</small></div></div>
              <div className="stat"><div className="k">Fit (NSE)</div><div className="v">{fmt(mCal?.nash_sutcliffe, 2)}</div></div>
              <div className="stat"><div className="k">Volume bias</div><div className="v">{fmt(mCal?.percent_bias, 1)}<small>%</small></div></div>
            </div>
            <div className="seed-row"><span>Seeding → lake (p50)</span><b>{fmt(mSeedLake?.p50)} AF/yr</b></div>
            <div className="seed-row"><span>90% range</span><span className="pct">{fmt(mSeedLake?.p05)}–{fmt(mSeedLake?.p95)} AF/yr</span></div>
            <div className="seed-row"><span>Stage effect (p50)</span><b>{fmt(mSeedStage?.p50, 3)} in/yr</b></div>
            <div className="seed-row"><span>Yrs to offset shortfall</span><b>{fmt(mLake?.years_of_seeding_to_offset_structural_shortfall)}</b></div>
            <div className="note">
              Snow-aware water balance, calibrated to {model?.meta?.gauge_years} yrs of gauge data (gauge {model?.meta?.outlet_gauge}). At the median effect it would take {fmt(mLake?.years_of_seeding_to_offset_structural_shortfall)} years of seeding to offset the shortfall.
            </div>
          </div>
        )}

        {grid && (
          <div className="section">
            <h2>Map layers — Bear River</h2>
            <div className="seed-row"><span>① Seeding → lake hotspots</span><b>where it pays off</b></div>
            <div className="seed-row"><span>② Seedable snow zone</span><b>cold enough?</b></div>
            <div className="seed-row"><span>③ Runoff efficiency</span><b>reaches a river?</b></div>
            <div className="seed-row"><span>④ Elevation / terrain</span><b>real DEM</b></div>
            <div className="seed-row"><span>⑤ Land cover</span><b>NLCD 2021</b></div>
            <div className="note">
              Toggle layers in the top-right of the map. Turn on the radar over the hotspots to see where today's clouds sit above the ground that actually delivers water to the lake. {grid?._meta?.n_cells} cells across {grid?._meta?.elev_min_m}–{grid?._meta?.elev_max_m} m.
            </div>
          </div>
        )}

        <div className="foot">
          Data: USGS National Water Information System (waterservices.usgs.gov), public/no-key. Elevation: open-elevation (SRTM/ASTER). Land cover: NLCD 2021 (MRLC/USGS). Lake facts: USU GSL Strike Team, UT DNR, Grow the Flow. Seeding context: bottom-up estimate from Rainmaker disclosed validation — illustrative, not company figures.
        </div>
      </aside>

      <main className="mapwrap">
        {data ? <GSLMap data={data} model={model} grid={grid} /> : <div className="loading">fetching live USGS data…</div>}
      </main>
    </div>
  );
}
