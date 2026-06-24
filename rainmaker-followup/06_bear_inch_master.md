# What One Inch of Water Is Worth in the Bear River Basin

*Barr Dolan — Rainmaker follow-up. One model, every number reconciled from a single Monte Carlo simulation (`bear_inch_master.py`, 200,000 draws). This document pulls together three earlier pieces: the direct-dollar model, the ecological-value model, and the flow-regime science.*

---

## The bottom line (read this first)

If we add one extra inch of precipitation across the Bear River basin, here is what happens, in plain terms:

- That inch is **400,000 acre-feet** of water — simple arithmetic over 4.8 million acres.
- Because seeded water is mostly **high-elevation snow**, about **140,000 acre-feet (P50)** of it actually reaches the river. The rest soaks in, feeds plants, or evaporates.
- The water that reaches the river, used directly by farms and cities, is worth roughly **$12 million a year** (its marginal value).
- The water that *never* reaches the river still does real ecological work worth roughly **$18 million a year** — recharge, fish and recreation, rangeland.
- Add those together and a defensible answer is **about $30 million per year, somewhere in the $23–37M range.**

The single most important caveat: **a quarter of every inch sublimates off the snowpack and is worth nothing.** Any number that values all 400,000 acre-feet equally is wrong. Saying that out loud is what makes the rest credible.

| The headline numbers | What it answers | Low (P10) | **Middle (P50)** | High (P90) |
|---|---|---:|---:|---:|
| **Direct water value** | What the water itself is worth (net) | $7.8M | **$11.7M** | $16.5M |
| **Ecological value** | What the off-river water is worth | $12.2M | **$17.7M** | $24.7M |
| **Combined** | The two added together | $23.4M | **$29.9M** | $37.3M |
| *Economic activity supported* | *Broader output, not "value of water"* | *$27.7M* | *$37.1M* | *$48.6M* |
| *Cost to develop the same water* | *At the price Utah already pays for it* | *$52.5M* | *$63.7M* | *$77.8M* |

The first three rows stack legitimately (they describe different water). The last two are *different ways of framing the same water* for different audiences — useful in a meeting, but never added to the others.

---

## How to read this document

The interview question was simple: *one extra inch falls on the basin — what is it worth downstream?* The answer is a chain of **relationships**, each in the same shape:

> **add 1 inch → produce Y units of some effect → worth $Z per year.**

Three things to know about how it's built:

1. **Everything traces back to one pool of water.** All the value below comes from the same 400,000 acre-feet. We account for that water exactly once, which is what keeps anything from being counted twice.
2. **Every number is a range, not a point.** The simulation runs 200,000 times with each uncertain input drawn from a sourced range. We report the middle (P50) and the spread (P10–P90).
3. **Every relationship carries a confidence tier.** Some are solid (irrigation, recharge). Some are honest estimates we'd flag as such (wildfire, carbon). The document never hides which is which.

---

## Step 1: where the water goes

Before any dollars, follow the water. One inch over the basin is 400,000 acre-feet. We split it the way seeded precipitation actually falls — **80% as snow, 20% as rain** — because glaciogenic (silver-iodide) seeding overwhelmingly produces high-elevation winter snow, and snow behaves very differently from rain.

Snow runs off efficiently (cold ground, little evaporation, frozen or saturated soil). Rain loses much more to evaporation and infiltration. Run each through its own runoff rate and the seeded inch yields about **140,000 acre-feet of new streamflow** — an effective runoff of ~0.35, higher than the basin's long-run average of ~0.21 precisely because it's snow-dominated.

| Where the inch ends up | Acre-feet (P50) | Share | Who values it |
|---|---:|---:|---|
| Reaches the river, diverted to farms + cities | 83,000 | 21% | direct value |
| Reaches the river, stays in-channel | 57,000 | 14% | hydropower + fish/recreation |
| Soaks into plants (rangeland, meadow) | 107,000 | 27% | forage + carbon |
| Recharges soil and groundwater | 57,000 | 14% | recharge + wildfire |
| Sublimates off the snow — lost to the air | 93,000 | 23% | **nobody** |
| **Total** | **400,000** | 100% | |

This balance closes to the acre-foot in every one of the 200,000 simulation runs. The last row is the honesty anchor.

---

## Step 2: the relationship table (the core deliverable)

Every impact, in the shape the question asked for. Dollar figures are annual value per inch; the middle number is P50, with the low–high range beside it.

### Direct human use — solid ground

