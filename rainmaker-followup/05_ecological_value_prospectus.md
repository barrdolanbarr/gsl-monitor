# The Ecological Value of One Seeded Inch: A Flow-Regime Prospectus
### Reframing the Bear River question as an ecological-economics research problem

*Barr Dolan — Rainmaker follow-up. Supersedes the benefit-transfer treatment in `04_one_inch_ecological_value.md` as the scientific framing; that document remains the accounting baseline. Companion model/figure: `bear_inch_ecohydro.py` · `bear_inch_ecohydro.png`*

---

## Abstract

The first ecological brief treated one inch (400,000 AF) as a *stock* to be partitioned by physical fate and priced at a flat $/AF. That is the standard practitioner move, and it is wrong in a way that matters. An inch delivered by glaciogenic seeding is not generic water — it is **high-elevation winter snowpack**, and its ecological value is governed not by its volume but by what it does to the river's *flow regime* (Poff et al. 1997): the magnitude, timing, duration, frequency, and rate-of-change of streamflow. Snowpack is a natural reservoir that releases on a delayed recession, so the marginal inch disproportionately augments **summer baseflow** — and summer baseflow is the single binding ecological constraint in snowmelt-dominated arid rivers. Because the dominant ecological production functions (stream temperature → coldwater fish; wetted area → secondary production; riparian recruitment) are **non-linear and threshold-shaped**, the value of the marginal inch is concentrated in time and state-dependent, and a flat $/AF systematically misprices it — usually downward, near thresholds, by a lot. This document rebuilds the problem as an ecological-economics research program: a conceptual cascade, eight mechanistic links (several of them new), the valuation theory that explains why averages fail, a production-function quantification strategy, and a falsifiable research design to estimate the coefficients with Rainmaker's own SNOTEL/gauge infrastructure.

---

## 1. Why the standard approach mis-values the inch

The benefit-transfer model in doc 04 makes three implicit assumptions that the ecology literature rejects:

1. **Linearity.** It assumes value scales with acre-feet at a constant $/AF. But ecological responses to flow are non-linear: stream temperature, dissolved oxygen, and usable habitat are step- or threshold-shaped. The marginal acre-foot's value depends on *where on the response curve the river already sits.*

2. **Time-homogeneity.** It assumes an acre-foot is an acre-foot regardless of when it arrives. The natural-flow paradigm says the opposite — the same volume is worth far more as sustained August baseflow than as part of the May freshet, because summer low flow is the limiting season. "Changes in low summer flows influence many ecosystem services" (NRC, *Valuing River Ecosystem Services*); seeded snowpack is precisely a mechanism for moving water into that window.

3. **Decomposability.** It assumes services can be summed across independent buckets. River ecosystems are integrated: the NRC explicitly warns that "ecosystem production functions are not only hard to estimate, but may be an inappropriate concept for river ecosystems" because the same flow simultaneously drives temperature, habitat, water quality, and riparian processes that interact and feed back.

The honest conclusion is not "the number is bigger" or "smaller" — it is that **a single $/AF cannot be the unit of analysis.** The right unit is the *change in the flow regime* and its propagation through a set of mechanistic links. That is the reframing below.

---

## 2. Conceptual model: the snow-to-system cascade

I organize the problem with the ecosystem-services cascade (Haines-Young & Potschin 2011; CICES): **biophysical structure → ecological function → service → benefit → economic value.** The novelty for a seeded snowmelt basin is that the *first arrow* is a hydrologic-regime transformation, not a volume:

```
  SEEDED SNOWPACK (structure: stored high-elevation SWE)
        │  snow acts as a natural reservoir; delayed, extended melt recession
        ▼
  ALTERED FLOW REGIME (function)  ── Poff's 5 components, esp. ↑ summer baseflow,
        │                            later peak, slower recession, ↑ duration of wetted habitat
        ├── thermal regime  ─────────────► coldwater fish habitat            (Link 1)
        ├── wetted usable area ──────────► aquatic 2° production → food web   (Link 2)
        ├── dilution / assimilation ─────► water-quality regulation          (Link 3)
        ├── hydrograph shape/timing ─────► riparian recruitment (cottonwood)  (Link 4)
        ├── recharge → water table ──────► GDEs + late-season return flow     (Link 5)
        ├── soil-moisture phenology ─────► NPP → forage + carbon              (Link 6)
        └── freshwater inflow ───────────► wetland / migratory-bird habitat   (Link 7)
                                                  │
                                                  ▼
                              SERVICES → BENEFITS → VALUE (provisioning,
                              regulating-maintenance, cultural per CICES)
```

