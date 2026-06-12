import React from "react";
import { TrendingDown, TrendingUp, Clock } from "lucide-react";

export default function BuyWaitBox({ buyNowOrWait, waitReason }) {
  const isBuy = buyNowOrWait === "buy";

  return (
    <div className={`rounded-lg border-2 p-4 ${
      isBuy
        ? "border-[#067D62] bg-green-50"
        : "border-[#FF9900] bg-orange-50"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {isBuy ? (
          <TrendingUp size={18} className="text-[#067D62]" />
        ) : (
          <Clock size={18} className="text-[#FF9900]" />
        )}
        <span className={`font-bold text-sm ${isBuy ? "text-[#067D62]" : "text-[#C77B00]"}`}>
          TrustLens Recommendation: {isBuy ? "Good time to buy" : "Consider waiting"}
        </span>
      </div>

      {waitReason && (
        <p className={`text-sm ${isBuy ? "text-green-800" : "text-orange-800"}`}>
          {waitReason}
        </p>
      )}

      {!isBuy && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendingDown size={14} className="text-[#CC0C39]" />
          <span className="text-xs text-[#CC0C39] font-medium">
            Historical data suggests a price drop is likely soon.
          </span>
        </div>
      )}
    </div>
  );
}
