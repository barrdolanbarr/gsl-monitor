"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SeriesChart({ site, param, color, label }: { site: string; param: string; color: string; label: string }) {
  const [points, setPoints] = useState<any[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/usgs?mode=series&site=${site}&param=${param}`)
      .then((r) => r.json())
      .then((j) => { if (alive) setPoints(j.points ?? []); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [site, param]);

  if (err) return <div style={{ fontSize: 11, color: "#5e7064" }}>1-yr history unavailable</div>;
  if (!points) return <div style={{ fontSize: 11, color: "#5e7064" }}>loading 1-yr history…</div>;
  if (!points.length) return <div style={{ fontSize: 11, color: "#5e7064" }}>no daily record</div>;

  return (
    <div style={{ width: 240, height: 90 }}>
      <div style={{ fontSize: 10, color: "#5e7064", fontFamily: "var(--mono)" }}>past 365 days ({label})</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
          <XAxis dataKey="date" hide />
          <YAxis width={40} tick={{ fontSize: 9 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #dce4dd" }}
            labelStyle={{ color: "#5e7064" }}
            formatter={(v: any) => [Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 }), label]}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.6} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