Link 0 — snowpack → summer baseflow — is the **keystone**: every downstream link is mediated by it. This is why the physics (how much seeded SWE survives to become *late-season* flow) dominates the value, exactly as the original Monte Carlo found that the runoff coefficient dominated — but now with an ecological mechanism attached, and with *timing* as important as *amount*.

---

## 3. The mechanistic links

Each link is stated as: **mechanism → evidence → Bear-specific relevance → how to value → confidence.** Links marked ★ are new relative to docs 03–04; they emerged from the literature in this round.

### Link 0 ★ — Snowpack → hydrograph shape → summer baseflow (keystone)

*Mechanism.* Snowpack is a natural reservoir; it melts on a recession that sustains flow into the dry season. Annual peak SWE is a strong predictor of summer low flow in arid watersheds, and shifts in snowmelt explained >60% of annual-streamflow variability in Great Basin watersheds.
*Bear relevance.* The Bear is snowmelt-dominated with a deep summer low (my GSL-SWY+ model reproduces this with the ~262K AF growing-season ag diversion). Seeded glaciogenic snow lands in exactly the high-elevation cold zone that feeds baseflow.
*Valuation consequence.* The ecologically potent quantity is not the 125K AF of annual streamflow but the fraction that manifests as **summer baseflow**. The value model should weight the inch by its seasonal delivery, not its annual total.
*Confidence: HIGH on mechanism, MEDIUM on the seeded baseflow fraction (the key number to measure).*

### Link 1 ★ — Baseflow → thermal regime → coldwater fish (Bonneville cutthroat trout)

*Mechanism.* "Trout distributions are governed first by temperature, second by flow." Higher summer baseflow lowers and buffers stream temperature; coldwater fish are excluded above ~19.5 °C and seek thermal refugia. Withdrawing 50–90% of summer baseflow significantly reduces trout growth.
*Evidence.* Snowpack → low flow → stream-temperature relationships are documented across western watersheds; the response is threshold-shaped.
*Bear relevance.* The **Bonneville cutthroat trout** — Utah's state fish — is native to the Bear drainage (Smith Fork, Thomas Fork, upper Bear), preferred range 48–62 °F (≈ 8.9–16.7 °C). Critically, **the majority of Bear River basin (Wyoming) cutthroat habitat is classified as high or very-high climate risk.** Conservation strategy explicitly calls to "maintain flows" and "provide late-season stream recharge" — i.e., exactly what seeded baseflow does.
*How to value.* A non-linear thermal-habitat production function (temperature → suitable stream-km), monetized via recreational-fishing consumer surplus (~$95/angler-day, regional benefit transfer) and non-use/existence value for a native species. Marginal value spikes where the river sits near the thermal threshold.
*Confidence: HIGH on the mechanism and Bear specificity; MEDIUM-LOW on the dollar coefficient (non-linear, site-specific).*

### Link 2 ★ — Baseflow → wetted usable area → aquatic secondary production → food web

*Mechanism.* Discharge sets wetted/weighted-usable area (WUA; the basis of IFIM/instream-flow science), which sets macroinvertebrate biomass and secondary production — the energetic base that feeds fish and riparian insectivorous birds.
*Evidence.* WUA–discharge and WUA–macroinvertebrate-biomass relationships are the standard tools of environmental-flow assessment; macroinvertebrate assemblages are the most sensitive indicator of ecological state.
*Valuation.* Largely an *intermediate* (supporting) function — its value is realized through Links 1 and 7 (fish, birds). Counting it separately would double-count; I carry it as the mechanism that makes the fish/bird endpoints credible, not as an additive dollar line. This is the cascade model's discipline (supporting services are "functions," not separately-valued services).
*Confidence: HIGH on mechanism; intentionally NOT separately monetized.*

