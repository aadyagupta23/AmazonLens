import React, { useState } from "react";
import { Leaf, ChevronDown, ChevronUp, Wind, Recycle, Package, Heart } from "lucide-react";
import { getSustainabilityColor } from "../../utils/sustainability.js";

const METRICS = [
  { key: "carbonFootprint",  label: "Carbon Footprint",  icon: Wind,    goodText: "Low carbon manufacturing and logistics.",   badText: "Above-average carbon emissions in production."   },
  { key: "recyclability",    label: "Recyclability",     icon: Recycle, goodText: "Materials are largely recyclable.",          badText: "Limited recyclability — mixed or non-recyclable materials." },
  { key: "packagingImpact",  label: "Packaging Impact",  icon: Package, goodText: "Minimal, recyclable, or FSC-certified packaging.", badText: "Excess or non-recyclable packaging detected." },
  { key: "ethicalSourcing",  label: "Ethical Sourcing",  icon: Heart,   goodText: "Supplier audits passed — fair labour standards.", badText: "Limited supplier transparency on labour practices." },
];

/**
 * SustainabilityPanel — mirrors TrustLens panel design.
 * Sits below the TrustLens section on ProductPage when Sustainability Mode is on.
 *
 * Props:
 *   data – result of getSustainabilityData(productId)
 */
export default function SustainabilityPanel({ data }) {
  const [expanded, setExpanded] = useState(false);
  const c = getSustainabilityColor(data.score);

  return (
    <div className="bg-gradient-to-br from-green-50/60 to-white border border-green-200 rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf size={15} className="text-[#1B5E20]" />
          <span className="font-bold text-[#0F1111] text-sm">Sustainability</span>
          {data.certified && (
            <span className="text-[10px] bg-[#1B5E20] text-white px-2 py-0.5 rounded-full font-bold">CERTIFIED</span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#007185] hover:underline flex items-center gap-0.5"
        >
          {expanded ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Details</>}
        </button>
      </div>

      {/* Score row */}
      <div className="flex items-center gap-4 mb-1">
        {/* SVG gauge — matches TrustCard style */}
        <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#E8F5E9" strokeWidth="4" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke={c.hex}
            strokeWidth="4"
            strokeDasharray={`${(data.score / 100) * 113} 113`}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
          />
          <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill={c.hex}>
            {data.score}
          </text>
        </svg>
        <div>
          <p className="font-bold text-sm text-[#0F1111]">{data.score}/100 — {c.label}</p>
          <p className="text-xs text-[#565959] mt-0.5">
            {data.score >= 75
              ? "This product meets eco-friendly standards."
              : data.score >= 50
              ? "Moderate environmental impact — some concerns."
              : "Below-average sustainability — consider alternatives."}
          </p>
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {METRICS.map(({ key, label, icon: Icon, goodText, badText }) => {
            const val = data[key];
            const mc = getSustainabilityColor(val);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: mc.hex }} />
                    <span className="text-xs font-medium text-[#0F1111]">{label}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: mc.hex }}>{val}</span>
                </div>
                <div className="h-1.5 bg-green-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${val}%`, backgroundColor: mc.hex }}
                  />
                </div>
                <p className="text-[10px] text-[#565959]">{val >= 65 ? goodText : badText}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
