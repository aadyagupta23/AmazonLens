import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import InsightCard from "./InsightCard.jsx";
import { computeInsights } from "./insightsData.js";
import { useSustainability } from "../../contexts/SustainabilityContext.jsx";
import { getSustainabilityData, getUserSustainabilityScore } from "../../utils/sustainability.js";

function computeSustainabilityInsights() {
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem("amz_orders") || "[]"); } catch {}

  const allItems = orders.flatMap((o) => o.items || []);
  const userScore = getUserSustainabilityScore(allItems);

  if (userScore === null) return [];

  const ecoItems = allItems.filter((i) => getSustainabilityData(i.id).score >= 70);
  const seen = new Set();
  const uniqueEco = ecoItems.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  return [
    {
      id: "sustainability_score",
      type: "sustainability_score",
      title: "Your sustainability score",
      value: `${userScore}/100`,
      subtext: `Based on ${allItems.length} item${allItems.length !== 1 ? "s" : ""} purchased`,
      delta: null,
      deltaLabel: null,
      cta: { label: "View dashboard", href: "/sustainability" },
      icon: "leaf",
      accentColor: "green",
    },
    {
      id: "sustainability_recyclable",
      type: "sustainability_recyclable",
      title: "Eco-friendly purchases",
      value: `${uniqueEco.length} product${uniqueEco.length !== 1 ? "s" : ""}`,
      subtext:
        allItems.length > 0
          ? `${Math.round((uniqueEco.length / allItems.length) * 100)}% of your purchases`
          : "No purchases yet",
      delta: null,
      deltaLabel: null,
      cta: { label: "Shop more eco", href: "/s?q=eco+certified" },
      icon: "leaf",
      accentColor: "green",
    },
  ];
}

export default function ShoppingInsights({ title = "Your Shopping Insights" }) {
  const { prefs } = useSustainability();

  const insights = useMemo(() => {
    const base = computeInsights();
    const sus = prefs.enabled ? computeSustainabilityInsights() : [];
    return [...base, ...sus];
  }, [prefs.enabled]);

  if (insights.length === 0) return null;

  const COL_MAP = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
  const lgCols = COL_MAP[insights.length] || "lg:grid-cols-5";

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
          <span className="text-xs text-[#565959]">Based on your activity</span>
          {prefs.enabled && (
            <Link to="/sustainability" className="text-xs text-[#007185] hover:underline flex-shrink-0">
              Dashboard →
            </Link>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 ${lgCols} gap-3`}>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}
