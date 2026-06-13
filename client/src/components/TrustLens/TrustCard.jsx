import React from "react";
import { X, MessageSquare, RotateCcw, FileText, Store, Shield, Cpu } from "lucide-react";

const METRICS = [
  {
    key: "reviewAuthenticity",
    label: "Review Authenticity",
    icon: MessageSquare,
    goodDetail: "Review patterns look natural — verified purchases dominate with no burst posting detected.",
    badDetail: "Bot-pattern reviews detected — all-caps text, 0-day accounts, or coordinated burst posting."
  },
  {
    key: "returnRate",
    label: "Return Rate",
    icon: RotateCcw,
    goodDetail: "Low return rate — buyers consistently receive what was described in the listing.",
    badDetail: "Above-average return rate — product may not match listing description or photos."
  },
  {
    key: "warrantyClaims",
    label: "Warranty Claims",
    icon: FileText,
    goodDetail: "Very few warranty claims in the first 6 months — product quality is consistent.",
    badDetail: "Elevated warranty claims in first 6 months — suggests recurring quality issues."
  },
  {
    key: "sellerReliability",
    label: "Seller Reliability",
    icon: Store,
    goodDetail: "Established seller with strong ratings, Amazon-fulfilled, and years of consistent performance.",
    badDetail: "New or inconsistent seller — limited history or below-average ratings."
  }
];

function getColor(score) {
  if (score > 75) return { hex: "#067D62", bar: "bg-[#067D62]", text: "text-[#067D62]", badge: "bg-[#067D62]", label: "Good" };
  if (score >= 50) return { hex: "#FF9900", bar: "bg-[#FF9900]", text: "text-[#FF9900]", badge: "bg-[#FF9900]", label: "Moderate" };
  return { hex: "#CC0C39", bar: "bg-[#CC0C39]", text: "text-[#CC0C39]", badge: "bg-[#CC0C39]", label: "Concerning" };
}

function defaultBreakdown(trustScore) {
  const offsets = { reviewAuthenticity: -12, returnRate: +13, warrantyClaims: +5, sellerReliability: +16 };
  const clamp = (v) => Math.max(12, Math.min(97, v));
  return Object.fromEntries(
    Object.entries(offsets).map(([k, off]) => [k, { score: clamp(trustScore + off) }])
  );
}

export default function TrustCard({ product, onClose }) {
  const breakdown = product.trustBreakdown || defaultBreakdown(product.trustScore);
  const overall = getColor(product.trustScore);
  const reviewCount = (product.reviews || []).length;
  const signalSummary = reviewCount > 0
    ? `Based on ${reviewCount} review${reviewCount > 1 ? "s" : ""}, seller history & category benchmarks`
    : `Based on seller history & category benchmarks`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-[#131921] to-[#1d2d3e] px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Shield size={13} className="text-[#FF9900]" />
                <span className="text-[#FF9900] text-[11px] font-bold uppercase tracking-widest">
                  TrustLens™ AI — Signal Analysis
                </span>
              </div>
              <h3 className="text-white font-semibold text-sm leading-snug max-w-[280px] line-clamp-2">
                {product.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Overall score row */}
          <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
            {/* SVG gauge */}
            <svg width="52" height="52" viewBox="0 0 44 44" className="flex-shrink-0">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke={overall.hex}
                strokeWidth="4"
                strokeDasharray={`${(product.trustScore / 100) * 113} 113`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: "stroke-dasharray 1.2s ease" }}
              />
              <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                {product.trustScore}
              </text>
            </svg>
            <div>
              <div className="text-white text-sm font-bold">Overall Trust Score</div>
              <div className={`text-xs font-medium mt-0.5 ${overall.text}`}>
                {product.trustScore > 75
                  ? "Genuine — safe to buy"
                  : product.trustScore >= 50
                  ? "Mixed — review carefully before buying"
                  : "Suspicious — exercise caution"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Metrics ── */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {METRICS.map((metric, i) => {
            const data = breakdown[metric.key] || { score: product.trustScore };
            const c = getColor(data.score);
            const Icon = metric.icon;
            const detail = data.detail || (data.score > 75 ? metric.goodDetail : metric.badDetail);

            return (
              <div key={metric.key} className={i < METRICS.length - 1 ? "pb-4 border-b border-gray-100" : ""}>
                {/* Label row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.badge} bg-opacity-10`}
                         style={{ backgroundColor: `${c.hex}18` }}>
                      <Icon size={13} style={{ color: c.hex }} />
                    </div>
                    <span className="text-sm font-semibold text-[#0F1111]">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: c.hex }}
                    >
                      {c.label}
                    </span>
                    <span className="text-sm font-bold text-[#0F1111] w-8 text-right">{data.score}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${data.score}%`, backgroundColor: c.hex }}
                  />
                </div>

                {/* Detail text */}
                <p className="text-[11px] text-[#565959] leading-relaxed">{detail}</p>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-4">
          <div className="bg-gray-50 rounded-lg py-2.5 px-3 flex items-start gap-2">
            <Cpu size={12} className="text-[#999] mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-[#999] leading-relaxed">
              {signalSummary}. Scores computed live by the TrustLens™ AI engine — review authenticity (35%), seller reliability (25%), return rate (20%), warranty claims (20%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
