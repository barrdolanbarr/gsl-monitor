"use client";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { simulateScenario, TARGET_STAGE, type ScenarioParams } from "@/lib/lakeModel";

const HORIZON = 75;

function fmt(n: number | null | undefined, d = 0) {
  if (n === undefined || n === null || isNaN(n as number)) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

function Slider({
  label, value, setValue, min, max, step, unit, display,
}: {
  label: string; value: number; setValue: (v: number) => void;
  min: number; max: number; step: number; unit: string;
  display?: (v: number) => string;
}) {
  return (
    <div className="scen-slider">
      <div className="scen-slider-head">
        <span>{label}</span>
        <b>{display ? display(value) : `${fmt(value)} ${unit}`}</b>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </div>
  );
}

export default function ScenarioExplorer({
  currentStageFt, seedP50,
}: { currentStageFt: number; seedP50?: number }) {
  const [agBuyback, setAgBuyback] = useState(0);
  const [miConservation, setMiConservation] = useState(0);
  const [seedPct, setSeedPct] = useState(0);
  const [climate, setClimate] = useState(0);

  const seedingFullDeployAF = seedP50 ?? 1200;

  const { scenario, baseline, seedingDeltaFt, addedAF } = useMemo(() => {
    const common = {
      startStageFt: currentStageFt,
      years: HORIZON,
      seedingFullDeployAF,
    };
    const params: ScenarioParams = {
      ...common,
      agBuybackAF: agBuyback,
      miConservationAF: miConservation,
      seedingFraction: seedPct / 100,
      climatePctPerDecade: climate,
    };
    const scenario = simulateScenario(params);
    const baseline = simulateScenario({
      ...common, agBuybackAF: 0, miConservationAF: 0, seedingFraction: 0, climatePctPerDecade: 0,
    });
    // what the seeding slider alone contributes to the end state
    const noSeed = seedPct > 0
      ? simulateScenario({ ...params, seedingFraction: 0 })
      : scenario;
    return {
      scenario, baseline,
      seedingDeltaFt: scenario.finalStageFt - noSeed.finalStageFt,
      addedAF: agBuyback + miConservation + (seedPct / 100) * seedingFullDeployAF,
    };
  }, [currentStageFt, agBuyback, miConservation, seedPct, climate, seedingFullDeployAF]);

  const chartData = scenario.points.map((p, i) => ({
    year: p.year,
    scenario: p.stageFt,
    baseline: baseline.points[i]?.stageFt,
  }));

  const reached = scenario.yearsToTarget !== null;

  return (
    <div className="section">
      <h2>Scenario explorer — what would refill the lake?</h2>

      <Slider label="Ag buyback / leasing → lake" value={agBuyback} setValue={setAgBuyback}
        min={0} max={600_000} step={25_000} unit="AF/yr"
        display={(v) => `${fmt(v / 1000)}K AF/yr`} />
      <Slider label="M&I conservation → lake" value={miConservation} setValue={setMiConservation}
        min={0} max={250_000} step={10_000} unit="AF/yr"
        display={(v) => `${fmt(v / 1000)}K AF/yr`} />
      <Slider label="Cloud seeding deployment" value={seedPct} setValue={setSeedPct}
        min={0} max={100} step={5} unit="%"
        display={(v) => `${v}% (~${fmt((v / 100) * seedingFullDeployAF)} AF/yr)`} />
      <Slider label="River-inflow climate trend" value={climate} setValue={setClimate}
        min={-10} max={10} step={1} unit="%/decade"
        display={(v) => `${v > 0 ? "+" : ""}${v}%/decade`} />

      <div className="scen-chart">
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={chartData} margin={{ top: 8, right: 6, bottom: 0, left: -14 }}>
            <XAxis dataKey="year" tick={{ fontSize: 9 }} tickCount={6} />
            <YAxis tick={{ fontSize: 9 }} width={44}
              domain={[(dataMin: number) => Math.min(4182, Math.floor(dataMin)), (dataMax: number) => Math.max(4204, Math.ceil(dataMax))]}
              tickFormatter={(v: number) => fmt(v)} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #dce4dd" }}
              labelStyle={{ color: "#5e7064" }}
              formatter={(v: any, name: any) => [
                `${fmt(v, 2)} ft`, name === "scenario" ? "your scenario" : "do nothing",
              ]}
            />
            <ReferenceLine y={TARGET_STAGE} stroke="#0f7b54" strokeDasharray="4 3"
              label={{ value: "healthy 4,198", fontSize: 9, fill: "#0f7b54", position: "insideTopRight" }} />
            <Line type="monotone" dataKey="baseline" stroke="#b9c4bb" strokeWidth={1.4}
              strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="scenario" stroke="#1f6f8b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="statgrid">
        <div className="stat">
          <div className="k">Reaches 4,198 ft</div>
          <div className="v">{reached ? `${scenario.yearsToTarget} ` : "not in "}<small>{reached ? "yrs" : `${HORIZON} yrs`}</small></div>
        </div>
        <div className="stat">
          <div className="k">Long-run equilibrium</div>
          <div className="v">{fmt(scenario.equilibriumStageFt, 1)} <small>ft</small></div>
        </div>
        <div className="stat">
          <div className="k">Added inflow</div>
          <div className="v">{fmt(addedAF / 1000)}<small>K AF/yr</small></div>
        </div>
        <div className="stat">
          <div className="k">Salinity in {HORIZON} yrs</div>
          <div className="v">{fmt(scenario.finalSalinity)} <small>g/L</small></div>
        </div>
      </div>

      <div className="seed-row">
        <span>Seeding&apos;s share of this trajectory</span>
        <b>{seedPct === 0 ? "—" : `${seedingDeltaFt >= 0.005 ? "+" : ""}${fmt(seedingDeltaFt, 2)} ft`}</b>
      </div>

      <div className="note">
        Annual whole-lake mass balance on the USGS stage–area–volume relationship: evaporation
        scales with surface area as the lake grows or shrinks (with a salinity correction), so
        added inflow buys less stage the higher you go. Baseline river inflow is calibrated so a
        sustained +800K AF/yr — the Strike Team prescription — equilibrates at ~4,198 ft; doing
        nothing settles near 4,189 ft. Drag the seeding slider to 100%: it moves the {HORIZON}-yr
        stage by ~{fmt(Math.abs(seedingDeltaFt) || 0.02, 2)} ft — the lake gets refilled by water
        policy, not weather modification.
      </div>
    </div>
  );
}
