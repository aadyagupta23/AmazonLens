import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, Leaf, TrendingDown, Sparkles, ChevronRight,
  Users, ThumbsUp, ThumbsDown, Gift, Zap, Star, ShoppingBag,
} from "lucide-react";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { useWitness } from "../contexts/WitnessContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatPrice } from "../utils/format.js";

function timeAgo(isoString) {
  const days = Math.floor((Date.now() - new Date(isoString)) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function WitnessSignup({ item, onDone }) {
  const { goOnline, witnessInfo } = useWitness();
  const { user } = useAuth();
  const [wouldBuyAgain, setWouldBuyAgain] = useState(true);
  const alreadyLive = witnessInfo?.productId === item.id;
  const city = user.city || "";

  if (alreadyLive) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        You're live as a Witness for this product!
      </div>
    );
  }

  if (!city) {
    return (
      <div className="mt-4 border border-orange-200 rounded-xl p-4 bg-orange-50">
        <p className="text-sm font-medium text-[#0F1111] mb-1">Add your city first</p>
        <p className="text-xs text-[#565959] mb-3">WitnessPanel uses your city to match you with nearby shoppers.</p>
        <Link to="/account" className="text-xs bg-[#131921] text-white px-4 py-2 rounded-full hover:bg-[#232F3E] inline-block">
          Go to Account Settings →
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    goOnline({
      name: user.name,
      city,
      productId: item.id,
      productName: item.name,
      monthsOwned: 1,
      wouldBuyAgain,
    });
    onDone();
  };

  return (
    <div className="mt-4 border border-[#FFD814] rounded-xl p-4 bg-[#FFFBEA]">
      <p className="text-xs font-semibold text-[#0F1111] mb-1">Ready to go live</p>
      <p className="text-xs text-[#565959] mb-3">
        As <strong>{user.name}</strong> · {city}
      </p>
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-[#565959] mb-1">Buy it again?</label>
          <div className="flex gap-2">
            <button
              onClick={() => setWouldBuyAgain(true)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${wouldBuyAgain ? "bg-green-50 border-green-400 text-green-700" : "border-gray-300 text-[#565959]"}`}
            >
              <ThumbsUp size={12} /> Yes
            </button>
            <button
              onClick={() => setWouldBuyAgain(false)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${!wouldBuyAgain ? "bg-red-50 border-red-400 text-red-700" : "border-gray-300 text-[#565959]"}`}
            >
              <ThumbsDown size={12} /> No
            </button>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={false}
          className="bg-[#131921] hover:bg-[#232F3E] disabled:bg-gray-300 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors"
        >
          Go Live
        </button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { orders } = useOrders();
  const { witnessInfo } = useWitness();
  const [expandedWitness, setExpandedWitness] = useState(null);

  // Flatten all orders into individual item rows
  const orderItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderId: order.id,
      placedAt: order.placedAt,
      status: order.status,
      address: order.address,
    }))
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  if (orderItems.length === 0) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#0F1111] mb-2">No orders yet</h1>
        <p className="text-[#565959] mb-6">Once you place an order, it'll show up here.</p>
        <Link
          to="/"
          className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm inline-block"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-[#0F1111] mb-6">Your Orders</h1>

      <div className="space-y-5">
        {orderItems.map((item, idx) => {
          const trustScore = item.trustScore ?? 70;
          const sustainability = item.sustainability ?? Math.round(60 + trustScore * 0.3);
          const key = `${item.orderId}-${item.id}-${idx}`;

          return (
            <div key={key} className="bg-white rounded-lg border border-[#DDD] shadow-sm p-5">
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Product image */}
                <Link to={`/dp/${item.id}`} className="flex-shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-28 h-28 object-contain rounded border"
                    onError={(e) => { e.target.src = "https://placehold.co/112x112/EAEDED/131921?text=IMG"; }}
                  />
                </Link>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                    <Link to={`/dp/${item.id}`} className="hover:text-[#C7511F]">
                      <h2 className="text-lg font-bold">{item.name}</h2>
                    </Link>
                    <span className="text-xs text-[#565959] bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                      {item.orderId}
                    </span>
                  </div>

                  <p className="text-green-700 text-sm mb-1">
                    {item.status} · {timeAgo(item.placedAt)}
                  </p>
                  {item.qty > 1 && (
                    <p className="text-xs text-[#565959] mb-2">Qty: {item.qty}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      TrustLens {trustScore}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Sustainability {sustainability}
                    </span>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {formatPrice(item.price * item.qty)} paid
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-[#F7F8F8] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package size={14} />
                        <span className="font-semibold text-sm">TrustLens Score</span>
                      </div>
                      <div className="text-xl font-bold">{trustScore}/100</div>
                      <p className="text-xs text-[#565959] mt-0.5">Verified buyer confidence</p>
                    </div>
                    <div className="bg-[#F7F8F8] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={14} />
                        <span className="font-semibold text-sm">You Paid</span>
                      </div>
                      <div className="text-xl font-bold">{formatPrice(item.price)}</div>
                      {item.originalPrice > item.price && (
                        <p className="text-xs text-green-700 mt-0.5">
                          Saved {formatPrice(item.originalPrice - item.price)}
                        </p>
                      )}
                    </div>
                    <div className="bg-[#F7F8F8] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Leaf size={14} />
                        <span className="font-semibold text-sm">Sustainability</span>
                      </div>
                      <div className="text-xl font-bold">{sustainability}/100</div>
                      <p className="text-xs text-[#565959] mt-0.5">vs similar products</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 mt-5">
                    <Link
                      to={`/dp/${item.id}`}
                      className="bg-[#FFD814] hover:bg-[#F7CA00] px-5 py-2 rounded font-semibold text-sm"
                    >
                      Buy Again
                    </Link>
                    <button className="border border-[#DDD] px-5 py-2 rounded hover:bg-[#F7F8F8] text-sm">
                      Write Review
                    </button>
                    <button className="border border-[#DDD] px-5 py-2 rounded hover:bg-[#F7F8F8] text-sm">
                      View Details
                    </button>
                    {witnessInfo?.productId !== item.id && (
                      <button
                        onClick={() => setExpandedWitness(
                          expandedWitness === key ? null : key
                        )}
                        className="flex items-center gap-2 border-2 border-[#007185] text-[#007185] hover:bg-[#007185] hover:text-white px-5 py-2 rounded font-semibold text-sm transition-colors"
                      >
                        <Users size={15} /> Be a Witness
                      </button>
                    )}
                  </div>

                  {/* Witness incentive card */}
                  {expandedWitness !== key && witnessInfo?.productId !== item.id && (
                    <div
                      className="mt-4 rounded-xl border border-[#007185]/30 bg-gradient-to-r from-[#f0fafa] to-white p-4 cursor-pointer hover:border-[#007185] transition-colors"
                      onClick={() => setExpandedWitness(key)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Users size={14} className="text-[#007185]" />
                            <span className="text-sm font-bold text-[#0F1111]">Become a Witness™</span>
                          </div>
                          <p className="text-xs text-[#565959] mb-2">
                            You own this. Help shoppers decide — and get rewarded.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                              <Gift size={10} /> ₹50 Amazon Pay cashback
                            </span>
                            <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                              <Zap size={10} /> Early sale access
                            </span>
                            <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                              <Star size={10} /> Witness score badge
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-[#007185] flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  )}

                  {expandedWitness === key && (
                    <WitnessSignup item={item} onDone={() => setExpandedWitness(null)} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact Summary */}
      <div className="bg-white border rounded-lg shadow-sm p-5 mt-6">
        <h2 className="text-xl font-bold mb-4">Shopping Impact Summary</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">{orderItems.length}</div>
            <div className="text-sm text-[#565959]">Products Purchased</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {orderItems.length ? Math.round(orderItems.reduce((s, i) => s + (i.trustScore ?? 70), 0) / orderItems.length) : 0}
            </div>
            <div className="text-sm text-[#565959]">Avg Trust Score</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {formatPrice(orderItems.reduce((s, i) => s + Math.max(0, (i.originalPrice ?? i.price) - i.price) * i.qty, 0))}
            </div>
            <div className="text-sm text-[#565959]">Total Saved</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">{orders.length}</div>
            <div className="text-sm text-[#565959]">Orders Placed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
