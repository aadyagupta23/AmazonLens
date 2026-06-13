import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import {
  Package, RotateCcw, Star, ShoppingCart,
  X, Check, ChevronDown, ChevronUp,
} from "lucide-react";

const RETURN_REASONS = [
  "Item not as described",
  "Defective or doesn't work",
  "Wrong item sent",
  "Changed my mind",
  "Better price available",
  "Arrived damaged",
  "Missing parts or accessories",
];

// ── Return Modal ─────────────────────────────────────────────────────────────
function ReturnModal({ orderId, item, onClose, onReturn }) {
  const [step, setStep] = useState("select");
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#FF9900] text-[11px] font-bold uppercase tracking-widest">
              Return Request
            </p>
            <p className="text-white text-sm font-semibold mt-0.5 line-clamp-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          {step === "select" && (
            <>
              <p className="text-sm font-medium text-[#0F1111] mb-3">
                Why are you returning this item?
              </p>
              <div className="space-y-2 mb-4">
                {RETURN_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="returnReason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-[#FF9900]"
                    />
                    <span className="text-sm text-[#0F1111] group-hover:text-[#C7511F]">{r}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => reason && setStep("confirm")}
                disabled={!reason}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:opacity-40 text-[#0F1111] font-bold text-sm py-2.5 rounded-full"
              >
                Continue
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <p className="text-sm font-medium text-[#0F1111] mb-3">Confirm your return</p>
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
                <p className="text-xs text-[#565959] mb-0.5">Reason selected</p>
                <p className="text-sm font-medium text-[#0F1111]">{reason}</p>
              </div>
              <p className="text-xs text-[#565959] mb-4">
                We'll arrange a free pickup from your delivery address within 2–3 business days.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 border border-gray-300 text-sm py-2.5 rounded-full hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => { onReturn(orderId, item.id, reason); setStep("done"); }}
                  className="flex-1 bg-[#CC0C39] hover:bg-[#B00832] text-white font-bold text-sm py-2.5 rounded-full"
                >
                  Confirm Return
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-green-600" />
              </div>
              <p className="font-bold text-[#0F1111] text-sm">Return request submitted!</p>
              <p className="text-xs text-[#565959] mt-1">
                We'll pick up the item from your delivery address shortly.
              </p>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-sm py-2.5 rounded-full"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ orderId, item, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (!stars || !body.trim()) return;
    onSubmit(orderId, item.id, {
      rating: stars,
      title,
      body,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    });
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#FF9900] text-[11px] font-bold uppercase tracking-widest">
              Write a Review
            </p>
            <p className="text-white text-sm font-semibold mt-0.5 line-clamp-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-green-600" />
              </div>
              <p className="font-bold text-[#0F1111] text-sm">Review submitted!</p>
              <p className="text-xs text-[#565959] mt-1">Thank you for your feedback.</p>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-sm py-2.5 rounded-full"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-[#0F1111] mb-3">Overall rating</p>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setStars(s)}>
                    <Star
                      size={30}
                      className={s <= stars ? "text-[#FF9900] fill-[#FF9900]" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Review headline (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#FF9900]"
              />
              <textarea
                placeholder="Describe your experience with this product..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:border-[#FF9900]"
              />
              <button
                onClick={handleSubmit}
                disabled={!stars || !body.trim()}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:opacity-40 text-[#0F1111] font-bold text-sm py-2.5 rounded-full"
              >
                Submit Review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Single Order Card ─────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const { returnItem, addReview } = useOrders();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [returnModal, setReturnModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);

  const placedDate = new Date(order.placedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const handleReorderAll = () => {
    order.items.forEach((item) => addToCart(item, item.qty));
    navigate("/cart");
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Order header bar */}
        <div className="bg-[#F0F2F2] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-6 flex-wrap text-sm">
            <div>
              <p className="text-[10px] text-[#565959] uppercase tracking-wide font-semibold mb-0.5">Order Placed</p>
              <p className="text-[#0F1111] font-medium">{placedDate}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#565959] uppercase tracking-wide font-semibold mb-0.5">Total</p>
              <p className="text-[#0F1111] font-medium">{formatPrice(order.total)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#565959] uppercase tracking-wide font-semibold mb-0.5">Ship To</p>
              <p className="text-[#0F1111] font-medium">{order.address?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#007600] bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              {order.status}
            </span>
            <span className="text-[10px] text-[#565959] font-medium hidden sm:block">#{order.id}</span>
            <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Items */}
        {expanded && (
          <>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-5 py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div
                    className="w-20 h-20 flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/dp/${item.id}`)}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/80"; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-[#0F1111] hover:text-[#C7511F] cursor-pointer leading-snug mb-1"
                      onClick={() => navigate(`/dp/${item.id}`)}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-[#565959] mb-2">
                      Qty: {item.qty} &nbsp;·&nbsp; {formatPrice(item.price)}
                    </p>

                    {/* Return status badge */}
                    {item.returnStatus && (
                      <span className="inline-block bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                        {item.returnStatus}
                        {item.returnReason && ` — ${item.returnReason}`}
                      </span>
                    )}

                    {/* Submitted review */}
                    {item.review && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-2">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={s <= item.review.rating ? "text-[#FF9900] fill-[#FF9900]" : "text-gray-300"}
                            />
                          ))}
                          <span className="text-[10px] text-[#565959] ml-1">{item.review.date}</span>
                        </div>
                        {item.review.title && (
                          <p className="text-xs font-bold text-[#0F1111]">{item.review.title}</p>
                        )}
                        <p className="text-xs text-[#565959] line-clamp-2">{item.review.body}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {!item.returnStatus && (
                        <button
                          onClick={() => setReturnModal({ item })}
                          className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 px-3 py-1.5 rounded-full hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          <RotateCcw size={11} /> Return Item
                        </button>
                      )}
                      {!item.review && (
                        <button
                          onClick={() => setReviewModal({ item })}
                          className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 px-3 py-1.5 rounded-full hover:border-[#FF9900] hover:text-[#C7511F] transition-colors"
                        >
                          <Star size={11} /> Write a Review
                        </button>
                      )}
                      <button
                        onClick={() => { addToCart(item, item.qty); navigate("/cart"); }}
                        className="flex items-center gap-1.5 text-xs font-medium bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] px-3 py-1.5 rounded-full"
                      >
                        <ShoppingCart size={11} /> Buy Again
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reorder all */}
            <div className="px-5 py-3 bg-[#FAFAFA] border-t border-gray-100 flex justify-end">
              <button
                onClick={handleReorderAll}
                className="flex items-center gap-1.5 text-xs font-bold border border-gray-300 bg-white hover:bg-gray-50 text-[#0F1111] px-4 py-2 rounded-full"
              >
                <ShoppingCart size={12} /> Reorder all items
              </button>
            </div>
          </>
        )}
      </div>

      {returnModal && (
        <ReturnModal
          orderId={order.id}
          item={returnModal.item}
          onClose={() => setReturnModal(null)}
          onReturn={(oid, iid, reason) => { returnItem(oid, iid, reason); setReturnModal(null); }}
        />
      )}
      {reviewModal && (
        <ReviewModal
          orderId={order.id}
          item={reviewModal.item}
          onClose={() => setReviewModal(null)}
          onSubmit={(oid, iid, review) => { addReview(oid, iid, review); setReviewModal(null); }}
        />
      )}
    </>
  );
}

// ── Orders Page ───────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { orders } = useOrders();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-medium text-[#0F1111] mb-5 flex items-center gap-2">
        <Package size={22} /> Your Orders
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <Package size={56} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[#0F1111] mb-2">No orders yet</h2>
          <p className="text-sm text-[#565959] mb-5">
            When you place an order, it will appear here.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
