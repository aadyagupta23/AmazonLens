import React, { useState } from "react";
import { RefreshCw, ShieldCheck, PackageOpen, Truck, Store, Star, Info, ChevronDown, ChevronUp, Check } from "lucide-react";

const ICON_MAP = { RefreshCw, ShieldCheck, PackageOpen, Truck, Store, Star };

const STATUS_STYLE = {
  VERIFIED: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", pill: "#16a34a" },
  TRUSTED:  { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", pill: "#0284c7" },
};

function TrustShieldLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="17" fill="#FFF3E0" />
      <path d="M17 5 L27 9.5 V17.5 C27 23 22.5 27.5 17 29 C11.5 27.5 7 23 7 17.5 V9.5 Z"
        fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12.5 17 L15.5 20 L21.5 14"
        stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalRow({ signal, isLast }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const Icon = ICON_MAP[signal.icon] || Store;

  return (
    <div className={`flex items-start gap-3 py-3.5 ${!isLast ? "border-b border-gray-100" : ""}`}>
      {/* Icon with check badge — identical style for every signal */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
          <Icon size={17} className="text-green-600" />
        </div>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
          <Check size={8} strokeWidth={3} className="text-white" />
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#0F1111] leading-snug">{signal.headline}</p>
        <p className="text-[#565959] text-xs mt-0.5 leading-snug">{signal.subtitle}</p>
      </div>

      {/* ⓘ tooltip */}
      <div className="relative flex-shrink-0 mt-0.5">
        <button
          onClick={() => setTooltipOpen((v) => !v)}
          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <Info size={11} />
        </button>
        {tooltipOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setTooltipOpen(false)} />
            <div className="absolute right-0 bottom-8 z-20 w-64 bg-[#131921] rounded-xl shadow-2xl p-4">
              <p className="text-[#FF9900] text-[10px] font-bold uppercase tracking-widest mb-2">How We Measure</p>
              <p className="text-white text-xs leading-relaxed">{signal.howWeMeasure}</p>
              <div className="absolute right-[10px] bottom-[-6px] w-3 h-3 rotate-45 bg-[#131921]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrustPanel({ data, loading, sellerName }) {
  const [expanded, setExpanded] = useState(true);
  const style = STATUS_STYLE[data?.status] || STATUS_STYLE.TRUSTED;
  const signals = data?.signals || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <TrustShieldLogo size={34} />
          <div>
            <div className="text-sm font-bold leading-tight">
              <span className="text-[#0F1111]">Trust</span>
              <span className="text-[#FF9900]">Lens</span>
              <span className="text-[#565959] font-normal text-xs">™</span>
            </div>
            <div className="text-[#565959] text-[11px] leading-tight">Company trust score</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!loading && data && (
            <>
              <span className="text-sm font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                {data.companyScore}<span className="font-normal text-xs">/100</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: style.pill }}>
                <Check size={10} strokeWidth={3} />
                {data.status}
              </span>
            </>
          )}
          {loading && <span className="text-xs text-[#FF9900] font-medium animate-pulse">Analyzing…</span>}
          <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600 ml-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="px-4 py-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signals */}
      {!loading && data && expanded && (
        <>
          {signals.length > 0 && (
            <div className="px-4 pt-3 pb-0.5">
              <p className="text-[11px] font-bold text-[#565959] uppercase tracking-wide">
                Why buyers trust this seller
              </p>
            </div>
          )}

          {signals.length > 0 ? (
            <div className="px-4">
              {signals.map((signal, i) => (
                <SignalRow key={signal.key} signal={signal} isLast={i === signals.length - 1} />
              ))}
            </div>
          ) : (
            <div className="px-4 py-5">
              <p className="text-sm text-[#565959] text-center">Not enough verified data to show trust signals.</p>
            </div>
          )}

          {/* Footer — formula summary */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 mt-1">
            <p className="text-[10px] text-[#999] leading-relaxed">
              Score = 50% review quality · 30% keep rate · 20% reorder rate.
              Calculated across {data.productCount > 1 ? `${data.productCount} products` : "this product"} by {sellerName || "this seller"}.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
