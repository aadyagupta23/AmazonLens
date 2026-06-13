import React from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, Monitor, Dumbbell, Home, Briefcase, Package, ChevronRight,
} from "lucide-react";

const ICON_MAP = {
  graduation_cap: GraduationCap,
  monitor:        Monitor,
  dumbbell:       Dumbbell,
  home:           Home,
  briefcase:      Briefcase,
};

// Placeholder image area — gradient + icon, distinct per journey
const IMAGE_STYLE = {
  graduation_cap: { from: "#1a3a6b", to: "#2d6a9f" },
  monitor:        { from: "#1c1c2e", to: "#3a3a5c" },
  dumbbell:       { from: "#6b2020", to: "#c0392b" },
  home:           { from: "#145a38", to: "#1e8449" },
  briefcase:      { from: "#7d4000", to: "#c97d10" },
};

export default function JourneyCard({ journey }) {
  const navigate = useNavigate();
  const { title, description, productCount, budget, query, icon } = journey;

  const Icon = ICON_MAP[icon] || Package;
  const imgStyle = IMAGE_STYLE[icon] || { from: "#131921", to: "#232F3E" };

  const handleExplore = () => navigate(`/s?q=${encodeURIComponent(query)}`);

  const fmt = (n) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(0)}L`
    : n >= 1000  ? `₹${(n / 1000).toFixed(0)}K`
    :              `₹${n}`;

  return (
    <div
      className="flex-shrink-0 w-44 lg:w-auto bg-white border border-[#DDD] rounded overflow-hidden
                 hover:border-[#AAAAAA] hover:shadow-sm transition-all cursor-pointer group"
      onClick={handleExplore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleExplore()}
      aria-label={`Explore ${title}`}
    >
      {/* Image area — ~50% of card height */}
      <div
        className="h-32 flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${imgStyle.from}, ${imgStyle.to})` }}
      >
        {/* Soft circle backdrop for icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/10" />
        </div>
        <Icon size={34} className="text-white relative z-10" strokeWidth={1.5} />
      </div>

      {/* Text area */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-bold text-[#0F1111] text-sm leading-tight group-hover:text-[#C7511F] transition-colors line-clamp-1">
          {title}
        </h3>

        <p className="text-[11px] text-[#565959] leading-snug line-clamp-2">
          {description}
        </p>

        <p className="text-[11px] text-[#565959]">
          {productCount} items · {fmt(budget.min)}–{fmt(budget.max)}
        </p>

        <button
          onClick={(e) => { e.stopPropagation(); handleExplore(); }}
          className="mt-1 w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-bold
                     py-1.5 rounded-sm flex items-center justify-center gap-0.5 transition-colors"
        >
          Shop now <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}
