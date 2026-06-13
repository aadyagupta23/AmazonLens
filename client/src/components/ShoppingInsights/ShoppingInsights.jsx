import React, { useState, useEffect } from "react";
import InsightCard from "./InsightCard.jsx";
import { INSIGHTS_MOCK } from "./insightsData.js";

/**
 * ShoppingInsights — personalised analytics layer, sits near the bottom of
 * the homepage so it feels like a summary rather than a primary feature.
 *
 * Props (all optional):
 *   fetchInsights – async () => insight[]  hook up to /api/sense/insights when ready
 *   title         – string
 */
export default function ShoppingInsights({
  fetchInsights = null,
  title = "Your Shopping Insights",
}) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = fetchInsights ? await fetchInsights() : INSIGHTS_MOCK;
        if (!cancelled) setInsights(data);
      } catch {
        if (!cancelled) setInsights(INSIGHTS_MOCK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchInsights]);

  return (
    <div className="bg-white rounded shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-[#0F1111] text-lg">{title}</h2>
        <span className="text-xs text-[#565959]">Based on your activity · Updated daily</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-[#DDD] rounded h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
