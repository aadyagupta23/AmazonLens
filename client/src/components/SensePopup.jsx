import React, { useEffect, useState, useRef } from "react";
import { X, RefreshCw, ShoppingCart, AlertTriangle } from "lucide-react";
import { useCart } from "../contexts/CartContext.jsx";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { formatPrice, API } from "../utils/format.js";

export default function SensePopup() {
  const [visible, setVisible] = useState(false);
  const [item, setItem] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const { addToCart, items: cartItems } = useCart();
  const { orders } = useOrders();
  const dismissTimer = useRef(null);
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;

    // Compute reorder predictions from real order history
    const productMap = {};
    if (orders && orders.length > 0) {
      for (const order of orders) {
        for (const item of (order.items || [])) {
          if (!productMap[item.id]) {
            productMap[item.id] = { item, dates: [] };
          }
          productMap[item.id].dates.push(new Date(order.placedAt));
        }
      }
    }

    const today = new Date();
    const candidates = [];

    for (const [pid, { item, dates }] of Object.entries(productMap)) {
      if (dates.length < 3) continue;
      dates.sort((a, b) => a - b);
      const lastDate = dates[dates.length - 1];
      const daysSinceLast = Math.round((today - lastDate) / 86400000);

      const gaps = [];
      for (let i = 1; i < dates.length; i++) gaps.push((dates[i] - dates[i - 1]) / 86400000);
      const avgCycleDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);

      if (avgCycleDays < 7) continue;

      const variance = gaps.reduce((s, g) => s + Math.pow(g - avgCycleDays, 2), 0) / gaps.length;
      const stdDev = Math.sqrt(variance);
      const isPeriodic = stdDev <= avgCycleDays * 0.4;

      if (!isPeriodic) continue;

      const daysOverdue = daysSinceLast - avgCycleDays;

      if (daysOverdue >= -3) {
        if (cartItems.find((c) => c.id === pid)) continue;

        const urgency = daysOverdue > 7 ? "Overdue" : daysOverdue > 0 ? "Due now" : "Due soon";
        candidates.push({
          productId: item.id,
          productName: item.name,
          price: item.price,
          thumbnail: item.thumbnail || item.image,
          urgency,
          daysOverdue: Math.max(0, daysOverdue),
          avgCycleDays,
          daysSinceLast,
          orderCount: dates.length,
        });
      }
    }

    candidates.sort((a, b) => b.daysOverdue - a.daysOverdue || b.orderCount - a.orderCount);

    if (candidates.length === 0) {
      candidates.push({
        productId: "p005",
        productName: "Nescafé Gold Blend 200g",
        price: 649,
        thumbnail: "https://images-na.ssl-images-amazon.com/images/P/B00EUKVIE8.01.L.jpg",
        urgency: "Due soon",
        daysOverdue: 0,
        avgCycleDays: 28,
        daysSinceLast: 26,
      });
    }

    const chosen = candidates[0];

    // Fetch stock info for the chosen product
    const showTimer = setTimeout(async () => {
      hasShown.current = true;

      try {
        const res = await fetch(`${API}/api/sense/stock/${chosen.productId}`);
        const data = await res.json();
        if (data.lowStock) {
          setStockInfo(data);
        }
      } catch (_) {}

      setItem(chosen);
      setVisible(true);
      dismissTimer.current = setTimeout(() => setVisible(false), 14000);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [orders, cartItems]);

  const dismiss = () => {
    setVisible(false);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  };

  const handleReorder = () => {
    if (item) {
      addToCart({
        id: item.productId,
        name: item.productName,
        price: item.price,
        thumbnail: item.thumbnail,
        isPrime: true,
      });
    }
    dismiss();
  };

  if (!visible || !item) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[999] slide-up w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-[#FF9900]" />
            <span className="text-white text-sm font-bold">Amazon Sense™</span>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-[#565959] mb-3">Based on your order history, you might be running low:</p>

          <div className="flex items-center gap-3 mb-3">
            <img
              src={item.thumbnail}
              alt={item.productName}
              className="w-14 h-14 object-contain rounded border border-gray-100"
              onError={(e) => { e.target.src = "https://via.placeholder.com/56x56/EAEDED"; }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[#0F1111] leading-tight line-clamp-2">
                {item.productName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-[#0F1111]">{formatPrice(item.price)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  item.daysOverdue > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {item.urgency}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#565959] mb-2">
            You usually reorder this every <strong>{item.avgCycleDays} days</strong>.
            {item.daysSinceLast > 0 && <> Last ordered <strong>{item.daysSinceLast} days</strong> ago.</>}
          </p>

          {/* Low stock warning */}
          {stockInfo && stockInfo.lowStock && (
            <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={13} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                Only <strong>{stockInfo.stock} left</strong> in stock! You usually buy this every {item.avgCycleDays} days. Consider buying it early.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleReorder}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-bold py-2 px-3 rounded-full"
            >
              <ShoppingCart size={14} />
              Reorder now
            </button>
            <button
              onClick={dismiss}
              className="text-sm text-[#007185] hover:underline px-2"
            >
              Later
            </button>
          </div>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-[#FF9900]"
            style={{ animation: "shrink 14s linear forwards" }}
          />
        </div>
        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      </div>
    </div>
  );
}
