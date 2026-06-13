import React, { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { getTrustColor } from "../../utils/format.js";
import TrustCard from "./TrustCard.jsx";

export default function TrustScore({ score, size = "md", product, analyzing = false }) {
  const [showCard, setShowCard] = useState(false);
  const trust = getTrustColor(score);
  const Icon = score > 75 ? ShieldCheck : score >= 50 ? Shield : ShieldAlert;
  const isLg = size === "lg";
  const dim = isLg ? 56 : 44;

  return (
    <>
      <div className={`flex items-center gap-2 ${isLg ? "py-2" : "py-1"}`}>
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg width={dim} height={dim} viewBox="0 0 44 44">
            {/* Track */}
            <circle cx="22" cy="22" r="18" fill="none" stroke="#E5E7EB" strokeWidth="4" />

            {analyzing ? (
              /* Spinning scanner ring while backend computes */
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="#FF9900"
                strokeWidth="4"
                strokeDasharray="28 85"
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ animation: "spin 1.1s linear infinite", transformOrigin: "22px 22px" }}
              />
            ) : (
              /* Filled trust score ring */
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke={trust.hex}
                strokeWidth="4"
                strokeDasharray={`${(score / 100) * 113} 113`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
              />
            )}

            {/* Centre number or scan dots */}
            {analyzing ? (
              <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="#FF9900">···</text>
            ) : (
              <text
                x="22" y="26" textAnchor="middle"
                fontSize={isLg ? "11" : "10"} fontWeight="700" fill={trust.hex}
              >
                {score}
              </text>
            )}
          </svg>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Label + info trigger */}
        <div>
          <div className="flex items-center gap-1.5" style={{ color: analyzing ? "#FF9900" : trust.hex }}>
            {analyzing ? (
              <Shield size={isLg ? 18 : 14} className="text-[#FF9900]" />
            ) : (
              <Icon size={isLg ? 18 : 14} />
            )}

            <span className={`font-bold ${isLg ? "text-base" : "text-sm"}`}>
              {analyzing
                ? "TrustLens™ — Scanning signals…"
                : `Trust Score: ${score}/100 — ${trust.label}`}
            </span>

            {/* Info icon — only on product page where product prop is passed */}
            {!analyzing && product && (
              <button
                onClick={() => setShowCard(true)}
                title="See full trust breakdown"
                className="ml-0.5 rounded-full hover:bg-gray-100 p-0.5 transition-colors"
                style={{ color: trust.hex }}
              >
                <Info size={isLg ? 15 : 12} />
              </button>
            )}
          </div>

          <p className={`text-xs mt-0.5 ${analyzing ? "text-[#FF9900]" : "text-[#565959]"}`}>
            {analyzing
              ? "Analyzing review patterns, seller history & category benchmarks…"
              : score > 75
              ? "Reviews and seller signals look authentic."
              : score >= 50
              ? "Some review anomalies or seller signals detected."
              : "Significant trust concerns detected. Review carefully."}
          </p>
        </div>
      </div>

      {showCard && product && (
        <TrustCard product={product} onClose={() => setShowCard(false)} />
      )}
    </>
  );
}
