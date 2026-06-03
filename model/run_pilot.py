#!/usr/bin/env python3
"""Run the GSL-SWY+ v1 Bear River pilot end-to-end and write outputs for the monitor.

  1. Load config + station normals + the 76-yr outlet streamflow record.
  2. Calibrate central parameters to the observed monthly climatology.
  3. Run the paired baseline/seeded model at the central seeding increment.
  4. Propagate parameter uncertainty with Monte Carlo to a seeding->lake-stage distribution.
  5. Write model_outputs.json and bear_basin_model.geojson into the app's public/ folder
     (and a copy into model/outputs/) so the Next.js monitor can render them on the map.

Usage:  python3 run_pilot.py [--draws N] [--quick]
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import os

import numpy as np

from gsl_swy.io_data import load_config, load_gauge, AF_PER_CFS_YEAR
from gsl_swy.engine import Params
from gsl_swy.calibrate import calibrate, simulate, nash_sutcliffe, percent_bias
from gsl_swy.seeding import run_paired, lake_acres_at_stage
from gsl_swy.montecarlo import run_montecarlo

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
PUBLIC = os.path.join(REPO, "public")
OUT = os.path.join(HERE, "outputs")
MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
OUTLET_LATLON = (41.62, -112.10)   # Bear River near Corinne


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--draws", type=int, default=400, help="Monte Carlo draws")
    ap.add_argument("--quick", action="store_true", help="few draws, for a fast smoke test")
    args = ap.parse_args()
    n_draws = 60 if args.quick else args.draws

    cfg = load_config()
    gauge = load_gauge()
    print(f"[data] gauge years={gauge.n_years}  mean annual={gauge.mean_annual_cfs:,.0f} cfs "
          f"({gauge.mean_annual_af:,.0f} AF/yr)")
    print(f"[data] wettest={gauge.wettest_years}  driest={gauge.driest_years}")

    print("[calibrate] fitting central parameters to observed monthly climatology ...")
    pr_cal, cal = calibrate(cfg, gauge)
    print(f"[calibrate] NSE={cal['nse']:.3f}  %bias={cal['percent_bias']:+.1f}  "
          f"modeled annual={cal['modeled_annual_af']:,.0f} AF  obs={cal['observed_annual_af']:,.0f} AF")

    res = simulate(cfg, pr_cal)
    central_inc = cfg.seeding["seeded_precip_increment_pct"]["central"]
    seed_central = run_paired(cfg, pr_cal, central_inc)
    print(f"[seeding] central +{central_inc*100:.0f}% cool-season precip -> "
          f"+{seed_central.delta_af:,.0f} AF at outlet, "
          f"+{seed_central.delta_af_to_lake:,.0f} AF to lake, "
          f"{seed_central.delta_stage_in:.3f} in/yr stage")

    print(f"[montecarlo] {n_draws} draws ...")
    mc = run_montecarlo(cfg, pr_cal, n=n_draws)

    acres = lake_acres_at_stage(cfg)
    shortfall_af = cfg.lake["structural_shortfall_af"]
    to_lake_p50 = mc["seeding_delta_af_to_lake"]["p50"]
    years_to_offset = shortfall_af / to_lake_p50 if to_lake_p50 > 0 else None

    payload = {
        "meta": {
            "model": "GSL-SWY+ v1",
            "pilot": cfg.raw["pilot"]["name"],
            "outlet_gauge": cfg.raw["pilot"]["outlet_gauge"],
            "generated_utc": dt.datetime.utcnow().isoformat() + "Z",
            "gauge_years": gauge.n_years,
            "note": ("Snow-aware monthly water balance calibrated to the Bear River outlet gauge. "
                     "Seeding effect is the paired-run difference; uncertainty is Monte Carlo over "
                     "uncertain physical parameters."),
        },
        "calibration": {
            "nash_sutcliffe": cal["nse"],
            "percent_bias": cal["percent_bias"],
            "modeled_annual_af": cal["modeled_annual_af"],
            "observed_annual_af": cal["observed_annual_af"],
            "months": MONTH_LABELS,
            "observed_monthly_cfs": [round(v, 1) for v in cal["observed_monthly_cfs"]],
            "modeled_monthly_cfs": [round(v, 1) for v in cal["modeled_monthly_cfs"]],
            "observed_p10_cfs": [round(v, 1) for v in gauge.clim_cfs_p10.tolist()],
            "observed_p90_cfs": [round(v, 1) for v in gauge.clim_cfs_p90.tolist()],
        },
        "water_balance_af": {
            "precip": round(res.precip_af),
            "aet": round(res.aet_af),
            "quickflow": round(res.quickflow_af),
            "baseflow": round(res.baseflow_af),
            "yield_to_outlet": round(res.annual_af),
            "peak_swe_month": MONTH_LABELS[res.peak_swe_month - 1],
        },
        "calibrated_params": {
            "oro_per_km": round(pr_cal.oro_per_km, 3),
            "precip_scale": round(pr_cal.precip_scale, 3),
            "melt_factor_mm_per_C_day": round(pr_cal.melt_factor, 3),
            "baseflow_beta": round(pr_cal.beta, 3),
            "depletion_factor": round(pr_cal.depletion_factor, 3),
        },
        "seeding_central": {
            "increment_pct": seed_central.increment_pct,
            "delta_af_at_outlet": round(seed_central.delta_af),
            "delta_af_to_lake": round(seed_central.delta_af_to_lake),
            "delta_stage_inches_per_year": round(seed_central.delta_stage_in, 4),
        },
        "seeding_uncertainty": mc,
        "lake_context": {
            "south_arm_stage_ft": cfg.lake["recent_south_arm_ft"],
            "healthy_stage_ft": cfg.lake["healthy_elev_ft"],
            "surface_acres_at_stage": round(acres),
            "structural_shortfall_af": shortfall_af,
            "seeding_to_lake_p50_af": round(to_lake_p50),
            "years_of_seeding_to_offset_structural_shortfall": (
                round(years_to_offset) if years_to_offset else None),
            "honesty_note": ("At the median modeled effect, a full year of cloud seeding offsets "
                             "well under 1% of the lake's structural water deficit -- it would "
                             "take centuries of seeding to close it. The physical seeding pathway "
                             "is anchored to the operationally-validated yield envelope (a 3-10% "
                             "effect in targeted storms/areas scaled by the treatable fraction of "
                             "basin precip), so this is ~2-3 orders of magnitude too small to "
                             "refill the lake. Defensible value is in agriculture/ski pathways, "
                             "not lake replenishment."),
        },
    }

    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [OUTLET_LATLON[1], OUTLET_LATLON[0]]},
            "properties": {
                "id": "bear_outlet_model",
                "title": "Bear River — GSL-SWY+ model",
                "gauge": cfg.raw["pilot"]["outlet_gauge"],
                "nash_sutcliffe": round(cal["nse"], 3),
                "percent_bias": round(cal["percent_bias"], 1),
                "modeled_yield_af": round(res.annual_af),
                "observed_yield_af": round(gauge.mean_annual_af),
                "seeding_delta_af_to_lake_p50": round(to_lake_p50),
                "seeding_delta_stage_in_p50": round(mc["seeding_delta_stage_inches_per_year"]["p50"], 4),
                "seeding_delta_stage_in_p05": round(mc["seeding_delta_stage_inches_per_year"]["p05"], 4),
                "seeding_delta_stage_in_p95": round(mc["seeding_delta_stage_inches_per_year"]["p95"], 4),
            },
        }],
    }

    os.makedirs(PUBLIC, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    for d in (PUBLIC, OUT):
        with open(os.path.join(d, "model_outputs.json"), "w") as fh:
            json.dump(payload, fh, indent=2)
        with open(os.path.join(d, "bear_basin_model.geojson"), "w") as fh:
            json.dump(geojson, fh, indent=2)
    print(f"[write] model_outputs.json + bear_basin_model.geojson -> {PUBLIC}")
    print(f"[done] seeding to lake (p50)={to_lake_p50:,.0f} AF/yr  "
          f"stage p50={mc['seeding_delta_stage_inches_per_year']['p50']:.3f} in/yr")


if __name__ == "__main__":
    main()
