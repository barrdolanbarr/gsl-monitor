"use client";
import { useEffect, useMemo, useState } from "react";

// "Follow the water" — routes a chosen quantity of NEW basin water down the hydrologic
// cascade and shows the marginal economic value created at every node. Reads the per-AF
// decomposition from /economic_outputs.json (written by model/run_pilot.py) and rescales
// instantly with the slider — no recompute.

type Node = {
  id: string; label: string; type: "consumptive" | "passthrough" | "lake_terminal";
  path?: string; beneficiary: string; af_per_af: number; value_per_af_used: number;
  usd_per_af: number; loss?: boolean; fate?: string; value_basis?: string;
};
type Econ = {
  basin: { drainage_area_sqmi: number; area_acres: number; acre_feet_per_inch: number };
  fractions: { to_lake: number; by_path: Record<string, number> };
  per_af: { consumptive_usd: number; passthrough_usd: number; lake_terminal_usd: number; total_usd: number };
  nodes: Node[];
  by_beneficiary: { beneficiary: string; usd_per_af: number }[];
  notes: { partition?: string; lake_terminal?: string };
};

const PATH_COLOR: Record<string, string> = {
  soil: "#0f7b54",          // green — soil moisture / ET (crops, forage, fire)
  groundwater: "#b88a1e",   // amber — recharge / wells / baseflow
  surface: "#1f6f8b",       // blue — surface runoff / river
  interception: "#b9c4bb",  // grey — loss
};
const TYPE_COLOR: Record<string, string> = {
  consumptive: "#1f6f8b",
  passthrough: "#c0612e",
  lake_terminal: "#8a3ffc",
};

