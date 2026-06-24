"""
bear_inch_plot.py  -  figures for the 1-inch Bear River value model.
Re-runs the core Monte Carlo (same params/seed as bear_inch_value.py) and
produces a single presentation figure: distribution of the three valuation
lenses + a tornado sensitivity chart.
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

rng = np.random.default_rng(42)
N = 200_000
BASIN_ACRES = 7_500 * 640
V_GROSS_AF = BASIN_ACRES / 12.0

def tri(lo, m, hi): return rng.triangular(lo, m, hi, N)

runoff_coeff = tri(0.20, 0.30, 0.45)
new_streamflow = V_GROSS_AF * runoff_coeff
frac_ag = tri(0.35, 0.50, 0.65)
frac_mi = tri(0.00, 0.08, 0.20)
ov = np.maximum(0, frac_ag + frac_mi - 1); frac_ag -= ov
af_ag, af_mi, af_all = new_streamflow*frac_ag, new_streamflow*frac_mi, new_streamflow
ag_net, ag_gross = tri(30,70,120), tri(150,250,330)
mi, hydro, mult = tri(350,420,600), tri(3,5,8), tri(1.4,1.8,2.2)

lens_A = ag_net*af_ag + mi*af_mi + hydro*af_all
lens_B = ag_gross*af_ag*mult + mi*af_mi + hydro*af_all
lens_C = mi*af_all

def corr(a,b):
    ar=np.argsort(np.argsort(a)); br=np.argsort(np.argsort(b))
    return np.corrcoef(ar,br)[0,1]
sens = {"Runoff coefficient":runoff_coeff,"Ag gross $/AF":ag_gross,
        "Ag allocation %":frac_ag,"Ag multiplier":mult,
        "M&I allocation %":frac_mi,"M&I $/AF":mi,"Hydro $/AF":hydro}
sens = dict(sorted(sens.items(), key=lambda kv: abs(corr(kv[1],lens_B))))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.2))
M = lambda x: x/1e6

# --- left: lens distributions ---
colors = {"A  Marginal water value":("#3b7dd8", lens_A),
          "B  Total economic output":("#2ca58d", lens_B),
          "C  M&I highest-use benchmark":("#d98e3b", lens_C)}
for label,(c,data) in colors.items():
    ax1.hist(M(data), bins=120, alpha=0.55, color=c, label=label, density=True)
    p50 = np.percentile(data,50)
    ax1.axvline(M(p50), color=c, lw=1.6, ls="--")
ax1.set_xlabel("Annual downstream value of 1 extra inch  ($ millions/yr)")
ax1.set_ylabel("probability density")
ax1.set_title("Value of one extra inch over the Bear basin\n(Monte Carlo, N=200k)",
              fontsize=11)
ax1.legend(fontsize=8.5, loc="upper right")
ax1.set_xlim(0, 90)
ax1.grid(alpha=0.2)

# --- right: tornado sensitivity ---
names = list(sens.keys())
vals = [corr(v, lens_B) for v in sens.values()]
ax2.barh(names, vals, color="#2ca58d")
ax2.set_xlabel("rank-correlation with total output (Lens B)")
ax2.set_title("What drives the uncertainty?\nPhysics (runoff) > prices",
              fontsize=11)
ax2.set_xlim(0, 0.8)
for i,v in enumerate(vals):
    ax2.text(v+0.01, i, f"{v:.2f}", va="center", fontsize=8.5)
ax2.grid(alpha=0.2, axis="x")

# annotate P50s on left panel
txt = (f"P50 streamflow: {np.percentile(new_streamflow,50):,.0f} AF\n"
       f"Lens A P50: ${M(np.percentile(lens_A,50)):.0f}M\n"
       f"Lens B P50: ${M(np.percentile(lens_B,50)):.0f}M\n"
       f"Lens C P50: ${M(np.percentile(lens_C,50)):.0f}M")
ax1.text(0.97, 0.55, txt, transform=ax1.transAxes, ha="right", va="top",
         fontsize=8.5, bbox=dict(boxstyle="round", fc="white", ec="0.7", alpha=0.9))

plt.tight_layout()
plt.savefig("bear_inch_value.png", dpi=150, bbox_inches="tight")
print("saved bear_inch_value.png")
