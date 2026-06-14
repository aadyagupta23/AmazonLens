import React, { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bundles, products } from "../../../server/data/mockData.js";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import {
  ShoppingCart,
  CheckCircle,
  Package,
  Star,
  TrendingDown,
  ChevronLeft,
  Plus,
  AlertCircle,
  Zap,
} from "lucide-react";


// ── Trust score colour helper ────────────────────────────────────────────────
function trustColor(score) {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

// ── Completeness progress bar ────────────────────────────────────────────────
function CompletenessBar({ pct }) {
  const color =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
      ? "bg-yellow-400"
      : "bg-orange-400";
  return (
    <div className="w-full bg-[#E7E7E7] rounded-full h-3 overflow-hidden">
      <div
        className={`${color} h-3 rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Inline add-on card (for Frequently Added Items) ─────────────────────────
function AddonCard({ product, onAdd, added }) {
  return (
    <div className="flex items-center gap-3 bg-[#F7F8F8] rounded-lg border border-[#DDD] p-3 hover:border-[#007185] transition-colors">
      <img
        src={product.thumbnail}
        alt={product.name}
        className="w-16 h-16 object-contain rounded bg-white border border-[#EEE] flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F1111] line-clamp-2 leading-snug">
          {product.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star size={11} className="text-[#FFA41C] fill-[#FFA41C]" />
          <span className="text-xs text-[#565959]">
            {product.rating} · {product.reviewCount.toLocaleString("en-IN")} reviews
          </span>
        </div>
        <p className="text-sm font-bold text-[#0F1111] mt-1">
          ₹{product.price.toLocaleString("en-IN")}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="ml-2 text-xs font-normal text-[#565959] line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={() => onAdd(product)}
        disabled={added}
        className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold transition-all ${
          added
            ? "bg-green-100 text-green-700 border border-green-300 cursor-default"
            : "bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FFA41C]"
        }`}
      >
        {added ? (
          <>
            <CheckCircle size={13} />
            Added
          </>
        ) : (
          <>
            <Plus size={13} />
            Add
          </>
        )}
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BundleDetailPage() {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Track which add-ons have been added this session (for button feedback)
  const [addedAddons, setAddedAddons] = useState({});
  // Toast state for "Add Entire Setup" confirmation
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const bundle = bundles.find((b) => b.id === bundleId);

  if (!bundle) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/bundles")}
          className="flex items-center gap-1 text-[#007185] hover:underline text-sm mb-4"
        >
          <ChevronLeft size={16} /> Back to Bundles
        </button>
        <h1 className="text-2xl font-bold text-[#0F1111]">Bundle not found</h1>
        <p className="text-[#565959] mt-2">
          The bundle you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  // Resolve products that actually exist in the products array
  const bundleProducts = bundle.products
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  // Resolve suggested add-ons
  const addonProducts = (bundle.suggestedAddons || [])
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  const avgTrust =
    bundleProducts.length > 0
      ? Math.round(
          bundleProducts.reduce((sum, p) => sum + (p.trustScore || 0), 0) /
            bundleProducts.length
        )
      : 0;

  const totalSavingsPct = bundle.originalTotal
    ? Math.round(((bundle.originalTotal - bundle.totalPrice) / bundle.originalTotal) * 100)
    : 0;

  // ── Cart helpers ────────────────────────────────────────────────────────
  function showToast(msg) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  function handleAddEntireSetup() {
    if (!addToCart) {
      showToast(`${bundleProducts.length} items ready to add (connect CartContext)`);
      return;
    }
    
    bundleProducts.forEach((p) => 
        addToCart(p));
    showToast(`${bundleProducts.length} items added to cart!`);
  }

  function handleAddAddon(product) {
    addToCart(product);
    setAddedAddons((prev) => ({ ...prev, [product.id]: true }));
    showToast(`"${product.name.slice(0, 40)}..." added to cart`);
  }

  const completeness = bundle.completeness ?? 100;
  const missingItems = bundle.missingItems ?? [];

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">

      {/* ── Toast notification ─────────────────────────────────────────── */}
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-3 bg-[#232F3E] text-white
          px-5 py-3 rounded-lg shadow-2xl transition-all duration-300 max-w-sm
          ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
      >
        <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
        <span className="text-sm font-medium">{toastMsg}</span>
      </div>

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate("/bundles")}
        className="flex items-center gap-1 text-[#007185] hover:underline text-sm mb-5"
      >
        <ChevronLeft size={15} />
        Back to Bundles
      </button>

      {/* ── HEADER CARD ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#DDD] overflow-hidden mb-5 shadow-sm">
        {/* Dark gradient banner */}
        <div className="bg-gradient-to-r from-[#131921] via-[#1a2533] to-[#232F3E] px-6 pt-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-[#FFD814]" />
            <span className="text-[#FFD814] text-xs font-bold uppercase tracking-widest">
              Shopping Bundle
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {bundle.name}
          </h1>
          <p className="text-[#A4A9AD] mt-2 text-sm sm:text-base">
            {bundle.tagline}
          </p>
        </div>

        {/* Stats strip + CTA — overlaps the banner via negative margin */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 -mt-5 mb-5">
            <div className="bg-white rounded-lg border border-[#DDD] shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-[#0F1111]">
                {bundleProducts.length}
              </div>
              <div className="text-xs text-[#565959] mt-0.5 font-medium uppercase tracking-wide">
                Products
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DDD] shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold ${trustColor(avgTrust)}`}>
                {avgTrust}
              </div>
              <div className="text-xs text-[#565959] mt-0.5 font-medium uppercase tracking-wide">
                Avg TrustLens
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DDD] shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-700">
                ₹{bundle.savings.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-[#565959] mt-0.5 font-medium uppercase tracking-wide">
                You Save
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DDD] shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-[#0F1111]">
                ₹{bundle.totalPrice.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-[#565959] mt-0.5 font-medium uppercase tracking-wide">
                Bundle Price
              </div>
            </div>
          </div>

          {/* Add Entire Setup to Cart */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleAddEntireSetup}
              className="flex items-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00]
                active:bg-[#E8BB00] text-[#0F1111] font-bold
                px-6 py-3 rounded-lg text-sm transition-colors
                border border-[#FFA41C] shadow-sm"
            >
              <ShoppingCart size={16} />
              Add Entire Setup to Cart
            </button>

            <div className="flex items-center gap-2 text-xs text-[#565959]">
              <TrendingDown size={13} className="text-green-600" />
              <span>
                Save{" "}
                <span className="font-bold text-green-700">{totalSavingsPct}%</span>{" "}
                vs. buying individually
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INCLUDED PRODUCTS ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#DDD] p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F1111]">
            Included Products
          </h2>
          <span className="text-sm text-[#565959] bg-[#F7F8F8] px-3 py-1 rounded-full border border-[#DDD]">
            {bundleProducts.length} items
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {bundleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* ── SETUP COMPLETENESS ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#DDD] p-5 mb-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F1111] mb-4">
          Setup Completeness
        </h2>

        <div className="flex items-end gap-3 mb-3">
          <span
            className={`text-4xl font-bold ${
              completeness >= 80
                ? "text-green-700"
                : completeness >= 60
                ? "text-yellow-600"
                : "text-orange-500"
            }`}
          >
            {completeness}%
          </span>
          <span className="text-[#565959] text-sm pb-1">Complete</span>
        </div>

        <CompletenessBar pct={completeness} />

        <p className="text-xs text-[#565959] mt-2 mb-4">
          {completeness >= 80
            ? "This setup is nearly complete — a few extras will make it perfect."
            : completeness >= 60
            ? "Good foundation! A few additions will round this out significantly."
            : "Core essentials covered. Consider the items below for a full setup."}
        </p>

        {missingItems.length > 0 && (
          <div className="border-t border-[#EBEBEB] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-[#C45500]" />
              <span className="text-sm font-semibold text-[#0F1111]">
                What's missing
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#FFF3E8] text-[#C45500]
                    border border-[#F5CBA7] px-3 py-1.5 rounded-full font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C45500] flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FREQUENTLY ADDED ITEMS ─────────────────────────────────────── */}
      {addonProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DDD] p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-[#FFD814]" />
            <h2 className="text-lg font-bold text-[#0F1111]">
              Frequently Added with This Setup
            </h2>
          </div>
          <p className="text-sm text-[#565959] mb-4">
            Customers who bought this bundle also picked these up.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {addonProducts.map((product) => (
              <AddonCard
                key={product.id}
                product={product}
                onAdd={handleAddAddon}
                added={!!addedAddons[product.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── WHY THIS BUNDLE ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#DDD] p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F1111] mb-3">
          Why this bundle?
        </h2>
        <p className="text-[#565959] text-sm leading-relaxed">
          This bundle groups products that are frequently purchased together
          and are curated to help complete a specific shopping goal. TrustLens
          analysis gives this setup an average trust score of{" "}
          <span className={`font-bold ${trustColor(avgTrust)}`}>{avgTrust}</span>{" "}
          across all {bundleProducts.length} included products — meaning you're
          getting both value and verified quality in one go.
        </p>

        {bundle.savings > 0 && (
          <div className="mt-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <TrendingDown size={16} className="text-green-700 flex-shrink-0" />
            <p className="text-sm text-green-800">
              You save{" "}
              <span className="font-bold">
                ₹{bundle.savings.toLocaleString("en-IN")}
              </span>{" "}
              ({totalSavingsPct}% off) compared to buying each item separately.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}