function fmtUSD(n: number): string {
  if (!isfiniteNum(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`;
  if (a >= 1e6) return `$${(n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (a >= 1e3) return `$${(n / 1e3).toLocaleString(undefined, { maximumFractionDigits: 0 })}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function fmtAF(n: number): string {
  if (!isfiniteNum(n)) return "—";
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function isfiniteNum(n: any): n is number { return typeof n === "number" && isFinite(n); }

export default function EconomicExplorer({ seedingGeneratedAF }: { seedingGeneratedAF?: number }) {
  const [econ, setEcon] = useState<Econ | null>(null);
  const [genAF, setGenAF] = useState<number>(seedingGeneratedAF ?? 4675);
  const [view, setView] = useState<"beneficiary" | "stage">("beneficiary");

  useEffect(() => {
    fetch("/economic_outputs.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.economics) setEcon(j.economics); })
      .catch(() => {});
  }, []);

  const afPerInch = econ?.basin.acre_feet_per_inch ?? 400000;

  const scaled = useMemo(() => {
    if (!econ) return null;
    const nodes = econ.nodes.map((n) => ({
      ...n, af: n.af_per_af * genAF, usd: n.usd_per_af * genAF,
    }));
    const byBen = econ.by_beneficiary
      .map((b) => ({ ...b, usd: b.usd_per_af * genAF }))
      .filter((b) => b.usd > 0);
    const total = econ.per_af.total_usd * genAF;
    const toLakeAF = econ.fractions.to_lake * genAF;
    const maxBen = Math.max(...byBen.map((b) => b.usd), 1);
    return { nodes, byBen, total, toLakeAF, maxBen };
  }, [econ, genAF]);

  if (!econ || !scaled) {
    return (
      <div className="section">
        <h2>Economic layer — follow the water</h2>
        <div className="note">Loading economic model… (run <span className="mono">model/run_pilot.py</span> to generate it).</div>
      </div>
    );
  }

  const consumptive = scaled.nodes.filter((n) => n.type === "consumptive");
  const totalAF = genAF; // consumptive fractions sum to 1
  const inches = genAF / afPerInch;

  const stageRows = [
    { label: "Upstream consumptive use", color: TYPE_COLOR.consumptive, usd: econ.per_af.consumptive_usd * genAF },
    { label: "In-river pass-through (hydro, fishing)", color: TYPE_COLOR.passthrough, usd: econ.per_af.passthrough_usd * genAF },
    { label: "Great Salt Lake (joint benefits)", color: TYPE_COLOR.lake_terminal, usd: econ.per_af.lake_terminal_usd * genAF },
  ];
  const stageMax = Math.max(...stageRows.map((r) => r.usd), 1);

  return (
    <div className="section econ">
      <h2>Economic layer — follow the water</h2>

      {/* WATER-GENERATED SLIDER */}
      <div className="scen-slider">
        <div className="scen-slider-head">
          <span>Extra water generated in basin</span>
          <b>{fmtAF(genAF)} AF · {inches.toFixed(2)} in</b>
        </div>
        <input
          type="range" min={0} max={afPerInch} step={500} value={genAF}
          onChange={(e) => setGenAF(Number(e.target.value))}
        />
        <div className="econ-presets">
          <button className={Math.round(genAF) === Math.round(seedingGeneratedAF ?? 4675) ? "on" : ""}
            onClick={() => setGenAF(seedingGeneratedAF ?? 4675)}>
            seeding ≈ {fmtAF(seedingGeneratedAF ?? 4675)} AF
          </button>
          <button className={genAF === Math.round(afPerInch / 4) ? "on" : ""}
            onClick={() => setGenAF(Math.round(afPerInch / 4))}>¼ inch</button>
          <button className={genAF === afPerInch ? "on" : ""}
            onClick={() => setGenAF(afPerInch)}>+1 inch</button>
        </div>
      </div>

      {/* HEADLINE */}
      <div className="statgrid econ-head">
        <div className="stat"><div className="k">Total economic value</div><div className="v">{fmtUSD(scaled.total)}</div></div>
        <div className="stat"><div className="k">Blended value</div><div className="v">${econ.per_af.total_usd.toFixed(0)}<small>/AF</small></div></div>
        <div className="stat"><div className="k">Reaches the lake</div><div className="v">{fmtAF(scaled.toLakeAF)}<small>AF ({(econ.fractions.to_lake * 100).toFixed(0)}%)</small></div></div>
        <div className="stat"><div className="k">Of generated</div><div className="v">{fmtAF(totalAF)}<small>AF</small></div></div>
      </div>

      {/* WHERE THE WATER GOES — 100% stacked partition bar */}
      <div className="econ-block">
        <div className="econ-block-title">Where the water goes</div>
        <div className="econ-stack">
          {consumptive.map((n) => (
            <div key={n.id}
              className="econ-seg"
              title={`${n.label}: ${fmtAF(n.af)} AF (${(n.af_per_af * 100).toFixed(0)}%)`}
              style={{ width: `${n.af_per_af * 100}%`, background: PATH_COLOR[n.path ?? "surface"] }} />
          ))}
        </div>
        <div className="econ-legend">
          {Object.entries(PATH_COLOR).map(([k, c]) => (
            <span key={k} className="econ-li"><i style={{ background: c }} />{k}</span>
          ))}
        </div>
      </div>

      {/* WHERE THE VALUE COMES FROM */}
      <div className="econ-block">
        <div className="econ-block-title">
          Where the value comes from
          <span className="econ-toggle">
            <button className={view === "beneficiary" ? "on" : ""} onClick={() => setView("beneficiary")}>by beneficiary</button>
            <button className={view === "stage" ? "on" : ""} onClick={() => setView("stage")}>by stage</button>
          </span>
        </div>

        {view === "beneficiary" && scaled.byBen.map((b) => (
          <div className="econ-bar-row" key={b.beneficiary}>
            <div className="econ-bar-label">{b.beneficiary}</div>
            <div className="econ-bar-track">
              <div className="econ-bar-fill" style={{ width: `${(b.usd / scaled.maxBen) * 100}%` }} />
            </div>
            <div className="econ-bar-val">{fmtUSD(b.usd)}</div>
          </div>
        ))}

        {view === "stage" && stageRows.map((r) => (
          <div className="econ-bar-row" key={r.label}>
            <div className="econ-bar-label">{r.label}</div>
            <div className="econ-bar-track">
              <div className="econ-bar-fill" style={{ width: `${(r.usd / stageMax) * 100}%`, background: r.color }} />
            </div>
            <div className="econ-bar-val">{fmtUSD(r.usd)}</div>
          </div>
        ))}
      </div>

      <div className="note">
        Each acre-foot of new water is routed down the cascade: upstream uses are rival
        (fractions sum to 100%, losses included — no double-counting), in-river hydro &amp;
        fishing are valued on throughflow, and Great Salt Lake benefits are joint products of
        the {(econ.fractions.to_lake * 100).toFixed(0)}% that actually reaches the lake.
        The headline value sits upstream (agriculture, supply, wildfire) — the lake-terminal
        per-AF anchors are deliberately modest because seeding moves lake level by orders of
        magnitude too little to refill it. Dollar anchors are editable, sourced, illustrative —
        not Rainmaker company figures.
      </div>
    </div>
  );
}
