"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Tooltip, LayersControl, WMSTileLayer, Pane, ZoomControl, LayerGroup } from "react-leaflet";
import { STATIONS, WATERSHEDS, Station } from "@/lib/data";
import SeriesChart from "./SeriesChart";

const COLORS: Record<string, string> = {
  inflow_major: "#1c7ed6",
  inflow_minor: "#74c0e8",
  lake_stage: "#2f9e6e",
};

const BASIN_POLYS: Record<string, [number, number][]> = {
  Bear: [[42.3,-111.3],[42.4,-112.2],[41.7,-112.4],[41.4,-111.9],[41.6,-111.2],[42.0,-110.9]],
  Weber: [[41.4,-111.2],[41.35,-111.9],[40.95,-111.85],[40.85,-111.3],[41.1,-111.0]],
  Jordan: [[40.85,-111.7],[40.8,-112.1],[40.2,-112.0],[40.0,-111.6],[40.4,-111.5],[40.7,-111.55]],
};
const BASIN_COLOR: Record<string,string> = { Bear:"#1c7ed6", Weber:"#c08a2e", Jordan:"#2f9e6e" };

const MODEL_COLOR = "#8a3ffc";   // GSL-SWY+ model layer accent
const OUTLET_LATLON: [number, number] = [41.62, -112.10];   // Bear River near Corinne (outlet gauge)

function fmt(n: number | undefined, d = 0) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

/* ---- color ramps: each takes t in [0,1] and returns an rgb() string ---- */
type Stop = [number, [number, number, number]];
function rampFn(stops: Stop[]) {
  return (t: number) => {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < stops.length; i++) {
      const [t1, c1] = stops[i];
      if (t <= t1) {
        const [t0, c0] = stops[i - 1];
        const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
        const c = [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * f));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
      }
    }
    const last = stops[stops.length - 1][1];
    return `rgb(${last[0]},${last[1]},${last[2]})`;
  };
}
// terrain: green lowlands -> tan -> brown -> white peaks
const RAMP_ELEV = rampFn([
  [0.0, [120, 158, 110]], [0.35, [196, 190, 130]], [0.6, [170, 132, 86]],
  [0.82, [120, 92, 70]], [1.0, [244, 246, 248]],
]);
// snow zone: pale -> blue
const RAMP_SNOW = rampFn([[0.0, [231, 240, 246]], [0.5, [126, 178, 214]], [1.0, [25, 92, 168]]]);
// runoff efficiency: pale sand -> teal -> deep green
const RAMP_RUNOFF = rampFn([[0.0, [238, 234, 214]], [0.5, [110, 186, 168]], [1.0, [15, 110, 84]]]);
// hotspots (matches the radar gradient): cyan -> green -> yellow -> orange -> red
const RAMP_HOT = rampFn([
  [0.0, [34, 193, 220]], [0.3, [67, 209, 122]], [0.55, [232, 210, 74]],
  [0.8, [224, 97, 46]], [1.0, [192, 41, 79]],
]);

function ringToLatLng(coords: number[][]): [number, number][] {
  return coords.map(([lon, lat]) => [lat, lon]);
}

/** A choropleth overlay: colors every grid cell by one property via a ramp. */
function Choro({
  features, accessor, ramp, label, unit, decimals = 2, normLo, normHi,
}: {
  features: any[];
  accessor: (p: any) => number;
  ramp: (t: number) => string;
  label: string;
  unit: string;
  decimals?: number;
  normLo?: number;
  normHi?: number;
}) {
  const vals = features.map((f) => accessor(f.properties));
  const lo = normLo ?? Math.min(...vals);
  const hi = normHi ?? Math.max(...vals);
  return (
    <LayerGroup>
      {features.map((f, i) => {
        const v = accessor(f.properties);
        const t = hi > lo ? (v - lo) / (hi - lo) : 0;
        const ring = ringToLatLng(f.geometry.coordinates[0]);
        return (
          <Polygon
            key={i}
            positions={ring}
            pane="choro"
            pathOptions={{ stroke: true, color: "#ffffff", weight: 0.4, opacity: 0.35,
                           fillColor: ramp(t), fillOpacity: 0.62 }}
          >
            <Tooltip sticky className="ws-tip">
              <b>{label}: {fmt(v, decimals)}{unit}</b><br />
              <span style={{ opacity: .7 }}>
                {f.properties.elevation_m} m · snow {fmt(f.properties.snow_fraction, 2)} ·
                runoff {fmt(f.properties.runoff_ratio, 2)} · →lake {fmt(f.properties.af_to_lake_per_yr, 1)} AF/yr
              </span>
            </Tooltip>
          </Polygon>
        );
      })}
    </LayerGroup>
  );
}

