import React from "react";
import { useNavigate } from "react-router-dom";
import { useHistory } from "../contexts/HistoryContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { Clock, ShoppingCart, Trash2 } from "lucide-react";
import StarRating from "../components/StarRating.jsx";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function HistoryPage() {
  const { history, clearHistory } = useHistory();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-medium text-[#0F1111] flex items-center gap-2">
          <Clock size={22} className="text-[#565959]" />
          Browsing History
          {history.length > 0 && (
            <span className="text-sm text-[#565959] font-normal ml-1">
              ({history.length} {history.length === 1 ? "item" : "items"})
            </span>
          )}
        </h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-sm text-[#CC0C39] hover:underline"
          >
            <Trash2 size={14} /> Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <Clock size={56} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[#0F1111] mb-2">No browsing history yet</h2>
          <p className="text-sm text-[#565959] mb-5">Products you view will appear here.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {history.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group"
            >
              <div
                className="h-40 flex items-center justify-center p-4 cursor-pointer bg-white"
                onClick={() => navigate(`/dp/${product.id}`)}
              >
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.target.src = `https://placehold.co/200x200/EAEDED/131921?text=${encodeURIComponent(product.brand || "Item")}`;
                  }}
                />
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p
                  className="text-xs text-[#0F1111] line-clamp-2 leading-snug mb-1 cursor-pointer hover:text-[#C7511F]"
                  onClick={() => navigate(`/dp/${product.id}`)}
                >
                  {product.name}
                </p>
                <div className="mb-1">
                  <StarRating rating={product.rating} size="sm" />
                </div>
                <div className="flex items-baseline gap-1 flex-wrap mb-1">
                  <span className="text-sm font-bold text-[#0F1111]">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-xs text-[#CC0C39]">-{product.discount}%</span>
                  )}
                </div>
                <p className="text-[10px] text-[#999] mb-2 mt-auto">{timeAgo(product.viewedAt)}</p>
                <button
                  onClick={() => { addToCart(product); navigate("/cart"); }}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-bold py-1.5 rounded-full flex items-center justify-center gap-1"
                >
                  <ShoppingCart size={11} /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
