"""Core monthly water-balance engine: snow -> quickflow/AET/recharge -> baseflow -> outlet.

Runs the 12-month climatology to a repeating steady state (snowpack and the baseflow
reservoir carry storage across months, so the annual cycle is spun up over several years).
All internal depths are mm over the contributing band area.
"""
from __future__ import annotations
from dataclasses import dataclass

import numpy as np

from .io_data import BasinConfig, DAYS_IN_MONTH, AF_PER_CFS_YEAR, SQMI_TO_M2, M3_PER_AF
from .forcing import BandForcing

SEC_PER_MONTH = DAYS_IN_MONTH * 86400.0
CFS_PER_CMS = 35.3147   # cubic feet per second per cubic meter per second


@dataclass
class Params:
    """Uncertain / calibratable parameters (central values are defaults)."""
    oro_per_km: float = 0.55      # orographic precip increase per 1000 m (calibrated)
    precip_scale: float = 1.0     # global precip multiplier (calibration nuisance)
    t_rain_snow: float = 1.0      # rain/snow threshold, deg C
    t_window: float = 2.0         # half-width of the mixed rain/snow transition, deg C
    melt_factor: float = 3.0      # degree-day melt factor, mm / deg C / day
    t_melt: float = 0.0           # melt threshold, deg C
    subl_frac: float = 0.10       # sublimation as fraction of snowfall
    qf_frac: float = 0.25         # fast direct-runoff fraction of soil-saturation excess
    awc_mm: float = 150.0         # soil available water capacity
    beta: float = 0.10            # baseflow linear-reservoir release fraction per month
    depletion_factor: float = 1.0 # net->gauge scaling for upstream consumptive use/diversion
    irrig_af: float = 0.0         # annual growing-season consumptive diversion (AF), seasonal


# growing-season shape for irrigation/consumptive diversion (Jan..Dec), sums to 1.0.
# The Bear is heavily diverted for agriculture; withdrawals peak mid-summer, which is
# what produces the observed deep Jul-Sep low against a high winter baseflow floor.
IRRIG_SHAPE = np.array([0.0, 0.0, 0.0, 0.04, 0.14, 0.22,
                        0.26, 0.18, 0.10, 0.04, 0.02, 0.0])


@dataclass
class EngineResult:
    monthly_cfs: np.ndarray       # (12,) modeled outlet discharge, calendar Jan..Dec
    annual_af: float              # modeled annual yield reaching outlet
    swe_mm: np.ndarray            # (12,) basin-mean SWE (area-weighted)
    quickflow_af: float
    baseflow_af: float
    aet_af: float
    precip_af: float
    peak_swe_month: int


def _snow_step(p_mm, tmean, swe, pr: Params):
    """One band-month: returns (rain+melt available mm, snowfall, melt, sublimation, new swe)."""
    # rain/snow partition with a linear transition band
    frac_snow = np.clip((pr.t_rain_snow + pr.t_window - tmean) / (2 * pr.t_window), 0.0, 1.0)
    snowfall = p_mm * frac_snow
    rain = p_mm - snowfall
    swe = swe + snowfall
    subl = pr.subl_frac * snowfall
    swe = max(0.0, swe - subl)
    return rain, snowfall, subl, swe


