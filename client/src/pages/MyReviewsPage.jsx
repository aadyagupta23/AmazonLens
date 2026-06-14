import React from "react";
import { Link } from "react-router-dom";
import { useReviews } from "../contexts/ReviewsContext.jsx";
import { Star, MessageSquare } from "lucide-react";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "text-[#FF9900] fill-[#FF9900]" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function MyReviewsPage() {
  const { myReviews, clearReview } = useReviews();

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#0F1111]">Your Reviews</h1>
          <p className="text-sm text-[#565959] mt-1">{myReviews.length} review{myReviews.length !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/account" className="text-sm text-[#007185] hover:underline">← Back to Account</Link>
      </div>

      {myReviews.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#DDD] rounded">
          <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[#0F1111] font-medium mb-1">No reviews yet</p>
          <p className="text-sm text-[#565959] mb-4">Reviews you write on product pages will appear here.</p>
          <Link to="/" className="text-sm text-[#007185] hover:underline">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myReviews.map((r) => (
            <div key={`${r.productId}-${r.date}`} className="bg-white border border-[#DDD] rounded p-4 flex gap-4">
              <Link to={`/dp/${r.productId}`} className="flex-shrink-0">
                <img
                  src={r.productThumbnail}
                  alt={r.productName}
                  className="w-16 h-16 object-contain border border-gray-100 rounded"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/dp/${r.productId}`}
                  className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline font-medium line-clamp-1"
                >
                  {r.productName}
                </Link>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <StarDisplay rating={r.rating} />
                  <span className="text-sm font-bold text-[#0F1111]">{r.title}</span>
                </div>
                <p className="text-sm text-[#565959] line-clamp-3">{r.body}</p>
                <p className="text-xs text-[#999] mt-1">Reviewed {timeAgo(r.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
