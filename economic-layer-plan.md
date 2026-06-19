# Economic Layer — Plan for the Jun 25 Rainmaker Follow-up

**Goal Parker set:** take the Bear River monitor and answer *"what happens economically when an extra inch of water drops in the basin?"* — toggle the water created, **follow it downstream** (with conveyance/evaporation losses), and show the **total economic impact**, not just $/AF of water delivered. His framing: *"water and money follow the same path."* He also flagged the real gap at Rainmaker: they're strong **cloud-to-ground**, weak **ground-into-system**. That gap is exactly what this layer fills.

This doc is the plan + the underlying research (the water-destination map and per-node economics). No code yet — build decision comes after you review.

---

## 1. The core idea: water as a routed graph, not a single number

The mistake to avoid is a flat "$/acre-foot" multiplier. The honest, defensible model is a **routing graph**: one acre-foot generated at a seeding hotspot enters the basin, splits at each junction into fractions, and at each node a portion is *consumed* and assigned an economic value. The residual continues downstream. Total value = sum over the whole path of (fraction consumed at node × value per unit at that node).

Two principles keep it credible:

- **No double-counting.** The same acre-foot is not worth $800 to a farmer *and* $2,500 to the lake. It's split — some is transpired by crops upstream, some recharges groundwater, some reaches the lake. Fractions sum to 1.
- **Value is buyer-specific.** The same physical water is worth different amounts to different buyers (avoided cost framing). The model should let you toggle *whose* value you're summing — that's the BD insight Parker is testing.

This is literally the "ground-into-system" accounting Rainmaker says it lacks.

---

## 2. The water-destination map (every place a drop can go)

Once seeded precipitation reaches the ground in the Bear basin, it cascades. Approximate partition fractions below are from a comparable mountain basin (upper Chehalis: ~35% ET, ~30% groundwater recharge, ~30% surface runoff, ~5% interception) and Bear-specific figures — these become calibratable parameters, not hard-coded truth.

```
SEEDED PRECIPITATION (snow vs rain — already scored in the hotspot grid)
│
├─ Interception (~5%) ─────────────► evaporates — LOST (no value)
│
├─ Snowpack storage ──────────────► timing value: natural reservoir;
│                                     feeds melt → runoff + lake-effect snow
│
├─ Infiltration → SOIL MOISTURE
│   ├─ Transpiration / crop & forage ET ──► [NODE: Agriculture] [NODE: Ranching]
│   ├─ Fuel & soil moisture ──────────────► [NODE: Wildfire resilience]
│   └─ Deep percolation ──────────────────► GROUNDWATER
│        ├─ Aquifer / wells ──────────────► [NODE: M&I + irrigation supply]
│        └─ Baseflow return to river ─────► (re-enters surface path; big in Cache/Box Elder)
│
└─ SURFACE RUNOFF → streams
    ├─ Reservoir storage (Bear Lake; PacifiCorp Soda/Grace/Cove/Oneida)
    │     ├─ [NODE: Hydropower]  (~77 MW across 4 dams)
    │     └─ regulated supply for 150,000+ irrigated acres
    ├─ Diversions (Bear River Canal ~230,000 AF/yr) ──► [NODE: Agriculture / M&I]
    ├─ Instream flow ──► [NODE: Fisheries & recreation]  [NODE: Riparian habitat]
    ├─ Wetlands / Bear River Migratory Bird Refuge ──► [NODE: Waterfowl/birding]
    │     (also a big evaporative sink: ~340,000 AF/yr lost in wet/open-water areas)
    │
    └─ TERMINAL: GREAT SALT LAKE  (Bear = ~58% of GSL inflow; ~1.2M AF/yr reaches lake)
          stage/level drives ↓
          ├─ [NODE: Lake-effect snow] → ski industry
          ├─ [NODE: Brine shrimp]
          ├─ [NODE: Mineral extraction]
          ├─ [NODE: Dust / health avoided cost]  (exposed lakebed shrinks)
          └─ [NODE: Lake recreation / birding]
```

The existing **seeding-hotspot grid already encodes Stage 0** (snow fraction × runoff ratio × delivery-to-lake). The economic layer picks up where that grid stops — at the moment water becomes runoff/soil moisture — and routes it through the nodes above.

---

## 3. Economic value at each node (researched anchors)

