"""
bear_inch_eco.py
================
ECOLOGICAL / NON-MARKET extension to bear_inch_value.py.

The direct-use model (bear_inch_value.py) valued ONLY the ~125k AF of the gross
400,000 AF that becomes river streamflow (ag diversion, M&I, hydropower). But an
inch of precipitation is 400,000 AF gross. The other ~275,000 AF does not vanish
-- it sublimates (lost), is transpired by vegetation (rangeland/meadow green-up),
or percolates to soil moisture and aquifer recharge. That water does ECOLOGICAL
work the first model ignored.

This model partitions the full 400,000 AF by physical fate and assigns a value
stream to each fate, using benefit-transfer unit values. It is built around two
hard rules so it does NOT double-count the direct-use model:

  RULE 1 (different water). Forage green-up, recharge, soil-moisture/wildfire,
  and carbon are valued ONLY on the NON-RUNOFF water (the ~275k AF). That water
  never entered the streamflow the direct model valued, so there is no overlap.

  RULE 2 (different good, same in-channel water). Instream fisheries/recreation
  is valued ONLY on the residual streamflow that is NOT diverted to ag or M&I
  -- i.e. (1 - frac_ag - frac_mi) x streamflow, the water the direct model
  already let "pass downstream." The direct model assigned that residual ONLY a
  few $/AF of hydropower (electricity). Recreation/instream habitat is a
  physically distinct good produced by the same passing water (a fishing day is
  not a kWh), so it legitimately stacks on hydro -- but it does NOT stack on the
  ag/M&I value, because diverted water is, by definition, not in the channel.

Every bucket carries an explicit CONFIDENCE TIER. The honest headline is a wide
band whose magnitude is dominated by two poorly-constrained inputs (recharge
$/AF and the instream fraction), not a single number.

SOURCES (benefit-transfer unit values):
  - Groundwater recharge value $90-1,100/AF (median ~$390), avoided-pumping
    $323-452/AF: managed-aquifer-recharge literature. HEAVILY discounted here
    because diffuse soil percolation is mostly NOT recoverable usable storage.
  - Rangeland forage: ~3/4 of Bear basin is grazing land; growing-season precip
    drives forage; 1 AUM ~ 780 lbs dry forage. Marginal value of water on
    dryland range is far below irrigated hay ($30-120/AF) -> low $/AF here.
  - Instream/recreation: western instream-flow leases $115-350/AF/yr; freshwater
    fishing consumer surplus ~$95/day, wildlife viewing ~$48/day (regional
    benefit-transfer). Used as the value of water LEFT in the channel.
  - Social cost of carbon ~$190-255/ton CO2 (EPA 2023/2025). Applied to small
    incremental biomass/soil carbon from forage green-up.
  - Wildfire: soil moisture lowers late-season fuel flammability; suppression +
    damage costs are large but the AF->probability-shift link is unquantified ->
    lowest-confidence, bounded co-benefit only.
"""

import numpy as np
import json

rng = np.random.default_rng(42)
N = 200_000

# ----------------------------------------------------------------------
# STAGE 1 - gross precipitation volume (same as direct model)
# ----------------------------------------------------------------------
BASIN_ACRES = 7_500 * 640                 # 4,800,000 acres
V_GROSS_AF = BASIN_ACRES / 12.0           # 400,000 AF from one inch

def tri(lo, mode, hi, n=N):
    return rng.triangular(lo, mode, hi, n)

# ----------------------------------------------------------------------
# STAGE 2 - hydrologic partition of the 400,000 AF by physical fate
#   runoff           -> streamflow (DIRECT model's domain; valued there)
#   sublimation/loss -> lost to atmosphere (snow); NO value
#   vegetation ET    -> rangeland/meadow green-up (forage, carbon)
#   recharge/soil    -> deep percolation + retained soil moisture
#                       (recharge value, wildfire co-benefit)
# Fractions must sum to 1. We draw runoff first (the same coefficient the
# direct model uses), then split the REMAINDER among the three non-runoff
# fates with triangulars renormalized to the remainder.
# ----------------------------------------------------------------------
runoff_coeff = tri(0.20, 0.30, 0.45)            # same anchor as direct model
streamflow   = V_GROSS_AF * runoff_coeff        # ~125k AF P50
remainder    = V_GROSS_AF - streamflow          # the ~275k AF the direct model ignored

