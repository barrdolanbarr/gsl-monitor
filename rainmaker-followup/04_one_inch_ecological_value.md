# The Other 275,000 Acre-Feet: Ecological Value of One Extra Inch
### Beyond direct consumption — the natural-system value the first model threw away

*Barr Dolan — Rainmaker follow-up. Extends `00_one_inch_bear_brief.md`. Model: `bear_inch_eco.py` · Figure: `bear_inch_eco.png`*

---

## The gap this fixes

My first deliverable answered "what is an inch worth" by valuing the water that reaches the river: **~125,000 AF (P50) of new streamflow** routed to irrigation, M&I, and hydropower. But an inch over the basin is **400,000 AF gross**. The first model implicitly valued one acre-foot in three and discarded the rest.

The other **~275,000 AF doesn't disappear.** It sublimates, gets transpired by rangeland and meadow vegetation, or percolates into soil moisture and aquifer recharge. That water does real ecological work — and it's almost entirely *additional* to the direct-use number, not double-counted, because it never entered the streamflow the first model priced.

This brief partitions the full 400,000 AF by physical fate and attaches a value stream to each, with the same Monte Carlo discipline (200,000 draws, seeded) and explicit confidence tiers.

**Headline:**

| Roll-up | What's in it | P10 | **P50** | P90 |
|---|---|---|---|---|
| **Eco — Core** | forage + recharge + instream fisheries/rec | $12.0M | **$17.4M** | $24.2M |
| **Eco — Total** | core + wildfire + carbon (low-confidence) | $14.5M | **$20.0M** | $27.0M |

So the natural-system value of an inch is roughly **$12–24M/yr (core)** — a number that *sits alongside* the direct-use Lens A (~$10.4M), because it comes from different water. It is not a competing estimate of the same thing.

---

## How the water actually splits (the anti-double-counting move)

The whole credibility of this brief rests on one discipline: **never value the same physical acre-foot twice.** I enforce two rules.

**Rule 1 — different water.** Forage, recharge, soil-moisture/wildfire, and carbon are valued *only* on the non-runoff ~275k AF. That water never became the streamflow the direct model sold to ag and cities, so there is zero overlap with Lens A/B/C.

**Rule 2 — different good, same in-channel water.** Instream fisheries/recreation is valued *only* on the streamflow that is **not** diverted — the residual `(1 − frac_ag − frac_mi) × streamflow` that the direct model already let "pass downstream" and credited with only a few dollars of hydropower. A fishing day is a physically distinct good from a kilowatt-hour, so recreation legitimately stacks on hydro for that same passing water — but it does *not* stack on the ag/M&I value, because diverted water is by definition no longer in the channel.

Fate of the 400,000 AF (P50):

| Fate | AF (P50) | Valued as | In which model |
|---|---|---|---|
| Diverted streamflow (ag + M&I) | ~74,000 | crop / municipal value | direct model (Lens A/B/C) |
| In-channel residual | ~50,500 | instream fisheries/recreation | **this model** |
| Vegetation ET | ~113,000 | rangeland forage + carbon | **this model** |
| Recharge / soil moisture | ~61,000 | recharge + wildfire co-benefit | **this model** |
| Sublimation / loss | ~98,500 | nothing — lost to atmosphere | neither |

That last row is the honesty anchor: **roughly a quarter of the inch sublimates off high-elevation snow and is worth nothing.** Any model that values the full 400k AF uniformly is wrong, and saying so out loud is what makes the rest defensible.

---

## The five value streams

**Groundwater recharge — $6.6M (P50), MEDIUM confidence.** Deep percolation that reaches usable aquifer storage offsets future pumping. The managed-aquifer-recharge literature prices recharge at \$90–1,100/AF (median ~\$390) and avoided pumping at \$323–452/AF — but diffuse basin-wide percolation is mostly *not* recoverable usable storage, so I discount hard to \$20–250/AF. Even discounted, this is the largest single eco stream.

**Instream fisheries / recreation — $7.3M (P50), MEDIUM-LOW confidence.** The value of water left in the river: western instream-flow leases run \$115–350/AF/yr, and freshwater fishing carries a consumer surplus around \$95/recreation-day (wildlife viewing ~\$48/day). I value the non-diverted residual at \$40–300/AF. Lower confidence than the Lemhi case because the Bear is not an ESA salmon market with an established price.

