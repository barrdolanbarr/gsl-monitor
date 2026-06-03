"""Paired baseline / seeded runs and conversion of yield to a lake-stage effect."""
from __future__ import annotations
from dataclasses import dataclass

from .io_data import BasinConfig
from .forcing import build_forcing
from .engine import Params, run_engine


def lake_acres_at_stage(cfg: BasinConfig) -> float:
    """Surface area (acres) near the current stage from the linearized hypsometry."""
    lake = cfg.lake
    stage = lake["recent_south_arm_ft"]
    area_sqmi = lake["ref_area_sqmi"] + lake["d_area_per_ft_sqmi"] * (stage - lake["ref_stage_ft"])
    return area_sqmi * 640.0  # 640 acres per square mile


@dataclass
class SeedingResult:
    baseline_annual_af: float
    seeded_annual_af: float
    delta_af: float                 # extra water reaching the outlet from seeding
    delta_af_to_lake: float         # after delivery factor to the lake
    delta_stage_ft: float           # resulting south-arm stage change (full year of operations)
    delta_stage_in: float
    increment_pct: float


def run_paired(cfg: BasinConfig, pr: Params, increment: float) -> SeedingResult:
    # The published increment is a per-storm, per-target-area effect. Scale it by the
    # treatable fraction of the basin's cool-season precip to get the realized basin-wide
    # bump, so the physical yield matches the operationally-validated full-deployment range.
    eff_increment = increment * cfg.seeding.get("seeded_treatable_fraction", 1.0)
    base_forcing = build_forcing(cfg, pr.oro_per_km, pr.precip_scale, seeding_increment=0.0)
    seed_forcing = build_forcing(cfg, pr.oro_per_km, pr.precip_scale, seeding_increment=eff_increment)
    base = run_engine(cfg, base_forcing, pr)
    seed = run_engine(cfg, seed_forcing, pr)

    delta = seed.annual_af - base.annual_af
    delivery = cfg.seeding["delivery_factor_to_lake"]
    delta_to_lake = delta * delivery
    acres = lake_acres_at_stage(cfg)
    d_stage_ft = delta_to_lake / acres
    return SeedingResult(
        baseline_annual_af=base.annual_af,
        seeded_annual_af=seed.annual_af,
        delta_af=delta,
        delta_af_to_lake=delta_to_lake,
        delta_stage_ft=d_stage_ft,
        delta_stage_in=d_stage_ft * 12.0,
        increment_pct=increment * 100.0,
    )
