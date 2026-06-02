"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Tooltip, LayersControl, WMSTileLayer, Pane, ZoomControl } from "react-leaflet";
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

function fmt(n: number | undefined, d = 0) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

export default function GSLMap({ data }: { data: any }) {
  const sites = data?.sites ?? {};

  return (
    <MapContainer
      center={[41.0, -112.3]}
      zoom={8}
      scrollWheelZoom={true}
      zoomControl={false}
      className="leaflet-container"
    >
      <Pane name="radar" style={{ zIndex: 350 }} />
      <Pane name="datamarkers" style={{ zIndex: 600 }} />
      <ZoomControl position="bottomleft" />

      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Terrain (soft)">
          <>
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
          </>
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
          <>
            {WATERSHEDS.map((w) => (
              <Polygon
                key={w.short}
                positions={BASIN_POLYS[w.short]}
                pathOptions={{ color: BASIN_COLOR[w.short], weight: 2, fillOpacity: 0.05, opacity: 0.7 }}
              >
                <Tooltip sticky className="ws-tip">
                  <b>{w.name}</b><br />
                  {w.inflowSharePct}% of river inflow · {fmt(w.areaSqMi)} sq mi<br />
                  <span style={{ opacity: .7 }}>{w.headwaters}</span>
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
        Great Salt Lake Basin · live hydrology
      </div>

      <div className="legend">
        <div className="lg-title">Layers</div>
        <div className="li"><span className="sw" style={{ background: COLORS.lake_stage }} /> Lake-stage gauge</div>
        <div className="li"><span className="sw" style={{ background: COLORS.inflow_major }} /> Major inflow</div>
        <div className="li"><span className="sw" style={{ background: COLORS.inflow_minor }} /> Minor inflow</div>
        <div className="li"><span className="sq" style={{ borderColor: "#1c7ed6" }} /> Watershed</div>
        <div className="li radar-li"><span className="grad" /> Radar reflectivity</div>
      </div>
    </MapContainer>
  );
}