| Add 1 inch → | produces (P50) | worth $/yr (P10 / **P50** / P90) | confidence |
|---|---:|---|:--:|
| → **new streamflow** | 140,000 AF | *physical, not dollars* | HIGH |
| → **irrigation** water | 70,000 AF to farms | $3.3M / **$5.0M** / $7.3M | HIGH |
| → **city & industry** supply | 13,000 AF | $2.5M / **$5.8M** / $9.9M | HIGH |
| → **hydropower** (water just passes through) | 140,000 AF | $0.5M / **$0.7M** / $1.0M | HIGH |

### Ecological value — real, but lower-confidence

| Add 1 inch → | produces (P50) | worth $/yr (P10 / **P50** / P90) | confidence |
|---|---:|---|:--:|
| → **fish & recreation** (water left in the river) | 57,000 AF | $4.5M / **$8.3M** / $13.9M | MED-LOW |
| → **groundwater recharge** | 57,000 AF | $3.0M / **$6.2M** / $11.2M | MEDIUM |
| → **rangeland forage** green-up | 107,000 AF | $1.5M / **$2.5M** / $3.9M | MED-LOW |
| → **wildfire** risk reduction | 165,000 AF of soil moisture | $0.9M / **$1.8M** / $3.1M | LOW |
| → **carbon** stored in plants/soil | 107,000 AF | $0.3M / **$0.6M** / $1.0M | LOW |

**A simple way to quote it:** the direct water works out to about **$83 per acre-foot of streamflow.** Add the ecological value and the combined inch is worth roughly **$75 per acre-foot of total precipitation** — a clean per-unit number to scale up or down. (A half-inch is about half the value; two inches, about double. The one exception is the ecological thresholds described at the end, which are not linear.)

---

## Step 3: the three layers, in a little more depth

### Layer 1 — direct economics (the defensible core)

One inch over 4.8 million acres is 400,000 acre-feet — certain arithmetic. The uncertain step is how much reaches the river, which is why we model snow and rain separately (Step 1). Once it's in the river, the Bear is over-allocated, so the water gets split: irrigation takes the most (it's the lowest-value use per acre-foot — the central irony of the basin), cities take a little (but pay the most), and hydropower earns on *all* of it as it passes the PacifiCorp dam cascade on the way down.

The key insight for Rainmaker: **the value of an inch is limited by hydrology, not economics.** The biggest source of uncertainty in the whole model is the runoff coefficient — how much seeded snow becomes streamflow. That's a *measurement* question (SNOTEL sites + stream gauges), and it's exactly the "ground-into-system" gap the company already works on. Tighten that measurement and you roughly halve the uncertainty in the dollar figure.

### Layer 2 — ecological value (the water the first layer ignored)

Layer 1 only valued the ~140,000 acre-feet that reaches the river. But the inch is 400,000 acre-feet; the other ~260,000 does ecological work as soil moisture, plant growth, and recharge. Two rules keep this from double-counting Layer 1:

- **Different water.** Forage, recharge, wildfire, and carbon are valued *only* on water that never reached the river — so there's no overlap with the irrigation and city value.
- **Different use of the same water.** Fish and recreation are valued *only* on the water left in the channel (not diverted). A fishing day is a genuinely different product from a kilowatt-hour, so it can stack on hydropower — but never on the water already sent to farms and cities.

What drives this layer is *not* hydrology — it's the per-acre-foot prices we're least sure of, especially recharge and instream-flow values. So: **Layer 1 is limited by hydrology; Layer 2 is limited by valuation method.** Two different levers, and a customer should know which is which.

### Layer 3 — the science behind the numbers (why a flat price is the wrong tool)

Layers 1–2 price the inch per acre-foot. The ecology says that's the wrong unit. A seeded inch is *snowpack*, and snowpack is a natural reservoir that releases slowly — so the marginal inch disproportionately boosts **summer baseflow**, and summer low water is the single binding constraint in a snowmelt-fed arid river. Because the ecological responses are **threshold-shaped, not linear**, a flat $/acre-foot mis-prices the inch — usually too low, exactly where it matters most.

The keystone relationship gates all the others:

> **Snowpack → summer baseflow.** Of the ~140,000 AF of new streamflow, an estimated 20–35% (~28,000–49,000 AF) is delivered as July–September baseflow. *That* is the ecologically potent water. If Rainmaker measures this one link (paired SNOTEL and gauge data), most of the ecological uncertainty collapses.

From there, the science either **sharpens an existing bucket** or flags a **candidate addition** not yet in the dollar model:

