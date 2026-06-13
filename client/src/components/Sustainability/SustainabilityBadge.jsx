import React from "react";
import { Leaf } from "lucide-react";
import { getSustainabilityColor } from "../../utils/sustainability.js";

/**
 * SustainabilityBadge — compact inline badge.
 * Used on ProductCard and the buy-box in ProductPage.
 *
 * Props:
 *   score   – 0–100
 *   size    – "sm" | "md" (default "sm")
 *   onClick – optional click handler to open the full panel
 */
export default function SustainabilityBadge({ score, size = "sm", onClick }) {
  const c = getSustainabilityColor(score);

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.light} ${c.lightText} cursor-default`}
        title={`Sustainability Score: ${score}/100 — ${c.label}`}
        onClick={onClick}
        style={onClick ? { cursor: "pointer" } : {}}
      >
        <Leaf size={9} />
        {score}
      </span>
    );
  }

  // md
  return (
    <button
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${c.light} border border-current/10 hover:opacity-90 transition-opacity`}
      style={{ color: c.hex }}
      onClick={onClick}
    >
      <Leaf size={14} />
      <span className="text-sm font-bold">{score}/100</span>
      <span className="text-xs">{c.label}</span>
    </button>
  );
}
