import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function UserTrustVote({ productId }) {
  const storageKey = `trust_vote_${productId}`;

  const [vote, setVote] = useState(() => localStorage.getItem(storageKey));

  // Stable community counts derived from productId so they're consistent
  const seed = productId.split("").reduce((h, c) => h ^ c.charCodeAt(0), 0x7ABCD);
  const baseTrust = 80 + (Math.abs(seed) % 70);
  const baseDistrust = 5 + (Math.abs(seed * 13) % 25);

  const trustedCount = baseTrust + (vote === "trust" ? 1 : 0);
  const distrustedCount = baseDistrust + (vote === "distrust" ? 1 : 0);

  const handleVote = (v) => {
    if (vote === v) {
      localStorage.removeItem(storageKey);
      setVote(null);
    } else {
      localStorage.setItem(storageKey, v);
      setVote(v);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <span className="text-xs text-[#565959]">
        Was this seller trustworthy?&nbsp;
        <span className="text-[#007185] font-medium">{trustedCount} trust</span>
        <span className="text-[#565959]"> · </span>
        <span className="text-[#CC0C39] font-medium">{distrustedCount} flagged</span>
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => handleVote("trust")}
          className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
            vote === "trust"
              ? "bg-green-50 border-green-300 text-green-700"
              : "border-gray-200 text-[#565959] hover:border-green-300 hover:text-green-700"
          }`}
        >
          <ThumbsUp size={12} />
          Trust
        </button>
        <button
          onClick={() => handleVote("distrust")}
          className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
            vote === "distrust"
              ? "bg-red-50 border-red-300 text-red-700"
              : "border-gray-200 text-[#565959] hover:border-red-300 hover:text-red-700"
          }`}
        >
          <ThumbsDown size={12} />
          Flag
        </button>
      </div>
    </div>
  );
}
