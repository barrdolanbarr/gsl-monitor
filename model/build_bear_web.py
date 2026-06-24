"""
build_bear_web.py
=================
Emits public/bear_economics.json — the single source of truth for the
Bear River Basin Monitor web app.

It re-runs the SAME reconciled Monte Carlo as rainmaker-followup/bear_inch_master.py
(seed 42, N=200k, 80/20 snow/rain split) so every dollar on the website matches the
master document exactly. For each impact it emits a "relationship record":

    add 1 inch over the Bear basin  ->  Y units of <thing>  ->  $Z / yr

plus per-acre-foot-generated coefficients (so the UI slider can rescale any
"water generated" quantity instantly), confidence tiers, the ecological/flow-regime
narrative, and sourced unit values. The GSL is included ONLY as a terminal:
how much of the inch reaches the lake, and the (deliberately modest, joint) value
of that water.
"""
import numpy as np, json, os

rng = np.random.default_rng(42)
N = 200_000
def tri(a, b, c): return rng.triangular(a, b, c, N)
def p(x): return [round(float(v)) for v in np.percentile(x, [10, 50, 90])]
def p50(x): return float(np.percentile(x, 50))

# ---------------------------------------------------------------- hydrology (matches master)
BASIN_ACRES = 7_500 * 640                  # 4,800,000 acres
GROSS = BASIN_ACRES / 12.0                 # 400,000 AF per inch

SNOW_FRAC = 0.80
gross_snow = GROSS * SNOW_FRAC
gross_rain = GROSS * (1 - SNOW_FRAC)
runoff_snow = tri(0.30, 0.40, 0.50)
runoff_rain = tri(0.05, 0.15, 0.30)
streamflow = gross_snow * runoff_snow + gross_rain * runoff_rain
remainder = GROSS - streamflow
blended_runoff = streamflow / GROSS

s_subl, s_et, s_rech = tri(0.20, 0.35, 0.50), tri(0.25, 0.40, 0.55), tri(0.10, 0.20, 0.35)
ss = s_subl + s_et + s_rech
s_subl, s_et, s_rech = s_subl/ss, s_et/ss, s_rech/ss
af_subl, af_et, af_rech = remainder*s_subl, remainder*s_et, remainder*s_rech

frac_ag, frac_mi = tri(0.35, 0.50, 0.65), tri(0.00, 0.08, 0.20)
frac_ag -= np.maximum(0, frac_ag + frac_mi - 1)
frac_instream = np.maximum(0, 1 - frac_ag - frac_mi)
af_ag, af_mi = streamflow*frac_ag, streamflow*frac_mi
af_instream = streamflow*frac_instream
af_div = af_ag + af_mi

# ---------------------------------------------------------------- unit $/AF (matches master)
ag_net, ag_gross = tri(30, 70, 120), tri(150, 250, 330)
mi, hydro, mult = tri(350, 420, 600), tri(3, 5, 8), tri(1.4, 1.8, 2.2)
forage, rech, instream = tri(8, 20, 45), tri(20, 80, 250), tri(40, 120, 300)
wildfire, carbon = tri(2, 8, 25), tri(1, 4, 12)

# ---------------------------------------------------------------- value streams
val_ag       = ag_net * af_ag
val_mi       = mi * af_mi
val_hydro    = hydro * streamflow
val_forage   = forage * af_et
val_recharge = rech * af_rech
val_instream = instream * af_instream
val_wildfire = wildfire * (af_et + af_rech)
val_carbon   = carbon * af_et

lens_A = val_ag + val_mi + val_hydro
lens_B = ag_gross*af_ag*mult + val_mi + val_hydro
lens_C = mi*streamflow
eco_core  = val_forage + val_recharge + val_instream
eco_total = eco_core + val_wildfire + val_carbon
combined  = lens_A + eco_core

# water that continues downstream toward the Great Salt Lake = the non-diverted
# in-channel residual (instream) plus a fraction of recharge that returns as baseflow.
gw_return_frac = tri(0.10, 0.25, 0.45)     # share of recharge that returns to channel
af_to_lake = af_instream + af_rech*gw_return_frac

