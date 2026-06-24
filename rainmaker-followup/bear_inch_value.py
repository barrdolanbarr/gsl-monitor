"""
bear_inch_value.py
===================
What is the downstream economic value of ONE extra inch of precipitation
over the Bear River basin?

This is the literal question posed in the Rainmaker interview. The model is a
transparent, parameterized chain:

    1 inch over basin area  ->  gross precip volume (AF)
                            ->  x runoff coefficient        =  NEW STREAMFLOW (AF)
                            ->  allocate among uses          =  AF by use
                            ->  x $/AF by use                =  ECONOMIC VALUE

Every uncertain input is a distribution, not a point. We run a Monte Carlo and
report P10 / P50 / P90 plus a sensitivity (variance-driver) ranking, because the
honest answer to "what's an inch worth" is a range with named drivers.

THREE VALUATION LENSES (reported separately on purpose):
  A. Marginal value of the water  -- willingness-to-pay / net value of the water
                                      itself (ag NET return to water, M&I avoided
                                      cost, hydropower). Answers "what is the
                                      water worth."
  B. Total economic output supported -- impact-study style: GROSS crop revenue
                                      x regional multiplier, + M&I + hydro.
                                      Answers "downstream economic footprint."
  C. Highest-and-best-use benchmark -- value every new AF at the M&I development
                                      cost Utah is already prepared to pay.

SOURCES (see companion brief for full citations):
  - Basin area ~7,500 sq mi: Utah Div. of Water Resources / bearriverinfo.org
  - Basin precipitation ~8.3M AF/yr (4.0 UT + 2.3 ID + 2.0 WY): UDWR
  - Undepleted natural flow ~1.75M AF/yr; current inflow to GSL ~1.2M AF/yr;
    gross diversions ~750K AF/yr: Wyoming/Utah State Water Plans
        -> basin runoff ratio ~ 1.75M / 8.3M = 0.21  (anchors the LOW end of r)
  - Bear River Development: 220,000 AF/yr at ~$365-400/AF, $1.5-2.8B capital:
    Utah Div. of Water Resources / Deseret News  (anchors M&I $/AF)
  - Alfalfa ~$299/AF gross (AZ), ~$1000/ac gross at 5 t/ac x $200/t; net return
    to water for low-value forage ~$30-120/AF: UNR / AZ Farm Bureau / lit.
  - Hydropower: Bear cascade ~77 MW (Soda/Grace/Oneida/Cutler), run-of-river;
    ~130 kWh per AF across usable head x ~$0.04/kWh ~ $5/AF: PacifiCorp + calc.
"""

import numpy as np

rng = np.random.default_rng(42)
N = 200_000

# ----------------------------------------------------------------------
# STAGE 1 - precipitation volume (deterministic given the question)
# ----------------------------------------------------------------------
BASIN_SQ_MI = 7_500
ACRES_PER_SQ_MI = 640
BASIN_ACRES = BASIN_SQ_MI * ACRES_PER_SQ_MI          # 4,800,000 acres
INCH_FT = 1.0 / 12.0
V_GROSS_AF = BASIN_ACRES * INCH_FT                   # 400,000 AF of extra precip

def tri(lo, mode, hi, n=N):
    return rng.triangular(lo, mode, hi, n)

# ----------------------------------------------------------------------
# STAGE 2 - runoff coefficient: fraction of extra precip reaching the river
#   LOW  0.20  ~ long-run basin runoff ratio (1.75M/8.3M)
#   MODE 0.30  ~ marginal: seeding adds high-elevation winter snow that
#               converts more efficiently than the basin average
#   HIGH 0.45  ~ cold high-elevation snowpack, low ET, saturated/frozen ground
# ----------------------------------------------------------------------
runoff_coeff = tri(0.20, 0.30, 0.45)
new_streamflow = V_GROSS_AF * runoff_coeff           # NEW AF in the river

# ----------------------------------------------------------------------
# STAGE 3 - allocation of the new streamflow among consumptive uses
#   ag dominates diversions in the Bear; M&I is small but high value;
#   the remainder passes downstream (still earns hydropower).
#   Hydropower is NON-CONSUMPTIVE: it applies to ALL new streamflow.
# ----------------------------------------------------------------------
frac_ag = tri(0.35, 0.50, 0.65)
frac_mi = tri(0.00, 0.08, 0.20)
# clip so ag+mi <= 1
overflow = np.maximum(0.0, frac_ag + frac_mi - 1.0)
frac_ag = frac_ag - overflow
af_ag = new_streamflow * frac_ag
af_mi = new_streamflow * frac_mi
af_all = new_streamflow                              # hydropower sees all of it

