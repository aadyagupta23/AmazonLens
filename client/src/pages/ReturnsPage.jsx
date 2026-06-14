import React from "react";
import { Link } from "react-router-dom";
import { RotateCcw, ShoppingBag } from "lucide-react";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { formatPrice } from "../utils/format.js";

function timeAgo(isoString) {
  if (!isoString) return "";
  const days = Math.floor((Date.now() - new Date(isoString)) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const STATUS_STYLE = {
  "Returned": "bg-orange-50 text-orange-700 border-orange-200",
};

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
          Returns you request will appear here. You can request a return from your{" "}
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
    <div className="max-w-[900px] mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <RotateCcw size={22} className="text-orange-600" />
        <h1 className="text-3xl font-bold text-[#0F1111]">Your Returns</h1>
        <span className="text-sm text-[#565959] bg-gray-100 px-3 py-1 rounded-full">
          {returnItems.length} item{returnItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {returnItems.map((item, idx) => {
          const statusCls = STATUS_STYLE[item.returnStatus] || "bg-gray-50 text-gray-600 border-gray-200";
          return (
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
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusCls}`}>
                      {item.returnStatus}
                    </span>
                  </div>

                  <p className="text-xs text-[#565959] mb-2">
                    Order <span className="font-mono">{item.orderId}</span>
                    {item.returnedAt && ` · Requested ${timeAgo(item.returnedAt)}`}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.qty > 1 && (
                      <span className="text-xs bg-gray-100 text-[#565959] px-2 py-0.5 rounded-full">
                        Qty: {item.qty}
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-[#565959] px-2 py-0.5 rounded-full">
                      Paid {formatPrice(item.price * item.qty)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <Link
                      to="/orders"
                      className="text-xs text-[#007185] hover:underline"
                    >
                      View original order →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white border border-[#DDD] rounded-lg p-5 shadow-sm">
        <h2 className="font-bold text-[#0F1111] mb-3 flex items-center gap-2">
          <ShoppingBag size={16} /> Return Summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F7F8F8] rounded p-3 text-center">
            <div className="text-2xl font-bold text-[#0F1111]">{returnItems.length}</div>
            <div className="text-xs text-[#565959] mt-0.5">Items Returned</div>
          </div>
          <div className="bg-[#F7F8F8] rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-700">
              {formatPrice(returnItems.reduce((s, i) => s + i.price * i.qty, 0))}
            </div>
            <div className="text-xs text-[#565959] mt-0.5">Refund Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