# GSL terminal joint-benefit anchors ($/AF of water reaching the lake) — modest by design.
gsl_dust, gsl_eco, gsl_ski, gsl_rec = tri(40, 80, 130), tri(20, 40, 70), tri(15, 30, 55), tri(8, 15, 30)
val_gsl_dust = gsl_dust * af_to_lake
val_gsl_eco  = gsl_eco  * af_to_lake
val_gsl_ski  = gsl_ski  * af_to_lake
val_gsl_rec  = gsl_rec  * af_to_lake
gsl_total = val_gsl_dust + val_gsl_eco + val_gsl_ski + val_gsl_rec

def coef(stream):
    """per-AF-of-generated-water dollar coefficients (linear scaling for the UI slider)."""
    lo, md, hi = p(stream)
    return {"p10": lo/GROSS, "p50": md/GROSS, "p90": hi/GROSS}

def benefit(slug, label, short, layer, Y_af, stream, unit_lo, unit_md, unit_hi, unit,
            conf, beneficiary, mechanism, relationship, source, color):
    return {
        "slug": slug, "label": label, "short": short, "layer": layer,
        "beneficiary": beneficiary, "confidence": conf, "color": color,
        "y_af_per_inch": round(p50(Y_af)), "y_af_per_genAF": p50(Y_af)/GROSS,
        "usd_per_inch": p(stream), "usd_per_genAF": coef(stream),
        "unit_value": {"lo": unit_lo, "p50": unit_md, "hi": unit_hi, "unit": unit},
        "mechanism": mechanism, "relationship": relationship, "source": source,
    }

benefits = [
    # ---- Layer 1: direct human use --------------------------------------------------
    benefit("irrigation", "Irrigation water", "Irrigation", "Direct use",
            af_ag, val_ag, 30, 70, 120, "$/AF net to water", "HIGH", "Agriculture",
            "New streamflow is diverted to alfalfa/hay. Forage is the lowest-value use per "
            "acre-foot in the basin — the central irony of the Bear.",
            "Each diverted acre-foot of irrigation water is worth its net return to the water itself.",
            "University of Nevada Reno Extension / Arizona Farm Bureau — alfalfa water use & net value per AF.",
            "#1f6f8b"),
    benefit("municipal", "Municipal & industrial supply", "M&I supply", "Direct use",
            af_mi, val_mi, 350, 420, 600, "$/AF", "HIGH", "Municipal & Industrial",
            "A small share of new streamflow is captured for cities and industry — small in "
            "volume, highest in value per acre-foot.",
            "Each acre-foot of municipal supply is valued at the price Utah is already prepared to pay for it.",
            "Bear River Development project — 220,000 AF/yr at a quoted ~$365–400/AF ($1.5–2.8B capital).",
            "#155e75"),
    benefit("hydropower", "Hydropower", "Hydropower", "Direct use",
            streamflow, val_hydro, 3, 5, 8, "$/AF passthrough", "HIGH", "Hydropower",
            "Water is non-consumptive here — every acre-foot in the river generates as it "
            "passes the PacifiCorp dam cascade (Soda, Grace, Oneida, Cutler) on its way down.",
            "Every acre-foot of streamflow earns run-of-river generation as it passes the cascade.",
            "PacifiCorp Bear River hydroelectric cascade; ~130 kWh/AF × wholesale price.",
            "#c0612e"),
    # ---- Layer 2: ecological / non-market -------------------------------------------
    benefit("instream", "Fish & recreation (water left in the river)", "Fish & recreation", "Ecological",
            af_instream, val_instream, 40, 120, 300, "$/AF/yr", "MED-LOW", "Recreation & fisheries",
            "The water NOT diverted stays in the channel. A fishing day is a genuinely different "
            "product from a kilowatt-hour, so recreation can stack on hydropower for this water — "
            "but never on water already sent to farms and cities.",
            "Each acre-foot left in the channel supports angling and recreation value.",
            "WestWater Research / western water markets (instream leases $115–350/AF); UF/IFAS recreation surplus ~$95/day.",
            "#2ca58d"),
    benefit("recharge", "Groundwater recharge", "Recharge", "Ecological",
            af_rech, val_recharge, 20, 80, 250, "$/AF", "MEDIUM", "Groundwater",
            "Deep percolation that reaches usable aquifer storage offsets future pumping. Diffuse "
            "basin-wide percolation is mostly not recoverable, so the literature value is discounted hard.",
            "Each acre-foot of recharge offsets future pumping at an avoided-cost value.",
            "Managed-aquifer-recharge literature ($90–1,100/AF, median ~$390), discounted to $20–250/AF here.",
            "#b88a1e"),
    benefit("forage", "Rangeland forage green-up", "Forage", "Ecological",
            af_et, val_forage, 8, 20, 45, "$/AF", "MED-LOW", "Ranching",
            "Growing-season soil moisture drives forage on dryland range. Real and broad, but the "
            "marginal value of water on dryland range is far below irrigated hay.",
            "Each acre-foot of growing-season soil moisture adds dryland forage value.",
            "USU/Extension rangeland productivity; 1 AUM ≈ 780 lbs dry forage.",
            "#0f7b54"),
    benefit("wildfire", "Wildfire risk reduction", "Wildfire", "Ecological",
            af_et + af_rech, val_wildfire, 2, 8, 25, "$/AF", "LOW", "Wildfire resilience",
            "Added late-season soil moisture lowers fuel flammability. Suppression and damage costs "
            "are large, but the acre-foot → fire-probability link is genuinely unquantified, so this "
            "is carried as a bounded co-benefit, not a load-bearing number.",
            "Each acre-foot of soil moisture is a bounded co-benefit against wildfire cost.",
            "Federal suppression ~$2.9B/yr; per-acre damage ~$500; fuel-moisture link qualitative.",
            "#a8431e"),
    benefit("carbon", "Carbon (soil + biomass)", "Carbon", "Ecological",
            af_et, val_carbon, 1, 4, 12, "$/AF (SCC-based)", "LOW", "Carbon",
            "Incremental plant and soil carbon from green-up, valued at the EPA social cost of carbon. "
            "Most forage carbon cycles annually, so the permanent fraction is small.",
            "Each acre-foot of green-up stores a small, permanent fraction of carbon.",
            "EPA (2023/2025) social cost of carbon ~$190–255/ton CO₂ on incremental biomass.",
            "#6f8a3a"),
]

