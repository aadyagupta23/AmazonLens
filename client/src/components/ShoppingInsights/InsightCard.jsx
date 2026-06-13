import React from "react";
import { Link } from "react-router-dom";
import {
  PiggyBank, RefreshCw, Tag, BarChart2, Leaf, ChevronRight,
} from "lucide-react";

const ICON_MAP = {
  piggy_bank: PiggyBank,
  refresh:    RefreshCw,
  tag:        Tag,
  bar_chart:  BarChart2,
  leaf:       Leaf,
};

// Icon background tints — one per accentColor value in insightsData
const ICON_TINT = {
  green:  { bg: "bg-green-50",  color: "text-[#067D62]" },
  red:    { bg: "bg-red-50",    color: "text-[#CC0C39]" },
  blue:   { bg: "bg-blue-50",   color: "text-[#007185]" },
  orange: { bg: "bg-orange-50", color: "text-[#C7511F]" },
};

/**
 * InsightCard — compact visual summary card.
 * 3 lines only: icon + metric + subtitle + CTA link.
 */
export default function InsightCard({ insight }) {
  const { value, subtext, cta, icon, accentColor } = insight;

  const Icon  = ICON_MAP[icon] || BarChart2;
  const tint  = ICON_TINT[accentColor] || ICON_TINT.blue;

  return (
    <div className="bg-white border border-[#DDD] rounded p-3.5 flex flex-col gap-2.5 hover:border-[#AAAAAA] hover:shadow-sm transition-all">
      {/* Icon bubble */}
      <div className={`w-9 h-9 rounded-full ${tint.bg} flex items-center justify-center`}>
        <Icon size={16} className={tint.color} />
      </div>

      {/* Primary metric */}
      <p className="text-[#0F1111] font-bold text-base leading-tight">{value}</p>

      {/* Subtitle */}
      <p className="text-xs text-[#565959] leading-tight">{subtext}</p>

      {/* CTA link */}
      {cta && (
        <Link
          to={cta.href}
          className="mt-auto inline-flex items-center gap-0.5 text-xs text-[#007185] hover:text-[#C7511F] hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {cta.label} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}
