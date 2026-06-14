import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Sparkles, Star, ShoppingCart, Check } from "lucide-react";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice, API } from "../utils/format.js";

function timeAgo(isoString) {
  if (!isoString) return "";
  const days = Math.floor((Date.now() - new Date(isoString)) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function StarRating({ rating }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= Math.round(rating) ? "text-[#FF9900] fill-[#FF9900]" : "text-gray-300"}
        />
      ))}
      <span className="text-[10px] text-[#565959] ml-1">{rating}</span>
    </div>
  );
}

function SuggestionCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      thumbnail: product.thumbnail,
      brand: product.brand,
      category: product.category,
      inStock: product.inStock,
      isPrime: product.isPrime,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link
      to={`/dp/${product.id}`}
      className="flex flex-col bg-white border border-[#DDD] rounded-lg overflow-hidden hover:border-[#007185] hover:shadow-md transition-all group"
    >
      <div className="relative bg-[#F7F8F8] p-3 flex items-center justify-center h-32">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-full w-full object-contain"
          onError={(e) => { e.target.src = "https://placehold.co/120x120/EAEDED/131921?text=IMG"; }}
        />
        {product.discount && (
          <span className="absolute top-2 left-2 bg-[#CC0C39] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <span className="text-[10px] text-[#565959] bg-gray-100 px-1.5 py-0.5 rounded-full self-start">{product.brand}</span>
        <p className="text-xs font-semibold text-[#0F1111] group-hover:text-[#C7511F] line-clamp-2 leading-tight">{product.name}</p>
        <StarRating rating={product.rating} />

        <div className="flex items-baseline gap-1.5 mt-auto pt-1">
          <span className="text-sm font-bold text-[#0F1111]">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] text-[#565959] line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {product.isPrime && (
          <span className="text-[#00A8E1] text-[10px] font-bold">prime</span>
        )}

        <p className="text-[10px] text-[#007185] italic line-clamp-2">{product.reason}</p>

        <button
          onClick={handleAdd}
          className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-colors ${
            added
              ? "bg-green-600 text-white"
              : "bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111]"
          }`}
        >
          {added ? <><Check size={11} /> Added</> : <><ShoppingCart size={11} /> Add to Cart</>}
        </button>
      </div>
    </Link>
  );
}

function AiSuggestions({ item }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`${API}/api/returns/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: item.id,
        productName: item.name,
        brand: item.brand || "",
        category: item.category || "",
      }),
    })
      .then((r) => r.ok ? r.json() : { suggestions: [] })
      .then((data) => { if (!cancelled) setSuggestions(data.suggestions || []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [item.id]);

  if (loading) {
    return (
      <div className="mt-4 border border-[#007185]/20 rounded-lg p-3 bg-[#f0fafa]">
        <div className="flex items-center gap-2 text-xs text-[#007185]">
          <Sparkles size={13} className="animate-pulse" />
          Finding similar products from other brands…
        </div>
      </div>
    );
  }

  if (error || !suggestions.length) return null;

  return (
    <div className="mt-4 border border-[#007185]/20 rounded-lg p-4 bg-[#f0fafa]">
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={13} className="text-[#007185]" />
        <span className="text-xs font-bold text-[#007185]">You might also like — similar products, different brand</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} product={s} />
        ))}
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const { orders } = useOrders();

  const returnItems = orders.flatMap((order) =>
    (order.items || [])
      .filter((item) => item.returnStatus)
      .map((item) => ({
        ...item,
        orderId: order.id,
        placedAt: order.placedAt,
        orderStatus: order.status,
      }))
  ).sort((a, b) => new Date(b.returnedAt || b.placedAt) - new Date(a.returnedAt || a.placedAt));

  if (returnItems.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
        <RotateCcw size={48} className="text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#0F1111] mb-2">No returns yet</h1>
        <p className="text-[#565959] mb-6">
          Returns you request will appear here. You can return items from your{" "}
          <Link to="/orders" className="text-[#007185] hover:underline">Orders page</Link>.
        </p>
        <Link
          to="/orders"
          className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm inline-block"
        >
          View Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-[#0F1111] mb-6">Your Returns</h1>

      {/* Return Summary */}
      <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
        <h2 className="text-xl font-bold mb-4">Return Summary</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">{returnItems.length}</div>
            <div className="text-sm text-[#565959]">Items Returned</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {formatPrice(returnItems.reduce((s, i) => s + i.price * i.qty, 0))}
            </div>
            <div className="text-sm text-[#565959]">Refund Value</div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {returnItems.map((item, idx) => (
          <div key={`${item.orderId}-${item.id}-${idx}`} className="bg-white rounded-lg border border-[#DDD] shadow-sm p-5">
            <div className="flex gap-4">
              <Link to={`/dp/${item.id}`} className="flex-shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-20 h-20 object-contain rounded border border-[#EEE] bg-[#F7F8F8]"
                  onError={(e) => { e.target.src = "https://placehold.co/80x80/EAEDED/131921?text=IMG"; }}
                />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <Link to={`/dp/${item.id}`} className="hover:text-[#C7511F]">
                    <h2 className="text-base font-bold text-[#0F1111] line-clamp-2">{item.name}</h2>
                  </Link>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 bg-orange-50 text-orange-700 border-orange-200">
                    Returned
                  </span>
                </div>

                <p className="text-xs text-[#565959] mb-2">
                  Order <span className="font-mono">{item.orderId}</span>
                  {item.returnedAt && ` · Returned ${timeAgo(item.returnedAt)}`}
                </p>

                <div className="flex flex-wrap gap-2">
                  {item.qty > 1 && (
                    <span className="text-xs bg-gray-100 text-[#565959] px-2 py-0.5 rounded-full">Qty: {item.qty}</span>
                  )}
                  <span className="text-xs bg-gray-100 text-[#565959] px-2 py-0.5 rounded-full">
                    Paid {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              </div>
            </div>

            <AiSuggestions item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