# ---- roll-ups -----------------------------------------------------------------------
def rollup(key, label, stream, note):
    return {"key": key, "label": label, "usd_per_inch": p(stream),
            "usd_per_genAF": coef(stream), "note": note}

rollups = [
    rollup("lens_A", "Direct water value (marginal)", lens_A,
           "What the water itself is worth, net. The defensible economic core."),
    rollup("eco_core", "Ecological value (core)", eco_core,
           "Forage + recharge + fish/recreation — the off-river water Layer 1 ignores."),
    rollup("combined", "Combined defensible total", combined,
           "Direct water value + ecological core. These add because they price different water."),
    rollup("lens_B", "Economic activity supported", lens_B,
           "Broader downstream output with a regional multiplier. A framing, not 'value of water'."),
    rollup("lens_C", "Cost to develop the same water", lens_C,
           "Valued at the M&I price Utah already pays. A framing, not additive."),
]

# ---- GSL terminal -------------------------------------------------------------------
gsl_terminal = {
    "af_to_lake_per_inch": round(p50(af_to_lake)),
    "af_to_lake_per_genAF": p50(af_to_lake)/GROSS,
    "share_of_inch_pct": round(100*p50(af_to_lake)/GROSS, 1),
    "share_of_streamflow_pct": round(100*p50(af_to_lake)/p50(streamflow), 1),
    "usd_per_inch": p(gsl_total),
    "usd_per_genAF": coef(gsl_total),
    "streams": [
        {"label": "Dust / public-health avoided cost", "usd_per_inch": p(val_gsl_dust),
         "basis": "Exposed-lakebed PM2.5/arsenic; Owens Lake analog; GSL lakebed = 23–34% of Wasatch dust."},
        {"label": "Lake ecosystem & industry (brine shrimp, minerals, birds)", "usd_per_inch": p(val_gsl_eco),
         "basis": "Minerals ~$1.1B / 5,368 jobs; brine shrimp ~$67M; GSL aggregate ~$2.5B/yr."},
        {"label": "Lake-effect snow / ski", "usd_per_inch": p(val_gsl_ski),
         "basis": "Lake adds 5–10% of Utah snow, +5–7 ski weeks; ski ~$1.2B / 20K jobs."},
        {"label": "Lake recreation & birding", "usd_per_inch": p(val_gsl_rec),
         "basis": "Wildlife-viewing consumer surplus ~$48/day."},
    ],
    "honesty": ("This is the ONLY Great Salt Lake figure that matters for the seeding question: "
                "how much of the inch reaches the lake and what that water is jointly worth. The "
                "anchors are deliberately modest — seeding moves lake LEVEL by 2–3 orders of magnitude "
                "too little to refill it, so the defensible headline value sits upstream, not in the lake."),
}

