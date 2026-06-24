"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BearEcon, Benefit, fmtUSD, fmtAF, scaleCoef,
  CONF_COLOR, CONF_LABEL,
} from "@/lib/bearEcon";
import { useGenAF } from "../../components/useGenAF";

const INCH_AF = 400000;

export default function BenefitDetail() {
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const [econ, setEcon] = useState<BearEcon | null>(null);
  const [genAF, setGenAF] = useGenAF();

  useEffect(() => {
    fetch("/bear_economics.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => setEcon(e))
      .catch(() => {});
  }, []);

  if (!econ) return <div className="wrap"><div className="loading" style={{ position: "static", padding: 60 }}>loading…</div></div>;

  const b: Benefit | undefined = econ.benefits.find((x) => x.slug === slug);
  if (!b) return (
    <div className="wrap wrap-narrow">
      <div className="crumb"><Link href="/">← Overview</Link></div>
      <h1 className="page-head">Relationship not found</h1>
      <p className="lede">No benefit matches “{slug}”. <Link href="/">Back to the Overview</Link>.</p>
    </div>
  );

  const af = b.y_af_per_genAF * genAF;
  const usd = scaleCoef(b.usd_per_genAF, genAF);
  const inches = genAF / INCH_AF;
  const uv = b.unit_value;

  // sibling links
  const idx = econ.benefits.findIndex((x) => x.slug === slug);
  const prev = econ.benefits[(idx - 1 + econ.benefits.length) % econ.benefits.length];
  const next = econ.benefits[(idx + 1) % econ.benefits.length];

  return (
    <div className="wrap">
      <div className="crumb">
        <Link href="/">Overview</Link> › {b.layer} › <span style={{ color: "var(--ink)" }}>{b.label}</span>
      </div>

      <div className="page-head">
        <h1>
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: b.color, marginRight: 10, verticalAlign: "middle" }} />
          {b.label}
        </h1>
        <p className="lede">{b.relationship}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <span className="chip chip-layer">{b.layer}</span>
          <span className="chip chip-layer">{b.beneficiary}</span>
          <span className="chip chip-conf" style={{ background: CONF_COLOR[b.confidence] }}>{CONF_LABEL[b.confidence]}</span>
        </div>
      </div>

      {/* mini generated-water control */}
      <div className="genctl">
        <div className="genctl-top">
          <span className="gv">{fmtAF(genAF)}</span>
          <span className="gu">acre-feet generated</span>
          <span className="gin">≈ {inches.toFixed(2)} in over the basin</span>
        </div>
        <input type="range" min={0} max={800000} step={5000} value={genAF} onChange={(e) => setGenAF(Number(e.target.value))} />
        <div className="note" style={{ marginTop: 8 }}>Shared across pages — the amount you set here carries back to the Overview.</div>
      </div>

      <div className="det-grid">
        <div>
          {/* relationship flow */}
          <div className="det-rel">
            <div className="dr-k">The relationship · add → get → worth</div>
            <div className="dr-flow">
              <div className="dr-node"><span className="nb">{fmtAF(genAF)}</span><span className="nl">AF generated</span></div>
              <span className="dr-op">→</span>
              <div className="dr-node"><span className="nb">{fmtAF(af)}</span><span className="nl">AF to this use</span></div>
              <span className="dr-op">→</span>
              <div className="dr-node"><span className="nb">{fmtUSD(usd[1])}</span><span className="nl">per year</span></div>
            </div>
          </div>

          <div className="det-card">
            <h3>How the water becomes value</h3>
            <p>{b.mechanism}</p>
          </div>

          <div className="det-card">
            <h3>The unit value behind the number</h3>
            <div className="kv"><span className="kk">Low anchor</span><span className="vv">{uv.lo} {uv.unit}</span></div>
            <div className="kv"><span className="kk">Central (P50)</span><span className="vv">{uv.p50} {uv.unit}</span></div>
            <div className="kv"><span className="kk">High anchor</span><span className="vv">{uv.hi} {uv.unit}</span></div>
            <div className="kv"><span className="kk">Water this use receives</span><span className="vv">{(b.y_af_per_genAF * INCH_AF).toLocaleString()} AF / inch</span></div>
            <p className="srcline" style={{ marginTop: 12 }}>Source: {b.source}</p>
          </div>

          <div className="det-card">
            <h3>How it scales</h3>
            <p>
              Value is linear in water generated: {fmtUSD(b.usd_per_genAF.p50)} per acre-foot generated (P50).
              At your current setting of {fmtAF(genAF)} AF that is <b>{fmtUSD(usd[1])}/yr</b>, with a P10–P90
              range of {fmtUSD(usd[0])} – {fmtUSD(usd[2])}. The acre-feet shown reflect this relationship's
              share of the basin's water fate, not the full generated amount.
            </p>
          </div>
        </div>

        <aside className="det-side">
          <div className="det-card">
            <h3>At {fmtAF(genAF)} AF generated</h3>
            <div className="ds-stat"><div className="ds-k">Value · P50 / yr</div><div className="ds-v">{fmtUSD(usd[1])}</div></div>
            <div className="ds-stat"><div className="ds-k">P10 – P90</div><div className="ds-v" style={{ fontSize: 14 }}>{fmtUSD(usd[0])} – {fmtUSD(usd[2])}</div></div>
            <div className="ds-stat"><div className="ds-k">Water to this use</div><div className="ds-v">{fmtAF(af)} <small>AF</small></div></div>
            <div className="ds-stat"><div className="ds-k">Confidence</div><div className="ds-v" style={{ fontSize: 15 }}>{CONF_LABEL[b.confidence]}</div></div>
            <div className="ds-stat"><div className="ds-k">Counted in headline?</div><div className="ds-v" style={{ fontSize: 15 }}>{["irrigation", "municipal", "hydropower", "instream", "recharge", "forage"].includes(b.slug) ? "Yes" : "No — conservative"}</div></div>
          </div>
          <div className="det-card">
            <h3>Other relationships</h3>
            <div className="kv"><span className="kk">← Prev</span><Link className="vv" href={`/benefit/${prev.slug}`} style={{ textDecoration: "none", color: "var(--accent2)" }}>{prev.short}</Link></div>
            <div className="kv"><span className="kk">Next →</span><Link className="vv" href={`/benefit/${next.slug}`} style={{ textDecoration: "none", color: "var(--accent2)" }}>{next.short}</Link></div>
            <div className="kv"><span className="kk">All</span><Link className="vv" href="/" style={{ textDecoration: "none", color: "var(--accent2)" }}>Overview table</Link></div>
          </div>
        </aside>
      </div>

      <div className="footnote">
        Per-acre-foot coefficients are derived from the master Monte Carlo (seed {econ.meta.seed}); multiply by
        any generated-water quantity for a total. Unit values are sourced anchors, illustrative — not company figures.
      </div>
    </div>
  );
}
