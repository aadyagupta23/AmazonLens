import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import InsightCard from "./InsightCard.jsx";
import { INSIGHTS_BASE, INSIGHTS_SUSTAINABILITY } from "./insightsData.js";
import { useSustainability } from "../../contexts/SustainabilityContext.jsx";

/**
 * ShoppingInsights — personalised analytics layer at the bottom of the homepage.
 *
 * When Sustainability Mode is on, two sustainability insight cards are appended
 * and a subtle "Sustainability Mode active" label appears in the header.
 *
 * Props (all optional):
 *   fetchInsights – async () => insight[]  hook in a live API when ready
 *   title         – string
 */
export default function ShoppingInsights({
  fetchInsights = null,
  title = "Your Shopping Insights",
}) {
  const { prefs } = useSustainability();
  const [baseInsights, setBaseInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = fetchInsights ? await fetchInsights() : INSIGHTS_BASE;
        if (!cancelled) setBaseInsights(data);
      } catch {
        if (!cancelled) setBaseInsights(INSIGHTS_BASE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchInsights]);

  // Merge sustainability insights when mode is on
  const insights = useMemo(() => {
    if (prefs.enabled) return [...baseInsights, ...INSIGHTS_SUSTAINABILITY];
    return baseInsights;
  }, [baseInsights, prefs.enabled]);

  // Tailwind requires static class names — use a lookup
  const COL_MAP = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
  const lgCols = COL_MAP[insights.length] || "lg:grid-cols-5";
  const gridClass = `grid grid-cols-2 sm:grid-cols-3 ${lgCols} gap-3`;

  return (
    <div className="bg-white rounded shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-[#0F1111] text-lg">{title}</h2>
          {prefs.enabled && (
            <span className="flex items-center gap-0.5 text-[10px] bg-green-50 text-[#1B5E20] border border-green-200 px-1.5 py-0.5 rounded-full font-medium">
              <Leaf size={9} /> Eco Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#565959]">Based on your activity · Updated daily</span>
          {prefs.enabled && (
            <Link to="/sustainability" className="text-xs text-[#007185] hover:underline flex-shrink-0">
              Dashboard →
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-[#DDD] rounded h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className={gridClass}>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
