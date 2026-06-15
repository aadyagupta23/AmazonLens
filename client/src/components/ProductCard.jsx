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
  const { profile, aiScores, localPurchasedCats } = useSense();
  const wishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = useState(false);

  // Check if product is already in cart
  const cartItem = items.find((i) => i.id === product.id);
  const inCart = !!cartItem;

  // Use Groq AI score if cached (set when user visited product page), otherwise strict heuristic
  const senseMatchScore = (() => {
    const cached = aiScores?.[product.id];
    if (cached != null) return cached.score;

    // Use localStorage orders (instant, no async) — falls back to Sense profile if somehow empty
    const purchasedCats = localPurchasedCats.length > 0
      ? localPurchasedCats
      : (profile?.purchasedCategories || []);

    const productCat = (product.category || "").toLowerCase();
    const productBrand = (product.brand || "").toLowerCase();
    const returnedBrands = (profile?.returnedBrands || []).map(b => b.toLowerCase());

    // 90+ (Pick Me): same category as something purchased, but a DIFFERENT brand
    const sameCatEntry = purchasedCats.find(c => {
      const pc = c.category.toLowerCase();
      return productCat.includes(pc) || pc.includes(productCat);
    });
    if (sameCatEntry) {
      const purchasedBrandsInCat = (sameCatEntry.brands || []).map(b => b.toLowerCase());
      const isDifferentBrand = purchasedBrandsInCat.length === 0 || !purchasedBrandsInCat.includes(productBrand);
      const budgetOk = !profile?.budgetRange?.avg || product.price / profile.budgetRange.avg <= 2;
      const notReturned = !returnedBrands.includes(productBrand);
      if (isDifferentBrand && budgetOk && notReturned) return 91;
    }

    return 0;
  })();

  const score = product.companyScore ?? product.productScore ?? product.trustScore ?? 70;

  // Dampen Sense match when TrustLens score is low
  const senseScore = (() => {
    if (score >= 75) return senseMatchScore;
    if (senseMatchScore < 80) return senseMatchScore;
    if (score < 40) return 0;
    if (senseMatchScore >= 90) {
      const trustRatio = (score - 40) / 35;
      return Math.round(80 + trustRatio * 9);
    }
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
        {senseScore >= 90 && (
          <div className="mt-1.5 text-[11px] text-[#725B13] font-medium">
            👑 Pick Me
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
