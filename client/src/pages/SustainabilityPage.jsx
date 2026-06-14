import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Leaf, Recycle, Package, Globe, Award, TrendingUp, ChevronRight } from "lucide-react";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { getSustainabilityData, getUserSustainabilityScore, getSustainabilityColor } from "../utils/sustainability.js";

function loadOrders() {
  try { return JSON.parse(localStorage.getItem("amz_orders") || "[]"); } catch { return []; }
}

function computeMonthlyTrend(orders) {
  const byMonth = {};
  orders.forEach((o) => {
    const d = new Date(o.placedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    if (!byMonth[key]) byMonth[key] = { label, scores: [], sortKey: d.getFullYear() * 12 + d.getMonth() };
    (o.items || []).forEach((i) => byMonth[key].scores.push(getSustainabilityData(i.id).score));
  });
  return Object.values(byMonth)
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-6)
    .map((m) => ({
      month: m.label,
      score: m.scores.length ? Math.round(m.scores.reduce((s, v) => s + v, 0) / m.scores.length) : 0,
    }));
}

const ACHIEVEMENTS = [
  { emoji: "🌱", title: "Eco Starter",       desc: "Made your first purchase",                      threshold: (orders) => orders.length >= 1 },
  { emoji: "♻",  title: "Conscious Shopper", desc: "3+ eco-friendly purchases (score ≥ 70)",        threshold: (_, ecoCount) => ecoCount >= 3 },
  { emoji: "🌍", title: "Green Explorer",    desc: "Purchased from 3+ product categories",          threshold: (orders) => new Set(orders.flatMap(o => (o.items||[]).map(i => (i.category||"").split(">")[0].trim()))).size >= 3 },
  { emoji: "🌿", title: "Sustainability Pro", desc: "Average sustainability score above 75",         threshold: (_, _2, score) => score !== null && score >= 75 },
  { emoji: "⭐", title: "Carbon Champion",   desc: "5+ eco-certified purchases (score ≥ 80)",       threshold: (_, _2, _3, certCount) => certCount >= 5 },
];