# ----------------------------------------------------------------------
# STAGE 4 - $/AF by use
# ----------------------------------------------------------------------
ag_net_per_af   = tri(30, 70, 120)     # marginal NET return to water (forage)
ag_gross_per_af = tri(150, 250, 330)   # GROSS crop revenue per AF (output lens)
mi_per_af       = tri(350, 420, 600)   # M&I avoided development cost
hydro_per_af    = tri(3, 5, 8)         # run-of-river passthrough
ag_multiplier   = tri(1.4, 1.8, 2.2)   # regional economic output multiplier (ag)

# ----------------------------------------------------------------------
# THREE LENSES
# ----------------------------------------------------------------------
lens_A = ag_net_per_af * af_ag + mi_per_af * af_mi + hydro_per_af * af_all
lens_B = (ag_gross_per_af * af_ag * ag_multiplier
          + mi_per_af * af_mi + hydro_per_af * af_all)
lens_C = mi_per_af * af_all

def pct(x):
    return np.percentile(x, [10, 50, 90])

def fmt_money(v):
    return f"${v/1e6:6.2f}M"

print("=" * 68)
print("ONE EXTRA INCH OVER THE BEAR RIVER BASIN  -  downstream value")
print("=" * 68)
print(f"Basin area:               {BASIN_ACRES:,.0f} acres ({BASIN_SQ_MI:,} sq mi)")
print(f"Gross extra precip (1 in):{V_GROSS_AF:,.0f} acre-feet")
print()

p = pct(new_streamflow)
print(f"NEW STREAMFLOW (AF):      P10 {p[0]:7,.0f}   P50 {p[1]:7,.0f}   P90 {p[2]:7,.0f}")
print(f"  (runoff coeff P10/50/90: "
      f"{np.percentile(runoff_coeff,10):.2f} / "
      f"{np.percentile(runoff_coeff,50):.2f} / "
      f"{np.percentile(runoff_coeff,90):.2f})")
print()

for name, lens in [("A  marginal water value ", lens_A),
                   ("B  total econ output    ", lens_B),
                   ("C  M&I highest-use bench", lens_C)]:
    p = pct(lens)
    print(f"LENS {name}: P10 {fmt_money(p[0])}   P50 {fmt_money(p[1])}   "
          f"P90 {fmt_money(p[2])}")
print()

# implied blended $/AF (lens A) on the new streamflow
blended = lens_A / new_streamflow
print(f"Implied blended $/AF (lens A): "
      f"P10 ${np.percentile(blended,10):,.0f}  "
      f"P50 ${np.percentile(blended,50):,.0f}  "
      f"P90 ${np.percentile(blended,90):,.0f}")
print()

# ----------------------------------------------------------------------
# SENSITIVITY - which input drives the spread in Lens B?
# rank by |Spearman-ish| correlation of input vs output
# ----------------------------------------------------------------------
def corr(a, b):
    ar = np.argsort(np.argsort(a)); br = np.argsort(np.argsort(b))
    return np.corrcoef(ar, br)[0, 1]

inputs = {
    "runoff coefficient": runoff_coeff,
    "ag allocation frac": frac_ag,
    "ag gross $/AF":      ag_gross_per_af,
    "ag multiplier":      ag_multiplier,
    "M&I allocation frac":frac_mi,
    "M&I $/AF":           mi_per_af,
    "hydro $/AF":         hydro_per_af,
}
print("SENSITIVITY (rank-correlation with Lens B, total output):")
for k, v in sorted(inputs.items(), key=lambda kv: -abs(corr(kv[1], lens_B))):
    print(f"   {k:22s} {corr(v, lens_B):+.3f}")

# save a compact JSON of headline results
import json
out = {
    "gross_precip_AF": V_GROSS_AF,
    "new_streamflow_AF": dict(zip(["p10","p50","p90"], pct(new_streamflow).round(0))),
    "lens_A_marginal_water_value_USD": dict(zip(["p10","p50","p90"], pct(lens_A).round(0))),
    "lens_B_total_output_USD": dict(zip(["p10","p50","p90"], pct(lens_B).round(0))),
    "lens_C_highest_use_USD": dict(zip(["p10","p50","p90"], pct(lens_C).round(0))),
}
with open("bear_inch_results.json", "w") as f:
    json.dump(out, f, indent=2, default=float)
print("\nSaved bear_inch_results.json")
