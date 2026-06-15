import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { API } from "../utils/format.js";
import { useCart } from "../contexts/CartContext.jsx";
import {
  ShoppingCart,
  CheckCircle,
  Package,
  Star,
  TrendingDown,
  ChevronLeft,
  Plus,
  Zap,
  Sparkles,
} from "lucide-react";


// ── Trust score colour helper ────────────────────────────────────────────────
function trustColor(score) {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
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
  const location = useLocation();
  const { addToCart } = useCart();

  // Seed productMap instantly from passed products so the page renders without waiting for fetch
  const seedMap = {};
  (location.state?.resolvedProducts || []).forEach((p) => { seedMap[p.id] = p; });

  const [productMap, setProductMap] = useState(seedMap);
  const [staticBundles, setStaticBundles] = useState([]);
  const [addedAddons, setAddedAddons] = useState({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/bundles`).then((r) => r.json()),
      fetch(`${API}/api/products`).then((r) => r.json()),
    ]).then(([bundleData, productData]) => {
      setStaticBundles(bundleData.bundles || []);
      const map = {};
      (productData.products || []).forEach((p) => { map[p.id] = p; });
      setProductMap(map);
    }).catch(() => {});
  }, []);

  // Priority: router state (from ContinueYourJourney) → static bundles
  const rawBundle = (() => {
    // 1. AI bundle passed via navigation state
    const passed = location.state?.aiBundle;
    if (passed && passed.id === bundleId) {
      const resolvedPrices = (passed.items || [])
        .map((i) => productMap[i.productId])
        .filter(Boolean);
      const total = resolvedPrices.reduce((s, p) => s + p.price, 0);
      return {
        id: passed.id,
        name: passed.title,
        tagline: passed.reason,
        goal: passed.goal || null,
        products: (passed.items || []).map((i) => i.productId),
        perItemReasons: passed.perItemReasons || {},
        totalPrice: total,
        originalTotal: total,
        savings: 0,
        completeness: 100,
        missingItems: [],
        suggestedAddons: [],
        isAiBundle: true,
        tag: passed.tag,
        confidence: passed.confidence,
      };
    }
    // 2. Static curated bundles from server
    return staticBundles.find((b) => b.id === bundleId) || null;
  })();

  const bundle = rawBundle;

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

  // Resolve products that actually exist in the product map
  const bundleProducts = (bundle.products || [])
    .map((id) => productMap[id])
    .filter(Boolean);

  // Resolve suggested add-ons
  const addonProducts = (bundle.suggestedAddons || [])
    .map((id) => productMap[id])
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
            {bundle.isAiBundle && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                <Sparkles size={9} /> AI Personalized · {bundle.confidence}% match
              </span>
            )}
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

            {bundle.isAiBundle ? (
              <div className="bg-white rounded-lg border border-[#DDD] shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-[#007185]">
                  {bundle.confidence ?? "—"}%
                </div>
                <div className="text-xs text-[#565959] mt-0.5 font-medium uppercase tracking-wide">
                  AI Match
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#DDD] shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  ₹{bundle.savings.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-[#565959] mt-0.5 font-medium uppercase tracking-wide">
                  You Save
                </div>
              </div>
            )}

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
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAddEntireSetup}
              className="flex items-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00]
                active:bg-[#E8BB00] text-[#0F1111] font-bold
                px-4 py-2 rounded-lg text-xs transition-colors
                border border-[#FFA41C] shadow-sm"
            >
              <ShoppingCart size={14} />
              Add Entire Setup to Cart
            </button>

            {!bundle.isAiBundle && totalSavingsPct > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#565959]">
                <TrendingDown size={12} className="text-green-600" />
                <span>
                  Save{" "}
                  <span className="font-bold text-green-700">{totalSavingsPct}%</span>{" "}
                  vs. buying individually
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI GOAL (shown only for AI bundles) ───────────────────────── */}
      {bundle.isAiBundle && bundle.goal && (
        <div className="bg-[#E6F2F2] border border-[#007185]/30 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
          <Sparkles size={16} className="text-[#007185] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#0F1111]">
            <span className="font-semibold text-[#007185]">Goal: </span>{bundle.goal}
          </p>
        </div>
      )}

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
            <div key={product.id} className="flex flex-col gap-1">
              <ProductCard product={product} />
              {bundle.isAiBundle && bundle.perItemReasons?.[product.id] && (
                <p className="text-[10px] text-[#565959] leading-snug px-1">
                  {bundle.perItemReasons[product.id]}
                </p>
              )}
            </div>
          ))}
        </div>
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
          {bundle.isAiBundle
            ? bundle.tagline
            : `This bundle groups products that are frequently purchased together and are curated to help complete a specific shopping goal. TrustLens analysis gives this setup an average trust score of `}
          {!bundle.isAiBundle && (
            <><span className={`font-bold ${trustColor(avgTrust)}`}>{avgTrust}</span>{" "}across all {bundleProducts.length} included products — meaning you're getting both value and verified quality in one go.</>
          )}
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