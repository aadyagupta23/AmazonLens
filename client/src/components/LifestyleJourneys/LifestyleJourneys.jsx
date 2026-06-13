import React from "react";
import { useNavigate } from "react-router-dom";
import LifestyleCard from "./LifestyleCard.jsx";
import { LIFESTYLE_MOCK } from "./lifestyleData.js";

/**
 * LifestyleJourneys — aspirational life-event journeys section.
 * Positioned near the bottom of the homepage.
 * Feels like discovery / inspiration rather than immediate shopping.
 *
 * Props (all optional):
 *   journeys – journey[]  swap in live data when ready
 *   title    – string
 */
export default function LifestyleJourneys({
  journeys = LIFESTYLE_MOCK,
  title = "Recommended Journeys",
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded shadow-sm p-4 mb-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-bold text-[#0F1111] text-lg">{title}</h2>
          <p className="text-xs text-[#565959] mt-0.5">Life milestones worth shopping for</p>
        </div>
        <button
          onClick={() => navigate("/s")}
          className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline flex-shrink-0 mt-1"
        >
          See all →
        </button>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth lg:hidden">
        {journeys.map((j) => (
          <div key={j.id} className="snap-start">
            <LifestyleCard journey={j} />
          </div>
        ))}
      </div>

      <div className="hidden lg:grid grid-cols-5 gap-3 mt-3">
        {journeys.map((j) => (
          <LifestyleCard key={j.id} journey={j} />
        ))}
      </div>
    </div>
  );
}
