/**
 * DnaPanel
 *
 * Shows the user's Amazon Lens DNA profile:
 * preferred brands, categories, budget range, return patterns,
 * sustainability affinity, and DNA evolution stage.
 *
 * Rendered inside AccountPage.
 */

import React from "react";
import { Dna, Leaf, TrendingUp, RotateCcw, Wallet, ShieldAlert, Sprout, Flame } from "lucide-react";
import { useDna } from "../contexts/DnaContext.jsx";

const STAGE_CONFIG = {
  seedling:    { Icon: Sprout, label: "Seedling",    color: "text-green-600",  bg: "bg-green-50",  desc: "Keep browsing and buying — your DNA is just forming."       },
  growing:     { Icon: TrendingUp, label: "Growing", color: "text-blue-600",   bg: "bg-blue-50",   desc: "Your DNA is taking shape. Patterns are starting to emerge."  },
  established: { Icon: Flame,  label: "Established", color: "text-orange-600", bg: "bg-orange-50", desc: "Your DNA is mature. Insights and warnings are most accurate." },
};

function ScoreBar({ value, max, color = "bg-[#FF9900]" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DnaPanel() {
  const { profile, dnaReady } = useDna();

  if (!dnaReady) {
    return (
      <div className="bg-white border border-[#DDD] rounded p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!profile || !profile.mature) {
    return (
      <div className="bg-white border border-[#DDD] rounded p-5">
        <div className="flex items-center gap-2 mb-3">
          <Dna size={18} className="text-[#FF9900]" />
          <h2 className="font-bold text-[#0F1111] text-base">Amazon Lens DNA</h2>
          <span className="text-[10px] bg-[#FF9900]/10 text-[#B7800A] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            New
          </span>
        </div>
        <div className="flex items-start gap-3 p-4 bg-[#FAFAFA] rounded-xl border border-dashed border-gray-300">
          <Sprout size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#0F1111] mb-1">Your DNA is just getting started</p>
            <p className="text-xs text-[#565959]">
              Browse and buy a few products — Amazon Lens DNA learns your preferences, return patterns,
              and budget range to warn you before you regret a purchase.
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              {profile?.eventCount || 0} / 5 signals collected
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stage = STAGE_CONFIG[profile.stage] || STAGE_CONFIG.growing;
  const StageIcon = stage.Icon;
  const maxBrandScore = profile.preferredBrands[0]?.score || 1;
  const maxCatScore   = profile.preferredCategories[0]?.score || 1;

  return (
    <div className="bg-white border border-[#DDD] rounded p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dna size={18} className="text-[#FF9900]" />
          <h2 className="font-bold text-[#0F1111] text-base">Amazon Lens DNA</h2>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${stage.bg} ${stage.color}`}>
          <StageIcon size={12} />
          {stage.label}
        </div>
      </div>

      <p className="text-xs text-[#565959] mb-5">{stage.desc}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Preferred Brands */}
        {profile.preferredBrands.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-[#565959]" />
              <span className="text-xs font-semibold text-[#0F1111] uppercase tracking-wide">Preferred Brands</span>
            </div>
            <div className="space-y-2">
              {profile.preferredBrands.slice(0, 5).map(({ brand, score }) => (
                <div key={brand}>
                  <div className="flex justify-between text-xs text-[#0F1111] mb-0.5">
                    <span>{brand}</span>
                    <span className="text-[#565959]">{score}pts</span>
                  </div>
                  <ScoreBar value={score} max={maxBrandScore} color="bg-[#FF9900]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Categories */}
        {profile.preferredCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp size={14} className="text-[#565959]" />
              <span className="text-xs font-semibold text-[#0F1111] uppercase tracking-wide">Preferred Categories</span>
            </div>
            <div className="space-y-2">
              {profile.preferredCategories.slice(0, 5).map(({ category, score }) => (
                <div key={category}>
                  <div className="flex justify-between text-xs text-[#0F1111] mb-0.5">
                    <span className="truncate max-w-[160px]">{category}</span>
                    <span className="text-[#565959] flex-shrink-0 ml-2">{score}pts</span>
                  </div>
                  <ScoreBar value={score} max={maxCatScore} color="bg-[#007185]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Range */}
        {profile.budgetRange?.avg > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Wallet size={14} className="text-[#565959]" />
              <span className="text-xs font-semibold text-[#0F1111] uppercase tracking-wide">Your Budget Pattern</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Min", value: `₹${profile.budgetRange.min.toLocaleString("en-IN")}` },
                { label: "Avg", value: `₹${profile.budgetRange.avg.toLocaleString("en-IN")}`, highlight: true },
                { label: "Max", value: `₹${profile.budgetRange.max.toLocaleString("en-IN")}` },
              ].map(({ label, value, highlight }) => (
                <div key={label} className={`rounded-lg p-2.5 text-center ${highlight ? "bg-[#FFF8E7] border border-[#FF9900]/30" : "bg-[#FAFAFA]"}`}>
                  <p className={`text-xs font-bold ${highlight ? "text-[#B7800A]" : "text-[#0F1111]"}`}>{value}</p>
                  <p className="text-[10px] text-[#565959]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return Patterns */}
        {profile.returnPatterns?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <RotateCcw size={14} className="text-[#565959]" />
              <span className="text-xs font-semibold text-[#0F1111] uppercase tracking-wide">Your Return Patterns</span>
            </div>
            <div className="space-y-2">
              {profile.returnPatterns.slice(0, 4).map((p) => {
                const pct = Math.round(p.returnRate * 100);
                const color = pct > 40 ? "text-red-600" : pct > 20 ? "text-amber-600" : "text-green-600";
                return (
                  <div key={p.category} className="flex items-center justify-between text-xs">
                    <span className="text-[#0F1111] truncate max-w-[150px]">{p.category}</span>
                    <span className={`font-bold ${color}`}>{pct}% returned</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sustainability Affinity */}
        {profile.sustainabilityAffinity > 0 && (
          <div className="sm:col-span-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Leaf size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-[#0F1111] uppercase tracking-wide">Sustainability Affinity</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ScoreBar value={profile.sustainabilityAffinity} max={1} color="bg-green-500" />
              </div>
              <span className="text-xs font-bold text-green-700">
                {Math.round(profile.sustainabilityAffinity * 100)}% eco purchases
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-5 pt-4 border-t border-[#F0F0F0]">
        DNA learns from your views, cart adds, purchases, and returns — never from ratings or wishlists.
        · {profile.eventCount} signals collected
      </p>
    </div>
  );
}
