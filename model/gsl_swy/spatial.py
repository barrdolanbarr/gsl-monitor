"""Spatial seeding-to-lake efficiency surface for the Bear River pilot.

Turns the calibrated 0-D (elevation-band) water balance into a 2-D field over a real
coarse DEM (model/data/bear_dem_grid.json, ~0.1deg, open-elevation SRTM/ASTER). For every
grid cell inside the Bear basin we reuse the *exact same* calibrated physics the lumped
model is built on, evaluated at that cell's real elevation:

  * snow_fraction   - cool-season (Nov-Mar) precip falling as snow at the cell's lapse-rate
                      temperature. Seeding only generates snow where clouds are cold enough,
                      so warm/low cells score ~0: seeding there does little even if it works.
  * runoff_ratio    - annual runoff / annual precip from a single-band engine run at the
                      cell elevation. Dry, high-PET valley/foothill cells evaporate most of
                      their input (low ratio); cold high cells shed most of it (high ratio).
  * rel_delivery    - relative likelihood that runoff *generated in this cell* reaches the
                      lake rather than being consumed by valley irrigation/conveyance losses.
                      Mountain cells feed the trunk river; valley-floor cells are inside the
                      heavily-diverted agricultural reach, so their generated water is mostly
                      used before the outlet. Ramps 0.35 (valley floor) -> 1.0 (>=2000 m).

The cell hotspot score = snow_fraction * runoff_ratio * rel_delivery. To keep the map honest
and tied to the validated lumped result, we then DISTRIBUTE the calibrated basin-wide
seeding->lake yield (Monte-Carlo p50, ~1,200 AF/yr) across cells in proportion to score*area.
So the per-cell AF/yr values sum back to the validated number: the map literally shows where
that ~1,200 AF comes from, not a new inflated figure.

Output: public/bear_seeding_grid.geojson (one square polygon per in-basin cell) carrying
elevation_m, snow_fraction, runoff_ratio, rel_delivery, eff_index (0-1), and af_to_lake_per_yr.
"""
from __future__ import annotations
import json
import os

import numpy as np

from .io_data import BasinConfig, DATA_DIR
from .forcing import _extraterrestrial_radiation_mm
from .engine import Params, run_engine, _snow_step
from .forcing import BandForcing

MONTHS = np.arange(1, 13)

# Approximate Bear-basin boundary (lat, lon), matching the watershed polygon drawn on the
# monitor map. Used only to scope the grid to "just the Bear River".
BEAR_POLY = [(42.30, -111.30), (42.40, -112.20), (41.70, -112.40),
             (41.40, -111.90), (41.60, -111.20), (42.00, -110.90)]


