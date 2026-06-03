"""Calibrate central parameters against the observed monthly streamflow climatology.

Objective combines Nash-Sutcliffe efficiency (hydrograph shape) and absolute percent-bias
on mean annual volume. We optimize the handful of parameters the design flags as dominant
controls: orographic precip gradient, precip scale, melt factor, baseflow recession (beta),
and the depletion factor. Snow-threshold / sublimation / CN are held at central values here
and explored in the Monte Carlo.
"""
from __future__ import annotations
from dataclasses import replace

import numpy as np
from scipy.optimize import differential_evolution, minimize

from .io_data import BasinConfig, GaugeObs
from .forcing import build_forcing
from .engine import Params, run_engine


def nash_sutcliffe(obs, sim):
    obs = np.asarray(obs); sim = np.asarray(sim)
    denom = np.sum((obs - obs.mean()) ** 2)
    return 1.0 - np.sum((obs - sim) ** 2) / denom if denom > 0 else -np.inf


def percent_bias(obs, sim):
    obs = np.asarray(obs); sim = np.asarray(sim)
    return 100.0 * (np.sum(sim) - np.sum(obs)) / np.sum(obs)


def simulate(cfg: BasinConfig, pr: Params):
    forcing = build_forcing(cfg, pr.oro_per_km, pr.precip_scale)
    return run_engine(cfg, forcing, pr)


def calibrate(cfg: BasinConfig, gauge: GaugeObs, base: Params | None = None):
    base = base or Params()
    obs = gauge.clim_cfs

    # x = [oro_per_km, precip_scale, melt_factor, beta, depletion_factor, qf_frac]
    # beta floor is low: the Bear is a strongly groundwater-buffered/regulated river
    # with a high year-round baseflow floor, which only a slow reservoir can sustain.
    # qf_frac sets the fast/slow split of the soil-saturation excess and controls how
    # sharp the spring snowmelt peak is vs. how much is buffered into baseflow.
    # 7th param: annual growing-season consumptive diversion (AF) that produces the
    # observed summer drawdown. Started near a Bear-basin-scale irrigation estimate.
    x0 = np.array([base.oro_per_km, base.precip_scale, base.melt_factor,
                   base.beta, base.depletion_factor, base.qf_frac, 400000.0])
    bounds = [(0.1, 1.5), (0.6, 1.6), (1.5, 6.0), (0.02, 0.40), (0.4, 1.3),
              (0.05, 0.60), (0.0, 900000.0)]

    def unpack(x):
        return replace(base, oro_per_km=x[0], precip_scale=x[1], melt_factor=x[2],
                       beta=x[3], depletion_factor=x[4], qf_frac=x[5], irrig_af=x[6])

    def loss(x):
        pr = unpack(x)
        res = run_engine(cfg, build_forcing(cfg, pr.oro_per_km, pr.precip_scale), pr,
                         spinup_years=5)
        sim = res.monthly_cfs
        nse = nash_sutcliffe(obs, sim)
        pbias = percent_bias(obs, sim)
        # maximize NSE, penalize volume bias
        return (1.0 - nse) + 0.02 * abs(pbias)

    # Differential evolution strictly respects the physical bounds (Nelder-Mead
    # ignores them and wanders into unphysical regions, e.g. negative orographic
    # gradients that produce negative high-band precip). A short Nelder-Mead polish
    # refines the global-search result.
    de = differential_evolution(loss, bounds, x0=x0, tol=1e-3, maxiter=60,
                                popsize=12, seed=7, polish=False)
    result = minimize(loss, de.x, method="Nelder-Mead",
                      bounds=bounds,
                      options={"xatol": 1e-3, "fatol": 1e-4, "maxiter": 300})
    best = result.x if result.fun < de.fun else de.x
    pr_cal = unpack(best)
    res = simulate(cfg, pr_cal)
    return pr_cal, {
        "nse": float(nash_sutcliffe(obs, res.monthly_cfs)),
        "percent_bias": float(percent_bias(obs, res.monthly_cfs)),
        "modeled_annual_af": res.annual_af,
        "observed_annual_af": gauge.mean_annual_af,
        "modeled_monthly_cfs": res.monthly_cfs.tolist(),
        "observed_monthly_cfs": obs.tolist(),
    }
