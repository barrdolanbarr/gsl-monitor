"""Economic layer for the Bear River pilot.

Routes a quantity of NEW water generated in the basin (acre-feet) down the
hydrologic cascade and attaches a marginal economic value at every node where the
water is used. See model/data/economics_config.json for the node graph and the
$/AF anchors (all editable, all sourced in economic-layer-plan.md).

Three value types, kept rigorously separate so nothing is double-counted:

  * CONSUMPTIVE  - rival uses; fractions sum to 1.0 (losses included). One acre-foot
                   either grows a crop or flows on, never both.
  * PASS-THROUGH - non-rival uses of in-river flow (hydropower, fishing). Valued on
                   the water that flows past, without consuming it.
  * LAKE-TERMINAL- joint products of the same acre-foot reaching the Great Salt Lake
                   (shrimp + minerals + dust suppression + ski at once). Summed per
                   AF-to-lake, not partitioned.

The headline object is a PER-ACRE-FOOT decomposition: multiply every AF/$ field by a
chosen "water generated" quantity to get the basin total. The frontend does exactly
this so a slider can rescale instantly with no recompute.
"""
from __future__ import annotations
import json
import os
from typing import Any

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def load_economics_config() -> dict:
    with open(os.path.join(DATA_DIR, "economics_config.json")) as fh:
        return json.load(fh)


def _round(x: float, d: int = 2) -> float:
    return round(float(x), d)


def compute_economics(cfg: dict | None = None) -> dict[str, Any]:
    """Return a per-AF-generated decomposition of where the water goes and what it's worth.

    All quantities are expressed PER acre-foot of new water generated in the basin:
      - af_per_af   : fraction of generated water consumed/flowing at each node (AF per AF)
      - usd_per_af  : marginal economic value created at each node (USD per AF generated)
    Multiply by a generated-water quantity (AF) to get basin totals.
    """
    if cfg is None:
        cfg = load_economics_config()

    cons = cfg["consumptive_partition"]
    passthrough = cfg["passthrough"]
    terminal = cfg["lake_terminal"]

    # --- integrity check: consumptive fractions must sum to 1.0 (mass conservation) ---
    frac_sum = sum(n["frac"] for n in cons)
    if abs(frac_sum - 1.0) > 1e-6:
        raise ValueError(
            f"consumptive_partition fractions sum to {frac_sum:.6f}, must equal 1.0 "
            "(every acre-foot of generated water must be accounted for, losses included)"
        )

    # --- water reaching the lake (baseflow return + surface residual) ---
    to_lake_frac = sum(n["frac"] for n in cons if n.get("fate") == "to_lake")

    # --- in-river throughflow that pass-through uses (hydro, fishing) act on ---
    surface_frac = sum(n["frac"] for n in cons if n["path"] == "surface")
    path_frac = {
        "surface": surface_frac,
        "soil": sum(n["frac"] for n in cons if n["path"] == "soil"),
        "groundwater": sum(n["frac"] for n in cons if n["path"] == "groundwater"),
        "interception": sum(n["frac"] for n in cons if n["path"] == "interception"),
    }

    # ---------------------------------------------------------------- consumptive
    consumptive_nodes = []
    consumptive_usd_per_af = 0.0
    for n in cons:
        usd = n["frac"] * n["value_per_af"]
        consumptive_usd_per_af += usd
        consumptive_nodes.append({
            "id": n["id"],
            "label": n["label"],
            "type": "consumptive",
            "path": n["path"],
            "beneficiary": n["beneficiary"],
            "af_per_af": _round(n["frac"], 4),
            "value_per_af_used": n["value_per_af"],     # $/AF actually used at this node
            "usd_per_af": _round(usd, 2),               # $ per AF generated (frac-weighted)
            "loss": bool(n.get("loss", False)),
            "fate": n.get("fate"),
            "value_basis": n.get("value_basis"),
        })

    # ---------------------------------------------------------------- pass-through
    passthrough_nodes = []
    passthrough_usd_per_af = 0.0
    for n in passthrough:
        applies = path_frac.get(n["applies_to"], 0.0)
        usd = applies * n["value_per_af"]
        passthrough_usd_per_af += usd
        passthrough_nodes.append({
            "id": n["id"],
            "label": n["label"],
            "type": "passthrough",
            "beneficiary": n["beneficiary"],
            "af_per_af": _round(applies, 4),            # throughflow (not consumed)
            "value_per_af_used": n["value_per_af"],
            "usd_per_af": _round(usd, 2),
            "applies_to": n["applies_to"],
            "value_basis": n.get("value_basis"),
        })

    # ---------------------------------------------------------------- lake terminal
    terminal_nodes = []
    terminal_usd_per_af = 0.0
    for n in terminal:
        usd = to_lake_frac * n["value_per_af"]          # joint product on AF-to-lake
        terminal_usd_per_af += usd
        terminal_nodes.append({
            "id": n["id"],
            "label": n["label"],
            "type": "lake_terminal",
            "beneficiary": n["beneficiary"],
            "af_per_af": _round(to_lake_frac, 4),
            "value_per_af_used": n["value_per_af"],
            "usd_per_af": _round(usd, 2),
            "value_basis": n.get("value_basis"),
        })

    total_usd_per_af = consumptive_usd_per_af + passthrough_usd_per_af + terminal_usd_per_af

    # ---------------------------------------------------------------- by beneficiary
    by_beneficiary: dict[str, float] = {}
    for node in consumptive_nodes + passthrough_nodes + terminal_nodes:
        by_beneficiary[node["beneficiary"]] = by_beneficiary.get(node["beneficiary"], 0.0) + node["usd_per_af"]
    by_beneficiary_sorted = sorted(
        ({"beneficiary": k, "usd_per_af": _round(v, 2)} for k, v in by_beneficiary.items()),
        key=lambda d: d["usd_per_af"], reverse=True,
    )

    area_acres = cfg["basin"]["drainage_area_sqmi"] * cfg["basin"]["acres_per_sqmi"]
    acre_feet_per_inch = area_acres / 12.0

    return {
        "meta": {
            "what": "Per-acre-foot economic decomposition of new water generated in the Bear River basin.",
            "how_to_use": "Multiply every *_per_af field by a generated-water quantity (AF) for basin totals.",
            "double_counting_guard": "Consumptive fractions sum to 1.0; lake-terminal benefits are joint products on to-lake water only; pass-through uses do not consume water.",
        },
        "basin": {
            "drainage_area_sqmi": cfg["basin"]["drainage_area_sqmi"],
            "area_acres": area_acres,
            "acre_feet_per_inch": _round(acre_feet_per_inch, 0),
        },
        "fractions": {
            "to_lake": _round(to_lake_frac, 4),
            "by_path": {k: _round(v, 4) for k, v in path_frac.items()},
        },
        "per_af": {
            "consumptive_usd": _round(consumptive_usd_per_af, 2),
            "passthrough_usd": _round(passthrough_usd_per_af, 2),
            "lake_terminal_usd": _round(terminal_usd_per_af, 2),
            "total_usd": _round(total_usd_per_af, 2),
        },
        "nodes": consumptive_nodes + passthrough_nodes + terminal_nodes,
        "by_beneficiary": by_beneficiary_sorted,
        "notes": {
            "partition": cfg.get("partition_note"),
            "lake_terminal": cfg.get("lake_terminal_note"),
        },
    }