These are starting anchors with sources; all become editable assumptions. Units are deliberately mixed because each buyer values water differently — the model normalizes everything to **$ per acre-foot consumed at that node**.

| Node | Physical link | Economic anchor | Source basis |
|---|---|---|---|
| **Agriculture** | crop ET; alfalfa uses 3–5 AF/acre, net irrig. req ~2.49 AF/acre | Marginal value of ag water ≈ **$688–806/AF** (cost to conserve via fallowing); basin farm cash receipts **$881M/yr**, sector **$1.6B/yr** | USU Extension; Choices/AgEcon |
| **Ranching/forage** | rangeland soil moisture → forage | tie to ag receipts + AUM forage value | USU |
| **Wildfire resilience** | soil/fuel moisture → burn probability | society can pay up to **~$505/acre** for high-risk fuel treatment and break even → convert AF→soil-moisture→acres-protected | Hunter & Taylor; USU |
| **M&I / irrigation supply** | reservoir + groundwater delivery | price to avoided-cost of next-cheapest supply; water-rights market price (hundreds $/AF) | UT DWR; your interview note |
| **Hydropower** | reservoir throughput | ~77 MW across 4 PacifiCorp dams → $/AF via head × generation × power price | PacifiCorp / FERC |
| **Fisheries & recreation** | instream flow → angler/boater days | per-angler-day spend; instream-flow WTP (contingent valuation) | NOAA/ASA; instream-flow lit |
| **Waterfowl / wetlands** | refuge inflow | 8M migratory birds; birding/hunting spend | USFWS Bear River Refuge |
| **GSL — lake-effect snow** | lake area → snow enhancement | lake adds **5–10% of Utah snow**, +5–7 ski weeks; ski = **$1.2B/yr, ~20,000 jobs** | GSL Collaborative |
| **GSL — brine shrimp** | salinity/level | **$67M/yr**, 40% of world cyst supply | GSL Collaborative |
| **GSL — minerals** | lake level | **$1.13B/yr, 5,368 jobs** (incl. US primary magnesium) | USGS |
| **GSL — dust/health** | exposed lakebed | Owens Lake analog: **$2.5B upfront + $25–50M/yr**; GSL lakebed = 23–34% of Wasatch dust; 2.66M residents downwind | UT DEQ; USU ILWA |
| **GSL — aggregate** | overall | **~$2.5B/yr, ~9,000 jobs** | USGS/GSL Collaborative |

**Important honesty guardrail (keep your interview credibility):** seeding's contribution to *lake level itself* is ~2–3 orders of magnitude below the structural shortfall — your existing model already says this. So the GSL terminal nodes should be expressed as **marginal/avoided-cost per AF that does reach the lake**, never as "seeding refills the lake." The defensible headline value sits in the upstream nodes (ag, wildfire, supply) plus the *marginal* dust/ecosystem benefit at the terminal.

---

## 4. Model architecture (how the map becomes the layer)

Three new pieces, layered on what exists:

1. **Routing/partition engine** (extend `model/gsl_swy/` in Python, or a parallel TS module).
   Input: AF generated per hotspot cell (already have this from `bear_seeding_grid.geojson`).
   Process: apply the partition fractions from §2 down the cascade, carrying conveyance + evaporation losses at each hop (the ~340k AF/yr wetland/open-water evap and diversion losses are real line items). Output: AF *consumed at each node*.

2. **Economic valuation layer** (a JSON config of node → $/AF, mirroring how `basin_config.json` already centralizes assumptions). Keep every number editable in one file so Parker/Zach can challenge any assumption live. Output: $ per node, and a basin total.

3. **"Follow the water" UX** (extend `GSLMap.tsx` / `ScenarioExplorer.tsx`).
   - A **slider**: water created in basin (toggle "+1 inch" or "+X AF"), exactly as Parker described.
   - A **routed flow animation / Sankey**: water splitting across nodes downstream, dollars accumulating — the River Runner feel he loved, but with economic payoff at each stop.
   - A **value breakdown panel**: $ by node, toggle by buyer/beneficiary, with the honesty note visible.

The new outputs slot into the same `public/*.json` + GeoJSON pattern `run_pilot.py` already writes, so the monitor consumes them with no new plumbing.

---

## 5. The week (today → Thu Jun 25, 11am MT / 10am PT, with Zach)

