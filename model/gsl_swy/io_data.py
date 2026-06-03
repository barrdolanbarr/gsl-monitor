"""Load configuration + observed data, and compute the streamflow calibration target."""
from __future__ import annotations
import csv
import json
import os
from dataclasses import dataclass, field

import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# Unit conversions
IN_TO_MM = 25.4
AF_PER_CFS_YEAR = 723.968          # acre-feet produced by 1 cfs sustained one year
M3_PER_AF = 1233.48
SQMI_TO_M2 = 2.589988e6
DAYS_IN_MONTH = np.array([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], dtype=float)


def f_to_c(f):
    return (np.asarray(f, dtype=float) - 32.0) / 1.8


@dataclass
class Station:
    id: str
    name: str
    elev_m: float
    role: str
    prcp_mm: np.ndarray   # 12, mm/month
    tmax_c: np.ndarray    # 12, deg C
    tmin_c: np.ndarray    # 12, deg C

    @property
    def tmean_c(self):
        return 0.5 * (self.tmax_c + self.tmin_c)


@dataclass
class BasinConfig:
    raw: dict
    stations: list[Station]
    bands_elev_m: np.ndarray
    bands_area_frac: np.ndarray
    area_sqmi: float
    latitude_deg: float
    lake: dict
    routing: dict
    seeding: dict

    @property
    def valley(self) -> Station:
        return min(self.stations, key=lambda s: s.elev_m)

    @property
    def high(self) -> Station:
        return max(self.stations, key=lambda s: s.elev_m)


def load_config() -> BasinConfig:
    with open(os.path.join(DATA_DIR, "basin_config.json")) as fh:
        cfg = json.load(fh)
    with open(os.path.join(DATA_DIR, "climate_normals_stations.json")) as fh:
        norm = json.load(fh)

    stations = []
    for s in norm["stations"]:
        m = s["monthly"]
        stations.append(Station(
            id=s["id"], name=s["name"], elev_m=float(s["elev_m"]), role=s["role"],
            prcp_mm=np.array(m["prcp_in"], dtype=float) * IN_TO_MM,
            tmax_c=f_to_c(m["tmax_f"]),
            tmin_c=f_to_c(m["tmin_f"]),
        ))

    bands = cfg["elevation_bands"]
    return BasinConfig(
        raw=cfg,
        stations=stations,
        bands_elev_m=np.array([b["elev_m"] for b in bands], dtype=float),
        bands_area_frac=np.array([b["area_frac"] for b in bands], dtype=float),
        area_sqmi=float(cfg["pilot"]["drainage_area_sqmi"]),
        latitude_deg=float(cfg["pilot"]["latitude_deg"]),
        lake=cfg["lake"],
        routing=cfg["routing"],
        seeding=cfg["seeding"],
    )


@dataclass
class GaugeObs:
    """Observed monthly streamflow climatology + interannual stats at the outlet gauge."""
    clim_cfs: np.ndarray            # 12, long-term mean monthly discharge (cfs), calendar Jan..Dec
    clim_cfs_p10: np.ndarray        # 12, 10th pct across years (dry)
    clim_cfs_p90: np.ndarray        # 12, 90th pct across years (wet)
    mean_annual_cfs: float
    mean_annual_af: float
    n_years: int
    wettest_years: list[int]
    driest_years: list[int]


def load_gauge() -> GaugeObs:
    path = os.path.join(DATA_DIR, "bear_river_corinne_monthly_cfs.csv")
    by_year: dict[int, dict[int, float]] = {}
    with open(path) as fh:
        for row in csv.reader(fh):
            if not row or row[0].startswith("#") or row[0] == "site":
                continue
            _, yr, mo, val = row[0], int(row[1]), int(row[2]), float(row[3])
            by_year.setdefault(yr, {})[mo] = val

    # monthly climatology across all years that reported each month
    months = np.arange(1, 13)
    clim, p10, p90 = [], [], []
    for mo in months:
        vals = np.array([by_year[y][mo] for y in by_year if mo in by_year[y]])
        clim.append(vals.mean())
        p10.append(np.percentile(vals, 10))
        p90.append(np.percentile(vals, 90))

    # annual means using complete calendar years only
    annual = {}
    for y, md in by_year.items():
        if len(md) == 12:
            annual[y] = np.mean([md[m] for m in range(1, 13)])
    yrs_sorted = sorted(annual, key=lambda y: annual[y])

    mean_annual_cfs = float(np.mean(list(annual.values())))
    return GaugeObs(
        clim_cfs=np.array(clim),
        clim_cfs_p10=np.array(p10),
        clim_cfs_p90=np.array(p90),
        mean_annual_cfs=mean_annual_cfs,
        mean_annual_af=mean_annual_cfs * AF_PER_CFS_YEAR,
        n_years=len(annual),
        wettest_years=yrs_sorted[-5:][::-1],
        driest_years=yrs_sorted[:5],
    )
