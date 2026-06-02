"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Tooltip, LayersControl } from "react-leaflet";
import { STATIONS, WATERSHEDS, Station } from "@/lib/data";
import SeriesChart from "./SeriesChart";

const COLORS: Record<string, string> = {
  inflow_major: "#1f6f8b",
  inflow_minor: "#6fb0c4",
  lake_stage: "#0f7b54",
};

// rough watershed polygon shells (illustrative outlines for the three basins, not survey-grade)
const BASIN_POLYS: Record<string, [number, number][]> = {
  Bear: [[42.3,-111.3],[42.4,-112.2],[41.7,-112.4],[41.4,-111.9],[41.6,-111.2],[42.0,-110.9]],
  Weber: [[41.4,-111.2],[41.35,-111.9],[40.95,-111.85],[40.85,-111.3],[41.1,-111.0]],
  Jordan: [[40.85,-111.7],[40.8,-112.1],[40.2,-112.0],[40.0,-111.6],[40.4,-111.5],[40.7,-111.55]],
};
const BASIN_COLOR: Record<string,string> = { Bear:"#1f6f8b", Weber:"#b88a1e", Jordan:"#0f7b54" };

function fmt(n: number | undefined, d = 0) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

export default function GSLMap({ data }: { data: any }) {
  const sites = data?.sites ?? {};

  return (
    <MapContainer center={[41.1, -112.4]} zoom={8} scrollWheelZoom={true} className="leaflet-container">
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Topographic">
          <TileLayer
            attribution='Tiles &copy; Esri — USGS, NOAA'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Terrain (OpenTopoMap)">
          <TileLayer
            attribution='&copy; OpenTopoMap (CC-BY-SA)'
            url="https://a.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Watershed catchments">
          <>
            {WATERSHEDS.map((w) => (
              <Polygon
                key={w.short}
                positions={BASIN_POLYS[w.short]}
                pathOptions={{ color: BASIN_COLOR[w.short], weight: 1.5, fillOpacity: 0.07, dashArray: "5 5" }}
              >
                <Tooltip sticky>
                  <b>{w.name}</b><br />
                  {w.inflowSharePct}% of river inflow · {fmt(w.areaSqMi)} sq mi<br />
                  <span style={{ color: "#5e7064" }}>{w.headwaters}</span>
                </Tooltip>
              </Polygon>
            ))}
          </>
        </LayersControl.Overlay>
      </LayersControl>

      {STATIONS.map((s: Station) => {
        const live = sites[s.id]?.params ?? {};
        const flow = live["00060"]?.value;
        const elev = live["62614"]?.value;
        const gh = live["00065"]?.value;
        const isLake = s.type === "lake_stage";
        const r = s.type === "inflow_major" ? 9 : s.type === "lake_stage" ? 11 : 6;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={r}
            pathOptions={{ color: "#fff", weight: 1.5, fillColor: COLORS[s.type], fillOpacity: 0.92 }}
          >
            <Popup>
              <div className="popup">
                <b>{s.name}</b>
                <div className="tag" style={{ background: COLORS[s.type] + "22", color: COLORS[s.type] }}>
                  {isLake ? "Lake stage" : s.type === "inflow_major" ? "Major inflow" : "Minor inflow"}
                </div>
                {isLake ? (
                  <div className="row">Elevation: <b>{fmt(elev, 2)} ft</b></div>
                ) : (
                  <>
                    <div className="row">Discharge: <b>{fmt(flow, 1)} cfs</b></div>
                    {gh !== undefined && <div className="row">Gage height: {fmt(gh, 2)} ft</div>}
                  </>
                )}
                <div className="row" style={{ color: "#5e7064" }}>
                  {live[isLake ? "62614" : "00060"]?.dateTime
                    ? new Date(live[isLake ? "62614" : "00060"].dateTime).toLocaleString()
                    : "no recent value"}
                </div>
                <div className="small">{s.note}{s.recordSince ? ` · record since ${s.recordSince}` : ""}</div>
                <div className="chartbox">
                  <SeriesChart site={s.id} param={isLake ? "62614" : "00060"} color={COLORS[s.type]} label={isLake ? "ft" : "cfs"} />
                </div>
                <div className="small">USGS site {s.id}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      <div className="legend">
        <div className="li"><span className="sw" style={{ background: COLORS.lake_stage }} /> Lake-stage gauge</div>
        <div className="li"><span className="sw" style={{ background: COLORS.inflow_major }} /> Major inflow</div>
        <div className="li"><span className="sw" style={{ background: COLORS.inflow_minor }} /> Minor inflow</div>
        <div className="li"><span className="sq" style={{ border: "1.5px dashed #1f6f8b", background: "transparent" }} /> Watershed</div>
      </div>
    </MapContainer>
  );
}