- **Days 1–2 — Lock the map & numbers.** Finalize node list, partition fractions, and the $/AF config from §2–3. Pull the 2–3 highest-leverage real datasets (USU ag water value, USGS Bear gauges, NIFC/USU wildfire). Text Parker to get the *real* operational numbers he offered (e.g. the Lemhi 50,000 AF figure, the customer-deliverable gaps) so your anchors rest on their data, not guesses.
- **Days 3–4 — Build the routing + valuation engine.** Partition cascade with losses; node $ outputs; basin total. Validate fractions sum to 1 and that no AF is double-counted. Sanity-check totals against the published basin aggregates ($1.6B ag, $2.5B GSL) so nothing is off by orders of magnitude.
- **Day 5 — Wire the UX.** Slider → routed flow viz → $-by-node panel. Make it screenshot-clean enough that Parker could forward it to Utah DNR.
- **Day 6 — Narrative + dry run.** One-screen story: "+X AF here → split this way → $Y total, broken down by beneficiary, with losses shown." Lead with the economic *framework* (the thing you fumbled last time), numbers second. Prep for Zach as the technical/economic owner.
- **Buffer — Day 7.** Polish, fix the one thing that breaks in dry run.

---

## 6. What to confirm with Parker before/while building (use his offer to "remove assumptions")

- The Bear vs Lemhi question for *their* customer story — he demoed both; Bear is your strength, Lemhi is their named example. Worth one text.
- Their real per-AF delivery numbers and where their current customer model stops (he admitted the ground-into-system gap).
- Which beneficiary framing matters most to their actual buyers (state water depts vs downstream Colorado funders vs ag districts) — that determines which node to headline.

---

## Sources

- [Bear River Basin Plan — Utah Div. of Water Resources](https://water.utah.gov/wp-content/uploads/2019/SWP/BearRiver/bear2002.pdf)
- [Bear River — Utah Div. of Water Resources](https://water.utah.gov/interstate-streams/bear-river/)
- [Water budget, upper Chehalis basin (partition analog) — USGS](https://pubs.usgs.gov/publication/sir20185084)
- [Agriculture Water Use & Economic Value in the GSL Basin — USU Extension](https://extension.usu.edu/irrigation/research/agricultural-water-use-salt-lake-basin)
- [Reducing alfalfa production to save the GSL — Utah News Dispatch](https://utahnewsdispatch.com/2025/01/07/great-salt-lake-study-reduce-alfalfa-production/)
- [How Ag Water Conservation Can Save the GSL — Choices Magazine](https://www.choicesmagazine.org/choices-magazine/submitted-articles/how-agricultural-water-conservation-can-save-the-great-salt-lake)
- [The Economic Value of Fuel Treatments — Hunter & Taylor (Forests)](https://www.nwfirescience.org/sites/default/files/publications/forests-13-02042.pdf)
- [Creating Wildfire-Resilient Communities in Utah — USU Extension](https://extension.usu.edu/climate/research/fuel-treatments-in-the-wildland-urban-interface)
- [Using Regional Soil Moisture to Map Wildfire Probability — USFWS](https://www.fws.gov/project/using-regional-soil-moisture-map-wildfire-probability)
- [GSL Lake Facts — Great Salt Lake Collaborative](https://greatsaltlakenews.org/lake-resources/lake-facts)
- [GSL economics (minerals/jobs) — USGS Hydro Mapper](https://webapps.usgs.gov/gsl/characteristics/economics.html)
- [Declining GSL spells economic trouble — KUER](https://www.kuer.org/health-science-environment/2021-07-07/declining-water-levels-in-the-great-salt-lake-spell-economic-trouble-for-utah)
- [GSL Dust Information & FAQ — Utah DEQ](https://deq.utah.gov/air-quality/great-salt-lake-dust-information-and-frequently-asked-questions)
- [Toxic dust from a drying GSL — USU ILWA](https://www.usu.edu/ilwa/reports/2022/great-salt-lake/5d-toxic-dust)
- [Bear River hydro project — PacifiCorp](https://www.pacificorp.com/energy/hydro/bear-river.html)
- [Bear River Migratory Bird Refuge — USFWS](https://www.fws.gov/refuge/bear-river-migratory-bird/about-us)
- [Recreational fishing economics — NOAA Fisheries](https://www.fisheries.noaa.gov/topic/socioeconomics/recreational-fisheries-economics)
