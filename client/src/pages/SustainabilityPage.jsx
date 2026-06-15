import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Leaf, Recycle, Package, Globe, Award, RefreshCw, ChevronRight } from "lucide-react";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { getSustainabilityColor } from "../utils/sustainability.js";
import { API } from "../utils/format.js";

function computeMonthlyTrend(orders, scoreMap) {
  const byMonth = {};
  orders.forEach((o) => {
    const d = new Date(o.placedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    if (!byMonth[key]) byMonth[key] = { label, scores: [], sortKey: d.getFullYear() * 12 + d.getMonth() };
    (o.items || []).forEach((i) => {
      const s = scoreMap[i.id];
      if (s != null) byMonth[key].scores.push(s);
    });
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
  { emoji: "🌱", title: "Eco Starter",        desc: "Made your first purchase",                     threshold: (orders) => orders.length >= 1 },
  { emoji: "♻",  title: "Conscious Shopper",  desc: "3+ eco-friendly purchases (score ≥ 70)",       threshold: (_, ecoCount) => ecoCount >= 3 },
  { emoji: "🌍", title: "Green Explorer",     desc: "Purchased from 3+ product categories",         threshold: (orders) => new Set(orders.flatMap(o => (o.items||[]).map(i => (i.category||"").split(">")[0].trim()))).size >= 3 },
  { emoji: "🌿", title: "Sustainability Pro",  desc: "Average sustainability score above 75",        threshold: (_, _2, score) => score !== null && score >= 75 },
  { emoji: "⭐", title: "Carbon Champion",    desc: "5+ eco-certified purchases (score ≥ 80)",      threshold: (_, _2, _3, certCount) => certCount >= 5 },
];

export default function SustainabilityPage() {
  const { prefs, toggleMode } = useSustainability();
  const { orders } = useOrders();

  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  // productId → { ecoScore, certified, ecoLabel, companyName }
  const [ecoMap, setEcoMap] = useState({});
  // productId → { name, category, thumbnail }
  const [productMap, setProductMap] = useState({});

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/companies`).then((r) => r.json()),
      fetch(`${API}/api/products`).then((r) => r.json()),
    ])
      .then(([companyData, productData]) => {
        const eco = {};
        for (const co of companyData.companies || []) {
          for (const pid of co.products || []) {
            eco[pid] = {
              ecoScore:    co.ecoScore ?? 0,
              certified:   (co.eco?.certifications?.length ?? 0) >= 2,
              ecoLabel:    co.ecoLabel ?? "Unknown",
              companyName: co.name,
            };
          }
        }
        setEcoMap(eco);

        const pmap = {};
        for (const p of productData.products || productData || []) {
          pmap[p.id] = { name: p.name, category: p.category, thumbnail: p.thumbnail };
        }
        setProductMap(pmap);
        setLastFetched(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getScore    = (id) => ecoMap[id]?.ecoScore ?? 0;
  const isCertified = (id) => ecoMap[id]?.certified ?? false;

  const allItems = useMemo(() => orders.flatMap((o) => o.items || []), [orders]);

  const userScore = useMemo(() => {
    if (allItems.length === 0 || loading) return null;
    const scores = allItems.map((i) => getScore(i.id)).filter((s) => s > 0);
    if (!scores.length) return null;
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    let bonus = 0;
    if (prefs.prioritizeEco)       bonus += 3;
    if (prefs.recyclablePackaging) bonus += 2;
    if (prefs.ethicalBrands)       bonus += 2;
    return Math.min(100, avg + bonus);
  }, [allItems, ecoMap, prefs, loading]);

  const c = getSustainabilityColor(userScore ?? 0);

  const monthlyTrend = useMemo(() => {
    const scoreMap = {};
    allItems.forEach((i) => { scoreMap[i.id] = getScore(i.id); });
    return computeMonthlyTrend(orders, scoreMap);
  }, [orders, ecoMap]);

  const ecoItems = useMemo(() => {
    const seen = new Set();
    return allItems
      .map((i) => ({
        ...i,
        name:      productMap[i.id]?.name      ?? i.name,
        category:  productMap[i.id]?.category  ?? i.category,
        thumbnail: productMap[i.id]?.thumbnail ?? i.thumbnail,
        susScore:  getScore(i.id),
      }))
      .filter((i) => i.susScore >= 70 && !seen.has(i.id) && seen.add(i.id))
      .sort((a, b) => b.susScore - a.susScore)
      .slice(0, 5);
  }, [allItems, ecoMap, productMap]);

  const ecoCount   = ecoItems.length;
  const certCount  = useMemo(() => allItems.filter((i) => isCertified(i.id)).length, [allItems, ecoMap]);
  const totalWithScore = useMemo(() => allItems.filter((i) => getScore(i.id) > 0).length, [allItems, ecoMap]);

  const sustainablePackagingPct = totalWithScore > 0
    ? Math.round((allItems.filter((i) => getScore(i.id) >= 70).length / totalWithScore) * 100)
    : 0;

  const avgScore = userScore ?? 0;
  const industryAvg = 54; // industry benchmark from server eco formula baseline

  // Personality — driven entirely by real computed metrics
  const personality = (() => {
    if (avgScore >= 85 && certCount >= 5)
      return { title: "Eco Champion 🌍", description: `Your average score of ${avgScore} across ${allItems.length} purchases puts you in the top tier of sustainable shoppers. ${certCount} certified items in your history.` };
    if (avgScore >= 70)
      return { title: "Conscious Shopper 🌱", description: `You score ${avgScore} on average — ${avgScore - industryAvg} points above the industry benchmark of ${industryAvg}. ${ecoCount} of your purchases were eco-friendly.` };
    if (avgScore >= 50)
      return { title: "Balanced Buyer ♻️", description: `Your average score is ${avgScore}. ${sustainablePackagingPct}% of your purchases use sustainable packaging. Small switches could push your score past 70.` };
    return { title: "Opportunity Explorer 🌿", description: `Your average score is ${avgScore} across ${totalWithScore} scored purchases. Choosing eco-certified products from your usual categories would improve this quickly.` };
  })();

  // Insight — uses real numbers throughout
  const insight = (() => {
    if (!allItems.length) return "Place your first order to see personalised sustainability insights.";
    if (avgScore >= 80) return `Your average eco score of ${avgScore} is ${avgScore - industryAvg} points above the industry average of ${industryAvg}. ${certCount} certified purchases contribute directly to this.`;
    if (sustainablePackagingPct < 50) return `Only ${sustainablePackagingPct}% of your ${totalWithScore} scored purchases use sustainable packaging — this is the fastest area to improve.`;
    if (certCount < 3) return `You have ${certCount} eco-certified purchase${certCount !== 1 ? "s" : ""}. Adding ${3 - certCount} more certified product${3 - certCount !== 1 ? "s" : ""} unlocks the Conscious Shopper achievement.`;
    return `Your sustainability habits are improving — ${ecoCount} eco-friendly purchases across ${new Set(ecoItems.map(i => (i.category||"").split(">")[0].trim())).size} categories.`;
  })();

  const improvementTarget = avgScore > 0 && avgScore < 85
    ? Math.max(1, Math.ceil((85 - avgScore) / 5))
    : null;

  const stats = [
    { Icon: Recycle, label: "Eco-Friendly Purchases", value: String(ecoCount),             sub: "score ≥ 70",              color: "text-[#1B5E20]", bg: "bg-green-50"  },
    { Icon: Package, label: "Sustainable Packaging",  value: `${sustainablePackagingPct}%`, sub: "of your purchases",       color: "text-[#558B2F]", bg: "bg-lime-50"   },
    { Icon: Globe,   label: "Categories Shopped",     value: String(new Set(allItems.map((i) => (i.category || "").split(">")[0].trim())).size || 0), sub: "distinct categories", color: "text-[#007185]", bg: "bg-blue-50" },
    { Icon: Leaf,    label: "Eco-Certified Items",    value: String(certCount),             sub: "certified products",      color: "text-[#1B5E20]", bg: "bg-green-50"  },
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

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Leaf size={22} className="text-[#1B5E20]" />
          <h1 className="text-2xl font-medium text-[#0F1111]">Your Sustainability Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px] text-[#999]">
              Updated {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-1.5 rounded text-[#565959] hover:text-[#0F1111] hover:bg-gray-100 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={toggleMode}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              prefs.enabled
                ? "bg-[#1B5E20] text-white hover:bg-[#145216]"
                : "bg-white border border-[#1B5E20] text-[#1B5E20] hover:bg-green-50"
            }`}
          >
            <Leaf size={11} />
            {prefs.enabled ? "Eco Mode: On" : "Eco Mode: Off"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#565959] gap-2">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Fetching your sustainability data…</span>
        </div>
      ) : (
        <>
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
                  <p className="text-xs text-[#565959] mt-1">Based on {totalWithScore} purchase{totalWithScore !== 1 ? "s" : ""}</p>
                  <p className="text-[10px] text-[#999] mt-1">Industry avg: {industryAvg}</p>
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

          {/* Personality */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={16} className="text-green-600" />
              <span className="text-xs font-bold uppercase text-green-700">Sustainability Personality</span>
            </div>
            <h2 className="text-xl font-bold text-[#0F1111]">{personality.title}</h2>
            <p className="text-sm text-[#565959] mt-2">{personality.description}</p>
          </div>

          {/* Monthly trend */}
          {monthlyTrend.length > 0 && (
            <div className="bg-white border border-[#DDD] rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-[#0F1111]">Sustainability Evolution</h2>
                  <p className="text-xs text-[#565959]">Average eco score per month from your orders</p>
                </div>
                <div className="text-sm font-bold text-green-700">Current: {userScore ?? "—"}</div>
              </div>
              <div className="space-y-3">
                {monthlyTrend.map(({ month, score }) => (
                  <div key={month} className="bg-[#FAFAFA] rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{month}</span>
                      <span className="font-bold text-green-700">{score}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 rounded-full" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insight */}
          <div className="bg-[#FFF8E7] border border-[#FFD77A] rounded-xl p-5 mb-4">
            <h2 className="font-bold text-[#0F1111] mb-2">Amazon Lens Insight</h2>
            <p className="text-sm text-[#565959]">{insight}</p>
            {improvementTarget && (
              <p className="text-sm font-medium text-[#B7791F] mt-3">
                Adding roughly {improvementTarget} more eco-certified purchase{improvementTarget !== 1 ? "s" : ""} could push your score closer to 85+.
              </p>
            )}
          </div>

          {/* Top eco purchases */}
          {ecoItems.length > 0 && (
            <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
              <h2 className="font-bold text-[#0F1111] text-base mb-3">Your Top Eco-Friendly Purchases</h2>
              <div className="divide-y divide-gray-100">
                {ecoItems.map((item) => {
                  const pc = getSustainabilityColor(item.susScore);
                  const ecoInfo = ecoMap[item.id];
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.thumbnail && (
                          <img src={item.thumbnail} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm text-[#0F1111]">{item.name}</p>
                          <p className="text-xs text-[#565959]">
                            {(item.category || "").split(">").pop().trim()}
                            {ecoInfo?.companyName && ` · ${ecoInfo.companyName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${pc.hex}20`, color: pc.hex }}
                        >
                          🌱 {item.susScore}
                        </span>
                        {ecoInfo?.ecoLabel && (
                          <span className="text-[10px] text-[#565959]">{ecoInfo.ecoLabel}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements */}
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
                    {!unlocked && <p className="text-[10px] text-[#999] mt-1">Not yet unlocked</p>}
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
        </>
      )}
    </div>
  );
}
