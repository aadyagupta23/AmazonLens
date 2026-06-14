import React, { useState } from "react";
import { AlertOctagon, ChevronDown, ChevronUp, Star } from "lucide-react";

// reviews may be pre-filtered (from AI scan) or contain a mix (filtered here by r.suspicious)
export default function SuspiciousReviews({ reviews }) {
  const [expanded, setExpanded] = useState(false);
  const suspicious = reviews.every((r) => r.aiReason != null || r.suspicious != null)
    ? reviews.filter((r) => r.aiReason || r.suspicious)
    : reviews.filter((r) => r.suspicious);

  if (suspicious.length === 0) return null;

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <AlertOctagon size={16} className="text-[#CC0C39]" />
          <span className="text-sm font-bold text-[#CC0C39]">
            {suspicious.length} Suspicious Review{suspicious.length > 1 ? "s" : ""} Detected
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-[#CC0C39]" />
        ) : (
          <ChevronDown size={16} className="text-[#CC0C39]" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-red-100">
          {suspicious.map((review) => (
            <div key={review.id} className="bg-red-50 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < review.rating ? "#FF9900" : "none"}
                      className={i < review.rating ? "text-[#FF9900]" : "text-gray-300"}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">by {review.author}</span>
                </div>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>
              <p className="text-sm font-medium text-[#0F1111]">"{review.title}"</p>
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{review.body}</p>
              <div className="mt-2 bg-red-100 border border-red-200 rounded px-2 py-1 flex items-start gap-1.5">
                <AlertOctagon size={12} className="text-[#CC0C39] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#CC0C39] font-medium">{review.aiReason || review.suspiciousReason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
