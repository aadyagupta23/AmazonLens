import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight, Sparkles } from "lucide-react";

import ProductCard from "../components/ProductCard.jsx";
import { API } from "../utils/format.js";

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

function AiBundleCard({ bundle, productMap }) {
  const navigate = useNavigate();
  const resolvedProducts = (bundle.items || [])
    .map((i) => productMap[i.productId])
    .filter(Boolean);
  const total = resolvedProducts.reduce((s, p) => s + p.price, 0);
  const fmt = (n) => `₹${n >= 1000 ? (n / 1000).toFixed(1) + "K" : n}`;

  return (
    <div
      className="bg-white rounded-xl border-2 border-[#007185]/30 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/bundles/${bundle.id}`)}
    >
      <div className="bg-gradient-to-r from-[#004B91] to-[#007185] text-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
            <Sparkles size={9} /> AI Personalized
          </span>
          {bundle.confidence && (
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
              {bundle.confidence}% match
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold leading-snug group-hover:text-[#FFD814] transition-colors">{bundle.title}</h2>
        <p className="text-xs text-white/80 mt-1.5 line-clamp-2">{bundle.reason}</p>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2.5">
            {resolvedProducts.slice(0, 4).map((p) => (
              <img key={p.id} src={p.thumbnail} alt={p.name}
                className="w-11 h-11 rounded-full border-2 border-white object-contain bg-[#F7F8F8]"
                onError={(e) => { e.target.style.display = "none"; }} />
            ))}
            {resolvedProducts.length > 4 && (
              <div className="w-11 h-11 rounded-full border-2 border-white bg-[#F7F8F8] flex items-center justify-center text-xs font-bold text-[#565959]">
                +{resolvedProducts.length - 4}
              </div>
            )}
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium text-[#0F1111]">{resolvedProducts.length} items</p>
            <p className="text-xs text-[#565959]">Est. total: {fmt(total)}</p>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/bundles/${bundle.id}`); }}
          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm border border-[#FFA41C]"
        >
          Explore Bundle <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function BundlesPage() {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/bundles`).then((r) => r.json()),
      fetch(`${API}/api/products`).then((r) => r.json()),
    ]).then(([bundleData, productData]) => {
      setBundles(bundleData.bundles || []);
      const map = {};
      (productData.products || []).forEach((p) => { map[p.id] = p; });
      setProductMap(map);
    }).catch(() => {});
  }, []);

  const aiBundles = (() => {
    try { return JSON.parse(localStorage.getItem("amz_ai_bundles") || "[]"); }
    catch { return []; }
  })();

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F1111]">Shopping Bundles</h1>
        <p className="text-[#565959] mt-1.5">
          Curated collections built around real shopping goals — buy together,
          save more.
        </p>
      </div>

      {aiBundles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-bold text-[#0F1111]">For You</h2>
            <span className="flex items-center gap-1 text-xs text-[#007185] bg-[#E6F2F2] px-2 py-0.5 rounded-full font-semibold">
              <Sparkles size={11} /> Built from your orders
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-2">
            {aiBundles.map((b) => <AiBundleCard key={b.id} bundle={b} productMap={productMap} />)}
          </div>
          <hr className="mt-8 mb-6 border-[#DDD]" />
        </div>
      )}

      <h2 className="text-xl font-bold text-[#0F1111] mb-4">All Bundles</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {bundles.map((bundle) => {
          const resolvedProducts = (bundle.products || [])
            .map((id) => productMap[id])
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