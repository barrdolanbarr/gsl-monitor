"""
bear_inch_ecohydro.py  -  ILLUSTRATIVE figures for the flow-regime reframing
(05_ecological_value_prospectus.md).

These are NOT fitted to Bear data. They illustrate two structural points that a
flat $/AF benefit transfer cannot represent, and whose parameters are exactly
what the research design (H1/H2) would estimate:

  LEFT  - the thermal-habitat production function is NON-LINEAR and threshold-
          shaped. The SAME marginal baseflow increment is worth almost nothing
          on a cold reach and a large step on a reach sitting near the ~19.5 C
          coldwater exclusion temperature. A constant $/AF assumes the dashed
          line; reality is the curve.

  RIGHT - the inch's ecological POTENCY is concentrated in the summer low-flow
          window. Seeded snowpack releases on a delayed recession, so a
          disproportionate share of the increment lands in Jul-Sep, when
          temperature/habitat are limiting. Annual-average $/AF ignores this.
"""
import numpy as np
import matplotlib.pyplot as plt

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.2))

# ----------------------------------------------------------------------
# LEFT: thermal-habitat production function vs linear benefit-transfer
# ----------------------------------------------------------------------
# Suitable coldwater habitat as a logistic function of controlling-reach
# August temperature, centered near the literature exclusion temp ~19.5 C.
T = np.linspace(10, 24, 400)
T_thresh, k = 19.5, 0.9
habitat = 1.0 / (1.0 + np.exp(k * (T - T_thresh)))   # fraction of reach suitable

ax1.plot(T, habitat, color="#2ca58d", lw=2.4, label="thermal-habitat production function")
ax1.axvline(T_thresh, color="#d96b6b", ls=":", lw=1.5)
ax1.text(T_thresh+0.1, 0.92, "~19.5 C\ncoldwater\nexclusion", color="#b04a4a", fontsize=8, va="top")

# show the SAME baseflow increment (a ~1.5 C cooling) at two baselines
def cool(Tbase, dT=1.5):
    h0 = 1/(1+np.exp(k*(Tbase - T_thresh)))
    h1 = 1/(1+np.exp(k*((Tbase-dT) - T_thresh)))
    return Tbase, h0, h1

for Tbase, col, tag in [(13.0, "#888888", "cold reach\n(low marginal value)"),
                        (19.7, "#3b7dd8", "near-threshold reach\n(high marginal value)")]:
    tb, h0, h1 = cool(Tbase)
    ax1.annotate("", xy=(tb-1.5, h1), xytext=(tb, h0),
                 arrowprops=dict(arrowstyle="->", color=col, lw=2.2))
    ax1.scatter([tb],[h0], color=col, zorder=5, s=28)
    ax1.text(tb+0.15, (h0+h1)/2, f"+{(h1-h0)*100:.0f}%\nhabitat", color=col, fontsize=8, va="center")
    ax1.text(tb, -0.08, tag, color=col, fontsize=7.5, ha="center", va="top")

# linear benefit-transfer "assumption" line for contrast (arbitrary slope)
ax1.plot([10,24],[0.85,0.15], color="0.6", ls="--", lw=1.6,
         label="flat $/AF assumption (linear)")
ax1.set_xlabel("controlling-reach August stream temperature (C)")
ax1.set_ylabel("fraction of reach as suitable coldwater habitat")
ax1.set_title("Same acre-foot, different value\nThermal-habitat response is non-linear "
              "(illustrative)", fontsize=10)
ax1.set_ylim(-0.18, 1.05); ax1.set_xlim(10, 24)
ax1.legend(fontsize=8, loc="lower left")
ax1.grid(alpha=0.2)

# ----------------------------------------------------------------------
# RIGHT: seasonal concentration of the inch's ecological potency
# ----------------------------------------------------------------------
months = ["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"]
x = np.arange(12)
# stylized natural snowmelt hydrograph (spring freshet, deep summer low)
base_flow = np.array([22,18,15,13,12,14,25,55,70,40,20,18], float)
# seeded increment delivery: snowpack reservoir -> shifted later, fills recession
seed_inc  = np.array([0.4,0.4,0.5,0.6,0.7,1.0,1.8,3.0,3.6,3.2,2.6,1.4])
# ecological potency weight: high when baseline flow is LOW (limiting season)
potency = (base_flow.max() - base_flow) / (base_flow.max() - base_flow.min())
potency = 0.15 + 0.85*potency

ax2.bar(x, base_flow, color="#cfe3f0", label="baseline hydrograph (stylized)")
ax2.bar(x, seed_inc, bottom=base_flow, color="#2ca58d", label="seeded increment")
ax2b = ax2.twinx()
ax2b.plot(x, potency, color="#d98e3b", lw=2.2, marker="o", ms=4,
          label="ecological potency weight")
ax2b.set_ylim(0, 1.05)
ax2b.set_ylabel("ecological potency of a marginal AF (limiting-season weight)",
                color="#b9772a", fontsize=9)
ax2b.tick_params(axis="y", colors="#b9772a")

# shade the summer low-flow window
ax2.axvspan(8.5, 11.5, color="#f3d9b0", alpha=0.35)
ax2.text(10, base_flow.max()*1.18, "summer low-flow window\n(temperature/habitat limiting)",
         ha="center", fontsize=8, color="#8a5a1a")

ax2.set_xticks(x); ax2.set_xticklabels(months, fontsize=8)
ax2.set_ylabel("relative streamflow")
ax2.set_title("Where the inch's value lives\nPotency concentrates in summer baseflow "
              "(illustrative)", fontsize=10)
ax2.set_ylim(0, base_flow.max()*1.35)
h1l,l1l = ax2.get_legend_handles_labels(); h2l,l2l = ax2b.get_legend_handles_labels()
ax2.legend(h1l+h2l, l1l+l2l, fontsize=7.5, loc="upper left")

plt.tight_layout()
plt.savefig("bear_inch_ecohydro.png", dpi=150, bbox_inches="tight")
print("saved bear_inch_ecohydro.png")
