// All real USGS site IDs from the GSL Hydro Mapper + watershed catchment properties.
// Coordinates are approximate gauge / centroid locations for mapping.

export type Station = {
  id: string;            // USGS site number
  name: string;
  short: string;
  type: "inflow_major" | "inflow_minor" | "lake_stage";
  param: "00060" | "00065" | "62614"; // discharge cfs | gage height ft | lake elev ft (NAVD/NGVD)
  lat: number;
  lng: number;
  note: string;
  recordSince?: string;
};

// Major inflows, minor inflows, and the two lake-stage gauges (Saltair south arm, Saline north arm).
export const STATIONS: Station[] = [
  { id: "10126000", name: "Bear River near Corinne, UT", short: "Bear R.", type: "inflow_major", param: "00060",
    lat: 41.5519, lng: -112.0666, note: "Largest single inflow (~58–64% of river inflow). ~8 mi upstream of GSL.", recordSince: "1949" },
  { id: "10141000", name: "Weber River near Plain City, UT", short: "Weber R.", type: "inflow_major", param: "00060",
    lat: 41.2933, lng: -112.0850, note: "~15% of river inflow. ~4 mi upstream of GSL.", recordSince: "1907" },
  { id: "10172630", name: "Goggin Drain near Magna, UT", short: "Goggin Drain", type: "inflow_major", param: "00060",
    lat: 40.7647, lng: -112.1894, note: "Lower Jordan system drainage. ~1 mi upstream of GSL.", recordSince: "1963" },
  { id: "410401112134801", name: "Farmington Bay Outflow at Causeway Bridge", short: "Farmington Bay", type: "inflow_major", param: "00060",
    lat: 41.0672, lng: -112.2297, note: "Flow into GSL near Antelope I. Negative = wind-driven reversal.", recordSince: "2003" },

  { id: "10172600", name: "Jordan River at Cudahy Ln", short: "Jordan R.", type: "inflow_minor", param: "00060",
    lat: 40.8208, lng: -111.9266, note: "Jordan River, Farmington Bay minor inflow (~20–22% of river inflow basin)." },
  { id: "10141450", name: "Kays Creek", short: "Kays Ck", type: "inflow_minor", param: "00060",
    lat: 41.1289, lng: -112.0500, note: "Farmington Bay minor inflow." },
  { id: "10142000", name: "Farmington Creek Abv Diversion", short: "Farmington Ck", type: "inflow_minor", param: "00060",
    lat: 40.9897, lng: -111.8819, note: "Farmington Bay minor inflow." },
  { id: "10141100", name: "South Fork Weber R nr Hooper", short: "S.F. Weber", type: "inflow_minor", param: "00060",
    lat: 41.1564, lng: -112.1397, note: "South Arm minor inflow." },
  { id: "10141200", name: "North Fork Weber R nr Hooper", short: "N.F. Weber", type: "inflow_minor", param: "00060",
    lat: 41.1717, lng: -112.1583, note: "South Arm minor inflow." },

  { id: "10010000", name: "Great Salt Lake at Saltair Boat Harbor", short: "Saltair (South Arm)", type: "lake_stage", param: "62614",
    lat: 40.7644, lng: -112.2108, note: "South-arm elevation. Record back to 1847. Stage→volume/area study applies here.", recordSince: "1847" },
  { id: "10010100", name: "Great Salt Lake near Saline, UT", short: "Saline (North Arm)", type: "lake_stage", param: "62614",
    lat: 41.3947, lng: -112.6889, note: "North-arm elevation. Record back to 1966.", recordSince: "1966" },
];

// Watershed / catchment properties for the three contributing basins (rendered as overlay markers + table).
export type Watershed = {
  name: string;
  short: string;
  inflowSharePct: number;     // share of river inflow to GSL
  areaSqMi: number;           // drainage area
  lat: number; lng: number;   // label anchor
  headwaters: string;
  notes: string;
};

export const WATERSHEDS: Watershed[] = [
  { name: "Bear River Watershed", short: "Bear", inflowSharePct: 58, areaSqMi: 7500, lat: 41.85, lng: -111.95,
    headwaters: "Uinta Mountains (loops through WY & ID, ~500 mi)",
    notes: "Least developed; ~90%+ of withdrawals are agricultural. Largest contributor." },
  { name: "Jordan River Watershed", short: "Jordan", inflowSharePct: 22, areaSqMi: 3800, lat: 40.55, lng: -111.90,
    headwaters: "Utah Lake outlet / Wasatch Front",
    notes: "Most populous; municipal demand growing fastest." },
  { name: "Weber River Watershed", short: "Weber", inflowSharePct: 15, areaSqMi: 2500, lat: 41.20, lng: -111.55,
    headwaters: "Uinta & Wasatch ranges",
    notes: "Suburban sprawl (Davis/Weber counties); smallest of the three." },
];

// GSL totals & targets (sourced)
export const LAKE_FACTS = {
  healthyElevFt: 4198,        // bottom of healthy range (UT DNR)
  healthyRangeTopFt: 4205,
  recentSouthArmFt: 4191.1,   // 2025 water-year close (USU Strike Team)
  catchmentSqMi: 21500,
  avgAnnualRiverInflowAF: 2900000,   // historical avg (USGS)
  directPrecipSharePct: 30,
  structuralShortfallAF: 800000,     // sustained inflow to reach healthy by ~2055 (USU)
  oneTimeDeficitAF: 5000000,         // ~to refill to healthy (Grow the Flow / Abbott)
};

// Stage -> surface area relationship for the SOUTH ARM (approx, for level-change → exposed-bed math).
// Shallow flat lake: ~ area grows strongly with stage. Coarse linear approx near operating range.
// At ~4192 ft ≈ 950 sq mi; near 4198 ft ≈ ~1,050+ sq mi. Used only for illustrative deltas.
export const HYPSOMETRY = {
  refStageFt: 4192,
  refAreaSqMi: 950,
  dAreaPerFtSqMi: 28,   // ~sq mi of surface area gained per foot of stage near operating range (coarse)
};

// Seeding-impact context (from the bottom-up analysis): full-deployment generation, delivery, lake effect.
export const SEEDING_CONTEXT = {
  perEventValidatedAF: 5.35,
  fullDeployGenLowAF: 1000,
  fullDeployGenHighAF: 8000,
  deliveryFactorToLake: 0.25,      // runoff × (1 − consumptive); ablation pre-accounted
  toLakeLowAF: 250,
  toLakeHighAF: 2000,
};
