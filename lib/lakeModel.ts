// GSL lake-stage scenario model — annual whole-lake mass balance with hypsometric
// (area↔stage) feedback and a first-order salinity→evaporation correction.
//
// All stages are in the USGS gauge datum (NGVD29, what Saltair 10010000 reports).
//
// Hypsometry: piecewise-linear AREA anchors from published sources, VOLUME derived
// by trapezoidal integration of area over stage (so dV = A·dh is internally exact),
// pinned to V(4191.35) = 8.2 M AF. Cross-checks against published values:
//   integrate → V(4198) ≈ 12.9 M AF (cited ~13.2 M);  V(4198)−V(4191.35) ≈ 4.7 M AF
//   (matches the ~5 M AF "one-time refill deficit" already used in LAKE_FACTS).
// Sources: USGS topobathymetric EAV tables (doi 10.5066/P9DGG75W); USGS/UT DWR
// (1,276 mi² & 13.2 M AF at 4,198; ~1,700 mi² & ~16 M AF at 4,200); UT DWR GSLEP
// (950 mi² at the 4,191.35 historic low; 3,300 mi² at the 4,211.6 high).

export type AnchorPoint = { stageFt: number; areaAcres: number };

const SQMI_TO_ACRES = 640;

// Whole lake (both arms + bays), NGVD29.
export const AREA_ANCHORS: AnchorPoint[] = [
  { stageFt: 4180.0,  areaAcres: 700 * SQMI_TO_ACRES },   // extrapolated low tail
  { stageFt: 4185.0,  areaAcres: 820 * SQMI_TO_ACRES },   // interpolated
  { stageFt: 4188.5,  areaAcres: 880 * SQMI_TO_ACRES },   // ~2022 record-low extent
  { stageFt: 4191.35, areaAcres: 950 * SQMI_TO_ACRES },   // GSLEP: 1963 historic-low extent
  { stageFt: 4195.0,  areaAcres: 1100 * SQMI_TO_ACRES },  // interpolated
  { stageFt: 4198.0,  areaAcres: 1276 * SQMI_TO_ACRES },  // 817K ac at healthy minimum
  { stageFt: 4200.0,  areaAcres: 1700 * SQMI_TO_ACRES },  // historical-average extent (flat bays flood)
  { stageFt: 4205.0,  areaAcres: 2300 * SQMI_TO_ACRES },  // interpolated
  { stageFt: 4211.6,  areaAcres: 3300 * SQMI_TO_ACRES },  // 1986–87 record-high extent
];

const V_ANCHOR_STAGE = 4191.35;
const V_ANCHOR_AF = 8_200_000; // M AF at the 1963-low stage; consistent with ~5 M AF refill-to-4198 deficit

export function areaAtStage(stageFt: number): number {
  const a = AREA_ANCHORS;
  if (stageFt <= a[0].stageFt) return a[0].areaAcres;
  if (stageFt >= a[a.length - 1].stageFt) return a[a.length - 1].areaAcres;
  for (let i = 1; i < a.length; i++) {
    if (stageFt <= a[i].stageFt) {
      const t = (stageFt - a[i - 1].stageFt) / (a[i].stageFt - a[i - 1].stageFt);
      return a[i - 1].areaAcres + t * (a[i].areaAcres - a[i - 1].areaAcres);
    }
  }
  return a[a.length - 1].areaAcres;
}

// Volume by trapezoidal integration of the area curve, pinned at the anchor.
function volumeRelative(stageFt: number): number {
  // signed ∫ area dh from V_ANCHOR_STAGE to stageFt, in AF (acres × ft)
  const lo = Math.min(stageFt, V_ANCHOR_STAGE);
  const hi = Math.max(stageFt, V_ANCHOR_STAGE);
  const STEP = 0.05;
  let v = 0;
  for (let h = lo; h < hi - 1e-9; ) {
    const h2 = Math.min(h + STEP, hi);
    v += 0.5 * (areaAtStage(h) + areaAtStage(h2)) * (h2 - h);
    h = h2;
  }
  return stageFt >= V_ANCHOR_STAGE ? v : -v;
}

export function volumeAtStage(stageFt: number): number {
  return Math.max(0, V_ANCHOR_AF + volumeRelative(stageFt));
}

