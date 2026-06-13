import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { CONTINUE_MOCK } from "./continueData.js";

// Per-bundle placeholder palette so each bundle looks distinct
const BUNDLE_PALETTE = {
  study_completion:  { from: "#1a3a5c", to: "#2d6a9f", label: "Study Setup"    },
  hostel_expansion:  { from: "#1c4a2e", to: "#2e7d52", label: "Hostel Kit"     },
  fitness_upgrade:   { from: "#6b1f1f", to: "#c0392b", label: "Fitness Gear"   },
};

// Product chip placeholder colours — cycle through these
const CHIP_COLORS = ["#e8f0fe","#fce8e6","#e8f5e9","#fff8e1","#f3e8ff"];

export default function ContinueYourJourney({ bundles = CONTINUE_MOCK }) {
  const navigate = useNavigate();

  const featured = [...bundles].sort((a, b) => b.confidence - a.confidence)[0];
  if (!featured) return null;

  const { title, reason, items, totalBudget, productCount, confidence, query, tag, id } = featured;
  const palette = BUNDLE_PALETTE[id] || { from: "#131921", to: "#232F3E", label: title };

  const handleExplore = () => navigate(`/s?q=${encodeURIComponent(query)}`);

  const fmt = (n) =>
    n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  return (
    <div className="bg-white rounded shadow-sm p-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-[#0F1111] text-lg">Continue Your Journey</h2>
          <p className="text-xs text-[#565959] mt-0.5">
            Based on your recent purchases and browsing activity
          </p>
        </div>
        <button
          onClick={() => navigate("/s?q=bundles")}
          className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline flex-shrink-0"
        >
          View more bundles →
        </button>
      </div>

      {/* ── MAIN CARD ── */}
      <div
        className="rounded overflow-hidden border border-[#EAEAEA] flex flex-col lg:flex-row
                   hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleExplore}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleExplore()}
        aria-label={`Explore ${title}`}
      >
        {/* LEFT: Hero image placeholder */}
        <div
          className="relative lg:w-64 lg:flex-shrink-0 h-44 lg:h-auto flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        >
          {/* Decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 rounded-full border-2 border-white/10" />
            <div className="absolute w-24 h-24 rounded-full border-2 border-white/15" />
          </div>
          {/* Bundle label */}
          <div className="relative z-10 text-center px-4">
            <div className="text-white/60 text-[10px] uppercase tracking-widest mb-1">{tag}</div>
            <div className="text-white font-bold text-sm leading-snug">{palette.label}</div>
            <div className="mt-2 inline-block bg-white/15 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {confidence}% match
            </div>
          </div>
        </div>

        {/* RIGHT: Info + product chips + CTA */}
        <div className="flex-1 p-5 flex flex-col gap-4">
          {/* Title + reason */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#007185] uppercase tracking-wide">{tag}</span>
            </div>
            <h3 className="font-bold text-[#0F1111] text-base leading-snug">{title}</h3>
            <p className="text-sm text-[#565959] mt-1">{reason}</p>
          </div>

          {/* Product image chips */}
          <div className="flex gap-2 flex-wrap">
            {items.slice(0, 5).map((item, i) => (
              <div
                key={item.name}
                title={item.name}
                className="w-16 h-16 rounded border border-[#DDD] flex items-center justify-center
                           text-[10px] text-[#565959] text-center leading-tight p-1 overflow-hidden flex-shrink-0"
                style={{ backgroundColor: CHIP_COLORS[i % CHIP_COLORS.length] }}
              >
                <span className="line-clamp-3">{item.name}</span>
              </div>
            ))}
            {items.length > 5 && (
              <div className="w-16 h-16 rounded border border-[#DDD] flex items-center justify-center
                              text-xs text-[#565959] bg-[#F7F8F8] flex-shrink-0">
                +{items.length - 5}
              </div>
            )}
          </div>

          {/* Meta + CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto">
            <div className="flex items-center gap-4 text-sm text-[#565959]">
              <span><strong className="text-[#0F1111]">{productCount}</strong> items</span>
              <span><strong className="text-[#0F1111]">{fmt(totalBudget)}</strong> est. total</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleExplore(); }}
                className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-bold
                           px-5 py-2 rounded-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                Explore Bundle <ChevronRight size={14} />
              </button>
              {/* <button
                onClick={(e) => { e.stopPropagation(); navigate("/s?q=bundles"); }}
                className="border border-[#DDD] hover:border-[#999] bg-[#F7F8F8] hover:bg-[#EAEDED]
                           text-[#0F1111] text-sm px-4 py-2 rounded-sm transition-colors whitespace-nowrap"
              >
                View More
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
