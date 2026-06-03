"""Monte Carlo over uncertain parameters, propagating to the seeding-to-lake effect.

Samples the parameters the design flags as uncertain (rain/snow threshold, melt factor,
sublimation fraction, orographic gradient, CN, baseflow beta, and the seeded precip
increment), re-running the paired model each draw to build distributions of the causal
seeding effect on lake stage. Calibrated values anchor the central tendency; priors are
widened around them.
"""
from __future__ import annotations
from dataclasses import replace

import numpy as np

from .io_data import BasinConfig
from .engine import Params
from .seeding import run_paired


def run_montecarlo(cfg: BasinConfig, pr_cal: Params, n: int = 400, seed: int = 12):
    rng = np.random.default_rng(seed)
    inc = cfg.seeding["seeded_precip_increment_pct"]

    def tnorm(mean, sd, lo, hi):
        return float(np.clip(rng.normal(mean, sd), lo, hi))

    delta_af = np.zeros(n)
    delta_to_lake = np.zeros(n)
    delta_stage_in = np.zeros(n)
    base_af = np.zeros(n)
    increments = np.zeros(n)

    for i in range(n):
        pr = replace(
            pr_cal,
            t_rain_snow=tnorm(pr_cal.t_rain_snow, 1.0, -1.5, 3.0),
            melt_factor=tnorm(pr_cal.melt_factor, 0.6, 1.5, 6.0),
            subl_frac=tnorm(pr_cal.subl_frac, 0.05, 0.02, 0.30),
            oro_per_km=tnorm(pr_cal.oro_per_km, 0.12, 0.1, 1.5),
            qf_frac=tnorm(pr_cal.qf_frac, 0.08, 0.05, 0.60),
            beta=tnorm(pr_cal.beta, 0.03, 0.02, 0.40),
        )
        # seeded increment: triangular over published low/central/high
        increment = float(rng.triangular(inc["low"], inc["central"], inc["high"]))
        increments[i] = increment

        sr = run_paired(cfg, pr, increment)
        delta_af[i] = sr.delta_af
        delta_to_lake[i] = sr.delta_af_to_lake
        delta_stage_in[i] = sr.delta_stage_in
        base_af[i] = sr.baseline_annual_af

    def pctiles(a):
        return {
            "p05": float(np.percentile(a, 5)),
            "p50": float(np.percentile(a, 50)),
            "mean": float(np.mean(a)),
            "p95": float(np.percentile(a, 95)),
        }

    return {
        "n_draws": n,
        "seeded_increment_pct": pctiles(increments * 100.0),
        "baseline_annual_af": pctiles(base_af),
        "seeding_delta_af_at_outlet": pctiles(delta_af),
        "seeding_delta_af_to_lake": pctiles(delta_to_lake),
        "seeding_delta_stage_inches_per_year": pctiles(delta_stage_in),
    }
