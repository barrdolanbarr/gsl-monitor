import { NextRequest, NextResponse } from "next/server";

// Server-side proxy to USGS Water Services (no API key required).
// Two modes:
//   /api/usgs?mode=current      -> latest instantaneous/daily values for all sites
//   /api/usgs?mode=series&site=10126000&param=00060 -> ~1yr daily values for charting

export const revalidate = 0; // always fresh

const IV_BASE = "https://waterservices.usgs.gov/nwis/iv/";
const DV_BASE = "https://waterservices.usgs.gov/nwis/dv/";

// All site IDs we care about (mirrors lib/data.ts)
const ALL_SITES = [
  "10126000","10141000","10172630","410401112134801",
  "10172600","10141450","10142000","10141100","10141200",
  "10010000","10010100",
];

async function fetchJSON(url: string) {
  const r = await fetch(url, { headers: { "Accept": "application/json" }, next: { revalidate: 0 } });
  if (!r.ok) throw new Error(`USGS ${r.status}`);
  return r.json();
}

// Parse USGS waterML-ish JSON into { siteId: { param: {value, dateTime, name} } }
function parseCurrent(json: any) {
  const out: Record<string, any> = {};
  const series = json?.value?.timeSeries ?? [];
  for (const ts of series) {
    const siteCode = ts?.sourceInfo?.siteCode?.[0]?.value;
    const siteName = ts?.sourceInfo?.siteName;
    const paramCode = ts?.variable?.variableCode?.[0]?.value;
    const vals = ts?.values?.[0]?.value ?? [];
    const last = vals.length ? vals[vals.length - 1] : null;
    if (!siteCode || !last) continue;
    if (!out[siteCode]) out[siteCode] = { name: siteName, params: {} };
    out[siteCode].params[paramCode] = {
      value: parseFloat(last.value),
      dateTime: last.dateTime,
    };
  }
  return out;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "current";

  try {
    if (mode === "series") {
      const site = searchParams.get("site");
      const param = searchParams.get("param") ?? "00060";
      if (!site) return NextResponse.json({ error: "site required" }, { status: 400 });
      // ~1 year of daily values
      const url = `${DV_BASE}?format=json&sites=${site}&parameterCd=${param}&period=P365D&siteStatus=all`;
      const json = await fetchJSON(url);
      const ts = json?.value?.timeSeries?.[0];
      const vals = ts?.values?.[0]?.value ?? [];
      const points = vals
        .map((v: any) => ({ date: v.dateTime?.slice(0, 10), value: parseFloat(v.value) }))
        .filter((p: any) => !isNaN(p.value) && p.value > -999990);
      return NextResponse.json({ site, param, name: ts?.sourceInfo?.siteName ?? "", points });
    }

    // current mode: pull instantaneous discharge/gage-height + lake elevation in two calls
    // Discharge + gage height (instantaneous) for flow sites
    const ivUrl = `${IV_BASE}?format=json&sites=${ALL_SITES.join(",")}&parameterCd=00060,00065,62614&siteStatus=all`;
    let current: Record<string, any> = {};
    try {
      const ivJson = await fetchJSON(ivUrl);
      current = parseCurrent(ivJson);
    } catch (e) {
      // fall through to daily values if instantaneous unavailable
    }

    // Lake elevation often reported as daily values (62614); backfill from DV for any missing
    const needDV = ["10010000", "10010100"].filter(
      (s) => !current[s] || !current[s].params?.["62614"]
    );
    if (needDV.length) {
      const dvUrl = `${DV_BASE}?format=json&sites=${needDV.join(",")}&parameterCd=62614&period=P7D&siteStatus=all`;
      try {
        const dvJson = await fetchJSON(dvUrl);
        const dvParsed = parseCurrent(dvJson);
        for (const s of Object.keys(dvParsed)) {
          if (!current[s]) current[s] = dvParsed[s];
          else current[s].params = { ...current[s].params, ...dvParsed[s].params };
        }
      } catch (e) { /* ignore */ }
    }

    return NextResponse.json({ fetchedAt: new Date().toISOString(), sites: current });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "fetch failed" }, { status: 502 });
  }
}
