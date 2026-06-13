import React from "react";
import { Link } from "react-router-dom";
import { Leaf, Recycle, Package, Globe, Award, TrendingUp, ChevronRight } from "lucide-react";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { getUserSustainabilityScore, getSustainabilityColor } from "../utils/sustainability.js";

const MONTHLY_TREND = [
  { month: "Jan", score: 62 }, { month: "Feb", score: 65 }, { month: "Mar", score: 68 },
  { month: "Apr", score: 66 }, { month: "May", score: 72 }, { month: "Jun", score: 78 },
];

const ACHIEVEMENTS = [
  { emoji: "🌱", title: "Eco Starter",        desc: "Made your first eco-friendly purchase",         unlocked: true  },
  { emoji: "♻",  title: "Conscious Shopper",  desc: "3+ purchases with recyclable packaging",        unlocked: true  },
  { emoji: "🌍", title: "Green Explorer",     desc: "Browsed 10+ sustainable products",              unlocked: true  },
  { emoji: "🌿", title: "Sustainability Pro",  desc: "Maintained score above 80 for a full month",   unlocked: false },
  { emoji: "⭐", title: "Carbon Champion",    desc: "Offset 5kg CO₂ through low-impact purchases",   unlocked: false },
];

const ECO_PURCHASES = [
  { name: "Prestige Pressure Cooker 5L", score: 83, category: "Home & Kitchen" },
  { name: "Nescafé Gold Blend 200g",     score: 88, category: "Grocery"        },
  { name: "JBL Cinema SB271 Soundbar",   score: 74, category: "Electronics"    },
];

export default function SustainabilityPage() {
  const { prefs, toggleMode } = useSustainability();
  const { items } = useCart();

  const userScore = getUserSustainabilityScore(items, prefs);
  const c = getSustainabilityColor(userScore);

  const maxTrend = Math.max(...MONTHLY_TREND.map((t) => t.score));

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      {/* Breadcrumb */}
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
        {/* Personal score card */}
        <div className="md:col-span-1 bg-white border border-[#DDD] rounded p-5 flex flex-col items-center text-center">
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
          <p className="text-xs text-[#565959] mt-2">Better than <strong>68%</strong> of shoppers</p>
        </div>

        {/* Stats grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {[
            { Icon: Recycle, label: "Recyclable Purchases", value: "12",   sub: "this month",        color: "text-[#1B5E20]", bg: "bg-green-50"  },
            { Icon: Package, label: "Sustainable Packaging", value: "73%",  sub: "of your purchases", color: "text-[#558B2F]", bg: "bg-lime-50"   },
            { Icon: Globe,   label: "Carbon Footprint",     value: "Low",  sub: "compared to average", color: "text-[#007185]", bg: "bg-blue-50"  },
            { Icon: Leaf,    label: "Eco-Certified Items",  value: "4",    sub: "eco-certified brands", color: "text-[#1B5E20]", bg: "bg-green-50" },
          ].map(({ Icon, label, value, sub, color, bg }) => (
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

      {/* Monthly trend */}
      <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[#1B5E20]" />
          <h2 className="font-bold text-[#0F1111] text-base">Monthly Progress</h2>
        </div>
        <div className="flex items-end gap-2 h-20">
          {MONTHLY_TREND.map(({ month, score }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-[#565959] font-medium">{score}</span>
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(score / maxTrend) * 56}px`,
                  backgroundColor: score === userScore || month === "Jun" ? "#1B5E20" : "#C8E6C9",
                }}
              />
              <span className="text-[10px] text-[#565959]">{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Eco-friendly purchases */}
      <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
        <h2 className="font-bold text-[#0F1111] text-base mb-3">Top Eco-Friendly Purchases</h2>
        <div className="divide-y divide-gray-100">
          {ECO_PURCHASES.map((p) => {
            const pc = getSustainabilityColor(p.score);
            return (
              <div key={p.name} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#0F1111]">{p.name}</p>
                  <p className="text-xs text-[#565959]">{p.category}</p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${pc.hex}20`, color: pc.hex }}
                >
                  🌱 {p.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-[#1B5E20]" />
          <h2 className="font-bold text-[#0F1111] text-base">Sustainability Achievements</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(({ emoji, title, desc, unlocked }) => (
            <div
              key={title}
              className={`rounded p-3 border text-center transition-all ${
                unlocked
                  ? "border-[#C8E6C9] bg-green-50"
                  : "border-[#EEE] bg-gray-50 opacity-50 grayscale"
              }`}
            >
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="text-xs font-bold text-[#0F1111]">{title}</p>
              <p className="text-[10px] text-[#565959] mt-0.5 leading-tight">{desc}</p>
              {!unlocked && <p className="text-[10px] text-[#999] mt-1">Locked</p>}
            </div>
          ))}
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
          <Link
            to="/account"
            className="text-xs text-[#007185] hover:underline flex items-center gap-0.5"
          >
            Settings <ChevronRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
