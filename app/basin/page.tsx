"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BearEcon, fmtAF, PATH_COLOR } from "@/lib/bearEcon";

const INCH_AF = 400000;

export default function BasinPage() {
  const [econ, setEcon] = useState<BearEcon | null>(null);
  useEffect(() => {
    fetch("/bear_economics.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => setEcon(e))
      .catch(() => {});
  }, []);

  return (
    <div className="wrap">
      <div className="crumb"><Link href="/">Overview</Link> › <span style={{ color: "var(--ink)" }}>The basin &amp; method</span></div>

      <div className="page-head">
        <h1>The Bear River Basin — and how this model works</h1>
        <p className="lede">
          What the Bear River Basin is, how it uses water today, and how this model turns an amount of new
          water into a dollar value you can defend. Every number that carries weight has a source behind it.
        </p>
      </div>

      {/* WHAT IT IS — fact grid */}
      <div className="csec">
        <div className="csec-h">What the basin is, by the numbers</div>
        <div className="factgrid">
          <div className="fact"><div className="fk">Drainage area</div><div className="fv">7,500 <small>sq mi</small><a href="#fn-2" className="fnref">2</a></div><div className="fs">Across Utah, Idaho &amp; Wyoming</div></div>
          <div className="fact"><div className="fk">River length</div><div className="fv">~500 <small>mi</small><a href="#fn-2" className="fnref">2</a></div><div className="fs">Loops through 3 states, ends ~90 mi from its source as the crow flies</div></div>
          <div className="fact"><div className="fk">Avg. flow to the lake</div><div className="fv">~1.2 <small>M AF/yr</small><a href="#fn-1" className="fnref">1</a></div><div className="fs">Largest single tributary to the Great Salt Lake (~58%)</div></div>
          <div className="fact"><div className="fk">Natural (undepleted) flow</div><div className="fv">~1.75 <small>M AF/yr</small><a href="#fn-1" className="fnref">1</a></div><div className="fs">Before farms and cities take their share</div></div>
          <div className="fact"><div className="fk">Long-run runoff ratio</div><div className="fv">~0.21<a href="#fn-1" className="fnref">1</a></div><div className="fs">Share of all precipitation that leaves as streamflow</div></div>
          <div className="fact"><div className="fk">Withdrawals that are agricultural</div><div className="fv">~90<small>%</small><a href="#fn-1" className="fnref">1</a></div><div className="fs">Mostly alfalfa and hay — the basin's least developed, most farmed</div></div>
        </div>
        <div className="note">
          Figures: USGS / Utah Division of Water Resources inflow record (1941–1990 average ≈ 1.2M AF),<a href="#fn-1" className="fnref">1</a> Utah
          &amp; Wyoming State Water Plans (natural flow ≈ 1.75M AF),<a href="#fn-1" className="fnref">1</a> bearriverinfo.org (basin area).<a href="#fn-2" className="fnref">2</a> Snowpack
          is measured at NRCS SNOTEL sites like Bear River RS (8,400 ft) — a normal year peaks near 75 inches of snow in early April.
        </div>
      </div>

      {/* WATER STORY */}
      <div className="csec">
        <div className="csec-h">How the basin gets — and uses — its water</div>
        <div className="det-card">
          <p>
            Almost all of the Bear's water starts as <b>mountain snow</b>. Winter storms off the Pacific
            stack snowpack in the Uinta and Wasatch ranges; that snowpack acts like a slow-release
            reservoir, melting through spring and early summer to feed the river. A smaller share arrives
            as late-summer rain. Because the water is snow-dominated and the high country is cold, a
            relatively efficient ~35% of a <i>snowy</i> input reaches the river — versus the basin's
            long-run average of ~21% once you include rain and dry years.
          </p>
          <p style={{ marginTop: 12 }}>
            The Bear is <b>over-allocated</b>: more water is promised on paper than the river reliably
            carries, governed by the interstate Bear River Compact.<a href="#fn-1" className="fnref">1</a> When new water shows up, existing
            rights mean it's split predictably — irrigation takes the largest share (it's also the
            <i> lowest</i>-value use per acre-foot), cities take a little (but pay the most per acre-foot),
            and hydropower earns on all of it as it passes the PacifiCorp dam cascade on the way down.<a href="#fn-3" className="fnref">3</a>
            Whatever isn't diverted continues toward the Great Salt Lake — the basin's terminal sink.
          </p>
        </div>
        <div className="det-card">
          <h3>Why the Great Salt Lake is part of the story</h3>
          <p>
            The Bear is the lake's biggest supplier, so the lake is where un-diverted water ends up. The
            lake has dropped to near-record lows, which exposes lakebed dust and stresses brine shrimp,
            millions of migratory birds (the Bear River Migratory Bird Refuge alone is ~41,000 acres of
            wetland),<a href="#fn-4" className="fnref">4</a> the ski industry that depends on lake-effect snow, and a mineral industry worth
            roughly a billion dollars. We keep the lake in the model <i>only</i> as a terminal question —
            how much new water reaches it, and what that water is worth there — on the{" "}
            <Link href="/gsl" style={{ color: "var(--accent)" }}>Reaches the GSL</Link> page.
          </p>
        </div>
      </div>

      {/* HOW THE MODEL WORKS — plain language */}
      <div className="csec">
        <div className="csec-h">How the model works, step by step</div>
        <div className="csec-sub">
          The question is simple: an extra inch falls on the basin, what is it worth downstream? The answer
          is a chain of relationships, each one built the same way.
        </div>

        <div className="bigrel">
          <span className="br-node">add water</span><span className="br-op">→</span>
          <span className="br-node">produce some effect</span><span className="br-op">→</span>
          <span className="br-node">worth $ per year</span>
        </div>

        <ol className="steps-plain">
          <li>
            <b>Start with a clean amount of water.</b> One inch of water spread over the basin's 4.8 million
            acres is exactly <b>400,000 acre-feet</b> — that part is just arithmetic. The slider on the other
            pages lets you pick any amount; everything scales from there.
          </li>
          <li>
            <b>Follow where the water actually goes.</b> Seeded water is mostly high-elevation snow, so we
            split the input <b>80% snow / 20% rain</b> and run each through its own runoff rate (snow sheds
            water efficiently; rain loses more to evaporation). The result: about{" "}
            {econ ? fmtAF(econ.basin.streamflow_af_per_inch) : "140,000"} acre-feet of a one-inch event reaches
            the river. The rest soaks into soil, feeds plants, recharges groundwater — or sublimates off the
            snow and is lost to the air. <b>That lost share is worth nothing, and saying so out loud is what
            makes the rest credible.</b>
          </li>
          <li>
            <b>Give every drop a job, then price it.</b> Each band of water supports a use — farms, cities,
            hydropower, fish, rangeland, recharge. We multiply the acre-feet in that band by a{" "}
            <i>sourced unit value</i> (a real market price or a published study value) to get dollars per year.
            That's one "relationship." There are eight; you can open any of them on the{" "}
            <Link href="/benefit" style={{ color: "var(--accent)" }}>Water uses</Link> page.
          </li>
          <li>
            <b>Never count the same water twice.</b> Two rules keep the total honest. <i>Different water:</i>
            {" "}rangeland, recharge, wildfire and carbon are valued only on water that never reached the river,
            so they can't overlap with irrigation or city supply. <i>Different use of the same water:</i> a
            fishing day is a genuinely different product from a kilowatt-hour, so recreation can stack on
            hydropower for in-channel water — but never on water already sent to farms.
          </li>
          <li>
            <b>Report a range, not a single guess.</b> Every unit value is uncertain, so the model runs{" "}
            {econ ? econ.meta.n_draws.toLocaleString() : "200,000"} times, each time drawing inputs from their
            sourced ranges. We report the middle outcome (P50) and the spread (P10–P90). The water budget
            closes to less than a thousandth of an acre-foot in every single run.
          </li>
          <li>
            <b>Be honest about confidence.</b> Some relationships are solid (irrigation, recharge); some are
            informed estimates we flag as such (wildfire, carbon). Every row carries a confidence tag, and the
            conservative headline excludes the weakest two.
          </li>
        </ol>
      </div>

      {/* WATER FATE recap */}
      {econ && (
        <div className="csec">
          <div className="csec-h">The water budget for a one-inch example</div>
          <div className="csec-sub">Where 400,000 acre-feet ends up. This is the physical backbone under every dollar figure.</div>
          <div className="partition">
            <div className="part-stack">
              {econ.partition.map((p) => (
                <div key={p.fate} className="part-seg" style={{ width: `${(p.af / INCH_AF) * 100}%`, background: PATH_COLOR[p.path] }} title={`${p.fate}: ${fmtAF(p.af)} AF`} />
              ))}
            </div>
            <div className="part-rows">
              {econ.partition.map((p) => (
                <div key={p.fate} className="part-row">
                  <i style={{ background: PATH_COLOR[p.path] }} />
                  <span className="pn">{p.fate}</span>
                  <span className="pv">{fmtAF(p.af)} AF</span>
                  <span className="pp">{((p.af / INCH_AF) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* THE REFRAME */}
      <div className="csec">
        <div className="csec-h">Why the marginal inch isn't worth the average inch</div>
        <div className="det-card" style={{ borderLeft: "3px solid var(--accent)" }}>
          <p>
            A flat price per acre-foot assumes every inch is worth the same. It isn't. A seeded inch is{" "}
            <b>snowpack</b>, and snowpack releases slowly — so the marginal inch disproportionately boosts{" "}
            <b>summer baseflow</b>, and summer low water is the single binding constraint in a snowmelt-fed
            arid river.<a href="#fn-5" className="fnref">5</a> The ecological payoffs are <b>threshold-shaped</b>: a 1–2°C cooling near a fish's
            heat-exclusion limit can re-open kilometers of habitat, while the same cooling on an
            already-cold reach buys almost nothing.
          </p>
          <p style={{ marginTop: 12 }}>
            So an acre-foot is only half the story; the other half is <b>when and where it lands</b>. The same
            inch can do little or a lot depending on whether it shows up on an already-cold reach in May or a
            short canal in August. That's the honest case for a slider over a headline number — you're looking
            at a range, not a point. A later build pins this down by comparing <i>real</i> years when the basin
            produced very different amounts of water.
          </p>
        </div>
      </div>

      <div className="fnlist">
        <div className="fnlist-h">Sources &amp; footnotes</div>
        <ol>
          <li id="fn-1"><span className="fn-n">1.</span> Utah Division of Water Resources — Bear River basin overview, inflow record, and the interstate Bear River Compact. <a href="https://water.utah.gov/interstate-streams/bear-river/" target="_blank" rel="noopener noreferrer">https://water.utah.gov/interstate-streams/bear-river/</a></li>
          <li id="fn-2"><span className="fn-n">2.</span> bearriverinfo.org — Bear River watershed description (drainage area, river length, three-state geography). <a href="https://bearriverinfo.org/watershed-description/bear-river-watershed/index" target="_blank" rel="noopener noreferrer">https://bearriverinfo.org/watershed-description/bear-river-watershed/index</a></li>
          <li id="fn-3"><span className="fn-n">3.</span> PacifiCorp — Bear River hydroelectric cascade (Soda, Grace, Oneida, Cutler powerhouses). <a href="https://www.pacificorp.com/energy/hydro/bear-river.html" target="_blank" rel="noopener noreferrer">https://www.pacificorp.com/energy/hydro/bear-river.html</a></li>
          <li id="fn-4"><span className="fn-n">4.</span> U.S. Fish &amp; Wildlife Service — Bear River Migratory Bird Refuge (~41,000 acres of wetland). <a href="https://www.fws.gov/refuge/bear-river-migratory-bird/about-us" target="_blank" rel="noopener noreferrer">https://www.fws.gov/refuge/bear-river-migratory-bird/about-us</a></li>
          <li id="fn-5"><span className="fn-n">5.</span> Poff et al. 1997, "The Natural Flow Regime," BioScience 47(11):769–784 — flow timing as the master variable in river ecology. <a href="https://academic.oup.com/bioscience/article/47/11/769/229917" target="_blank" rel="noopener noreferrer">https://academic.oup.com/bioscience/article/47/11/769/229917</a></li>
        </ol>
      </div>

      <div className="footnote">
        Sources: Utah Division of Water Resources (Bear River basin & Bear River Development); Utah/Wyoming
        State Water Plans; USGS National Water Information System; bearriverinfo.org; NRCS SNOTEL; PacifiCorp
        (Bear River hydro cascade); U.S. Fish &amp; Wildlife Service (Bear River Migratory Bird Refuge). Unit
        values and the simulation are documented in the master model (seed-42 Monte Carlo). Figures are
        illustrative and sourced — not Rainmaker company numbers.
      </div>
    </div>
  );
}