**Rangeland forage green-up — $2.6M (P50), MEDIUM-LOW confidence.** About three-quarters of the basin is grazing land, and growing-season soil moisture drives forage (1 AUM ≈ 780 lbs dry forage). But the marginal value of water on *dryland* range is far below irrigated hay (\$30–120/AF), so I value transpired water at only \$8–45/AF. Real, broad, but low per-acre-foot.

**Wildfire risk reduction — $1.9M (P50), LOW confidence (bound only).** Added late-season soil moisture lowers fuel flammability; suppression and damage costs are large (federal suppression ~\$2.9B/yr; damage ~\$500/acre). But the acre-foot → fire-probability link is genuinely unquantified, so I carry this as a bounded co-benefit at \$2–25/AF on the soil-moisture pool, not a load-bearing number.

**Carbon — $0.6M (P50), LOW confidence.** Incremental biomass and soil carbon from green-up, valued at the EPA social cost of carbon (~\$190–255/ton CO₂). Most forage carbon cycles annually, so the permanent fraction is small. Included for completeness; it doesn't move the answer.

---

## The data-science punchline (consistent with, but different from, the first model)

In the direct model, the **runoff coefficient** dominated everything — physics beat prices. Here the picture flips: the runoff coefficient barely matters (rank-corr +0.11), because more runoff means less non-runoff water *but* more in-channel residual, and the two roughly offset. Instead, the ecological number is driven by the two **benefit-transfer unit prices** I'm least sure of:

- **Recharge $/AF** (rank-corr +0.62)
- **Instream $/AF** (rank-corr +0.58)

The honest reading: **the direct-use value is bounded by hydrology; the ecological value is bounded by valuation method.** Tightening the direct number means measuring seeded snow-to-streamflow. Tightening the ecological number means committing to defensible benefit-transfer prices for recharge and instream flow in *this* basin — a literature-and-policy question, not a measurement one. Two different levers for two different numbers, and a customer should know which is which.

---

## How to use this in the room

- The ecological value is **roughly the same order of magnitude as the direct marginal-water value** (~$17M core vs. ~$10M Lens A) — and it's mostly additive, because it's different water. That roughly *doubles* the defensible "what an inch is worth" story without any double-counting.
- But the confidence is lower and I'd present it that way: the **core three** (recharge, instream, forage) are the ones I'd put weight on; **wildfire and carbon** I'd name as real co-benefits with honest uncertainty, not dollar claims to lean on.
- The single most valuable thing to a state audience here is the **in-channel / instream** stream — it's the quantified version of "leave the water in the river," and it's the same logic that has a real market price in the Lemhi.

---

## What I'd sharpen with you

1. **Recharge realism.** What fraction of basin percolation actually reaches recoverable storage with avoided-cost value? Rainmaker or a state hydrologist could replace my literature discount with a basin number — it's the biggest lever.
2. **Instream pricing for the Bear.** Is there any transaction or lease precedent on the Bear (or a defensible Idaho/Utah comp) to anchor the instream $/AF rather than borrowing western-market ranges?
3. **Sublimation fraction.** I assumed ~25% of the inch is lost to sublimation. With Rainmaker's SNOTEL data this becomes a measured number, and it directly sets how much water is even *available* for ecological value.

Everything is reproducible: `bear_inch_eco.py` is ~150 lines of documented, seeded Python; every unit value cites a source; the water mass balance closes to 400,000 AF by construction.

---

### Sources
- Groundwater recharge / avoided-pumping value: managed-aquifer-recharge literature (\$90–1,100/AF, median ~\$390; avoided pumping \$323–452/AF)
- Instream-flow lease pricing: WestWater Research / western water markets (\$115–350/AF/yr)
- Recreation-day consumer surplus: regional benefit-transfer (freshwater fishing ~\$95/day; wildlife viewing ~\$48/day) — UF/IFAS summary of US census-region studies
- Rangeland forage: USU/Extension rangeland productivity; AUM ≈ 780 lbs dry forage
- Social cost of carbon: EPA 2023/2025 (~\$190–255/ton CO₂)
- Wildfire cost context: federal suppression ~\$2.9B/yr; per-acre damage ~\$500; soil-moisture/fuel-flammability link (qualitative)
- Basin area & hydrology anchors: Utah Division of Water Resources; bearriverinfo.org (carried from `00_one_inch_bear_brief.md`)
