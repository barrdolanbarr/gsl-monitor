"use client";
import { useEffect, useState } from "react";

// Shared "water generated" quantity (acre-feet), persisted across pages so the
// slider choice carries from the Overview into any detail page. Defaults to one
// inch over the basin (400,000 AF).
const KEY = "bear_genAF";
const DEFAULT = 400000;

export function useGenAF() {
  const [genAF, setGenAF] = useState<number>(DEFAULT);
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem(KEY));
      if (v && isFinite(v) && v > 0) setGenAF(v);
    } catch {}
  }, []);
  const set = (v: number) => {
    setGenAF(v);
    try {
      window.localStorage.setItem(KEY, String(v));
    } catch {}
  };
  return [genAF, set] as const;
}
