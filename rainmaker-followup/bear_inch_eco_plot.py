"""
bear_inch_eco_plot.py - figure for the ecological-value extension.
Left:  where the 400,000 AF actually goes (physical fate of the inch).
Right: ecological value streams with P10-P90 error bars and confidence tiers.
Re-runs the same Monte Carlo (seed 42) as bear_inch_eco.py.
"""
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(42)
N = 200_000
BASIN_ACRES = 7_500 * 640
V = BASIN_ACRES / 12.0
def tri(a, b, c): return rng.triangular(a, b, c, N)

runoff = tri(0.20, 0.30, 0.45); streamflow = V * runoff; rem = V - streamflow
s_subl, s_et, s_rech = tri(0.20,0.35,0.50), tri(0.25,0.40,0.55), tri(0.10,0.20,0.35)
ss = s_subl+s_et+s_rech; s_subl,s_et,s_rech = s_subl/ss, s_et/ss, s_rech/ss
af_subl, af_et, af_rech = rem*s_subl, rem*s_et, rem*s_rech
fa, fm = tri(0.35,0.50,0.65), tri(0.00,0.08,0.20)
ov = np.maximum(0, fa+fm-1); fa -= ov
af_instream = streamflow * np.maximum(0, 1-fa-fm)
af_div = streamflow - af_instream

val_forage   = tri(8,20,45)   * af_et
val_recharge = tri(20,80,250) * af_rech
val_instream = tri(40,120,300)* af_instream
val_wildfire = tri(2,8,25)    * (af_et+af_rech)
val_carbon   = tri(1,4,12)    * af_et

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.2))

# --- left: physical fate of the 400k AF (P50) ---
fates = [("Diverted streamflow\n(ag + M&I)", np.percentile(af_div,50), "#8c8c8c"),
         ("In-channel residual\n(instream / fisheries)", np.percentile(af_instream,50), "#2ca58d"),
         ("Vegetation ET\n(forage + carbon)", np.percentile(af_et,50), "#7cb342"),
         ("Recharge / soil moisture\n(recharge + wildfire)", np.percentile(af_rech,50), "#3b7dd8"),
         ("Sublimation / loss\n(no value)", np.percentile(af_subl,50), "#d96b6b")]
labels = [f[0] for f in fates]; sizes = [f[1] for f in fates]; cols = [f[2] for f in fates]
y = np.arange(len(fates))[::-1]
ax1.barh(y, sizes, color=cols)
for yi, s in zip(y, sizes):
    ax1.text(s+4000, yi, f"{s:,.0f} AF", va="center", fontsize=8.5)
ax1.set_yticks(y); ax1.set_yticklabels(labels, fontsize=8.5)
ax1.set_xlabel("acre-feet (P50)")
ax1.set_xlim(0, max(sizes)*1.28)
ax1.set_title("Where one inch (400,000 AF) actually goes\nDirect model valued only the grey + green; "
              "eco value lives in green/olive/blue",
              fontsize=10)
ax1.grid(alpha=0.2, axis="x")
ax1.axhline(2.5, color="0.6", lw=0.8, ls=":")

# --- right: eco value streams with P10-P90 bars + tiers ---
streams = [("Carbon (SCC)", val_carbon, "LOW"),
           ("Wildfire co-benefit", val_wildfire, "LOW"),
           ("Forage green-up", val_forage, "MED-LOW"),
           ("Groundwater recharge", val_recharge, "MEDIUM"),
           ("Instream fisheries/rec", val_instream, "MED-LOW")]
M = lambda x: x/1e6
names = [s[0] for s in streams]
p10 = [np.percentile(s[1],10)/1e6 for s in streams]
p50 = [np.percentile(s[1],50)/1e6 for s in streams]
p90 = [np.percentile(s[1],90)/1e6 for s in streams]
tiers = [s[2] for s in streams]
tier_col = {"LOW":"#d96b6b","MED-LOW":"#e0a93b","MEDIUM":"#2ca58d"}
yy = np.arange(len(streams))
ax2.barh(yy, p50, color=[tier_col[t] for t in tiers], alpha=0.85)
ax2.errorbar(p50, yy, xerr=[np.array(p50)-np.array(p10), np.array(p90)-np.array(p50)],
             fmt="none", ecolor="0.3", capsize=3, lw=1.2)
for yi, m50, t in zip(yy, p50, tiers):
    ax2.text(m50+0.3, yi+0.18, f"${m50:.1f}M", va="center", fontsize=8.5)
    ax2.text(0.15, yi-0.22, t, va="center", fontsize=7, color="0.35")
ax2.set_yticks(yy); ax2.set_yticklabels(names, fontsize=8.5)
ax2.set_xlabel("annual value of 1 inch, by stream  ($M/yr, P50 with P10-P90)")
ax2.set_xlim(0, 14)
core50 = np.percentile(val_forage+val_recharge+val_instream, 50)/1e6
tot50  = np.percentile(val_forage+val_recharge+val_instream+val_wildfire+val_carbon, 50)/1e6
ax2.set_title("Ecological value streams (the water the direct model discarded)\n"
              f"CORE P50 {core50:.0f}M  |  with low-confidence buckets {tot50:.0f}M  (USD/yr)",
              fontsize=10)
ax2.grid(alpha=0.2, axis="x")

plt.tight_layout()
plt.savefig("bear_inch_eco.png", dpi=150, bbox_inches="tight")
print("saved bear_inch_eco.png")