# split of the NON-runoff water (renormalized so the three sum to the remainder)
s_subl = tri(0.20, 0.35, 0.50)   # snow sublimation/interception loss (high elev, windy)
s_et   = tri(0.25, 0.40, 0.55)   # transpired by rangeland/meadow vegetation
s_rech = tri(0.10, 0.20, 0.35)   # deep percolation -> soil moisture / aquifer
ssum = s_subl + s_et + s_rech
s_subl, s_et, s_rech = s_subl/ssum, s_et/ssum, s_rech/ssum

af_subl = remainder * s_subl     # lost, no value
af_et   = remainder * s_et       # forage + carbon
af_rech = remainder * s_rech     # recharge + (with af_et) wildfire soil-moisture pool
af_soil_pool = af_et + af_rech   # soil-moisture available to reduce fuel flammability

# residual in-channel streamflow (NOT diverted) -- ties to direct model's allocation
frac_ag = tri(0.35, 0.50, 0.65)
frac_mi = tri(0.00, 0.08, 0.20)
ov = np.maximum(0.0, frac_ag + frac_mi - 1.0); frac_ag -= ov
frac_instream = np.maximum(0.0, 1.0 - frac_ag - frac_mi)
af_instream = streamflow * frac_instream         # water left in the river

# ----------------------------------------------------------------------
# STAGE 3 - benefit-transfer unit values ($/AF) by ecological fate
# ----------------------------------------------------------------------
# Rangeland forage: marginal value of growing-season water on DRYLAND range,
#   far below irrigated hay. Tier: MEDIUM-LOW.
forage_per_af  = tri(8, 20, 45)
# Recharge: $90-1100/AF in MAR literature, but diffuse percolation is mostly
#   non-recoverable -> heavily discounted. Tier: MEDIUM (and dominant driver).
rech_per_af    = tri(20, 80, 250)
# Instream fisheries/recreation: value of water left in channel (western
#   instream leases + recreation-day surplus). Stacks on hydro, not on ag.
#   Tier: MEDIUM-LOW (Bear is not an ESA fish market like the Lemhi).
instream_per_af = tri(40, 120, 300)
# Wildfire risk reduction: bounded co-benefit on the soil-moisture pool. The
#   AF->fire-probability link is unquantified. Tier: LOW (bound only).
wildfire_per_af = tri(2, 8, 25)
# Carbon: incremental biomass/soil C from forage green-up, valued at SCC.
#   Most biomass C cycles annually -> small permanent fraction. Tier: LOW.
carbon_per_af  = tri(1, 4, 12)

# ----------------------------------------------------------------------
# STAGE 4 - value streams (each on its own, non-overlapping water)
# ----------------------------------------------------------------------
val_forage   = forage_per_af   * af_et          # different water from streamflow
val_recharge = rech_per_af     * af_rech        # different water from streamflow
val_instream = instream_per_af * af_instream    # in-channel residual; stacks on hydro
val_wildfire = wildfire_per_af * af_soil_pool   # co-benefit of soil moisture
val_carbon   = carbon_per_af   * af_et          # co-benefit of green-up

# Two roll-ups, on purpose:
#   CORE  = forage + recharge + instream  (the defensible additive set)
#   TOTAL = CORE + wildfire + carbon       (adds the two low-confidence buckets)
eco_core  = val_forage + val_recharge + val_instream
eco_total = eco_core + val_wildfire + val_carbon