export default function SustainabilityPage() {
  const { prefs, toggleMode } = useSustainability();

  const orders = useMemo(() => loadOrders(), []);
  const allItems = useMemo(() => orders.flatMap((o) => o.items || []), [orders]);

  const userScore = getUserSustainabilityScore(allItems, prefs);
  const c = userScore !== null ? getSustainabilityColor(userScore) : getSustainabilityColor(0);

  const monthlyTrend = useMemo(() => computeMonthlyTrend(orders), [orders]);
  const maxTrend = monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map((t) => t.score), 1) : 1;

  const ecoItems = useMemo(() => {
    const seen = new Set();
    return allItems
      .map((i) => ({ ...i, susScore: getSustainabilityData(i.id).score }))
      .filter((i) => i.susScore >= 70 && !seen.has(i.id) && seen.add(i.id))
      .sort((a, b) => b.susScore - a.susScore)
      .slice(0, 5);
  }, [allItems]);

  const ecoCount = ecoItems.length;
  const certCount = useMemo(
    () => allItems.filter((i) => getSustainabilityData(i.id).certified).length,
    [allItems]
  );

  const ecoCategories = useMemo(
    () => new Set(ecoItems.map((i) => (i.category || "").split(">")[0].trim())).size,
    [ecoItems]
  );

  const sustainablePackagingPct =
    allItems.length > 0
      ? Math.round((allItems.filter((i) => getSustainabilityData(i.id).recyclability >= 70).length / allItems.length) * 100)
      : 0;

  const stats = [
    { Icon: Recycle, label: "Eco-Friendly Purchases", value: String(ecoCount),                   sub: "score ≥ 70",              color: "text-[#1B5E20]", bg: "bg-green-50"  },
    { Icon: Package, label: "Sustainable Packaging",  value: `${sustainablePackagingPct}%`,       sub: "of your purchases",       color: "text-[#558B2F]", bg: "bg-lime-50"   },
    { Icon: Globe,   label: "Categories Purchased",   value: String(new Set(allItems.map((i) => (i.category || "").split(">")[0].trim())).size || 0), sub: "distinct categories", color: "text-[#007185]", bg: "bg-blue-50" },
    { Icon: Leaf,    label: "Eco-Certified Items",    value: String(certCount),                   sub: "certified products",      color: "text-[#1B5E20]", bg: "bg-green-50"  },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <div className="text-xs text-[#565959] mb-4 flex items-center gap-1">
        <Link to="/" className="text-[#007185] hover:underline">Home</Link>
        <span>›</span>
        <Link to="/account" className="text-[#007185] hover:underline">Account</Link>
        <span>›</span>
        <span>Sustainability</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Leaf size={22} className="text-[#1B5E20]" />
        <h1 className="text-2xl font-medium text-[#0F1111]">Your Sustainability Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Score ring */}
        <div className="md:col-span-1 bg-white border border-[#DDD] rounded p-5 flex flex-col items-center text-center">
          {userScore !== null ? (
            <>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E8F5E9" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={c.hex}
                  strokeWidth="7"
                  strokeDasharray={`${(userScore / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
                <text x="40" y="45" textAnchor="middle" fontSize="20" fontWeight="700" fill={c.hex}>
                  {userScore}
                </text>
              </svg>
              <p className="font-bold text-[#0F1111] mt-2">Your Sustainability Score</p>
              <p className="text-xs text-[#565959] mt-0.5">{c.label}</p>
              <p className="text-xs text-[#565959] mt-1">Based on {allItems.length} purchase{allItems.length !== 1 ? "s" : ""}</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <Leaf size={32} className="text-[#C8E6C9] mb-2" />
              <p className="text-sm text-[#565959]">No purchases yet</p>
              <p className="text-xs text-[#565959] mt-1">Score appears after your first order</p>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {stats.map(({ Icon, label, value, sub, color, bg }) => (
            <div key={label} className={`${bg} rounded p-3 border border-current/10`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={color} />
                <span className="text-xs text-[#565959]">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-[#565959]">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly trend — only show if there's data */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#1B5E20]" />
            <h2 className="font-bold text-[#0F1111] text-base">Monthly Eco Score Trend</h2>
            <span className="text-xs text-[#565959]">Avg sustainability score per month ordered</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {monthlyTrend.map(({ month, score }, idx) => (
              <div key={month + idx} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-[#565959] font-medium">{score}</span>
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${(score / maxTrend) * 56}px`,
                    backgroundColor: idx === monthlyTrend.length - 1 ? "#1B5E20" : "#C8E6C9",
                  }}
                />
                <span className="text-[10px] text-[#565959]">{month}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top eco purchases — only from real orders */}
      {ecoItems.length > 0 && (
        <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
          <h2 className="font-bold text-[#0F1111] text-base mb-3">Your Top Eco-Friendly Purchases</h2>
          <div className="divide-y divide-gray-100">
            {ecoItems.map((item) => {
              const pc = getSustainabilityColor(item.susScore);
              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#0F1111]">{item.name}</p>
                    <p className="text-xs text-[#565959]">{(item.category || "").split(">").pop().trim()}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${pc.hex}20`, color: pc.hex }}
                  >
                    🌱 {item.susScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements — unlocked state driven by real data */}
      <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-[#1B5E20]" />
          <h2 className="font-bold text-[#0F1111] text-base">Sustainability Achievements</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(({ emoji, title, desc, threshold }) => {
            const unlocked = threshold(orders, ecoCount, userScore, certCount);
            return (
              <div
                key={title}
                className={`rounded p-3 border text-center transition-all ${
                  unlocked ? "border-[#C8E6C9] bg-green-50" : "border-[#EEE] bg-gray-50 opacity-50 grayscale"
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs font-bold text-[#0F1111]">{title}</p>
                <p className="text-[10px] text-[#565959] mt-0.5 leading-tight">{desc}</p>
                {!unlocked && <p className="text-[10px] text-[#999] mt-1">Locked</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings shortcut */}
      <div className="bg-green-50 border border-[#C8E6C9] rounded p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#1B5E20]">
            Sustainability Mode is currently {prefs.enabled ? "ON" : "OFF"}
          </p>
          <p className="text-xs text-[#565959] mt-0.5">
            {prefs.enabled
              ? "Eco signals are showing across your shopping experience."
              : "Enable to see sustainability data throughout AmazonLens."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMode}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              prefs.enabled
                ? "bg-[#1B5E20] text-white hover:bg-[#145216]"
                : "bg-white border border-[#1B5E20] text-[#1B5E20] hover:bg-green-50"
            }`}
          >
            {prefs.enabled ? "Disable Mode" : "Enable Mode"}
          </button>
          <Link to="/account" className="text-xs text-[#007185] hover:underline flex items-center gap-0.5">
            Settings <ChevronRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