export default function GSLMap({ data, model, grid }: { data: any; model?: any; grid?: any }) {
  const sites = data?.sites ?? {};
  const cal = model?.calibration;
  const seedLake = model?.seeding_uncertainty?.seeding_delta_af_to_lake;
  const seedStage = model?.seeding_uncertainty?.seeding_delta_stage_inches_per_year;
  const lakeCtx = model?.lake_context;
  const cells: any[] = grid?.features ?? [];
  const gmeta = grid?._meta;

  return (
    <MapContainer
      center={[41.6, -111.9]}
      zoom={8}
      scrollWheelZoom={true}
      zoomControl={false}
      className="leaflet-container"
    >
      <Pane name="choro" style={{ zIndex: 320 }} />
      <Pane name="water" style={{ zIndex: 340 }} />
      <Pane name="radar" style={{ zIndex: 350 }} />
      <Pane name="datamarkers" style={{ zIndex: 600 }} />
      <ZoomControl position="bottomleft" />

      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Terrain (soft)">
          <LayerGroup>
            <TileLayer
              attribution='&copy; OpenStreetMap, &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
              opacity={0.35}
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            />
          </LayerGroup>
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Topographic (USGS)">
          <TileLayer
            attribution='USGS The National Map'
            url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        {/* ---- MODEL INPUT / OUTPUT GIS LAYERS (Bear pilot) ---- */}
        {cells.length > 0 && (
          <>
            <LayersControl.Overlay checked name="① Seeding → lake hotspots">
              <Choro features={cells} accessor={(p) => p.eff_index} ramp={RAMP_HOT}
                     label="Hotspot index" unit="" decimals={2} normLo={0} normHi={1} />
            </LayersControl.Overlay>

            <LayersControl.Overlay name="② Seedable snow zone">
              <Choro features={cells} accessor={(p) => p.snow_fraction} ramp={RAMP_SNOW}
                     label="Cool-season snow" unit="" decimals={2} />
            </LayersControl.Overlay>

            <LayersControl.Overlay name="③ Runoff efficiency">
              <Choro features={cells} accessor={(p) => p.runoff_ratio} ramp={RAMP_RUNOFF}
                     label="Runoff ratio" unit="" decimals={3} />
            </LayersControl.Overlay>

            <LayersControl.Overlay name="④ Elevation / terrain (DEM)">
              <Choro features={cells} accessor={(p) => p.elevation_m} ramp={RAMP_ELEV}
                     label="Elevation" unit=" m" decimals={0} />
            </LayersControl.Overlay>
          </>
        )}

        <LayersControl.Overlay checked name="Water — lakes & rivers (USGS NHD)">
          <TileLayer
            url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}"
            pane="water"
            opacity={0.9}
            attribution="Hydrography: USGS National Hydrography Dataset (The National Map)"
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="⑤ Land cover (NLCD 2021)">
          <WMSTileLayer
            url="https://www.mrlc.gov/geoserver/mrlc_display/wms"
            params={{ layers: "NLCD_2021_Land_Cover_L48", format: "image/png", transparent: true } as any}
            opacity={0.7}
            pane="choro"
            attribution="NLCD 2021 — MRLC / USGS"
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Radar — moisture / cloud potential (live NEXRAD)">
          <WMSTileLayer
            url="https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi"
            params={{ layers: "nexrad-n0q-900913", format: "image/png", transparent: true } as any}
            opacity={0.6}
            pane="radar"
            attribution="NEXRAD base reflectivity — Iowa Environmental Mesonet"
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Watershed catchments">
          <LayerGroup>
            {WATERSHEDS.map((w) => (
              <Polygon
                key={w.short}
                positions={BASIN_POLYS[w.short]}
                pathOptions={{ color: BASIN_COLOR[w.short], weight: 2, fillOpacity: 0.0, opacity: 0.6, dashArray: "5 5" }}
              >
                <Tooltip sticky className="ws-tip">
                  <b>{w.name}</b><br />
                  {w.inflowSharePct}% of river inflow · {fmt(w.areaSqMi)} sq mi<br />
                  <span style={{ opacity: .7 }}>{w.headwaters}</span>
                </Tooltip>
              </Polygon>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {model && (
          <LayersControl.Overlay checked name="GSL-SWY+ model (Bear pilot)">
            <CircleMarker
              center={OUTLET_LATLON}
              radius={11}
              pane="datamarkers"
              pathOptions={{
                color: "#ffffff", weight: 2,
                fillColor: MODEL_COLOR, fillOpacity: 1,
                className: "mk mk-model",
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <b>GSL-SWY+ model</b> · Bear River pilot
              </Tooltip>
              <Popup className="gsl-popup">
                <div className="popup">
                  <div className="pop-head">
                    <b>{model?.meta?.model ?? "GSL-SWY+"} — {model?.meta?.pilot ?? "Bear River"}</b>
                    <span className="tag" style={{ background: MODEL_COLOR + "1f", color: MODEL_COLOR }}>
                      model
                    </span>
                  </div>
                  <div className="big">{fmt(cal?.modeled_annual_af)} <span>AF/yr modeled yield</span></div>
                  <div className="row">observed {fmt(cal?.observed_annual_af)} AF/yr · NSE {fmt(cal?.nash_sutcliffe, 2)} · bias {fmt(cal?.percent_bias, 1)}%</div>
                  <div className="row dim">Snow-aware monthly water balance, calibrated to gauge {model?.meta?.outlet_gauge ?? "10126000"}.</div>
                  <hr style={{ border: "none", borderTop: "1px solid #0001", margin: "8px 0" }} />
                  <div className="row"><b>Cloud-seeding effect</b> (Monte Carlo, n={model?.seeding_uncertainty?.n_draws})</div>
                  <div className="row">→ to lake: <b>{fmt(seedLake?.p50)}</b> AF/yr <span className="dim">({fmt(seedLake?.p05)}–{fmt(seedLake?.p95)})</span></div>
                  <div className="row">→ stage: <b>{fmt(seedStage?.p50, 3)}</b> in/yr <span className="dim">({fmt(seedStage?.p05, 3)}–{fmt(seedStage?.p95, 3)})</span></div>
                  <div className="row">≈ {fmt(lakeCtx?.years_of_seeding_to_offset_structural_shortfall)} yrs to offset the structural shortfall</div>
                  <div className="small dim" style={{ marginTop: 6 }}>{lakeCtx?.honesty_note}</div>
                </div>
              </Popup>
            </CircleMarker>
          </LayersControl.Overlay>
        )}
      </LayersControl>

      {STATIONS.map((s: Station) => {
        const live = sites[s.id]?.params ?? {};
        const flow = live["00060"]?.value;
        const elev = live["62614"]?.value;
        const gh = live["00065"]?.value;
        const isLake = s.type === "lake_stage";
        const r = s.type === "inflow_major" ? 8 : s.type === "lake_stage" ? 10 : 5.5;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={r}
            pane="datamarkers"
            pathOptions={{
              color: "#ffffff", weight: 2,
              fillColor: COLORS[s.type], fillOpacity: 1,
              className: `mk mk-${s.type}`,
            }}
          >
            <Popup className="gsl-popup">
              <div className="popup">
                <div className="pop-head">
                  <b>{s.name}</b>
                  <span className="tag" style={{ background: COLORS[s.type] + "1f", color: COLORS[s.type] }}>
                    {isLake ? "lake stage" : s.type === "inflow_major" ? "major inflow" : "minor inflow"}
                  </span>
                </div>
                {isLake ? (
                  <div className="big">{fmt(elev, 2)} <span>ft elevation</span></div>
                ) : (
                  <div className="big">{fmt(flow, 1)} <span>cfs</span></div>
                )}
                {!isLake && gh !== undefined && <div className="row">gage height {fmt(gh, 2)} ft</div>}
                <div className="row dim">
                  {live[isLake ? "62614" : "00060"]?.dateTime
                    ? new Date(live[isLake ? "62614" : "00060"].dateTime).toLocaleString()
                    : "no recent value"}
                </div>
                <div className="small">{s.note}{s.recordSince ? ` · record since ${s.recordSince}` : ""}</div>
                <div className="chartbox">
                  <SeriesChart site={s.id} param={isLake ? "62614" : "00060"} color={COLORS[s.type]} label={isLake ? "ft" : "cfs"} />
                </div>
                <div className="small dim">USGS site {s.id}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      <div className="map-badge">
        <span className="mb-dot" />
        Great Salt Lake Basin · Bear River model layers
      </div>

      <div className="legend">
        <div className="lg-title">Active layer</div>
        <div className="li radar-li"><span className="grad" /> Hotspot index (low → high)</div>
        {gmeta && (
          <div className="li" style={{ fontSize: 10.5, opacity: .7, display: "block", marginTop: 4 }}>
            {gmeta.n_cells} cells · {gmeta.elev_min_m}–{gmeta.elev_max_m} m · Σ {fmt(gmeta.af_to_lake_total, 0)} AF/yr → lake
          </div>
        )}
        <div className="lg-title" style={{ marginTop: 10 }}>Reference</div>
        <div className="li"><span className="sw" style={{ background: "#3a7bd5" }} /> Water — lakes & rivers</div>
        <div className="li"><span className="sw" style={{ background: COLORS.lake_stage }} /> Lake-stage gauge</div>
        <div className="li"><span className="sw" style={{ background: COLORS.inflow_major }} /> Major inflow</div>
        <div className="li"><span className="sw" style={{ background: COLORS.inflow_minor }} /> Minor inflow</div>
        {model && <div className="li"><span className="sw" style={{ background: MODEL_COLOR }} /> GSL-SWY+ model</div>}
      </div>
    </MapContainer>
  );
}
