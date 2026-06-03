"""Distribute station climate normals across hypsometric elevation bands.

Temperature: lapsed from the valley anchor using a data-derived Tmax lapse rate (Tmax is
less affected by valley cold-air pooling than Tmin), preserving the valley's monthly diurnal
range. Precipitation: the valley monthly *shape* is amplified with elevation by an orographic
multiplier (the two COOP stations are both valley/basin sites and miss alpine orographic
enhancement, so the precip-elevation gradient is a calibrated parameter per the design doc).
PET: Hargreaves (1985) from band Tmean/Tmax/Tmin + extraterrestrial radiation.
"""
from __future__ import annotations
from dataclasses import dataclass

import numpy as np

from .io_data import BasinConfig, DAYS_IN_MONTH

MONTHS = np.arange(1, 13)


@dataclass
class BandForcing:
    elev_m: np.ndarray            # (B,)
    area_frac: np.ndarray         # (B,)
    prcp_mm: np.ndarray           # (B,12) mm/month
    tmean_c: np.ndarray           # (B,12)
    tmax_c: np.ndarray            # (B,12)
    tmin_c: np.ndarray            # (B,12)
    pet_mm: np.ndarray            # (B,12) mm/month


def _extraterrestrial_radiation_mm(lat_deg: float) -> np.ndarray:
    """Monthly mean extraterrestrial radiation Ra expressed in mm/day water-equivalent
    (FAO-56). Returns array of length 12 using mid-month day-of-year."""
    lat = np.radians(lat_deg)
    mid_doy = np.array([15, 45, 74, 105, 135, 162, 198, 228, 259, 289, 319, 345], dtype=float)
    dr = 1 + 0.033 * np.cos(2 * np.pi / 365 * mid_doy)          # inverse rel. earth-sun distance
    decl = 0.409 * np.sin(2 * np.pi / 365 * mid_doy - 1.39)      # solar declination
    ws = np.arccos(np.clip(-np.tan(lat) * np.tan(decl), -1, 1))  # sunset hour angle
    ra = (24 * 60 / np.pi) * 0.0820 * dr * (
        ws * np.sin(lat) * np.sin(decl) + np.cos(lat) * np.cos(decl) * np.sin(ws)
    )  # MJ/m2/day
    return ra * 0.408  # MJ/m2/day -> mm/day water equivalent


def build_forcing(cfg: BasinConfig, oro_per_km: float, precip_scale: float = 1.0,
                  seeding_increment: float = 0.0) -> BandForcing:
    """Build per-band monthly forcing.

    oro_per_km        : fractional precip increase per 1000 m above the valley anchor (calibrated)
    precip_scale      : global multiplier on precip (calibration nuisance for total volume)
    seeding_increment : fractional bump applied to cool-season precip in seedable bands (paired run)
    """
    valley, high = cfg.valley, cfg.high
    dz = high.elev_m - valley.elev_m

    # data-derived monthly lapse rate (deg C / m) from the two-station Tmax difference
    lapse = (high.tmax_c - valley.tmax_c) / dz            # (12,) typically negative
    dtr = valley.tmax_c - valley.tmin_c                   # valley diurnal range, preserved

    elev = cfg.bands_elev_m
    B = elev.size
    tmean = np.zeros((B, 12)); tmax = np.zeros((B, 12)); tmin = np.zeros((B, 12))
    prcp = np.zeros((B, 12))

    seedable = set(cfg.seeding["seedable_months"])
    seed_min_elev = cfg.seeding["seedable_min_elev_m"]

    for b in range(B):
        d_elev = elev[b] - valley.elev_m
        tmean[b] = valley.tmean_c + lapse * d_elev
        tmax[b] = tmean[b] + dtr / 2.0
        tmin[b] = tmean[b] - dtr / 2.0

        oro = 1.0 + oro_per_km * (d_elev / 1000.0)
        p = valley.prcp_mm * oro * precip_scale
        if seeding_increment > 0 and elev[b] >= seed_min_elev:
            bump = np.array([1 + seeding_increment if (m in seedable) else 1.0 for m in MONTHS])
            p = p * bump
        prcp[b] = p

    ra = _extraterrestrial_radiation_mm(cfg.latitude_deg)     # (12,) mm/day
    pet = np.zeros((B, 12))
    for b in range(B):
        td = np.clip(tmax[b] - tmin[b], 0.1, None)
        pet_day = 0.0023 * ra * (tmean[b] + 17.8) * np.sqrt(td)   # mm/day, Hargreaves
        pet_day = np.clip(pet_day, 0, None)
        pet[b] = pet_day * DAYS_IN_MONTH

    return BandForcing(elev_m=elev, area_frac=cfg.bands_area_frac,
                       prcp_mm=prcp, tmean_c=tmean, tmax_c=tmax, tmin_c=tmin, pet_mm=pet)
