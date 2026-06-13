import { useEffect, useState } from "react";
import axios from "axios";
import { API, formatPrice } from "../../utils/format.js";
import {
  TrendingDown, TrendingUp, Minus, Clock, ShieldCheck,
  ArrowDown, Zap, Calendar, Loader2
} from "lucide-react";

const PREDICTION_CONFIG = {
  likely_drop: { color: "text-green-700", bg: "bg-green-50", border: "border-green-200", Icon: TrendingDown, label: "Price Drop Likely" },
  possible_drop: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", Icon: TrendingDown, label: "Possible Drop" },
  stable: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", Icon: Minus, label: "Price Stable" },
  rising: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", Icon: TrendingUp, label: "Price Rising" },
  unknown: { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", Icon: Minus, label: "Unknown" },
};

export default function PriceDropPrediction({ productId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    axios
      .get(`${API}/api/price-drop/${productId}`)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-gray-400" />
          <span className="text-xs text-gray-400">Analyzing price trends...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const config = PREDICTION_CONFIG[data.prediction] || PREDICTION_CONFIG.unknown;
  const { Icon } = config;

  return (
    <div className={`border ${config.border} ${config.bg} rounded-xl p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#FF9900]" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price Intelligence</span>
        </div>
        <span className="text-[10px] text-gray-500 flex items-center gap-1">
          <ShieldCheck size={10} /> {data.confidence}% confidence
        </span>
      </div>

      {/* Main prediction */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
          <Icon size={20} className={config.color} />
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${config.color}`}>{config.label}</p>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{data.reason}</p>
        </div>
      </div>

      {/* Recommendation badge */}
      <div className={`flex items-center gap-2 p-2.5 rounded-lg ${
        data.recommendation === "buy"
          ? "bg-green-100 border border-green-300"
          : "bg-amber-100 border border-amber-300"
      }`}>
        {data.recommendation === "buy" ? (
          <>
            <ShieldCheck size={16} className="text-green-700" />
            <span className="text-sm font-semibold text-green-800">Buy Now — Good time to purchase</span>
          </>
        ) : (
          <>
            <Clock size={16} className="text-amber-700" />
            <span className="text-sm font-semibold text-amber-800">
              Wait {data.daysToWait} days — Expected to save {formatPrice(data.expectedDrop)}
            </span>
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase">12M Low</p>
          <p className="text-xs font-bold text-green-700">{formatPrice(data.stats.min)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase">Average</p>
          <p className="text-xs font-bold text-gray-700">{formatPrice(data.stats.avg)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase">12M High</p>
          <p className="text-xs font-bold text-red-600">{formatPrice(data.stats.max)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase">Next Sale</p>
          <p className="text-xs font-bold text-[#FF9900] flex items-center justify-center gap-0.5">
            <Calendar size={10} /> ~{data.stats.nextSaleIn}d
          </p>
        </div>
      </div>
    </div>
  );
}
