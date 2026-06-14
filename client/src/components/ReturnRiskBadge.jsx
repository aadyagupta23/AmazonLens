/**
 * ReturnRiskBadge
 *
 * Props:
 *   product — full product object (needs id, category, brand, price)
 *
 * Fetches risk data on mount, shows nothing if no risk found.
 */

import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useSense } from "../contexts/SenseContext.jsx";

const SEVERITY_CONFIG = {
  high:   { icon: ShieldAlert, bg: "bg-red-50",    border: "border-red-300",   text: "text-red-800",   label: "text-red-700"   },
  medium: { icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", label: "text-amber-700" },
  low:    { icon: AlertTriangle, bg: "bg-yellow-50",border: "border-yellow-200",text: "text-yellow-800",label: "text-yellow-600"},
  info:   { icon: Info,          bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-800",  label: "text-blue-600"  },
};

export default function ReturnRiskBadge({ product }) {
  const { getProductRisk, senseReady } = useSense();
  const [risk, setRisk] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!senseReady || !product?.id) return;
    setLoading(true);
    getProductRisk(product)
      .then((data) => setRisk(data))
      .catch(() => setRisk(null))
      .finally(() => setLoading(false));
  }, [product?.id, senseReady]);

  // Show nothing while loading or if there's no risk
  if (loading || !risk || risk.riskScore === 0 || risk.warnings.length === 0) return null;

  const topWarning = risk.warnings[0];
  const cfg = SEVERITY_CONFIG[topWarning.severity] || SEVERITY_CONFIG.low;
  const Icon = cfg.icon;
  const extraCount = risk.warnings.length - 1;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 my-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Icon size={16} className={`${cfg.label} flex-shrink-0 mt-0.5`} />
          <div>
            <span className={`text-sm font-semibold ${cfg.text}`}>
              Amazon Sense Warning · {risk.riskLabel}
            </span>
            <p className={`text-xs mt-0.5 ${cfg.text} opacity-90`}>{topWarning.message}</p>
          </div>
        </div>
        {risk.warnings.length > 1 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`text-xs flex items-center gap-0.5 ${cfg.label} flex-shrink-0`}
          >
            {expanded ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> +{extraCount} more</>}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 space-y-2 pl-6">
          <p className={`text-xs ${cfg.text} opacity-80`}>{topWarning.detail}</p>
          {risk.warnings.slice(1).map((w, i) => {
            const wCfg = SEVERITY_CONFIG[w.severity] || SEVERITY_CONFIG.low;
            const WIcon = wCfg.icon;
            return (
              <div key={i} className={`rounded-lg border ${wCfg.border} ${wCfg.bg} p-2`}>
                <div className="flex items-start gap-1.5">
                  <WIcon size={13} className={`${wCfg.label} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-xs font-medium ${wCfg.text}`}>{w.message}</p>
                    <p className={`text-xs ${wCfg.text} opacity-80 mt-0.5`}>{w.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-2 pl-6">
        Powered by Amazon Sense™ · Based on your personal shopping history
      </p>
    </div>
  );
}