def run_engine(cfg: BasinConfig, forcing: BandForcing, pr: Params,
               spinup_years: int = 6) -> EngineResult:
    B = forcing.elev_m.size
    swe = np.zeros(B)            # snow water equivalent state per band
    soil = np.full(B, pr.awc_mm * 0.5)
    bf_store = np.zeros(B)       # baseflow reservoir per band

    last = None
    for yr in range(spinup_years):
        monthly_runoff_mm = np.zeros(12)     # area-weighted total runoff depth
        monthly_qf_mm = np.zeros(12)
        monthly_bf_mm = np.zeros(12)
        monthly_aet_mm = np.zeros(12)
        monthly_swe_mm = np.zeros(12)
        monthly_p_mm = np.zeros(12)

        for mi in range(12):
            days = DAYS_IN_MONTH[mi]
            qf_w = bf_w = aet_w = ro_w = swe_w = p_w = 0.0
            for b in range(B):
                af = forcing.area_frac[b]
                p_mm = forcing.prcp_mm[b, mi]
                tmean = forcing.tmean_c[b, mi]
                pet = forcing.pet_mm[b, mi]

                rain, snowfall, subl, swe[b] = _snow_step(p_mm, tmean, swe[b], pr)
                # degree-day melt
                pot_melt = pr.melt_factor * max(0.0, tmean - pr.t_melt) * days
                melt = min(swe[b], pot_melt)
                swe[b] -= melt
                avail = rain + melt                      # water reaching the soil surface

                # Monthly Thornthwaite-Mather partition. SCS-CN is a daily-storm
                # method; applied to a whole month's snowmelt it spuriously converts
                # nearly all melt to instantaneous quickflow (a giant spring spike,
                # no baseflow floor). Instead: water enters the soil, AET is removed,
                # and the soil-saturation excess splits into a small fast direct-runoff
                # fraction plus recharge to a slow groundwater reservoir.
                soil[b] += avail
                ks = np.clip(soil[b] / pr.awc_mm, 0.0, 1.0)
                aet = min(pet * ks, soil[b])
                soil[b] -= aet
                excess = max(0.0, soil[b] - pr.awc_mm)
                soil[b] = min(soil[b], pr.awc_mm)

                qf = pr.qf_frac * excess                 # fast surface/interflow component
                recharge = excess - qf

                # baseflow (slow groundwater) linear reservoir
                bf_store[b] += recharge
                bf = bf_store[b] * pr.beta
                bf_store[b] -= bf

                qf_w += af * qf
                bf_w += af * bf
                aet_w += af * aet
                ro_w += af * (qf + bf)
                swe_w += af * swe[b]
                p_w += af * p_mm

            monthly_qf_mm[mi] = qf_w
            monthly_bf_mm[mi] = bf_w
            monthly_aet_mm[mi] = aet_w
            monthly_runoff_mm[mi] = ro_w
            monthly_swe_mm[mi] = swe_w
            monthly_p_mm[mi] = p_w

        last = (monthly_runoff_mm, monthly_qf_mm, monthly_bf_mm,
                monthly_aet_mm, monthly_swe_mm, monthly_p_mm)

    ro_mm, qf_mm, bf_mm, aet_mm, swe_mm, p_mm = last

    # depth (mm over basin) -> volume -> discharge
    area_m2 = cfg.area_sqmi * SQMI_TO_M2
    def mm_to_af(mm):
        return (mm / 1000.0) * area_m2 / M3_PER_AF
    def mm_to_cfs(mm, mi):
        vol_m3 = (mm / 1000.0) * area_m2
        return vol_m3 / SEC_PER_MONTH[mi] * CFS_PER_CMS   # m3/s -> cfs

    dep = pr.depletion_factor
    # gross modeled outlet flow, then subtract the seasonal consumptive diversion
    gross_cfs = np.array([mm_to_cfs(ro_mm[mi], mi) for mi in range(12)]) * dep
    div_af = pr.irrig_af * IRRIG_SHAPE
    div_cfs = np.array([div_af[mi] * M3_PER_AF / SEC_PER_MONTH[mi] * CFS_PER_CMS
                        for mi in range(12)])
    monthly_cfs = np.maximum(gross_cfs - div_cfs, 0.0)
    # annual yield reaching the outlet is the gross net of actual (clipped) diversion
    gross_af = np.array([mm_to_af(ro_mm[mi]) for mi in range(12)]) * dep
    diverted_af = np.minimum(div_cfs, gross_cfs) * SEC_PER_MONTH / M3_PER_AF / CFS_PER_CMS
    annual_af = float(np.sum(gross_af - diverted_af))
    return EngineResult(
        monthly_cfs=monthly_cfs,
        annual_af=annual_af,
        swe_mm=swe_mm,
        quickflow_af=float(sum(mm_to_af(qf_mm[mi]) for mi in range(12)) * dep),
        baseflow_af=float(sum(mm_to_af(bf_mm[mi]) for mi in range(12)) * dep),
        aet_af=float(sum(mm_to_af(aet_mm[mi]) for mi in range(12))),
        precip_af=float(sum(mm_to_af(p_mm[mi]) for mi in range(12))),
        peak_swe_month=int(np.argmax(swe_mm) + 1),
    )