# ---- water budget partition (P50 AF per inch) ---------------------------------------
partition = [
    {"fate": "Diverted to farms + cities", "af": round(p50(af_div)), "path": "surface", "value": "direct use"},
    {"fate": "Stays in-channel (toward the GSL)", "af": round(p50(af_instream)), "path": "surface", "value": "hydro + fish/recreation"},
    {"fate": "Soaks into plants (rangeland/meadow)", "af": round(p50(af_et)), "path": "soil", "value": "forage + carbon"},
    {"fate": "Recharges soil & groundwater", "af": round(p50(af_rech)), "path": "groundwater", "value": "recharge + wildfire"},
    {"fate": "Sublimates off the snow — lost", "af": round(p50(af_subl)), "path": "loss", "value": "nobody"},
]

out = {
    "meta": {
        "model": "Bear River inch-value model (reconciled, 80/20 snow/rain)",
        "n_draws": N, "seed": 42,
        "note": ("Every dollar reproduces rainmaker-followup/bear_inch_master.py exactly. "
                 "Multiply any *_per_genAF field by a 'water generated' quantity (AF) to rescale. "
                 "Unit values are sourced marginal/avoided-cost anchors, illustrative — not company figures."),
    },
    "basin": {
        "drainage_area_sqmi": 7500, "area_acres": BASIN_ACRES,
        "acre_feet_per_inch": GROSS,
        "snow_frac": SNOW_FRAC, "gross_snow_af": gross_snow, "gross_rain_af": gross_rain,
        "runoff_snow": "0.30 / 0.40 / 0.50", "runoff_rain": "0.05 / 0.15 / 0.30",
        "blended_runoff_p50": round(p50(blended_runoff), 3),
        "streamflow_af_per_inch": round(p50(streamflow)),
        "streamflow_af_per_genAF": p50(streamflow)/GROSS,
    },
    "partition": partition,
    "benefits": benefits,
    "rollups": rollups,
    "gsl_terminal": gsl_terminal,
    "presets": {
        "seeding_generated_af": 4675,   # full-deployment bottom-up generation (carried from monitor)
        "quarter_inch_af": round(GROSS/4), "one_inch_af": round(GROSS),
    },
}

here = os.path.dirname(os.path.abspath(__file__))
dest = os.path.join(here, "..", "public", "bear_economics.json")
with open(dest, "w") as f:
    json.dump(out, f, indent=2)
print("wrote", os.path.normpath(dest))
print(f"  streamflow P50 {p50(streamflow):,.0f} AF  blended runoff {p50(blended_runoff):.2f}")
print(f"  combined P50 ${p50(combined)/1e6:.1f}M   to-lake P50 {p50(af_to_lake):,.0f} AF "
      f"({100*p50(af_to_lake)/GROSS:.0f}% of inch)")
print(f"  Lens A ${p50(lens_A)/1e6:.1f}M  eco core ${p50(eco_core)/1e6:.1f}M  "
      f"GSL terminal ${p50(gsl_total)/1e6:.1f}M")