def _point_in_poly(lat, lon, poly):
    """Ray-casting point-in-polygon. poly is a list of (lat, lon)."""
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        yi, xi = poly[i]
        yj, xj = poly[j]
        if ((yi > lat) != (yj > lat)) and \
           (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def _cell_forcing(cfg: BasinConfig, elev_m: float, oro_per_km: float,
                  precip_scale: float) -> BandForcing:
    """Build single-band monthly forcing for one cell elevation (same lapse/oro/PET as forcing.py)."""
    valley, high = cfg.valley, cfg.high
    dz = high.elev_m - valley.elev_m
    lapse = (high.tmax_c - valley.tmax_c) / dz
    dtr = valley.tmax_c - valley.tmin_c

    d_elev = elev_m - valley.elev_m
    tmean = valley.tmean_c + lapse * d_elev
    tmax = tmean + dtr / 2.0
    tmin = tmean - dtr / 2.0
    oro = 1.0 + oro_per_km * (d_elev / 1000.0)
    prcp = valley.prcp_mm * oro * precip_scale

    ra = _extraterrestrial_radiation_mm(cfg.latitude_deg)
    td = np.clip(tmax - tmin, 0.1, None)
    from .io_data import DAYS_IN_MONTH
    pet_day = np.clip(0.0023 * ra * (tmean + 17.8) * np.sqrt(td), 0, None)
    pet = pet_day * DAYS_IN_MONTH

    return BandForcing(
        elev_m=np.array([elev_m]),
        area_frac=np.array([1.0]),
        prcp_mm=prcp.reshape(1, 12),
        tmean_c=tmean.reshape(1, 12),
        tmax_c=tmax.reshape(1, 12),
        tmin_c=tmin.reshape(1, 12),
        pet_mm=pet.reshape(1, 12),
    )


def _cool_season_snow_fraction(cfg: BasinConfig, elev_m: float, pr: Params) -> float:
    """Precip-weighted fraction of cool-season (seedable months) precip that falls as snow."""
    valley, high = cfg.valley, cfg.high
    dz = high.elev_m - valley.elev_m
    lapse = (high.tmax_c - valley.tmax_c) / dz
    d_elev = elev_m - valley.elev_m
    tmean = valley.tmean_c + lapse * d_elev
    oro = 1.0 + pr.oro_per_km * (d_elev / 1000.0)
    prcp = valley.prcp_mm * oro * pr.precip_scale

    seedable = set(cfg.seeding["seedable_months"])
    snow_p = 0.0
    tot_p = 0.0
    for mi in range(12):
        if (mi + 1) not in seedable:
            continue
        frac_snow = np.clip((pr.t_rain_snow + pr.t_window - tmean[mi]) / (2 * pr.t_window), 0.0, 1.0)
        snow_p += prcp[mi] * frac_snow
        tot_p += prcp[mi]
    return float(snow_p / tot_p) if tot_p > 0 else 0.0


def _rel_delivery(elev_m: float) -> float:
    """Relative likelihood runoff generated here reaches the lake (vs. valley diversion loss).
    Ramps from 0.35 at the valley floor (heavily irrigated lower Bear) to 1.0 at >=2000 m."""
    lo, hi = 1300.0, 2000.0
    f = (elev_m - lo) / (hi - lo)
    return float(np.clip(0.35 + 0.65 * f, 0.35, 1.0))


def build_spatial_grid(cfg: BasinConfig, pr: Params, seeding_to_lake_p50_af: float) -> dict:
    """Compute the per-cell efficiency surface and return a GeoJSON FeatureCollection dict."""
    with open(os.path.join(DATA_DIR, "bear_dem_grid.json")) as fh:
        dem = json.load(fh)
    lats = dem["lats"]
    lons = dem["lons"]
    elev = np.array(dem["elevation_m"], dtype=float)   # (nlat, nlon)
    dlat = abs(lats[1] - lats[0])
    dlon = abs(lons[1] - lons[0])

    cells = []
    for i, la in enumerate(lats):
        for j, lo in enumerate(lons):
            if not _point_in_poly(la, lo, BEAR_POLY):
                continue
            z = float(elev[i, j])
            snow = _cool_season_snow_fraction(cfg, z, pr)
            res = _cell_forcing(cfg, z, pr.oro_per_km, pr.precip_scale)
            eng = run_engine(cfg, res, pr, spinup_years=6)
            runoff_ratio = float(np.clip(eng.annual_af / eng.precip_af, 0.0, 1.0)) \
                if eng.precip_af > 0 else 0.0
            deliv = _rel_delivery(z)
            score = snow * runoff_ratio * deliv
            cells.append({
                "i": i, "j": j, "lat": la, "lon": lo, "elev": z,
                "snow": snow, "runoff": runoff_ratio, "deliv": deliv, "score": score,
            })

    if not cells:
        raise RuntimeError("no cells fell inside the Bear basin mask")

    scores = np.array([c["score"] for c in cells])
    elevs = np.array([c["elev"] for c in cells])
    runoffs = np.array([c["runoff"] for c in cells])
    snows = np.array([c["snow"] for c in cells])

    # distribute the validated basin seeding->lake yield by score (all cells ~equal area)
    wsum = scores.sum()
    af_to_lake = (scores / wsum) * seeding_to_lake_p50_af if wsum > 0 else np.zeros_like(scores)

    smax = scores.max() if scores.max() > 0 else 1.0
    emin, emax = elevs.min(), elevs.max()

    features = []
    for k, c in enumerate(cells):
        la, lo = c["lat"], c["lon"]
        half_lat, half_lon = dlat / 2.0, dlon / 2.0
        ring = [
            [lo - half_lon, la - half_lat],
            [lo + half_lon, la - half_lat],
            [lo + half_lon, la + half_lat],
            [lo - half_lon, la + half_lat],
            [lo - half_lon, la - half_lat],
        ]
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [ring]},
            "properties": {
                "elevation_m": round(c["elev"]),
                "elev_index": round(float((c["elev"] - emin) / (emax - emin)) if emax > emin else 0.0, 3),
                "snow_fraction": round(c["snow"], 3),
                "runoff_ratio": round(c["runoff"], 3),
                "rel_delivery": round(c["deliv"], 3),
                "eff_index": round(c["score"] / smax, 3),
                "af_to_lake_per_yr": round(float(af_to_lake[k]), 2),
            },
        })

    fc = {
        "type": "FeatureCollection",
        "_meta": {
            "what": "Per-cell seeding-to-lake efficiency surface for the Bear River pilot.",
            "dem_source": dem.get("source"),
            "resolution_deg": dem.get("resolution_deg"),
            "n_cells": len(features),
            "elev_min_m": round(float(emin)),
            "elev_max_m": round(float(emax)),
            "runoff_ratio_range": [round(float(runoffs.min()), 3), round(float(runoffs.max()), 3)],
            "snow_fraction_range": [round(float(snows.min()), 3), round(float(snows.max()), 3)],
            "af_to_lake_total": round(float(af_to_lake.sum()), 1),
            "af_to_lake_note": ("Per-cell AF/yr sums to the calibrated basin seeding->lake "
                                "Monte-Carlo p50; it shows WHERE the validated yield originates, "
                                "not an additional amount. Hotspot = cold snow zone x high runoff "
                                "ratio x good delivery to the trunk river."),
        },
        "features": features,
    }
    return fc
