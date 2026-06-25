"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BearEcon, Benefit, fmtUSD, fmtAF, fmtNum, scaleCoef,
  PATH_COLOR, CONF_COLOR, CONF_LABEL,
} from "@/lib/bearEcon";
import { useGenAF } from "./components/useGenAF";

const INCH_AF = 400000; // one inch over the basin

export default function Overview() {
  const [econ, setEcon] = useState<BearEcon | null>(null);
  const [genAF, setGenAF] = useGenAF();

  useEffect(() => {
    fetch("/bear_economics.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => setEcon(e))
      .catch(() => {});
  }, []);

  if (!econ) return <div className="wrap"><div className="loading" style={{ position: "static", padding: 60 }}>loading model…</div></div>;

  const s = genAF / INCH_AF; // scale factor vs. a 1-inch basin event
  const inches = genAF / INCH_AF;
  const streamflow = econ.basin.streamflow_af_per_genAF * genAF;

  const roll = (k: string) => econ.rollups.find((r) => r.key === k)!;
  const combined = scaleCoef(roll("combined").usd_per_genAF, genAF);
  const lensA = scaleCoef(roll("lens_A").usd_per_genAF, genAF);
  const ecoCore = scaleCoef(roll("eco_core").usd_per_genAF, genAF);
  const lensB = scaleCoef(roll("lens_B").usd_per_genAF, genAF);
  const lensC = scaleCoef(roll("lens_C").usd_per_genAF, genAF);

  const gt = econ.gsl_terminal;
  const toLake = gt.af_to_lake_per_genAF * genAF;
  const gslUSD = scaleCoef(gt.usd_per_genAF, genAF);

  const direct = econ.benefits.filter((b) => b.layer === "Direct use");
  const eco = econ.benefits.filter((b) => b.layer === "Ecological");

  const presets: { label: string; v: number }[] = [
    { label: "Seeding ≈4.7K AF", v: econ.presets.seeding_generated_af },
    { label: "¼ inch · 100K AF", v: econ.presets.quarter_inch_af },
    { label: "1 inch · 400K AF", v: econ.presets.one_inch_af },
    { label: "2 inch · 800K AF", v: econ.presets.one_inch_af * 2 },
  ];

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>From water generated to downstream value</h1>
        <p className="lede">
          Pick a quantity of new water generated over the Bear River basin. The model turns it into a
          defensible downstream dollar value — and shows where the water physically goes, how much
          reaches the Great Salt Lake, and what each relationship is worth. Every figure scales linearly,
          so the slider is the whole story.
        </p>
      </div>

      {/* GENERATED-WATER CONTROL */}
      <div className="genctl">
        <div className="genctl-top">
          <span className="gv">{fmtAF(genAF)}</span>
          <span className="gu">acre-feet generated</span>
          <span className="gin">≈ {inches.toFixed(2)} in over the basin · {fmtAF(streamflow)} AF reaches rivers</span>
        </div>
        <div className="genctl-sub">Drag to set the amount of new water. Everything below rescales instantly.</div>
        <input
          type="range" min={0} max={800000} step={5000} value={genAF}
          onChange={(e) => setGenAF(Number(e.target.value))}
        />
        <div className="genctl-presets">
          {presets.map((p) => (
            <button key={p.label} className={Math.abs(genAF - p.v) < 1 ? "on" : ""} onClick={() => setGenAF(p.v)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* HOW TO READ THIS */}
      <div className="explain">
        <div className="explain-h">How every number on this page is built</div>
        <div className="explain-flow">
          <div className="ef-node"><span className="ef-b">Add water</span><span className="ef-s">an amount generated over the basin</span></div>
          <span className="ef-op">→</span>
          <div className="ef-node"><span className="ef-b">It splits up</span><span className="ef-s">some reaches rivers, some soaks in, some is lost</span></div>
          <span className="ef-op">→</span>
          <div className="ef-node"><span className="ef-b">Each part does a job</span><span className="ef-s">farms, cities, power, fish, soil</span></div>
          <span className="ef-op">→</span>
          <div className="ef-node"><span className="ef-b">Worth $ / year</span><span className="ef-s">priced from real market & study values</span></div>
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          Every figure is a range, not a guess — a 200,000-run simulation gives the middle (P50) and the
          spread (P10–P90). For the full plain-language method and what the basin actually is, see{" "}
          <Link href="/basin" style={{ color: "var(--accent)" }}>The basin &amp; method</Link>.
        </div>
      </div>

      {/* HEADLINE */}
      <div className="headline">
        <div className="headline-main">
          <div className="hl-k">Combined defensible value · per year</div>
          <div className="hl-v">{fmtUSD(combined[1])}</div>
          <div className="hl-range">range {fmtUSD(combined[0])} – {fmtUSD(combined[2])} (P10–P90)</div>
          <div className="hl-note">
            Direct water value plus core ecological value. The two add up cleanly because they price
            different water — or a different use of the same water — so nothing is counted twice.
          </div>
        </div>
        <div className="headline-side">
          <div className="hl-card">
            <div className="k">Water generated</div>
            <div className="v">{fmtAF(genAF)} <small>AF</small></div>
            <div className="s">{inches.toFixed(2)} inch over 4.8M acres</div>
          </div>
          <div className="hl-card">
            <div className="k">Reaches the river network</div>
            <div className="v">{fmtAF(streamflow)} <small>AF</small></div>
            <div className="s">blended 80/20 snow/rain runoff ≈ {(econ.basin.blended_runoff_p50 * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* PARTITION — where the water physically goes */}
      <div className="csec">
        <div className="csec-h">Where the water physically goes</div>
        <div className="csec-sub">
          The same acre-feet, traced by fate. Value comes from the first four bands; the last is lost to
          sublimation. This is the physical backbone every dollar figure is built on.
        </div>
        <div className="partition">
          <div className="part-stack">
            {econ.partition.map((p) => (
              <div key={p.fate} className="part-seg"
                style={{ width: `${(p.af / INCH_AF) * 100}%`, background: PATH_COLOR[p.path] }}
                title={`${p.fate}: ${fmtAF(p.af * s)} AF`} />
            ))}
          </div>
          <div className="part-rows">
            {econ.partition.map((p) => (
              <div key={p.fate} className="part-row">
                <i style={{ background: PATH_COLOR[p.path] }} />
                <span className="pn">{p.fate}</span>
                <span className="pv">{fmtAF(p.af * s)} AF</span>
                <span className="pp">{((p.af / INCH_AF) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROLLUP CARDS */}
      <div className="csec">
        <div className="csec-h">The defensible total, in two stacks</div>
        <div className="csec-sub">
          Direct use is what the water itself is worth on the market. Ecological core is the off-river
          value of the water that is never diverted. They sum to the headline.
        </div>
        <div className="rollups">
          <div className="roll-card">
            <div className="rc-k">Direct water value</div>
            <div className="rc-v">{fmtUSD(lensA[1])}</div>
            <div className="rc-range">{fmtUSD(lensA[0])} – {fmtUSD(lensA[2])}</div>
            <div className="rc-note">Irrigation + municipal + hydropower — the market value of the water itself, net.</div>
          </div>
          <div className="roll-card">
            <div className="rc-k">Ecological core</div>
            <div className="rc-v">{fmtUSD(ecoCore[1])}</div>
            <div className="rc-range">{fmtUSD(ecoCore[0])} – {fmtUSD(ecoCore[2])}</div>
            <div className="rc-note">Forage, recharge, and in-channel fish/recreation — value from water that's never diverted.</div>
          </div>
          <div className="roll-card feature">
            <div className="rc-k">Combined · per year</div>
            <div className="rc-v">{fmtUSD(combined[1])}</div>
            <div className="rc-range">{fmtUSD(combined[0])} – {fmtUSD(combined[2])}</div>
            <div className="rc-note">The headline number. Conservative: wildfire and carbon are excluded from the core.</div>
          </div>
        </div>
      </div>

      {/* RELATIONSHIP TABLE */}
      <div className="csec">
        <div className="csec-h">Every relationship, priced</div>
        <div className="csec-sub">
          Each row is one mechanism that turns an acre-foot into value.{" "}
          <b>Click any row</b> to open its own page — the basis, the range, and the source behind the
          number — or browse them all on <Link href="/benefit" style={{ color: "var(--accent)" }}>Water uses</Link>.
        </div>
        <table className="reltable">
          <thead>
            <tr>
              <th>Relationship</th>
              <th className="hide-sm">Beneficiary</th>
              <th>Confidence</th>
              <th className="num">Water (AF)</th>
              <th className="num">Value / yr</th>
            </tr>
          </thead>
          <tbody>
            <RelGroup title="Direct use — the water itself" rows={direct} genAF={genAF} />
            <RelGroup title="Ecological — value off the river" rows={eco} genAF={genAF} />
          </tbody>
        </table>
        <div className="note" style={{ marginTop: 10 }}>
          Headline = direct use + the three ecological core rows (fish/recreation, recharge, forage).
          Wildfire and carbon are shown but kept out of the conservative total.
        </div>
      </div>

      {/* GSL TERMINAL CALLOUT */}
      <div className="csec">
        <div className="csec-h">What reaches the Great Salt Lake</div>
        <div className="csec-sub">
          The lake is the basin's terminal sink — the one place the GSL question actually belongs in this model.
        </div>
        <Link href="/gsl" className="gsl-callout">
          <div className="gsl-co-num">
            <div className="n">{fmtAF(toLake)}</div>
            <div className="l">AF reach the lake</div>
            <div className="l">{gt.share_of_inch_pct}% of generated · {gt.share_of_streamflow_pct}% of streamflow</div>
          </div>
          <div className="gsl-co-body">
            <div className="t">≈ {fmtUSD(gslUSD[1])}/yr in terminal value at the lake</div>
            <div className="d">
              Dust suppression, lake ecosystem & industry, lake-effect snow, and recreation — joint products
              of the water that makes it all the way down. Honest framing: this is real value, but seeding
              volumes are far too small to refill the lake.
            </div>
            <div className="go">See the lake terminal detail →</div>
          </div>
        </Link>
      </div>

      {/* LENS FRAMINGS */}
      <div className="csec">
        <div className="csec-h">Two alternative framings</div>
        <div className="csec-sub">
          Not added to the headline — different lenses on the same water, useful depending on who's asking.
        </div>
        <div className="lenses">
          <div className="lens-card">
            <div className="lc-k">Economic activity supported</div>
            <div className="lc-v">{fmtUSD(lensB[1])}</div>
            <div className="lc-note">{roll("lens_B").note}</div>
          </div>
          <div className="lens-card">
            <div className="lc-k">Cost to develop the same water</div>
            <div className="lc-v">{fmtUSD(lensC[1])}</div>
            <div className="lc-note">{roll("lens_C").note}</div>
          </div>
        </div>
      </div>

      <div className="footnote">
        Model: {econ.meta.model}. {fmtNum(econ.meta.n_draws)}-draw Monte Carlo, seed {econ.meta.seed}.
        Basin ≈ {fmtNum(econ.basin.drainage_area_sqmi)} sq mi · {fmtNum(econ.basin.area_acres)} acres ·
        80/20 snow/rain split (runoff {econ.basin.runoff_snow} snow, {econ.basin.runoff_rain} rain).
        Unit values are sourced marginal/avoided-cost anchors — illustrative, not Rainmaker company figures.
        Live gauges and the seeding-hotspot map are on the <Link href="/live" style={{ color: "var(--accent2)" }}>Live monitor</Link>.
      </div>
    </div>
  );
}

function RelGroup({ title, rows, genAF }: { title: string; rows: Benefit[]; genAF: number }) {
  return (
    <>
      <tr className="grp-row"><td colSpan={5}>{title}</td></tr>
      {rows.map((b) => {
        const af = b.y_af_per_genAF * genAF;
        const usd = scaleCoef(b.usd_per_genAF, genAF);
        return (
          <tr key={b.slug} onClick={() => { window.location.href = `/benefit/${b.slug}`; }}>
            <td>
              <Link href={`/benefit/${b.slug}`} className="rt-name" style={{ textDecoration: "none", color: "inherit" }}>
                <span className="sw" style={{ background: b.color }} />{b.label}
              </Link>
              <div className="rt-mech">{b.mechanism}</div>
            </td>
            <td className="hide-sm">{b.beneficiary}</td>
            <td>
              <span className="chip chip-conf" style={{ background: CONF_COLOR[b.confidence] }}>{CONF_LABEL[b.confidence]}</span>
            </td>
            <td className="num">{fmtAF(af)}</td>
            <td className="num">{fmtUSD(usd[1])}</td>
          </tr>
        );
      })}
    </>
  );
}