- **Sharpens fish & recreation:** more summer baseflow → cooler water → more habitat for **Bonneville cutthroat trout** (Utah's state fish, native to the Bear). The relationship is a step-change, not a line: a 1–2°C cooling near the ~19.5°C exclusion temperature can re-open kilometers of habitat, while the same cooling on an already-cold reach buys almost nothing. (See `bear_inch_ecohydro.png`, left panel.) This is the *correct* way to estimate the fish/recreation bucket — it refines that $8.3M, it doesn't add to it.
- **Sharpens recharge:** recharge feeds groundwater-dependent plants and returns to the river late in the season.
- **Sharpens forage:** growing-season soil moisture extends the green-up window.
- **Candidate addition — water quality:** more baseflow dilutes pollutants (flow controls 80–97% of a river's self-cleaning). Real, but data-hungry; not yet a dollar.
- **Candidate addition — riparian trees:** a slower snowmelt recession lets cottonwood and willow seedlings establish. Whether a seeded inch *slows* the recession or just raises the peak is genuinely uncertain — a hypothesis, not a claim.
- **Candidate addition — migratory birds:** freshwater inflow sustains the **Bear River Migratory Bird Refuge** (~41,000 acres of wetland, up to 500,000 waterfowl). Important, but hard to attribute to a single marginal inch.

---

## The one idea that reframes everything: marginal ≠ average

Three points an ecological economist would insist on:

**Thresholds.** The inch's value is a *step function* of the river's current state, not a constant. A flat price assumes the constant and is therefore wrong exactly where the value lives.

**Timing.** Because summer low flow is limiting, the inch's ecological value concentrates in the ~3 driest months. The *effective* quantity (summer baseflow) is much smaller than 140,000 AF — but each effective acre-foot is worth far more.

**Targeting.** The same inch can be "worth little" or "worth a lot" depending on where and when it lands. That's why the most useful answer to a customer is a *function*, not a single number — and why **seeding is worth most when targeted to near-threshold reaches in the limiting season.**

**The strategic takeaway:** the product to sell isn't acre-feet — it's *flow at the right time and place.* And the single measurement that would prove it (snow → summer baseflow) sits squarely inside Rainmaker's existing instrumentation.

---

## Reproducibility

Every figure comes from `bear_inch_master.py` — one seeded Monte Carlo, 200,000 draws, results saved to `bear_inch_master_results.json`. The water budget closes to less than 0.0001 acre-feet. Supporting figures: `bear_inch_value.png` (direct-value distributions + sensitivity), `bear_inch_eco.png` (water fate + ecological streams), `bear_inch_ecohydro.png` (the non-linear thermal-habitat relationship + seasonal concentration).

---

## Sources

**Hydrology & basin facts**
- Utah Division of Water Resources — Bear River basin; Bear River Development (220,000 AF, ~$365–400/AF, $1.5–2.8B capital).
- Wyoming / Utah State Water Plans — undepleted natural flow ~1.75M AF; basin precipitation (→ long-run runoff ratio ~0.21).
- bearriverinfo.org — basin area (~7,500 sq mi).
- PacifiCorp — Bear River hydroelectric cascade (Soda, Grace, Oneida, Cutler; ~77 MW).

**Direct economic unit values**
- University of Nevada Reno Extension / Arizona Farm Bureau — alfalfa water use and net value per acre-foot.

**Ecological / non-market unit values**
- Managed-aquifer-recharge literature — recharge $90–1,100/AF (median ~$390), avoided pumping $323–452/AF (discounted here for diffuse, non-recoverable percolation).
- WestWater Research / western water markets — instream-flow leases $115–350/AF/yr.
- UF/IFAS benefit-transfer summary — freshwater fishing consumer surplus ~$95/day; wildlife viewing ~$48/day.
- USU/Extension rangeland productivity; 1 AUM ≈ 780 lbs dry forage.
- EPA (2023/2025) — social cost of carbon ~$190–255/ton CO₂.

**Flow-regime science (Layer 3)**
- Poff, L. et al. (1997), *The Natural Flow Regime*, BioScience — the five components of flow.
- National Research Council, *Valuing River Ecosystem Services* — production-function caveats.
- Snowpack as natural reservoir; peak snow water equivalent predicts summer low flow; >60% of Great Basin streamflow variability from snowmelt timing.
- Stream temperature as the first-order control on trout; ~19.5°C coldwater exclusion.
- Bonneville cutthroat trout — native to the Bear; 48–62°F; Bear-basin habitat classified high climate risk; flow-maintenance in the recovery strategy (Trout Unlimited; Wyoming Game & Fish; Idaho Fish & Game).
- Assimilative capacity / dilution — flow controls 80–97% of seasonal self-purification.
- Recruitment-box model — Mahoney & Rood (1998); willow extension Amlin & Rood (2002).
- Ecosystem-services cascade — Haines-Young & Potschin (2011/2012); CICES.
- Bear River Migratory Bird Refuge — largest freshwater component of the Great Salt Lake ecosystem; ~41,000 ac wetland (U.S. Fish & Wildlife Service).
