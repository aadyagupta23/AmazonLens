import React from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { getTrustColor } from "../../utils/format.js";

export default function TrustScore({ score, size = "md" }) {
  const trust = getTrustColor(score);
  const Icon = score > 75 ? ShieldCheck : score >= 50 ? Shield : ShieldAlert;
  const isLg = size === "lg";

  return (
    <div className={`flex items-center gap-2 ${isLg ? "py-2" : "py-1"}`}>
      {/* Circular score */}
      <div className="relative flex-shrink-0">
        <svg width={isLg ? 56 : 44} height={isLg ? 56 : 44} viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#E5E7EB" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={trust.hex}
            strokeWidth="4"
            strokeDasharray={`${(score / 100) * 113} 113`}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
          <text
            x="22"
            y="26"
            textAnchor="middle"
            fontSize={isLg ? "11" : "10"}
            fontWeight="700"
            fill={trust.hex}
          >
            {score}
          </text>
        </svg>
      </div>

      {/* Label */}
      <div>
        <div className={`flex items-center gap-1.5 ${trust.hex === "#067D62" ? "text-[#067D62]" : trust.hex === "#FF9900" ? "text-[#FF9900]" : "text-[#CC0C39]"}`}>
          <Icon size={isLg ? 18 : 14} />
          <span className={`font-bold ${isLg ? "text-base" : "text-sm"}`}>
            Trust Score: {score}/100 — {trust.label}
          </span>
        </div>
        <p className="text-xs text-[#565959] mt-0.5">
          {score > 75
            ? "Reviews and pricing patterns look authentic."
            : score >= 50
            ? "Some pricing anomalies or review patterns detected."
            : "Significant trust concerns detected. Review carefully."}
        </p>
      </div>
    </div>
  );
}
