import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";

import { bundles, products } from "../../../server/data/mockData.js";

function CompletenessRing({ pct }) {
  const color =
    pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#ea580c";
  const label =
    pct >= 80 ? "Nearly complete" : pct >= 60 ? "Good start" : "Core only";
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-9 h-9 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#E7E7E7" strokeWidth="4" />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
          style={{ color }}
        >
          {pct}%
        </span>
      </div>
      <span className="text-xs text-[#565959]">{label}</span>
    </div>
  );
}

export default function BundlesPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F1111]">Shopping Bundles</h1>
        <p className="text-[#565959] mt-1.5">
          Curated collections built around real shopping goals — buy together,
          save more.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {bundles.map((bundle) => {
          const resolvedProducts = bundle.products
            .map((id) => products.find((p) => p.id === id))
            .filter(Boolean);

          const avgTrust =
            resolvedProducts.length > 0
              ? Math.round(
                  resolvedProducts.reduce(
                    (sum, p) => sum + (p.trustScore || 0),
                    0
                  ) / resolvedProducts.length
                )
              : 0;

          const completeness = bundle.completeness ?? 100;

          const trustColor =
            avgTrust >= 80
              ? "text-green-700"
              : avgTrust >= 60
              ? "text-yellow-600"
              : "text-red-600";

          return (
            <div
              key={bundle.id}
              onClick={() => navigate(`/bundles/${bundle.id}`)}
              className="bg-white rounded-xl border border-[#DDD]
                shadow-sm hover:shadow-lg hover:-translate-y-1
                transition-all duration-200
                overflow-hidden cursor-pointer group"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] text-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-[#FFD814]" />
                    <span className="text-[#FFD814] text-xs uppercase tracking-widest font-bold">
                      Bundle
                    </span>
                  </div>
                  <span className="text-xs text-[#A4A9AD]">
                    {resolvedProducts.length} items
                  </span>
                </div>

                <h2 className="text-lg font-bold leading-snug group-hover:text-[#FFD814] transition-colors">
                  {bundle.name}
                </h2>
                <p className="text-xs text-[#A4A9AD] mt-1.5 line-clamp-2">
                  {bundle.tagline}
                </p>
              </div>

              <div className="p-5">
                {/* Product preview thumbnails */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2.5">
                    {resolvedProducts.slice(0, 4).map((product) => (
                      <img
                        key={product.id}
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-11 h-11 rounded-full border-2 border-white object-cover bg-[#F7F8F8]"
                      />
                    ))}
                    {resolvedProducts.length > 4 && (
                      <div className="w-11 h-11 rounded-full border-2 border-white
                        bg-[#F7F8F8] flex items-center justify-center
                        text-xs font-bold text-[#565959]">
                        +{resolvedProducts.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-[#F7F8F8] rounded-lg p-3 text-center border border-[#EBEBEB]">
                    <div className={`font-bold text-base ${trustColor}`}>
                      {avgTrust}
                    </div>
                    <div className="text-[10px] text-[#565959] mt-0.5 uppercase tracking-wide">
                      TrustLens
                    </div>
                  </div>

                  <div className="bg-[#F7F8F8] rounded-lg p-3 text-center border border-[#EBEBEB]">
                    <div className="font-bold text-base text-green-700">
                      {Math.round(
                        ((bundle.originalTotal - bundle.totalPrice) /
                          bundle.originalTotal) *
                          100
                      )}%
                    </div>
                    <div className="text-[10px] text-[#565959] mt-0.5 uppercase tracking-wide">
                      Savings
                    </div>
                  </div>

                  <div className="bg-[#F7F8F8] rounded-lg p-3 text-center border border-[#EBEBEB]">
                    <div className="font-bold text-base text-[#0F1111]">
                      ₹{(bundle.savings / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[10px] text-[#565959] mt-0.5 uppercase tracking-wide">
                      You Save
                    </div>
                  </div>
                </div>

                {/* Completeness ring */}
                <div className="flex items-center justify-between mb-4 py-3
                  border-t border-b border-[#EBEBEB]">
                  <CompletenessRing pct={completeness} />
                  {bundle.missingItems && bundle.missingItems.length > 0 && (
                    <span className="text-xs text-[#C45500] bg-[#FFF3E8]
                      border border-[#F5CBA7] px-2 py-1 rounded-full">
                      {bundle.missingItems.length} item{bundle.missingItems.length !== 1 ? "s" : ""} missing
                    </span>
                  )}
                </div>

                {/* Included product list */}
                <div className="space-y-1.5 mb-4">
                  {bundle.productDetails.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="line-clamp-1 text-[#0F1111] text-xs flex-1 mr-2">
                        {product.name}
                      </span>
                      <span className="font-medium text-xs flex-shrink-0 text-[#565959]">
                        {product.isFree
                          ? <span className="text-green-700 font-bold">FREE</span>
                          : `₹${product.price.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                  ))}
                  {bundle.productDetails.length > 4 && (
                    <p className="text-xs text-[#007185]">
                      +{bundle.productDetails.length - 4} more items
                    </p>
                  )}
                </div>

                {/* Pricing footer */}
                <div className="border-t border-[#EBEBEB] pt-4">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-xs text-[#565959]">Bundle price</span>
                    <div className="text-right">
                      <span className="font-bold text-lg text-[#0F1111]">
                        ₹{bundle.totalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="ml-2 text-xs text-[#565959] line-through">
                        ₹{bundle.originalTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/bundles/${bundle.id}`);
                    }}
                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#E8BB00]
                      text-[#0F1111] font-bold py-2.5 rounded-lg
                      flex items-center justify-center gap-2 text-sm
                      border border-[#FFA41C] transition-colors"
                  >
                    Explore Bundle
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}