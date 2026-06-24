# What an Extra 50,000 Acre-Feet Is Worth in the Lemhi
### A worked economic case + a tool to make it interactive

*Draft for Zach & [founder] — follow-up to the Jun 18 call. Prepared by Barr Dolan.*
*Companion to "The Ground-Into-System Value Framework."*

---

## The ask, restated

You said: when we go to the Lemhi Basin and produce an additional 50,000 acre-feet that wouldn't have been there otherwise — how many extra bushels of wheat, how much wildfire-risk reduction, how much do fishermen spend along the river? Find the second-order effects.

This document does that. It runs the framework end-to-end on one real basin, with sourced numbers and honest confidence levels, and then specs the interactive version — the toggle-the-water map you said you'd want to send to a state agency.

**Why the Lemhi is the right basin to prove this on:** Idaho launched a cloud-seeding feasibility study there in 2022 and it's still pre-operational — so a forward-looking economic case is genuinely useful, not retrospective. And the Lemhi is one of the most important ESA salmon-recovery rivers in the country, which means there's already a *market price* for water in this basin. That changes everything about how defensible the number is.

> **Assumption flag.** 50,000 AF/yr is your planning figure from the call, not an official Lemhi study number. It's plausibly inside a ~10% augmentation envelope for the basin's snow-derived supply, but I'd want to pin it against the feasibility study's own estimate before presenting. You offered to remove assumptions — this is the first one I'd want to nail down with you.

---

## The Lemhi in one paragraph

The Lemhi is a high cattle-and-hay valley in east-central Idaho — roughly 26,600 head of beef cows and 22,300 acres of hay in Lemhi County, with over 90% of harvested ground in forage. It's also critical spawning habitat for ESA-listed Snake River spring/summer Chinook and steelhead, and decades of irrigation diversion have dewatered reaches that fish need. For 20+ years the state, NOAA, BPA and local ranchers have run voluntary water transactions to put flow *back* in the river: the 2008 Idaho Fish Accord put $7.6M toward Lemhi and Pahsimeroi transactions, thirteen landowners restored ~35 cfs through minimum-flow agreements, and a landmark Lemhi Basin Settlement was reached in 2022 and written into Idaho law (HB 749). Water in this basin is contested, legally loaded, and already being bought and sold.

---

## The value chain, by allocation

The key honesty move: 50,000 AF can't do everything at once. I report value **by where the water goes**, not as one inflated sum. This is also exactly the toggle a customer wants — "show me the case if we send it to fish vs. to fields."

### Allocation A — Instream flow for salmon (the headline)

This is the Lemhi's defining use, and it has the most defensible number because **the market already exists.** The state and its partners pay to lease water into this river right now.

