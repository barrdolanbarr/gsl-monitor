# What Is One Extra Inch of Water Worth in the Bear River Basin?
### A quantitative answer to the interview question

*Barr Dolan — Rainmaker follow-up. Model: `bear_inch_value.py` · Figure: `bear_inch_value.png`*

---

## The question, taken literally

You asked: *if an extra inch of water dropped on the Bear River basin, what is its downstream economic value?* This is the whole deliverable. Below is the chain — physics first, then economics — with every assumption sourced, every uncertain input expressed as a range, and the answer reported as a probability distribution rather than a single number I can't defend.

**Headline (Monte Carlo, 200,000 draws):**

| Lens | What it measures | P10 | **P50** | P90 |
|---|---|---|---|---|
| **A — Marginal water value** | What the water itself is worth (net) | $6.7M | **$10.4M** | $15.2M |
| **B — Total economic output** | Downstream economic activity supported | $23.5M | **$32.9M** | $45.3M |
| **C — Highest-and-best-use** | Valued at the M&I rate Utah already pays | $43.7M | **$56.8M** | $73.5M |

One inch over the basin yields **~125,000 acre-feet of new streamflow (P50)** and somewhere between **$10M and $57M per year** in downstream value, depending on which question you're answering. The three lenses aren't competing estimates — they answer three different questions, and a good BD conversation uses all three.

---

## The chain

**Step 1 — Inch to volume.** The basin is ~7,500 sq mi = 4.8M acres. One inch over it is `4.8M × (1/12 ft)` = **400,000 acre-feet** of extra precipitation. This part is just arithmetic and isn't uncertain.

**Step 2 — Volume to streamflow (the physics, and the crux).** Most precipitation never reaches the river — it sublimates, evaporates, or recharges soil. The fraction that does is the *runoff coefficient*. I anchored it to the Bear's own hydrology: the basin's long-run runoff ratio is ~0.21 (undepleted natural flow ~1.75M AF ÷ ~8.3M AF of annual precipitation). But seeding adds *high-elevation winter snow*, which converts to streamflow far more efficiently than the basin average (low ET, frozen/saturated ground). So I model the marginal coefficient as a triangular distribution **0.20 / 0.30 / 0.45**, giving **~125,000 AF (P50)** of new streamflow, range ~100k–156k.

**Step 3 — Streamflow to uses.** The Bear is over-allocated; new water gets split. Irrigation is the dominant claimant (modeled 35–65%, mode 50%), M&I is small but valuable (0–20%, mode 8%), and hydropower is *non-consumptive* — every acre-foot in the river generates at the PacifiCorp cascade (Soda/Grace/Oneida/Cutler) on its way down, so it earns regardless of final use.

**Step 4 — Uses to dollars.** Each use carries a sourced $/AF:

- **Irrigation (alfalfa/hay):** gross crop revenue ~$150–330/AF; *net* return to the water itself only ~$30–120/AF. Forage is the lowest-value use per acre-foot — which is the central irony of the basin.
- **M&I:** ~$350–600/AF, anchored to the Bear River Development project (220,000 AF/yr at a quoted ~$365–400/AF; $1.5–2.8B capital). This is a *revealed* price — it's what Utah is already prepared to pay to develop this exact water.
- **Hydropower:** ~$3–8/AF run-of-river passthrough (~130 kWh/AF × wholesale price). Small per unit, but free and certain.
- **Regional multiplier (ag output):** 1.4–2.2× for the total-output lens.

---

## The data-science punchline: physics beats prices

The sensitivity analysis (right panel of the figure) is the most important result for Rainmaker, not the dollar figure. The single largest driver of uncertainty in the value estimate is the **runoff coefficient** (rank-correlation 0.64) — it dominates every price and allocation assumption. Ag gross $/AF (0.48) and ag allocation (0.39) follow; the M&I and hydro prices barely move the answer.

The takeaway: **the value of an inch is bounded by hydrology, not by economics.** If Rainmaker wants to tighten the number it sells to a state agency, the highest-leverage investment is measuring how much seeded snow actually becomes streamflow — SNOTEL target/control plus stream gauges — which is precisely the "ground-into-system" gap you said the company has. The model doesn't just produce a number; it tells you where to spend the next measurement dollar.

---

## What I'd sharpen with you

1. **Runoff coefficient** — the biggest lever. With Rainmaker's actual Bear-season SNOTEL/gauge data I can replace my literature-anchored range with a basin-specific, defensible distribution and roughly halve the output uncertainty.
2. **Whole-basin vs. seedable target area.** I took "an inch over the basin" literally. Seeding realistically falls on the high-elevation subset, which *raises* the effective runoff coefficient — so the literal whole-basin read is, if anything, conservative on yield per seeded inch.
3. **Allocation reality.** The split among ag/M&I/instream depends on water rights and season; your operational knowledge would replace my modeled fractions with the real ones.

---

## How to read the three numbers in a customer meeting

- To a **water user / district**: lens A or the blended **~$83/AF** — what the water is worth to them versus their alternatives.
- To an **economic-development or state audience**: lens B — **~$33M/yr** of activity supported per inch.
- To make the **strategic case for developing the water at all**: lens C — **~$57M/yr** at the price the state already accepts. One inch, valued the way Utah values water it's prepared to build a $2B project for.

Everything here is reproducible: the model is ~120 lines of documented Python, the Monte Carlo is seeded, and every parameter cites a source.

---

### Sources
- Utah Division of Water Resources — Bear River basin; Bear River Development (220k AF, ~$365–400/AF, $1.5–2.8B)
- Wyoming/Utah State Water Plans — undepleted natural flow ~1.75M AF; gross diversions ~750k AF; basin precipitation apportionment
- bearriverinfo.org — basin area & description
- PacifiCorp — Bear River hydroelectric cascade (Soda, Grace, Oneida, Cutler)
- University of Nevada Reno Extension / Arizona Farm Bureau / deficit-irrigation literature — alfalfa water use and value per acre-foot
- Deseret News / KSL — Bear River Development cost-per-acre-foot reporting
