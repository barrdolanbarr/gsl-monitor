# The Ground-Into-System Value Framework
### How Rainmaker quantifies the total economic value of the water it delivers

*Draft for Zach & [founder] — follow-up to the Jun 18 call. Prepared by Barr Dolan.*

---

## Why this document exists

On our call you drew a sharp line: Rainmaker is "really good at cloud-to-ground, but ground-into-system we're not so focused on." That gap is the whole job. Anyone can report inches of snow on a SNOTEL pillow. The hard, valuable, customer-facing question is what happens to that water *after* it hits the ground — how much survives conveyance, where it goes, and what it's worth to the people downstream.

This is the methodology I'd bring to the business development team to answer that question consistently across every basin we operate in. It is deliberately **basin-agnostic** — the Lemhi worked example lives in a separate document. Here I'm defining the engine, not running one case.

The goal is not a single hero number. It's a defensible, repeatable way to turn "we produced N acre-feet" into a value statement a state water agency, an irrigation district, or a utility will actually believe and pay for.

---

## The core idea: water and money follow the same channel

Every acre-foot Rainmaker generates moves through a chain. Value is created — and lost — at each link. The framework's job is to make that chain explicit and to attach a number, with an honest confidence level, to each link.

**Link 0 — Generation.** Snow falls on the target area. Measured by target/control SNOTEL comparison and our own seeding records.

**Link 1 — Yield to the system.** Not all new snow becomes streamflow. It melts, some sublimates, some recharges soil and groundwater, some evaporates. This is the water-balance step — the same partition logic I built into my Great Salt Lake model. Output: acre-feet that actually reach the river network.

**Link 2 — Conveyance and routing.** Water moves downstream and is lost to seepage, evapotranspiration, and diversion along the way. This is exactly the "losses" piece you said we're missing for customers. Output: acre-feet delivered to each point of use.

**Link 3 — First-order use.** The water is consumed or left instream: irrigation, municipal supply, hydropower, or environmental flow.

**Link 4 — Second-order value.** What that use produces: bushels of hay, head of cattle, salmon smolts, angler-days, avoided water-right purchases, hydropower MWh.

**Link 5 — Third-order value.** The community layer: jobs, tax base, ranch and town survival, avoided public health and wildfire costs, cultural continuity. This is the "we give people their lives back" story, made quantitative.

The framework forces every claim back through this chain so we never quote a Link-5 benefit that Link-1 physics can't support. That discipline is what makes the number credible to a skeptical state hydrologist.

---

## The value taxonomy

For any basin, downstream value falls into six buckets. Each gets its own estimation method and data source.

**1. Agricultural production.** Added consumptive water → crop yield and livestock. In ranch country (most of our target basins) this is hay tonnage and the cattle that hay supports, not row crops.
*Sources: USDA NASS county yields, University of Idaho / USU extension water-use coefficients, hay and cattle prices.*

**2. Environmental / ecosystem flow.** Water left instream for fish and habitat. In ESA basins this is the dominant value, because there's a legal mandate and an existing market behind it.
*Sources: NOAA Fisheries recovery metrics (egg-to-smolt survival), state instream-flow transaction records, the price the state currently pays to lease water back into the river.*

**3. Recreation.** Fishing, boating, tourism tied to flow and fishery health.
*Sources: state Fish & Game angler-expenditure surveys, county sales-tax receipts in river towns.*

**4. Municipal & industrial supply.** Water for towns, and increasingly data centers and other industrial load.
*Sources: utility supply costs, avoided new-supply development cost.*

**5. Hydropower.** Added flow through generation facilities.
*Sources: facility head/efficiency, wholesale power prices.*

**6. Avoided costs / risk reduction.** What the water lets a customer *not* spend: water rights they don't have to buy, ESA litigation they avoid, wildfire and dust-health damages reduced.
*Sources: water market price data, litigation/regulatory cost benchmarks, fuel-moisture and air-quality models (the latter is where my GSL dust work plugs in).*