export function stageAtVolume(volumeAF: number): number {
  // bisection over a generous stage window
  let lo = 4175, hi = 4215;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (volumeAtStage(mid) < volumeAF) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Water-balance constants (annual, whole lake)
// ---------------------------------------------------------------------------
export const BALANCE = {
  // Gross freshwater-equivalent lake evaporation, ft/yr. Chosen so the historical
  // equilibrium closes: at 4,200 ft (1.09 M ac), rivers 2.9 M + GW + on-lake precip
  // balances gross evap of ~4 ft/yr after the salinity correction.
  grossEvapFt: 4.0,
  // Direct precipitation on the lake surface, ft/yr (~12 in).
  onLakePrecipFt: 1.0,
  // Groundwater inflow, AF/yr (commonly cited ~75K).
  groundwaterAF: 75_000,
  // Baseline river inflow, AF/yr — the "current trajectory" depleted average.
  // CALIBRATED (not measured) so that baseline + the Strike Team's +800K AF/yr
  // sustained-inflow prescription reaches equilibrium at ~4,198 ft. Under baseline
  // alone the lake drifts down to an equilibrium near ~4,189 ft.
  baselineRiverAF: 1_360_000,
  // Effective dissolved-salt load, grams. CALIBRATED so whole-lake salinity ≈ 160 g/L
  // at the current ~8.2 M AF volume (south-arm brine has run ~120–180 g/L recently).
  saltGrams: 1.62e15,
  // Salinity → evaporation suppression: f = clamp(1 − k·S[g/L]), saturated brine
  // evaporates ~20–30% slower than freshwater.
  salinityEvapCoeff: 0.00065,
  salinityEvapFloor: 0.70,
};

const LITERS_PER_AF = 1.2335e6;

export function salinityGL(volumeAF: number): number {
  return BALANCE.saltGrams / (Math.max(volumeAF, 1) * LITERS_PER_AF);
}

function evapFactor(sGL: number): number {
  return Math.max(BALANCE.salinityEvapFloor, 1 - BALANCE.salinityEvapCoeff * sGL);
}

// ---------------------------------------------------------------------------
// Scenario simulation
// ---------------------------------------------------------------------------
export type ScenarioParams = {
  startStageFt: number;       // live south-arm stage (NGVD29)
  years: number;              // horizon
  agBuybackAF: number;        // ag water leased/shepherded to the lake, AF/yr
  miConservationAF: number;   // municipal & industrial savings reaching the lake, AF/yr
  seedingFraction: number;    // 0–1 of full deployment
  seedingFullDeployAF: number;// to-lake AF/yr at full deployment (model p50)
  climatePctPerDecade: number;// river-inflow trend, %/decade (e.g. -5 = drying)
};

export type YearPoint = {
  year: number;        // calendar year
  stageFt: number;
  volumeAF: number;
  areaAcres: number;
  salinity: number;    // g/L
  inflowAF: number;    // total inflow that year
  evapAF: number;      // net evaporative loss that year (evap − on-lake precip)
};

export type ScenarioResult = {
  points: YearPoint[];
  yearsToTarget: number | null;  // years until stage ≥ 4198 (null = not within horizon)
  finalStageFt: number;
  finalSalinity: number;
  equilibriumStageFt: number;    // long-run stage if the scenario is held forever
};

export const TARGET_STAGE = 4198;

function netAnnualAF(volumeAF: number, riverAF: number): number {
  const stage = stageAtVolume(volumeAF);
  const area = areaAtStage(stage);
  const s = salinityGL(volumeAF);
  const evap = BALANCE.grossEvapFt * evapFactor(s) * area;
  const precip = BALANCE.onLakePrecipFt * area;
  return riverAF + BALANCE.groundwaterAF + precip - evap;
}

export function simulateScenario(p: ScenarioParams, startYear = new Date().getFullYear()): ScenarioResult {
  const interventionsAF =
    p.agBuybackAF + p.miConservationAF + p.seedingFraction * p.seedingFullDeployAF;

  let v = volumeAtStage(p.startStageFt);
  const points: YearPoint[] = [];
  let yearsToTarget: number | null = null;
  const SUBSTEPS = 12; // sub-annual steps keep the area feedback stable

  for (let y = 0; y <= p.years; y++) {
    const stage = stageAtVolume(v);
    const area = areaAtStage(stage);
    const s = salinityGL(v);
    const climateScale = Math.pow(1 + p.climatePctPerDecade / 100, y / 10);
    const river = BALANCE.baselineRiverAF * climateScale + interventionsAF;
    const evapNet =
      (BALANCE.grossEvapFt * evapFactor(s) - BALANCE.onLakePrecipFt) * area;

    points.push({
      year: startYear + y,
      stageFt: Math.round(stage * 100) / 100,
      volumeAF: Math.round(v),
      areaAcres: Math.round(area),
      salinity: Math.round(s),
      inflowAF: Math.round(river + BALANCE.groundwaterAF),
      evapAF: Math.round(evapNet),
    });

    if (yearsToTarget === null && stage >= TARGET_STAGE) yearsToTarget = y;

    for (let m = 0; m < SUBSTEPS; m++) {
      v = Math.max(500_000, v + netAnnualAF(v, river) / SUBSTEPS);
    }
  }

  // Long-run equilibrium for the end-state inflow (climate trend held at final value).
  const finalClimate = Math.pow(1 + p.climatePctPerDecade / 100, p.years / 10);
  const riverEq = BALANCE.baselineRiverAF * finalClimate + interventionsAF;
  let vEq = v;
  for (let i = 0; i < 600; i++) vEq = Math.max(500_000, vEq + netAnnualAF(vEq, riverEq) / 4);

  return {
    points,
    yearsToTarget,
    finalStageFt: points[points.length - 1].stageFt,
    finalSalinity: points[points.length - 1].salinity,
    equilibriumStageFt: Math.round(stageAtVolume(vEq) * 100) / 100,
  };
}