def pct(x): return np.percentile(x, [10, 50, 90])
def m(v):   return f"${v/1e6:6.2f}M"

print("=" * 70)
print("ECOLOGICAL / NON-MARKET VALUE OF ONE EXTRA INCH OVER THE BEAR BASIN")
print("=" * 70)
print(f"Gross precip (1 inch):     {V_GROSS_AF:,.0f} AF")
p = pct(streamflow)
print(f"Runoff -> streamflow:      P50 {p[1]:,.0f} AF  (valued in DIRECT model)")
p = pct(remainder)
print(f"Non-runoff remainder:      P50 {p[1]:,.0f} AF  (this model's domain)")
print()
print("PHYSICAL FATE OF THE NON-RUNOFF WATER (P50 AF):")
for nm, a in [("sublimation/loss (no value)", af_subl),
              ("vegetation ET (forage)", af_et),
              ("recharge/soil moisture", af_rech)]:
    print(f"   {nm:32s} {np.percentile(a,50):8,.0f}")
print(f"   {'in-channel residual (instream)':32s} {np.percentile(af_instream,50):8,.0f}"
      f"   <- from streamflow, not diverted")
print()
print("VALUE STREAMS (P10 / P50 / P90):")
for nm, v, tier in [("forage green-up   ", val_forage,   "MED-LOW"),
                    ("groundwater recharge", val_recharge, "MEDIUM "),
                    ("instream fisheries/rec", val_instream, "MED-LOW"),
                    ("wildfire co-benefit", val_wildfire, "LOW    "),
                    ("carbon (SCC)      ", val_carbon,   "LOW    ")]:
    p = pct(v)
    print(f"   {nm:22s} [{tier}]  {m(p[0])} {m(p[1])} {m(p[2])}")
print()
for nm, v in [("ECO CORE (forage+recharge+instream)", eco_core),
              ("ECO TOTAL (+wildfire+carbon)       ", eco_total)]:
    p = pct(v)
    print(f"{nm}: {m(p[0])}  {m(p[1])}  {m(p[2])}")
print()

# ----------------------------------------------------------------------
# SENSITIVITY - what drives the ecological-value spread? (rank correlation)
# ----------------------------------------------------------------------
def corr(a, b):
    ar = np.argsort(np.argsort(a)); br = np.argsort(np.argsort(b))
    return np.corrcoef(ar, br)[0, 1]

inputs = {
    "recharge $/AF":        rech_per_af,
    "recharge share":       s_rech,
    "instream $/AF":        instream_per_af,
    "instream fraction":    frac_instream,
    "runoff coefficient":   runoff_coeff,
    "ET share":             s_et,
    "forage $/AF":          forage_per_af,
    "sublimation share":    s_subl,
}
print("SENSITIVITY (rank-corr with ECO CORE):")
for k, v in sorted(inputs.items(), key=lambda kv: -abs(corr(kv[1], eco_core))):
    print(f"   {k:22s} {corr(v, eco_core):+.3f}")

# ----------------------------------------------------------------------
# save headline JSON
# ----------------------------------------------------------------------
out = {
    "gross_precip_AF": V_GROSS_AF,
    "streamflow_AF_p50": float(np.percentile(streamflow, 50)),
    "remainder_AF_p50": float(np.percentile(remainder, 50)),
    "value_streams_USD": {
        nm: dict(zip(["p10","p50","p90"], pct(v).round(0).tolist()))
        for nm, v in [("forage", val_forage), ("recharge", val_recharge),
                      ("instream", val_instream), ("wildfire", val_wildfire),
                      ("carbon", val_carbon)]
    },
    "eco_core_USD":  dict(zip(["p10","p50","p90"], pct(eco_core).round(0).tolist())),
    "eco_total_USD": dict(zip(["p10","p50","p90"], pct(eco_total).round(0).tolist())),
}
with open("bear_inch_eco_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("\nSaved bear_inch_eco_results.json")