### Link 3 ★ — Baseflow → dilution / assimilative capacity → water-quality regulation

*Mechanism.* Flow magnitude is the dominant control on a river's self-purification: seasonal flow variation can change assimilative capacity by up to ~80–97%. More baseflow dilutes nutrients/salts and shortens pollutant contact time.
*Bear relevance.* The Bear is heavily agricultural (return flows, nutrients, temperature, salinity); the lower river and its wetlands are sensitive to concentration. Summer is when both flow is lowest and loading effects are worst.
*How to value.* Avoided-cost of treatment / avoided TMDL-compliance cost for the diluted load; a regulating service under CICES. Defensible in principle, data-hungry in practice.
*Confidence: MEDIUM on mechanism, LOW on a Bear dollar figure without loading data.*

### Link 4 ★ — Hydrograph timing & recession rate → riparian recruitment (cottonwood/willow)

*Mechanism.* The **recruitment box model** (Mahoney & Rood 1998; extended to willow by Amlin & Rood 2002): cottonwood/willow seedlings establish only if the post-peak stage recession is slow enough (≤ ~2.5 cm/day) for root growth to track the receding moist zone. Climate-driven earlier, faster recessions are reducing recruitment across western riparian forests.
*Bear relevance.* Riparian cottonwood gallery forests are the structural backbone of the Bear's riparian zone — bank stability, shade (a feedback into Link 1's temperature), wildlife corridor, and carbon. Recruitment is *timing-limited*, not volume-limited.
*Honest caveat.* Whether a seeded increment *slows* the recession (good for recruitment) or merely raises the peak depends on melt dynamics — this is a directional hypothesis, not an established benefit. It could even be neutral. I flag it as a mechanism to test, not a number to claim.
*Confidence: HIGH on the recruitment mechanism; LOW on the sign/magnitude of the seeding effect — a research question.*

### Link 5 — Recharge → groundwater subsidy → GDEs + late-season return flow

*Mechanism.* Percolation raises the water table; phreatophytes and riparian meadows draw on this "groundwater subsidy," and a shallower table returns water to the channel as late-season baseflow (closing a loop back to Link 0). Groundwater dominates snowmelt runoff and controls streamflow efficiency in much of the western US.
*Upgrade from doc 04.* The recharge bucket is no longer just "avoided pumping $/AF" — it is the support system for groundwater-dependent ecosystems *and* a baseflow source. Same water, richer (and partly non-additive) value.
*Confidence: MEDIUM on mechanism; the avoided-cost dollar stays as in doc 04, with the GDE value noted qualitatively to avoid double-counting Link 0.*

### Link 6 — Soil-moisture phenology → NPP → forage + carbon

*Mechanism.* Snowmelt timing sets growing-season soil moisture, which limits gross primary productivity; earlier/abundant moisture lengthens the productive window. Forage and soil/plant carbon follow.
*Bear relevance.* ~3/4 of the basin is grazing land; this is the broad, low-intensity terrestrial endpoint.
*Confidence: MEDIUM on mechanism; LOW $/AF (dryland forage is low-value) — carried as in doc 04.*

### Link 7 ★ — Bear freshwater inflow → wetland productivity → migratory-bird habitat

