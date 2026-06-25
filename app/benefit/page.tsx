"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BearEcon, Benefit, fmtUSD, fmtAF, scaleCoef, CONF_COLOR, CONF_LABEL } from "@/lib/bearEcon";
import { useGenAF } from "../components/useGenAF";

const INCH_AF = 400000;

export default function BenefitIndex() {
  const [econ, setEcon] = useState<BearEcon | null>(null);
  const [genAF, setGenAF] = useGenAF();

  useEffect(() => {
    fetch("/bear_economics.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((e) => setEcon(e))
      .catch(() => {});
  }, []);

  if (!econ) return <div className="wrap"><div className="loading" style={{ position: "static", padding: 60 }}>loading…</div></div>;

  const inches = genAF / INCH_AF;
  const direct = econ.benefits.filter((b) => b.layer === "Direct use");
  const eco = econ.benefits.filter((b) => b.layer === "Ecological");

  const Card = ({ b }: { b: Benefit }) => {
    const af = b.y_af_per_genAF * genAF;
    const usd = scaleCoef(b.usd_per_genAF, genAF);
    return (
      <Link href={`/benefit/${b.slug}`} className="use-card" style={{ borderTopColor: b.color }}>
        <div className="uc-top">
          <span className="uc-name">{b.label}</span>
          <span className="chip chip-conf" style={{ background: CONF_COLOR[b.confidence] }}>{CONF_LABEL[b.confidence]}</span>
        </div>
        <div className="uc-mech">{b.mechanism}</div>
        <div className="uc-foot">
          <div className="uc-stat"><span className="k">Water</span><span className="v">{fmtAF(af)} AF</span></div>
          <div className="uc-stat"><span className="k">Value / yr</span><span className="v" style={{ color: b.color }}>{fmtUSD(usd[1])}</span></div>
          <span className="uc-go">Open →</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="wrap">
      <div className="crumb"><Link href="/">Overview</Link> › <span style={{ color: "var(--ink)" }}>Water uses</span></div>

      <div className="page-head">
        <h1>Pick a water use to explore</h1>
        <p className="lede">
          The basin's new water splits across eight different jobs. Each card is one relationship — choose
          any to see exactly how the water becomes value, the price behind it, and how confident we are.
          Set the amount once and it carries into every page.
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

      <div className="csec">
        <div className="csec-h">Direct use — the water itself</div>
        <div className="csec-sub">Water that reaches the river and gets used. Highest confidence — these are real market prices.</div>
        <div className="use-grid">{direct.map((b) => <Card key={b.slug} b={b} />)}</div>
      </div>

      <div className="csec">
        <div className="csec-h">Ecological — value off the river</div>
        <div className="csec-sub">Value from water that's never diverted, or left in the channel. Real, but priced from studies rather than markets.</div>
        <div className="use-grid">{eco.map((b) => <Card key={b.slug} b={b} />)}</div>
      </div>

      <div className="footnote">
        Headline total counts direct use + the three ecological core rows (fish/recreation, recharge, forage).
        Wildfire and carbon are shown for completeness but kept out of the conservative total.
      </div>
    </div>
  );
}
