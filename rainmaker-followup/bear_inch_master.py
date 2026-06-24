"""
bear_inch_master.py
===================
UNIFIED model behind the master document (06_bear_inch_master.md).

It reproduces, from ONE set of Monte Carlo draws (seed 42, N=200k), every number
in the three prior pieces so they cannot contradict each other:
  - first-order $ model      (was bear_inch_value.py  -> doc 00)
  - ecological value streams  (was bear_inch_eco.py    -> doc 04)
and emits a single "relationship table": for each precipitation impact,
    +1 inch over the basin  ->  Y units of <thing>  ->  $Z / yr
plus a per-acre-foot normalization. Computing everything from one draw set keeps
the joint distribution (and the combined total) internally consistent.

The flow-regime / thermal links (doc 05) are production-function / research-stage
and are reported structurally in the document, not as fixed coefficients here.

SOURCES are cited in the companion document (06_bear_inch_master.md).
"""
import numpy as np, json

rng = np.random.default_rng(42)
N = 200_000
def tri(a, b, c): return rng.triangular(a, b, c, N)
def pct(x): return np.percentile(x, [10, 50, 90])
def M(v): return v / 1e6

# ---------------------------------------------------------------- STAGE 1
BASIN_ACRES = 7_500 * 640                 # 4,800,000 acres
GROSS = BASIN_ACRES / 12.0                # 400,000 AF per inch (deterministic)

# ---------------------------------------------------------------- STAGE 2 snow/rain split
# Glaciogenic (silver-iodide) seeding produces overwhelmingly high-elevation
# WINTER SNOW. We split the inch 80% snow / 20% rain and give each its own
# runoff coefficient. Snow converts to streamflow far more efficiently (cold,
# low ET, frozen/saturated ground); the warmer rain fraction loses more to
# ET/infiltration. Summing the two gives the marginal streamflow for a SEEDED
# inch, and an implied blended coefficient that sits above the basin average.
SNOW_FRAC   = 0.80
gross_snow  = GROSS * SNOW_FRAC           # 320,000 AF falls as snow
gross_rain  = GROSS * (1 - SNOW_FRAC)     #  80,000 AF falls as rain
runoff_snow = tri(0.30, 0.40, 0.50)       # high-elevation snowpack -> efficient
runoff_rain = tri(0.05, 0.15, 0.30)       # rain -> more ET / infiltration loss
streamflow  = gross_snow*runoff_snow + gross_rain*runoff_rain   # new river streamflow
remainder   = GROSS - streamflow          # non-runoff water (subl + ET + recharge)
blended_runoff = streamflow / GROSS       # implied effective runoff coefficient

s_subl, s_et, s_rech = tri(0.20,0.35,0.50), tri(0.25,0.40,0.55), tri(0.10,0.20,0.35)
ss = s_subl+s_et+s_rech; s_subl,s_et,s_rech = s_subl/ss, s_et/ss, s_rech/ss
af_subl, af_et, af_rech = remainder*s_subl, remainder*s_et, remainder*s_rech

frac_ag, frac_mi = tri(0.35,0.50,0.65), tri(0.00,0.08,0.20)
frac_ag -= np.maximum(0, frac_ag+frac_mi-1)
frac_instream = np.maximum(0, 1-frac_ag-frac_mi)
af_ag, af_mi = streamflow*frac_ag, streamflow*frac_mi
af_instream = streamflow*frac_instream
af_div = af_ag + af_mi

# ---------------------------------------------------------------- STAGE 3 unit $/AF
ag_net, ag_gross = tri(30,70,120), tri(150,250,330)
mi, hydro, mult = tri(350,420,600), tri(3,5,8), tri(1.4,1.8,2.2)
forage, rech, instream = tri(8,20,45), tri(20,80,250), tri(40,120,300)
wildfire, carbon = tri(2,8,25), tri(1,4,12)

# ---------------------------------------------------------------- first-order lenses
lens_A = ag_net*af_ag + mi*af_mi + hydro*streamflow            # marginal water value
lens_B = ag_gross*af_ag*mult + mi*af_mi + hydro*streamflow     # total econ output
lens_C = mi*streamflow                                          # M&I highest-use

# ---------------------------------------------------------------- ecological streams
val_forage   = forage   * af_et
val_recharge = rech     * af_rech
val_instream = instream * af_instream
val_wildfire = wildfire * (af_et+af_rech)
val_carbon   = carbon   * af_et
eco_core  = val_forage + val_recharge + val_instream
eco_total = eco_core + val_wildfire + val_carbon

# combined defensible "what an inch is worth": marginal direct + ecological core
# (legitimate: eco is different water / different goods; lenses A/B/C do NOT sum)
combined = lens_A + eco_core