*Mechanism.* The Bear's freshwater inflow sustains wetland hydroperiod and pushes back salinity at its terminus.
*Bear relevance.* The **Bear River Migratory Bird Refuge** is "the largest freshwater component of the Great Salt Lake ecosystem," ~41,000 acres of freshwater wetland, supporting up to ~500,000 waterfowl and ~200,000 shorebirds annually; a **Western Hemisphere Shorebird Reserve Network** site of global importance (American avocet, black-necked stilt, white-faced ibis colonies of up to 10,000). This is a *flow-dependent freshwater-wetland* endpoint — I value it on inflow maintaining habitat, **not** on Great Salt Lake stage economics (which the prior analysis correctly set aside as beyond seeding's scale).
*How to value.* Wildlife-viewing/birding consumer surplus (~$48/day regional) and habitat-equivalency / wetland ecosystem-service transfer, applied to the marginal inflow's contribution to hydroperiod — heavily caveated because the refuge is managed and the marginal inch is small against its water budget.
*Confidence: HIGH on the habitat's importance; LOW on attributing a marginal-inch dollar to it.*

---

## 4. The valuation problem: why marginal ≠ average

Three theoretical points that an ecological economist would insist on, and that reframe the whole deliverable:

**Non-linearity and thresholds.** The thermal-habitat function (Link 1) is the cleanest example. If the river's controlling reach sits at 20 °C in August (lethal), an increment of baseflow that buys a 1–2 °C reduction can re-open kilometers of habitat — a discontinuous jump in value. If the reach sits at 12 °C, the same increment buys almost nothing. **The marginal inch is worth a step function of the baseline state, not a constant.** Benefit transfer assumes the constant and is therefore wrong precisely where the action is.

**Temporal concentration.** Because summer low flow is limiting, the inch's ecological value is concentrated in the ~3 driest months. A defensible model weights the streamflow increment by season and assigns ecological value chiefly to the baseflow component. This can make the *ecologically effective* quantity far smaller than 125K AF — but each effective acre-foot far more valuable.

**Marginal vs. total, and additionality.** The relevant economic object is the *marginal* change against the counterfactual (no seeding), on a system that is already functioning or already degraded. On a healthy reach, marginal value is low (diminishing returns); on a near-threshold reach, high. This is why the same inch can be "worth little" or "worth a lot" — and why an honest answer is a *function*, not a scalar.

The punchline for Rainmaker: **the product isn't water, it's flow at the right time and place.** That reframing is more defensible *and* more valuable than a flat $/AF, because it lets a customer target the seeding to the reaches and seasons where the production function is steep.

---

## 5. A defensible quantification strategy

Rather than one Monte Carlo dollar total, the production-function approach proceeds in stages, each independently checkable:

1. **Regime change.** Estimate Δ(summer baseflow) per seeded inch from SWE → recession physics (target/control SNOTEL + downstream gauges). Output: AF of *August-equivalent* baseflow, with uncertainty. *This is the one number that, if measured, collapses most of the uncertainty.*
2. **Production functions.** For each endpoint with a steep, monetizable curve (Link 1 thermal-habitat is first), fit response(flow) and locate the river's current operating point relative to the threshold.
3. **Service → value.** Monetize only the *endpoint* services (fish, birds, water-quality avoided cost, forage, recharge), treating Links 0/2/5-subsidy as *functions* that produce them — explicit cascade discipline against double-counting.
4. **Report as curves, not points.** Value-vs-baseflow and value-vs-baseline-temperature curves, with confidence bands, so the customer sees where seeding is and isn't worth it.

The illustrative figure (`bear_inch_ecohydro.png`) shows the two ideas that matter most: (a) the **non-linear thermal-habitat production function** beside the linear benefit-transfer assumption — same acre-foot, wildly different marginal value depending on baseline temperature; and (b) the **seasonal concentration** of the inch's ecological potency in the summer-baseflow window. These are labeled *illustrative* — the curves' parameters are exactly what the research design below would estimate.

---

## 6. The research design (the "PhD")

Treated as a dissertation, the question "what is a seeded inch worth ecologically in the Bear?" decomposes into testable hypotheses with a clear empirical program and explicit falsification criteria.

**H1 (keystone).** Seeded high-elevation SWE increases *summer* baseflow more than proportionally to its share of annual flow.
*Test:* paired target/control SNOTEL + nested stream gauges; separate baseflow via hydrograph separation; compare seeded vs. unseeded years/sub-basins.
*Falsified if:* the increment appears only in the spring freshet and not in July–September baseflow.

**H2.** Marginal summer baseflow lowers temperature in thermally-limited Bear reaches enough to expand Bonneville cutthroat habitat.
*Test:* distributed temperature loggers + a calibrated stream-temperature model; map current operating points vs. the ~19.5 °C threshold; couple to a WUA/habitat model.
*Falsified if:* controlling reaches are temperature-insensitive to realistic baseflow increments (already cold, or air-temperature-dominated).

**H3.** The seeding-shifted hydrograph slows post-peak recession enough to improve cottonwood/willow recruitment (the box-model criterion, ≤2.5 cm/day).
*Test:* stage-recession analysis seeded vs. unseeded; seedling establishment transects.
*Falsified if:* seeding raises peaks without slowing recession (no recruitment benefit).

**H4.** Marginal inflow measurably extends wetland hydroperiod / suppresses salinity at the Bear River refuge enough to affect shorebird forage availability.
*Test:* refuge water-budget accounting + remote-sensing of inundated area; this is the weakest link and may be rejected on scale grounds — and saying so is part of the science.

The deliverable's intellectual honesty is that **it names what would prove it wrong.** Two of these (H1, H2) are squarely within Rainmaker's existing measurement footprint and would, if confirmed, convert the company's "ground-into-system" gap into a defensible, sellable ecological product.

---

## 7. What this means for Rainmaker

- **Reframe the pitch from volume to flow regime.** "We add summer baseflow to a thermally-limited native-trout river" is a sharper, more defensible, and higher-value claim than "we add 125,000 acre-feet." It targets the steep part of the production function.
- **The Bonneville cutthroat is the headline endpoint.** A climate-imperiled *state fish*, native to the basin, limited by exactly the variable (summer temperature/baseflow) that seeded snow moves. It is scientifically central and rhetorically powerful — and it is non-use value, which state agencies fund.
- **The keystone measurement is H1.** Spend the next measurement dollar on seeded-SWE → summer-baseflow attribution. Everything downstream hinges on it, and Rainmaker is uniquely positioned to measure it.
- **Honesty is the moat.** Several links (riparian recruitment, refuge inflow) may be small or sign-uncertain. Presenting them as hypotheses with falsification criteria — rather than dollar claims — is what makes the strong links (thermal/fish, baseflow) credible to a technical state audience.

---

### Sources
- Poff, L. et al. (1997), *The Natural Flow Regime*, BioScience — five flow components; ecological integrity.
- National Research Council, *Valuing River Ecosystem Services* (NAP) — production-function caveats; low-summer-flow services; use/indirect/existence values.
- Conceptual framework for environmental flows based on ecosystem services & economic valuation (Ecosystem Services, 2016).
- Snowmelt timing → soil moisture, GPP, growing season (USGS / Frontiers in Plant Science; bioRxiv montane-meadow carbon).
- Snowpack as natural reservoir; peak SWE predicts summer low flow; >60% of Great Basin streamflow variability from snowmelt shifts (HYP; ScienceDirect; Drought.gov snow-drought).
- Stream temperature first-order control on trout; ~19.5 °C exclusion; 50–90% baseflow withdrawal reduces trout growth (USFS; ResearchGate brook-trout study; ProFishology synthesis).
- Bonneville cutthroat trout: native to Bear drainage; 48–62 °F; Bear/WY habitat high climate risk; conservation calls for flow maintenance & late-season recharge (Trout Unlimited; WGFD; IDFG conservation plan).
- Weighted usable area / IFIM; macroinvertebrate biomass–flow; secondary production as ecosystem-function metric (NZ J. Marine & Freshwater Research; Frontiers Eco & Evo).
- Assimilative capacity / dilution flow: flow controls 80–97% of seasonal assimilation (ASCE J. Hazard. Toxic Radioact. Waste; Springer Bull. Environ. Contam. Toxicol.).
- Recruitment box model: Mahoney & Rood (1998); willow extension Amlin & Rood (2002); recession ≤2.5 cm/day; climate effects on recruitment (Springer Wetlands; Ecosphere 2025).
- Groundwater-dependent ecosystems / phreatophyte groundwater subsidy; groundwater dominates snowmelt runoff (PNAS; Water Resources Research; Nature Comms Earth & Environment; Frontiers in Water).
- Ecosystem-services cascade: Haines-Young & Potschin (2011/2012); CICES classification.
- Bear River Migratory Bird Refuge: largest freshwater component of GSL ecosystem; ~41,000 ac wetland; ~500k waterfowl / 200k shorebirds; WHSRN site (US FWS).
- Recreation/non-market unit values: freshwater fishing ~$95/day, wildlife viewing ~$48/day (UF/IFAS benefit-transfer summary); EPA social cost of carbon ~$190–255/ton.
