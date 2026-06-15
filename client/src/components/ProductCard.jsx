import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { useCoPlanner } from "../contexts/CoPlannerContext.jsx";
import { useSense } from "../contexts/SenseContext.jsx";
import { formatPrice } from "../utils/format.js";
import StarRating from "./StarRating.jsx";
import { Heart, Leaf, Users, Check, Plus, Minus } from "lucide-react";

// Map companyStatus → badge colours
const STATUS_BADGE = {
  VERIFIED: "bg-[#067D62] text-white",
  TRUSTED:  "bg-[#0284c7] text-white",
};
const STATUS_LABEL = {
  VERIFIED: "Verified",
  TRUSTED:  "Trusted",
};

export default function ProductCard({ product, greenerChoice = false }) {
  const navigate = useNavigate();
  const { items, addToCart, updateQty, removeFromCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { startAddToPlan, plans, lastAddedProductId } = useCoPlanner();
  const { profile } = useSense();
  const wishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = useState(false);

  // Check if product is already in cart
  const cartItem = items.find((i) => i.id === product.id);
  const inCart = !!cartItem;

  // Client-side Amazon Sense match score (lightweight — no API call)
  const senseMatchScore = (() => {
    if (!profile?.mature) return 0;
    let score = 50;
    const brandKey = (product.brand || "").toLowerCase();
    const catKey = (product.category || "").toLowerCase();

    // Brand affinity
    const brandEntry = (profile.preferredBrands || []).find((b) => b.brand.toLowerCase() === brandKey);
    if (brandEntry) {
      const maxScore = profile.preferredBrands[0]?.score || 1;
      score += Math.round((brandEntry.score / maxScore) * 25);
    }
    if ((profile.returnedBrands || []).includes(product.brand)) score -= 20;

    // Category affinity
    const catEntry = (profile.preferredCategories || []).find(
      (c) => catKey.includes(c.category.toLowerCase()) || c.category.toLowerCase().includes(catKey)
    );
    if (catEntry) {
      const maxScore = profile.preferredCategories[0]?.score || 1;
      score += Math.round((catEntry.score / maxScore) * 20);
    }

    // Budget fit
    if (product.price && profile.budgetRange?.avg > 0) {
      const ratio = product.price / profile.budgetRange.avg;
      if (ratio >= 0.5 && ratio <= 1.5) score += 15;
      else if (ratio > 2.5) score -= 10;
    }

    // Rating boost
    if (product.rating >= 4.3) score += 10;

    return Math.max(0, Math.min(100, score));
  })();

  const score = product.companyScore ?? product.productScore ?? product.trustScore ?? 70;

  // Dampen Sense match when TrustLens score is low
  const senseScore = (() => {
    if (score >= 75) return senseMatchScore;
    if (senseMatchScore < 80) return senseMatchScore;

    // TrustLens below 40: kill any recommendation entirely
    if (score < 40) return 0;

    // TrustLens 40-74: force Pick Me (95+) down into Recommended (80-94) range
    if (senseMatchScore >= 95) {
      const trustRatio = (score - 40) / 35; // 0..1 (40→0, 74→0.97)
      return Math.round(80 + trustRatio * 14); // 80..94
    }

    // Already in Recommended range (80-94) — keep as-is
    return senseMatchScore;
  })();

  const status = product.companyStatus ?? product.productStatus ?? (score >= 75 ? "VERIFIED" : "TRUSTED");
  const badgeCls = STATUS_BADGE[status] ?? STATUS_BADGE.TRUSTED;
  const badgeLabel = STATUS_LABEL[status] ?? status;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleAddToPlan = (e) => {
    e.stopPropagation();
    startAddToPlan(product);
  };

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
        <div className={`absolute top-2 right-2 ${badgeCls} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
          {score} · {badgeLabel}
        </div>

        {/* Wishlist heart */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(product); }}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center transition-colors hover:border-red-300"
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={14} className={wishlisted ? "text-[#CC0C39] fill-[#CC0C39]" : "text-gray-400"} />
        </button>

        {/* Greener Choice badge */}
        {greenerChoice && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-[#E8F5E9] text-[#1B5E20] text-[10px] font-bold px-1.5 py-0.5 rounded">
            <Leaf size={9} />
            Green Choice
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
            <div className="text-xs text-[#007600] mt-1 flex items-center gap-1.5">
              {product.delivery}
              {/today|tomorrow/i.test(product.delivery) && (
                <span className="text-[10px] font-bold text-[#00A8E1]">prime</span>
              )}
            </div>
          )}
        </div>

        {/* Amazon Sense recommendation — subtle inline label */}
        {senseScore >= 95 && (
          <div className="mt-1.5 text-[11px] text-[#725B13] font-medium">
            👑 Pick Me
          </div>
        )}
        {senseScore >= 80 && senseScore < 95 && (
          <div className="mt-1.5 text-[11px] text-[#565959] font-medium">
            ✨ Recommended
          </div>
        )}

        {/* Cart button / quantity counter */}
        {justAdded ? (
          <div className="mt-2 w-full flex items-center justify-center gap-1 text-sm py-1.5 rounded-full bg-[#067D62] text-white font-medium">
            <Check size={14} /> Added to Cart
          </div>
        ) : inCart ? (
          <div className="mt-2 w-full flex items-center justify-center gap-0 rounded-full border border-gray-300 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }}
              className="px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 py-1.5 text-sm font-bold text-[#0F1111] min-w-[32px] text-center">{cartItem.qty}</span>
            <button
              onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty + 1); }}
              className="px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="mt-2 w-full btn-orange text-sm py-1.5 rounded-full"
          >
            Add to Cart
          </button>
        )}

        {plans.length > 0 && (
          <button
            onClick={handleAddToPlan}
            className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-full border border-gray-300 text-[#0F1111] hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
          >
            <Users size={12} /> {lastAddedProductId === product.id ? "Manage Co-Plans" : "Add to Co-Plan"}
          </button>
        )}
      </div>
    </div>
  );
}
