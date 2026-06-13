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

// Placeholder image gradients — softer, more aspirational than PopularShoppingLists
const IMAGE_STYLE = {
  graduation_cap: { from: "#0d3b6e", to: "#1565c0" },
  dumbbell:       { from: "#b71c1c", to: "#e53935" },
  monitor:        { from: "#212121", to: "#546e7a" },
  home:           { from: "#1b5e20", to: "#388e3c" },
  briefcase:      { from: "#e65100", to: "#fb8c00" },
};

/**
 * LifestyleCard — image-first aspirational card.
 * 50% image area, minimal text below.
 */
export default function LifestyleCard({ journey }) {
  const navigate = useNavigate();
  const { title, tagline, productCount, budget, query, icon, color } = journey;

  const Icon     = ICON_MAP[icon] || Package;
  const imgStyle = IMAGE_STYLE[icon] || { from: "#131921", to: "#232F3E" };

  const handleExplore = () => navigate(`/s?q=${encodeURIComponent(query)}`);

  const fmt = (n) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(0)}L`
    : n >= 1000  ? `₹${(n / 1000).toFixed(0)}K`
    :              `₹${n}`;

  return (
    <div
      className="flex-shrink-0 w-44 lg:w-auto bg-white border border-[#E8E8E8] rounded overflow-hidden
                 hover:shadow-md transition-all cursor-pointer group"
      onClick={handleExplore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleExplore()}
      aria-label={`Explore ${title} journey`}
    >
      {/* Image placeholder — 50% of card */}
      <div
        className="h-36 flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${imgStyle.from}, ${imgStyle.to})` }}
      >
        {/* Layered rings give depth without being garish */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-28 h-28 rounded-full border border-white/10" />
          <div className="absolute w-16 h-16 rounded-full border border-white/20" />
        </div>
        <Icon size={36} className="text-white/90 relative z-10" strokeWidth={1.5} />
      </div>

      {/* Text area */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3
          className="font-bold text-[#0F1111] text-sm leading-tight group-hover:text-[#C7511F] transition-colors line-clamp-1"
        >
          {title}
        </h3>

        <p className="text-[11px] text-[#565959] line-clamp-1">{tagline}</p>

        <p className="text-[11px] text-[#565959]">
          {productCount} products · {fmt(budget.min)}–{fmt(budget.max)}
        </p>

        <button
          onClick={(e) => { e.stopPropagation(); handleExplore(); }}
          className="mt-1 w-full text-xs font-medium text-[#007185] hover:text-[#C7511F] hover:underline
                     flex items-center gap-0.5 transition-colors"
        >
          Explore journey <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}
