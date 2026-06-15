import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Package, Leaf, TrendingDown,
  Users, ThumbsUp, ThumbsDown, Gift, Zap, Star, ShoppingBag, MapPin, X, RotateCcw,
} from "lucide-react";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { useWitness } from "../contexts/WitnessContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useReviews } from "../contexts/ReviewsContext.jsx";
import { useSense } from "../contexts/SenseContext.jsx";
import { formatPrice, API } from "../utils/format.js";

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

function InlineReviewForm({ item, user, onDone }) {
  const { saveReview, hasReviewed } = useReviews();
  const [form, setForm] = useState({ rating: 0, hoverRating: 0, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (hasReviewed(item.id)) {
    return (
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-blue-800">You've already reviewed this product.</span>
        <Link to="/my-reviews" className="text-xs text-[#007185] underline ml-2">See your reviews →</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${API}/api/customers/reviews`, {
        name: user?.name || "Anonymous",
        email: user?.email || "",
        productId: item.id,
        seller: item.soldBy || "",
        rating: form.rating,
        title: form.title,
        body: form.body,
      });
      saveReview({
        productId: item.id,
        productName: item.name,
        productThumbnail: item.thumbnail,
        rating: form.rating,
        title: form.title,
        body: form.body,
        date: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
        ✓ Review submitted! It now appears on the product page.
      </div>
    );
  }

  return (
    <div className="mt-3 border border-[#FFD814] rounded-lg p-4 bg-[#FFFBEA]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-[#0F1111]">Write a Review</h4>
        <button onClick={onDone} className="text-[#999] hover:text-[#CC0C39]"><X size={16} /></button>
      </div>
      <div className="flex items-center gap-2 mb-3 text-xs text-[#565959]">
        <div className="w-5 h-5 rounded-full bg-[#232F3E] text-white text-[10px] flex items-center justify-center font-bold">
          {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        Reviewing as <span className="font-medium text-[#0F1111]">{user?.name || "Guest"}</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-[#565959] block mb-1">Overall rating</label>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rating: s }))}
                onMouseEnter={() => setForm((f) => ({ ...f, hoverRating: s }))}
                onMouseLeave={() => setForm((f) => ({ ...f, hoverRating: 0 }))}
              >
                <Star size={22} className={s <= (form.hoverRating || form.rating) ? "text-[#FF9900] fill-[#FF9900]" : "text-gray-300"} />
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          required
          placeholder="Review headline"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF9900] bg-white"
        />
        <textarea
          required
          rows={3}
          placeholder="What did you like or dislike?"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF9900] resize-none bg-white"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-bold px-5 py-2 rounded-full disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}


export default function OrdersPage() {
  const { orders, returnItem } = useOrders();
  const { user } = useAuth();
  const { recordEvent } = useSense();
  const [expandedWitness, setExpandedWitness] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState(null);
  const [returnConfirm, setReturnConfirm] = useState(null); // { orderId, itemId, name }
  const [returnSuccess, setReturnSuccess] = useState(null); // item name just returned

  const confirmReturn = () => {
    if (!returnConfirm) return;
    returnItem(returnConfirm.orderId, returnConfirm.itemId, user?.email);
    setReturnSuccess(returnConfirm.name);
    setReturnConfirm(null);
    setTimeout(() => setReturnSuccess(null), 3000);
  };

  // DNA: log purchase events for existing orders once per session
  useEffect(() => {
    if (!orders.length) return;
    const key = "sense_orders_fired";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const allItems = orders.flatMap((o) => o.items || []);
    // Fire sequentially to avoid Mongoose version conflicts from concurrent saves
    allItems.slice(0, 8).reduce((p, item) => p.then(() => recordEvent("purchase", item)), Promise.resolve());
  }, [orders]);

  // Flatten all orders into individual item rows, excluding returned items
  const orderItems = orders.flatMap((order) =>
    order.items
      .filter((item) => !item.returnStatus)
      .map((item) => ({
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

      {/* Return success toast */}
      {returnSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
          <RotateCcw size={15} /> Return initiated for <span className="font-bold truncate max-w-[160px]">{returnSuccess}</span>
        </div>
      )}

      {/* Return confirmation modal */}
      {returnConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setReturnConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <RotateCcw size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F1111] text-base">Confirm Return</h3>
                <p className="text-xs text-[#565959]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[#0F1111] mb-5 line-clamp-3">
              Return <span className="font-semibold">{returnConfirm.name}</span>? A refund will be initiated within 3–5 business days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setReturnConfirm(null)}
                className="flex-1 border border-[#DDD] text-[#565959] font-semibold py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReturn}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-full text-sm transition-colors"
              >
                Yes, Return
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-[#0F1111] mb-6">Your Orders</h1>

      {/* Impact Summary */}
      <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
        <h2 className="text-xl font-bold mb-4">Shopping Impact Summary</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">{orderItems.length}</div>
            <div className="text-sm text-[#565959]">Products Purchased</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {(() => {
                const scored = orderItems.filter(i => i.trustScore != null);
                return scored.length ? Math.round(scored.reduce((s, i) => s + i.trustScore, 0) / scored.length) : "—";
              })()}
            </div>
            <div className="text-sm text-[#565959]">Avg Trust Score</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">{orders.length}</div>
            <div className="text-sm text-[#565959]">Orders Placed</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {formatPrice(orderItems.reduce((s, i) => s + i.price * i.qty, 0))}
            </div>
            <div className="text-sm text-[#565959]">Total Spent</div>
          </div>
        </div>
      </div>

      {/* Witness incentive card — once, not per product */}
      <div className="mb-5 rounded-xl border border-[#007185]/30 bg-[#f0fafa] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={14} className="text-[#007185]" />
              <span className="text-sm font-bold text-[#0F1111]">Become a Witness™</span>
            </div>
            <p className="text-xs text-[#565959] mb-2">
              You own it. Help shoppers decide — and get rewarded. Click "Be a Witness" on any product below.
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
        </div>
      </div>

      <div className="space-y-5">
        {orderItems.map((item, idx) => {
          const trustScore = item.trustScore ?? null;
          const sustainability = item.sustainability ?? null;
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
                    {trustScore != null && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        TrustLens {trustScore}
                      </span>
                    )}
                    {sustainability != null && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Sustainability {sustainability}
                      </span>
                    )}
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {formatPrice(item.price * item.qty)} paid
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {trustScore != null && (
                      <div className="bg-[#F7F8F8] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Package size={14} />
                          <span className="font-semibold text-sm">TrustLens Score</span>
                        </div>
                        <div className="text-xl font-bold">{trustScore}/100</div>
                        <p className="text-xs text-[#565959] mt-0.5">Verified buyer confidence</p>
                      </div>
                    )}
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
                    {sustainability != null && (
                      <div className="bg-[#F7F8F8] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Leaf size={14} />
                          <span className="font-semibold text-sm">Sustainability</span>
                        </div>
                        <div className="text-xl font-bold">{sustainability}/100</div>
                        <p className="text-xs text-[#565959] mt-0.5">vs similar products</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 mt-5">
                    <Link
                      to={`/dp/${item.id}`}
                      className="bg-[#FFD814] hover:bg-[#F7CA00] px-5 py-2 rounded font-semibold text-sm"
                    >
                      Buy Again
                    </Link>
                    <button
                      onClick={() => {
                        setExpandedReview(expandedReview === key ? null : key);
                        setExpandedDetails(null);
                      }}
                      className={`border px-5 py-2 rounded text-sm font-semibold transition-colors ${expandedReview === key ? "border-[#FF9900] bg-[#FFFBEA] text-[#0F1111]" : "border-[#DDD] hover:bg-[#F7F8F8]"}`}
                    >
                      Write Review
                    </button>
                    <button
                      onClick={() => {
                        setExpandedDetails(expandedDetails === key ? null : key);
                        setExpandedReview(null);
                      }}
                      className={`border px-5 py-2 rounded text-sm font-semibold transition-colors ${expandedDetails === key ? "border-[#007185] bg-[#f0fafa] text-[#007185]" : "border-[#DDD] hover:bg-[#F7F8F8]"}`}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setExpandedWitness(expandedWitness === key ? null : key)}
                      className={`flex items-center gap-1.5 border border-[#007185] bg-[#f0fafa] text-[#007185] px-5 py-2 rounded text-sm font-semibold transition-colors ${expandedWitness === key ? "bg-[#007185] text-white" : "hover:bg-[#007185] hover:text-white"}`}
                    >
                      <Users size={13} /> Be a Witness
                    </button>
                    {!item.returnStatus && (
                      <button
                        onClick={() => setReturnConfirm({ orderId: item.orderId, itemId: item.id, name: item.name })}
                        className="flex items-center gap-1.5 border border-[#DDD] hover:bg-[#FFF8F0] hover:border-orange-300 hover:text-orange-700 text-[#565959] px-5 py-2 rounded text-sm font-semibold transition-colors"
                      >
                        <RotateCcw size={13} /> Return
                      </button>
                    )}
                  </div>

                  {expandedWitness === key && (
                    <WitnessSignup item={item} onDone={() => setExpandedWitness(null)} />
                  )}

                  {/* Write Review inline form */}
                  {expandedReview === key && (
                    <InlineReviewForm item={item} user={user} onDone={() => setExpandedReview(null)} />
                  )}


                  {/* View Details inline panel */}
                  {expandedDetails === key && (
                    <div className="mt-3 border border-[#007185]/30 rounded-lg p-4 bg-[#f0fafa] text-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-[#0F1111]">Order Details</h4>
                        <button onClick={() => setExpandedDetails(null)} className="text-[#999] hover:text-[#CC0C39]"><X size={16} /></button>
                      </div>
                      <div className="space-y-2 text-[#0F1111]">
                        <div className="flex justify-between">
                          <span className="text-[#565959]">Order ID</span>
                          <span className="font-mono text-xs">{item.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#565959]">Placed</span>
                          <span>{new Date(item.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#565959]">Status</span>
                          <span className="text-green-700 font-medium">{item.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#565959]">Qty</span>
                          <span>{item.qty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#565959]">Price paid</span>
                          <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                        </div>
                        {item.originalPrice > item.price && (
                          <div className="flex justify-between">
                            <span className="text-[#565959]">You saved</span>
                            <span className="text-green-700 font-medium">{formatPrice((item.originalPrice - item.price) * item.qty)}</span>
                          </div>
                        )}
                        {item.address && (
                          <div className="pt-2 border-t border-[#007185]/20">
                            <div className="flex items-start gap-1.5">
                              <MapPin size={13} className="text-[#565959] mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-[#0F1111]">Delivered to</p>
                                <p className="text-xs text-[#565959]">{item.address}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#007185]/20 flex gap-4">
                        <Link
                          to={`/dp/${item.id}`}
                          className="text-sm text-[#007185] hover:underline font-medium"
                        >
                          View Product →
                        </Link>
                        <Link
                          to="/returns"
                          className="text-sm text-[#565959] hover:underline"
                        >
                          View Returns →
                        </Link>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
