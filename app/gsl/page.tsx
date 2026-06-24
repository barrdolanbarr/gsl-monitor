"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BearEcon, fmtUSD, fmtAF, scaleCoef } from "@/lib/bearEcon";
import { useGenAF } from "../components/useGenAF";

const INCH_AF = 400000;
const STREAM_COLORS = ["#c0612e", "#1f6f8b", "#0f7b54", "#b88a1e"];

export default function GslPage() {
  const [econ, setEcon] = useState<BearEcon | null>(null);
  const [genAF, setGenAF] = useGenAF();

  useEffect(() => {
    fetch("/bear_economics.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => setEcon(e))
      .catch(() => {});
  }, []);

  if (!econ) return <div className="wrap"><div className="loading" style={{ position: "static", padding: 60 }}>loading…</div></div>;

  const gt = econ.gsl_terminal;
  const toLake = gt.af_to_lake_per_genAF * genAF;
  const usd = scaleCoef(gt.usd_per_genAF, genAF);
  const inches = genAF / INCH_AF;
  const s = genAF / INCH_AF;
  const streamMax = Math.max(...gt.streams.map((x) => x.usd_per_inch[1]));

  return (
    <div className="wrap">
      <div className="crumb"><Link href="/">Overview</Link> › <span style={{ color: "var(--ink)" }}>Reaches the Great Salt Lake</span></div>

      <div className="page-head">
        <h1>What reaches the Great Salt Lake</h1>
        <p className="lede">
          The lake is the basin's terminal sink. This is the one place the GSL question belongs in the
          model: of the water generated over the Bear River basin, how much survives diversions and
          reaches the lake — and what that terminal water is worth.
        </p>
      </div>

      <div className="genctl">
        <div className="genctl-top">
          <span className="gv">{fmtAF(genAF)}</span>
          <span className="gu">acre-feet generated</span>
          <span className="gin">≈ {inches.toFixed(2)} in over the basin</span>
        </div>
        <input type="range" min={0} max={800000} step={5000} value={genAF} onChange={(e) => setGenAF(Number(e.target.value))} />
      </div>

      <div className="headline">
        <div className="headline-main" style={{ background: "linear-gradient(135deg,#1f6f8b,#155e75)" }}>
          <div className="hl-k">Reaches the lake</div>
          <div className="hl-v">{fmtAF(toLake)} <span style={{ fontSize: 16, fontWeight: 400 }}>AF</span></div>
          <div className="hl-range">{gt.share_of_inch_pct}% of water generated · {gt.share_of_streamflow_pct}% of streamflow</div>
          <div className="hl-note">
            In-channel flow that isn't diverted, plus the groundwater-return share. Roughly half of what
            reaches the river network makes it all the way down.
          </div>
        </div>
        <div className="headline-side">
          <div className="hl-card">
            <div className="k">Terminal value · per year</div>
            <div className="v">{fmtUSD(usd[1])}</div>
            <div className="s">{fmtUSD(usd[0])} – {fmtUSD(usd[2])}</div>
          </div>
        </div>
      </div>

      <div className="csec">
        <div className="csec-h">What the terminal water is worth</div>
        <div className="csec-sub">
          Four joint products of the water that reaches the lake. These are deliberately modest — terminal
          value, not the headline basin value, and not added to it.
        </div>
        <div className="partition">
          {gt.streams.map((st, i) => {
            const v = st.usd_per_inch[1] * s;
            return (
              <div key={st.label} className="econ-bar-row" style={{ alignItems: "flex-start" }}>
                <div className="econ-bar-label" style={{ flex: "0 0 220px" }}>
                  {st.label}
                  <div className="rt-mech">{st.basis}</div>
                </div>
                <div className="econ-bar-track" style={{ marginTop: 4 }}>
                  <div className="econ-bar-fill" style={{ width: `${(st.usd_per_inch[1] / streamMax) * 100}%`, background: STREAM_COLORS[i % STREAM_COLORS.length] }} />
                </div>
                <div className="econ-bar-val">{fmtUSD(v)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="csec">
        <div className="csec-h">The honest framing</div>
        <div className="det-card" style={{ borderColor: "var(--warn)", borderLeftWidth: 3 }}>
          <p>{gt.honesty}</p>
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          Live lake elevation, tributary inflow, and the seeding-to-lake water-balance model are on the{" "}
          <Link href="/live" style={{ color: "var(--accent)" }}>Live monitor</Link>. The full downstream-value
          picture is on the <Link href="/" style={{ color: "var(--accent)" }}>Overview</Link>.
        </div>
      </div>

      <div className="footnote">
        Terminal-value anchors: dust/public-health (Owens Lake analog), lake ecosystem & mineral industry,
        lake-effect snow / ski, and recreation & birding. Illustrative sourced figures — not company numbers.
      </div>
    </div>
  );
}