# ---------------------------------------------------------------- print relationship table
def row(label, Y, yunit, Z):
    p = pct(Z)
    print(f"{label:30s} | {np.percentile(Y,50):10,.0f} {yunit:9s} "
          f"| ${M(p[0]):6.1f}M ${M(p[1]):6.1f}M ${M(p[2]):6.1f}M")

print("="*96)
print("RELATIONSHIP TABLE  --  '+1 inch over the Bear basin  ->  Y units  ->  $Z/yr'")
print("="*96)
print(f"{'IMPACT':30s} | {'Y (P50)':20s} | {'$Z  P10 / P50 / P90':24s}")
print("-"*96)
print(f"{'gross precipitation':30s} | {GROSS:10,.0f} {'AF':9s} | (deterministic)")
print(f"{'  of which snow (80%)':30s} | {gross_snow:10,.0f} {'AF':9s} | (assumption)")
print(f"{'  of which rain (20%)':30s} | {gross_rain:10,.0f} {'AF':9s} | (assumption)")
print(f"{'new streamflow':30s} | {np.percentile(streamflow,50):10,.0f} {'AF':9s} | "
      f"(blended runoff P50 {np.percentile(blended_runoff,50):.2f})")
print("-- first-order (direct use) -----------------------------------------------------------------")
row("ag irrigation (net to water)", af_ag, "AF", ag_net*af_ag)
row("municipal & industrial",      af_mi, "AF", mi*af_mi)
row("hydropower (non-consumptive)",streamflow,"AF", hydro*streamflow)
print("-- ecological / non-market ------------------------------------------------------------------")
row("rangeland forage green-up",   af_et,  "AF", val_forage)
row("groundwater recharge",        af_rech,"AF", val_recharge)
row("instream fisheries/recreation",af_instream,"AF", val_instream)
row("wildfire risk reduction",     af_et+af_rech,"AF", val_wildfire)
row("carbon (SCC)",                af_et,  "AF", val_carbon)
print("-- roll-ups ---------------------------------------------------------------------------------")
for nm, v in [("LENS A marginal water value", lens_A),
              ("LENS B total econ output", lens_B),
              ("LENS C M&I highest-use", lens_C),
              ("ECO CORE (forage+rech+instr)", eco_core),
              ("ECO TOTAL (+wildfire+carbon)", eco_total),
              ("COMBINED (Lens A + eco core)", combined)]:
    p = pct(v)
    print(f"{nm:30s} |            {'':9s} | ${M(p[0]):6.1f}M ${M(p[1]):6.1f}M ${M(p[2]):6.1f}M")

print("\nWATER BUDGET (P50 AF, sums to 400,000):")
for nm, a in [("diverted (ag+M&I)",af_div),("in-channel residual",af_instream),
              ("vegetation ET",af_et),("recharge/soil",af_rech),("sublimation/loss",af_subl)]:
    print(f"   {nm:22s} {np.percentile(a,50):8,.0f}")
tot = af_div+af_instream+af_et+af_rech+af_subl
print(f"   {'TOTAL (mean)':22s} {tot.mean():8,.0f}   max abs err {np.abs(tot-GROSS).max():.4f}")

print(f"\nblended $/AF (Lens A / streamflow): P50 ${np.percentile(lens_A/streamflow,50):.0f}")
print(f"combined $/inch P50: ${M(np.percentile(combined,50)):.1f}M  "
      f"(= Lens A ${M(np.percentile(lens_A,50)):.1f}M + eco core ${M(np.percentile(eco_core,50)):.1f}M)")

# ---------------------------------------------------------------- save JSON
def d(x): return dict(zip(["p10","p50","p90"], pct(x).round(0).tolist()))
out = {
    "gross_AF": GROSS,
    "snow_frac": SNOW_FRAC,
    "gross_snow_AF": gross_snow, "gross_rain_AF": gross_rain,
    "blended_runoff_p50": float(np.percentile(blended_runoff,50)),
    "streamflow_AF_p50": float(np.percentile(streamflow,50)),
    "water_budget_p50_AF": {k: float(np.percentile(v,50)) for k,v in
        [("diverted",af_div),("instream",af_instream),("vegetation_ET",af_et),
         ("recharge",af_rech),("sublimation",af_subl)]},
    "value_per_inch_USD": {
        "ag": d(ag_net*af_ag), "mi": d(mi*af_mi), "hydro": d(hydro*streamflow),
        "forage": d(val_forage), "recharge": d(val_recharge),
        "instream": d(val_instream), "wildfire": d(val_wildfire), "carbon": d(val_carbon),
    },
    "lens_A": d(lens_A), "lens_B": d(lens_B), "lens_C": d(lens_C),
    "eco_core": d(eco_core), "eco_total": d(eco_total), "combined_A_plus_eco": d(combined),
}
with open("bear_inch_master_results.json","w") as f:
    json.dump(out, f, indent=2)
print("\nSaved bear_inch_master_results.json")
