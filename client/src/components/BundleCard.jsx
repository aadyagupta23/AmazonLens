import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import { Package, Zap } from "lucide-react";

export default function BundleCard({ bundle, products }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAddBundle = (e) => {
    e.stopPropagation();
    products.forEach((p) => addToCart(p));
  };

  return (
    <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] rounded-lg p-5 mb-4 text-white shadow-lg border border-[#FF9900]/30">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-[#FF9900]" />
            <span className="text-[#FF9900] text-xs font-bold uppercase tracking-wide">Amazon Bundle</span>
          </div>
          <h2 className="text-xl font-bold mb-1">{bundle.name}</h2>
          <p className="text-gray-300 text-sm mb-3">{bundle.tagline}</p>

          {/* Bundle items */}
          <div className="flex flex-col gap-1.5 mb-4">
            {bundle.productDetails.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-[#FF9900] text-[#131921] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-200">{item.name}</span>
                {item.isFree ? (
                  <span className="text-[#FF9900] font-bold text-xs ml-auto">FREE</span>
                ) : (
                  <span className="text-white font-medium ml-auto">{formatPrice(item.price)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Price block */}
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-bold text-[#FF9900]">{formatPrice(bundle.totalPrice)}</div>
          <div className="text-gray-400 text-sm line-through">{formatPrice(bundle.originalTotal)}</div>
          <div className="flex items-center gap-1 justify-end text-green-400 text-sm font-medium mt-1">
            <Zap size={14} />
            Save {formatPrice(bundle.savings)}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => navigate("/dp/p001")}
              className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#131921] font-bold px-5 py-2 rounded-full text-sm whitespace-nowrap"
            >
              View Bundle
            </button>
            <button
              onClick={handleAddBundle}
              className="bg-[#FF9900] hover:bg-[#F3A847] text-[#131921] font-bold px-5 py-2 rounded-full text-sm whitespace-nowrap"
            >
              Add All to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