A clean valuation never sums all six blindly — the same acre-foot can't simultaneously grow hay *and* sit instream for salmon. The framework treats these as **competing allocations** of the same water and reports value *by allocation scenario*, which is both honest and exactly the toggle a customer wants to play with.

---

## The hard part: attribution

You raised this twice on the call — "how do you say this is our water that helped." It's the central credibility problem, so the framework confronts it directly rather than burying it.

Attribution has two separate questions, and conflating them is how cloud-seeding economics loses credibility:

**Question A — How much extra water did we generate?**
This is the atmospheric/snowpack claim. The defensible method is target/control SNOTEL comparison, which the established Western programs use to land a 6–12% seasonal precipitation increase (Idaho's programs cite ~10% on average). The honest caveat — and one we should state before a customer does — is that there is no good *per-storm* physical estimate of seeding efficacy, so basin-wide numbers come from integrating many storms with real uncertainty. We quote a **range**, not a point.

**Question B — How much of that water reached the point of value, and can we trace it?**
This is the ground-into-system question and it's where Rainmaker can actually differentiate. The method stacks three independent lines of evidence:

- *Mass balance / modeling* — route the generated increment through a calibrated water-balance and conveyance model (the engine I've already built for the Bear). Gives the expected delivered volume and the losses along the way.
- *Stream gauges* — USGS and state gauges measure actual flow change at key nodes. Idaho notably lacks dense gauging exactly where it matters (you mentioned the state spent ~a quarter billion and didn't fix it), which is both a real limitation and an opportunity: a basin we instrument well becomes a basin we can defend.
- *Trace and timing* — seeding occurs in known windows; the routing model predicts when and where the pulse should arrive, and gauge timing can corroborate it.

The output is a **tiered confidence statement**: "high confidence on X AF generated, medium on Y AF delivered to node Z, with these named uncertainties." A state hydrologist will trust a tiered, caveated number far more than a single confident one — and it matches the intellectual honesty the founder already values about the model.

---

## How business development actually uses this

The framework only matters if it sells. Three customer types, three artifacts:

**State water agencies / departments of natural resources.** They care about statutory missions: ESA compliance, lake levels, drought resilience. The artifact is the basin value-and-attribution report plus the interactive map — the thing the founder said he'd "love to send to the Utah Department of Natural Resources." Pitch: *we deliver water where your mandate needs it, and we can defend the number.*

**Irrigation districts & water users.** They care about acre-feet at the headgate and cost per acre-foot versus their alternatives (buying rights, fallowing, drilling). The artifact is a cost-per-AF comparison: Rainmaker-generated water versus the going market price of a water right in their basin.

**Utilities & industrial buyers (hydropower, data centers, M&I).** They care about firm supply and reliability. The artifact is a supply-augmentation and risk-reduction memo tied to their specific facility.

In every case the framework supplies the same backbone — generation → yield → delivery → value → confidence — and BD swaps in the customer's currency at the end.

---

## Credibility posture

Two commitments keep this from becoming the kind of AI-confident output I told you I wouldn't present:

1. **Every number carries a confidence tier and a source.** No bare point estimates.
2. **We state the strongest counter-argument ourselves** — the per-storm attribution gap, the gauging gap, the competing-allocation problem — before the customer raises it. Owning the limitations is what earns the rest of the number.

---

## What I'd build next

This framework is the spec. The Lemhi document applies it end-to-end to a real basin, and the interactive tool turns it into the toggle-and-follow-the-water map. Both are scoped in the companion file.

---

### Sources
- University of Idaho Extension — Lemhi County agriculture
- Idaho Department of Water Resources — Idaho Water Transactions Program; Cloud Seeding Program (science, FAQ)
- NOAA Fisheries — Idaho landowners keep river flowing (Lemhi flow transactions)
- Idaho Fish & Game — economic impact of fishing in Idaho
- Utah Division of Water Resources / USU — cloud seeding target-control methodology and acre-foot yields
- WestWater Research / Western Water Market — western water transaction pricing 2024–25