- Western instream-flow transactions run roughly **$115–$350 per acre-foot per year** (CA stream-flow enhancement ~$115–130/AF/yr; western leases $200–350/AF/yr; Idaho's water-supply-bank rentals are far lower at $33/AF as of 2025, reflecting administered vs. market pricing).
- At **50,000 AF/yr**, water of this type carries an **avoided-acquisition value of roughly $5M–$17M per year** — that's what it would cost the state to buy the same instream benefit on the open market.

That avoided-cost figure is the cleanest thing in this whole document, because it's anchored to prices people actually pay. *Confidence: medium-high on the unit price, medium on the volume that realistically routes to instream benefit after losses.*

On top of the dollar figure sits the ESA value, which is harder to monetize but is the reason the state cares at all: added cold, clean summer flow improves egg-to-smolt survival from the Upper Salmon to Lower Granite Dam — the exact metric NOAA's program tracks. Restored Idaho salmon/steelhead fisheries are estimated to be worth ~$544M/yr in statewide economic activity; the Lemhi is one of the headwater basins feeding that. *Confidence: directional, not point.*

### Allocation B — Agricultural production

If instead the increment supports consumptive irrigation:

- Regional hay irrigation runs ~3 AF/acre, so 50,000 AF ≈ **~16,700 additional irrigated acres** of equivalent supply.
- At ~2.9 tons/acre that's **~48,000 tons of hay**, worth roughly **$7M–$12M/yr** at typical hay prices ($150–250/ton).
- That hay feeds cattle, the actual economic engine — so the third-order figure is the cattle and ranch jobs it sustains, not the hay receipts alone.

*Confidence: medium on tonnage, lower on price (hay markets swing hard).* Note: this competes with Allocation A — the framework's competing-allocation rule means we present A or B, or a split, never both summed.

### Allocation C — Recreation

Marginal, but real and emotionally resonant. Idaho fishing overall: 640,000 anglers, **$757M in spending, ~$1.1B economic impact, 8,400 jobs.** Salmon/steelhead towns live on it — in Riggins, salmon fishing drives ~23% of annual sales. Added Lemhi flow doesn't move the statewide number much, but it feeds the fishery that supports guide and town economies downstream. *Confidence: qualitative scaling, not a standalone dollar claim.*

### Allocation D — Wildfire risk reduction

You named this one. I'd flag it as the **lowest-confidence** link in the chain. The mechanism is real — more late-season riparian and soil moisture lowers fuel flammability — but there's no clean published $/AF coefficient, and overstating it would undercut the credibility of A and B. My recommendation: carry it as a **qualitative co-benefit** until we build a fuel-moisture model that earns a number. Naming its weakness is itself a credibility signal.

### Roll-up

The honest summary isn't "$X million." It's:

> A defensible **anchor of ~$5–17M/yr in avoided instream-water cost** (Allocation A), or alternatively **~$7–12M/yr in agricultural output** (Allocation B), plus recreation and ecosystem benefits that compound the case but resist a single number — all contingent on how much of the 50,000 AF survives conveyance to the point of use.

The deliverable's value is the *method and the map*, not false precision. That's the posture you said you respect about the model.

---

## Attribution plan for the Lemhi specifically

Three stacked lines of evidence (per the framework):

1. **Generation** — target/control SNOTEL comparison against an unseeded neighboring basin; quote the 6–12% range, not a point.
2. **Yield & routing** — drive the generated increment through the water-balance + conveyance model (the Bear engine, re-pointed to Lemhi DEM and diversions) to estimate delivered AF and losses by reach.
3. **Verification** — USGS/state stream gauges at key nodes. The Lemhi's gauge gaps are a real limitation *and* the pitch: a basin we instrument becomes a basin we can defend. Flag this to the state as a joint-investment opportunity.

Output: a tiered confidence statement per node, not one headline number.

---

## The interactive tool (scoped demo)

This is the "send it to Utah DNR / toggle the water / follow the drop" vision, scoped to something I can stand behind for a demo. It reuses what I've already built rather than starting over.

**What it does:** a map of the Lemhi where you set a slider — *acre-feet generated* — and the tool (1) routes that water downstream with reach-by-reach losses, (2) shows where it accumulates, and (3) updates an economic panel by allocation (instream $, ag $, recreation) live as you drag.

**Reuses my existing stack:**
- The **GSL-SWY+ water-balance engine** already does the melt/AET/runoff partition and basin routing — re-point it from the Bear to the Lemhi DEM.
- The **scenario-explorer pattern** (sliders → recomputed outputs) already exists in the monitor; swap the lake mass-balance for the value chain above.
- The map/overlay UI is already deployed on Vercel.

**MVP scope for the demo (defensible, not vibe-coded):**
- One basin (Lemhi), one slider (AF generated), three allocation outputs each with a visible confidence band.
- Reach-level routing with explicit loss accounting — the ground-into-system piece.
- A methods panel stating sources and the attribution caveats, so it reads as honest from the first click.

**Explicitly out of scope for the demo** (named so we're not overselling): per-storm attribution, real-time gauge ingestion, the wildfire and dust-health models. Those are the roadmap, not the demo.

---

## What I'd want from you before the next call

1. The feasibility study's own augmentation estimate for the Lemhi, to replace my 50,000 AF assumption with your real planning number.
2. Whichever allocation you most want to lead with for a state-agency audience — I suspect instream/ESA, given the basin, but you know the customer.
3. Whether to build the live tool for the call or present these two docs first and build the tool against your feedback.

---

### Sources
- University of Idaho Extension — Lemhi County agriculture (cattle, hay, yields)
- Idaho Department of Water Resources — Idaho Water Transactions Program; Cloud Seeding Program & Lemhi feasibility study
- NOAA Fisheries — "Idaho Landowners Keep River Flowing as Drought Threatens Snake River Salmon"
- Post Register — Lemhi River Basin Settlement (HB 749)
- Idaho Fish & Game / University of Idaho — economic impact of salmon & steelhead fishing in Idaho
- WestWater Research, Western Water Market, Colorado Sun, PPIC — western water transaction & instream-flow pricing 2024–25
- Utah Division of Water Resources / USU Extension — cloud-seeding target/control method and acre-foot yields