def scale_to_quantity(econ: dict, generated_af: float) -> dict:
    """Convenience: scale a per-AF decomposition to a specific generated-water quantity."""
    out = {
        "generated_af": generated_af,
        "equivalent_inches_over_basin": _round(generated_af / econ["basin"]["acre_feet_per_inch"], 3),
        "total_usd": _round(econ["per_af"]["total_usd"] * generated_af, 0),
        "to_lake_af": _round(econ["fractions"]["to_lake"] * generated_af, 0),
        "nodes": [
            {**n,
             "af": _round(n["af_per_af"] * generated_af, 1),
             "usd": _round(n["usd_per_af"] * generated_af, 0)}
            for n in econ["nodes"]
        ],
        "by_beneficiary": [
            {**b, "usd": _round(b["usd_per_af"] * generated_af, 0)}
            for b in econ["by_beneficiary"]
        ],
    }
    return out


if __name__ == "__main__":
    e = compute_economics()
    print(f"per-AF total value: ${e['per_af']['total_usd']:.2f}/AF  "
          f"(consumptive ${e['per_af']['consumptive_usd']:.2f} + "
          f"passthrough ${e['per_af']['passthrough_usd']:.2f} + "
          f"lake ${e['per_af']['lake_terminal_usd']:.2f})")
    print(f"to-lake fraction: {e['fractions']['to_lake']:.3f}   "
          f"AF per inch over basin: {e['basin']['acre_feet_per_inch']:,.0f}")
    print("by beneficiary ($/AF):")
    for b in e["by_beneficiary"]:
        print(f"  {b['beneficiary']:32s} {b['usd_per_af']:8.2f}")
    demo = scale_to_quantity(e, e["basin"]["acre_feet_per_inch"])
    print(f"\n1 inch over basin = {demo['generated_af']:,.0f} AF -> ${demo['total_usd']:,.0f}")
