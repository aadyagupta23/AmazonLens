import React from "react";
import { useNavigate } from "react-router-dom";
import JourneyCard from "./JourneyCard.jsx";
import { JOURNEYS_MOCK } from "./journeysData.js";

/**
 * PopularShoppingLists — curated, product-focused shopping bundles.
 * Acts as the main destination for "shop by goal" discovery.
 *
 * Props (all optional):
 *   journeys – journey[]  swap in live data when ready
 *   title    – string
 */
export default function RecommendedJourneys({
  journeys = JOURNEYS_MOCK,
  title = "Popular Shopping Lists",
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[#0F1111] text-lg">{title}</h2>
        <button
          onClick={() => navigate("/s")}
          className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline"
        >
          See all →
        </button>
      </div>

      {/* Mobile: horizontal scroll. Desktop: 5-column grid */}
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth lg:hidden">
        {journeys.map((j) => (
          <div key={j.id} className="snap-start">
            <JourneyCard journey={j} />
          </div>
        ))}
      </div>

      <div className="hidden lg:grid grid-cols-5 gap-3">
        {journeys.map((j) => (
          <JourneyCard key={j.id} journey={j} />
        ))}
      </div>
    </div>
  );
}
