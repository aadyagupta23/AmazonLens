import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * ContinueCard
 *
 * Renders one "Continue Your Journey" bundle recommendation.
 * Feels like a standard Amazon "Frequently bought together" module —
 * plain white card, item list, total budget, yellow CTA.
 */
export default function ContinueCard({ bundle }) {
  const navigate = useNavigate();
  const { title, reason, items, totalBudget, confidence, query, tag } = bundle;

  const handleExplore = () => navigate(`/s?q=${encodeURIComponent(query)}`);

  const fmt = (n) =>
    n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  // Confidence bar colour: green ≥80, orange 60-79, red <60
  const confColor =
    confidence >= 80 ? "bg-[#067D62]"
    : confidence >= 60 ? "bg-[#FF9900]"
    : "bg-[#CC0C39]";

  return (
    <div className="bg-white border border-[#DDD] rounded overflow-hidden hover:border-[#007185] hover:shadow-sm transition-all flex flex-col">

      {/* Tag ribbon */}
      <div className="bg-[#F7F8F8] border-b border-[#DDD] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[11px] text-[#565959]">{tag}</span>
        {/* Confidence indicator */}
        <span className="text-[10px] text-[#565959]">{confidence}% match</span>
      </div>

      <div className="p-3 flex flex-col gap-2.5 flex-1">
        {/* Title */}
        <h3 className="font-bold text-[#0F1111] text-sm leading-tight">{title}</h3>

        {/* Reason text — Amazon-style "Because you..." */}
        <p className="text-[11px] text-[#565959] leading-snug">{reason}</p>

        {/* Item list */}
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[#0F1111]">
                <span className="text-[#007185]">›</span>
                {item.name}
              </span>
              <span className="text-[#565959] ml-2 whitespace-nowrap">₹{item.price.toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>

        <hr className="border-[#DDD]" />

        {/* Total + confidence bar */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-[#565959]">Estimated total</p>
            <p className="text-sm font-bold text-[#0F1111]">
              ₹{totalBudget.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-[#565959] mb-1">Confidence</p>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${confColor}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleExplore}
          className="mt-auto w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-bold
                     py-2 rounded-sm flex items-center justify-center gap-1 transition-colors"
        >
          Explore bundle
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
