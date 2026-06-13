import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice, getTrustColor } from "../utils/format.js";
import StarRating from "./StarRating.jsx";
import { Leaf } from "lucide-react";

export default function ProductCard({ product, greenerChoice = false }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const trust = getTrustColor(product.trustScore);

  return (
    <div
      className={`bg-white rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col overflow-hidden group ${
        greenerChoice ? "ring-1 ring-green-300" : ""
      }`}
      onClick={() => navigate(`/dp/${product.id}`)}
    >
      {/* Image */}
      <div className="relative bg-white flex items-center justify-center h-48 p-4 overflow-hidden">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.src = `https://placehold.co/300x300/EAEDED/131921?text=${encodeURIComponent(product.brand)}`;
          }}
        />

        {/* TrustLens badge */}
        <div className={`absolute top-2 right-2 ${trust.bg} ${trust.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
          {product.trustScore} · {trust.label}
        </div>

        {/* Prime badge */}
        {product.isPrime && (
          <div className="absolute top-2 left-2 bg-[#00A8E1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            prime
          </div>
        )}

        {/* Greener Choice badge — only when sustainability mode surfaces it */}
        {greenerChoice && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-bold px-1.5 py-0.5 rounded">
            <Leaf size={9} />
            Greener Choice
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm text-[#0F1111] line-clamp-2 mb-1 leading-snug group-hover:text-[#C7511F]">
          {product.name}
        </h3>

        <div className="mb-1">
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-medium text-[#0F1111]">
              <span className="text-sm">₹</span>
              {product.price.toLocaleString("en-IN")}
            </span>
            {product.discount > 0 && (
              <span className="text-[#CC0C39] text-sm font-medium">-{product.discount}%</span>
            )}
          </div>
          {product.originalPrice && (
            <div className="text-xs text-[#565959]">
              M.R.P.: <s>{formatPrice(product.originalPrice)}</s>
            </div>
          )}
          {product.delivery && (
            <div className="text-xs text-[#007600] mt-1">{product.delivery}</div>
          )}
        </div>

        {/* Fake discount warning */}
        {product.isFakeDiscount && (
          <div className="mt-2 text-[10px] bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded flex items-center gap-1">
            ⚠ TrustLens: Price inflated
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="mt-2 w-full btn-orange text-sm py-1.5 rounded-full"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
