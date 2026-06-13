import React, { useState } from "react";
import {
  RefreshCw, ShieldCheck, PackageOpen, Truck, Store,
  Info, Check, AlertTriangle, X, ChevronDown, ChevronUp,
} from "lucide-react";

const ICON_MAP = { RefreshCw, ShieldCheck, PackageOpen, Truck, Store };

// ── Status colour tokens ───────────────────────────────────────────────────
const STATUS_STYLE = {
  good:    { iconBg: "#f0fdf4", iconColor: "#16a34a", badgeBg: "#16a34a" },
  warning: { iconBg: "#fff7ed", iconColor: "#ea580c", badgeBg: "#ea580c" },
  bad:     { iconBg: "#fef2f2", iconColor: "#dc2626", badgeBg: "#dc2626" },
};

const BADGE_ICON = {
  good:    <Check size={9} strokeWidth={3} />,
  warning: <AlertTriangle size={9} strokeWidth={3} />,
  bad:     <X size={9} strokeWidth={3} />,
};

const OVERALL_STYLE = {
  VERIFIED: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  MIXED:    { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  FLAGGED:  { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
};

// ── TrustShield SVG logo ───────────────────────────────────────────────────
function TrustShieldLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="17" fill="#FFF3E0" />
      <path
        d="M17 5 L27 9.5 V17.5 C27 23 22.5 27.5 17 29 C11.5 27.5 7 23 7 17.5 V9.5 Z"
        fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinejoin="round"
      />
      <path
        d="M12.5 17 L15.5 20 L21.5 14"
        stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Individual signal row ──────────────────────────────────────────────────
function SignalRow({ signal, isLast }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const style = STATUS_STYLE[signal.status] || STATUS_STYLE.good;
  const Icon = ICON_MAP[signal.icon] || Store;

  return (
    <div className={`flex items-start gap-3 py-4 ${!isLast ? "border-b border-gray-100" : ""}`}>
      {/* Icon box with status badge */}
      <div className="relative flex-shrink-0 w-11 h-11">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: style.iconBg }}
        >
          <Icon size={19} style={{ color: style.iconColor }} />
        </div>
        <span
          className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: style.badgeBg }}
        >
          {BADGE_ICON[signal.status]}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[#0F1111] font-bold text-sm leading-snug">{signal.headline}</p>
        <p className="text-[#565959] text-xs mt-0.5 leading-snug">{signal.subtitle}</p>
      </div>

      {/* ⓘ info button + tooltip */}
      <div className="relative flex-shrink-0 mt-0.5">
        <button
          onClick={() => setTooltipOpen((v) => !v)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors"
        >
          <Info size={12} />
        </button>

        {tooltipOpen && (
          <>
            {/* Backdrop to close */}
            <div className="fixed inset-0 z-10" onClick={() => setTooltipOpen(false)} />
            <div className="absolute right-0 bottom-8 z-20 w-64 bg-[#131921] rounded-xl shadow-2xl p-4">
              <p className="text-[#FF9900] text-[10px] font-bold uppercase tracking-widest mb-2">
                How We Measure
              </p>
              <p className="text-white text-xs leading-relaxed">{signal.howWeMeasure}</p>
              {/* Caret */}
              <div
                className="absolute right-[10px] bottom-[-6px] w-3 h-3 rotate-45"
                style={{ backgroundColor: "#131921" }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main TrustPanel component ──────────────────────────────────────────────
export default function TrustPanel({ data, loading, sellerName }) {
  const [expanded, setExpanded] = useState(true);

  const overallStyle = OVERALL_STYLE[data?.status] || OVERALL_STYLE.VERIFIED;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <TrustShieldLogo size={36} />
          <div>
            <div className="text-sm font-bold leading-tight">
              <span className="text-[#0F1111]">Trust</span>
              <span className="text-[#FF9900]">Lens</span>
            </div>
            <div className="text-[#565959] text-[11px] leading-tight">Verified by Amazon data</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Numeric score */}
          {!loading && data && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: overallStyle.bg, color: overallStyle.text, border: `1px solid ${overallStyle.border}` }}
            >
              {data.companyScore}/100
            </span>
          )}

          {/* VERIFIED / MIXED / FLAGGED badge */}
          {!loading && data && (
            <span
              className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: overallStyle.bg, color: overallStyle.text, border: `1px solid ${overallStyle.border}` }}
            >
              <Check size={10} strokeWidth={3} />
              {data.status}
            </span>
          )}

          {loading && (
            <span className="text-xs text-[#FF9900] font-medium animate-pulse">Analyzing…</span>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-gray-600 ml-1"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="px-4 py-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 py-4 border-b border-gray-50 last:border-0">
              <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signals */}
      {!loading && data && expanded && (
        <div className="px-4">
          {data.signals.map((signal, i) => (
            <SignalRow
              key={signal.key}
              signal={signal}
              isLast={i === data.signals.length - 1}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {!loading && data && expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <p className="text-[10px] text-[#999] leading-relaxed">
            Signals drawn from verified purchases &amp; fulfilment data. Updated weekly.
            {sellerName && (
              <span className="ml-1 text-[#007185]">Seller: {sellerName}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
