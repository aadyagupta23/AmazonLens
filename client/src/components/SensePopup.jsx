import React, { useEffect, useState, useRef } from "react";
import { X, RefreshCw, ShoppingCart } from "lucide-react";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import axios from "axios";
import { API } from "../utils/format.js";

export default function SensePopup() {
  const [visible, setVisible] = useState(false);
  const [item, setItem] = useState(null);
  const { addToCart } = useCart();
  const dismissTimer = useRef(null);

  useEffect(() => {
    const showTimer = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/api/sense/predictions`);
        if (data.predictions?.length > 0) {
          setItem(data.predictions[0]);
          setVisible(true);
          dismissTimer.current = setTimeout(() => setVisible(false), 12000);
        }
      } catch {
        // Fallback mock item
        setItem({
          productId: "p005",
          productName: "Nescafé Gold Blend 200g",
          price: 649,
          trustScore: 88,
          urgency: "Due today",
          daysOverdue: 0,
          thumbnail: "https://m.media-amazon.com/images/I/71Rj8EH9Y+L._AC_SL1500_.jpg"
        });
        setVisible(true);
        dismissTimer.current = setTimeout(() => setVisible(false), 12000);
      }
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

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
        trustScore: item.trustScore,
        thumbnail: item.thumbnail,
        isPrime: true
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

          <p className="text-xs text-[#565959] mb-3">
            You usually reorder this every <strong>28 days</strong>. Last ordered 28 days ago.
          </p>

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
            style={{ animation: "shrink 12s linear forwards" }}
          />
        </div>
        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      </div>
    </div>
  );
}
