import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, formatPrice, getTrustColor } from "../utils/format.js";
import { useCart } from "../contexts/CartContext.jsx";
import StarRating from "../components/StarRating.jsx";
import TrustScore from "../components/TrustLens/TrustScore.jsx";
import PriceHistory from "../components/TrustLens/PriceHistory.jsx";
import FakeDiscountAlert from "../components/TrustLens/FakeDiscountAlert.jsx";
import BuyWaitBox from "../components/TrustLens/BuyWaitBox.jsx";
import SuspiciousReviews from "../components/TrustLens/SuspiciousReviews.jsx";
import WitnessPanel from "../components/WitnessPanel/WitnessPanel.jsx";
import { Shield, Check, Truck, RotateCcw, ChevronRight, ChevronLeft, Share2, Heart } from "lucide-react";

const QTY_OPTIONS = [1, 2, 3, 4, 5];

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [trustExpanded, setTrustExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/api/products/${productId}`)
      .then(({ data }) => {
        setProduct(data.product);
        setSelectedImage(0);

        // Request TrustLens analysis for this product (demo heuristic analyzer)
        (async () => {
          try {
            const { data: analysisRes } = await axios.post(`${API}/api/sense/analyze`, { productId: data.product.id });
            if (analysisRes?.analysis) {
              setProduct((prev) => ({
                ...prev,
                // Only override trustScore for products without hand-crafted data (no trustBreakdown)
                trustScore: prev.trustBreakdown ? prev.trustScore : analysisRes.analysis.trustScore,
                trustReasons: analysisRes.analysis.reasons || []
              }));
            }
          } catch (err) {
            // ignore analysis errors; keep existing product trustScore
            console.warn("TrustLens analyze failed:", err?.message || err);
          }
        })();
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const trust = getTrustColor(product.trustScore);
  const nonSuspicious = (product.reviews || []).filter((r) => !r.suspicious);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#565959] mb-3 flex items-center gap-1 flex-wrap">
          <Link to="/" className="text-[#007185] hover:underline">Home</Link>
          <span>›</span>
          {product.category.split(" > ").map((crumb, i, arr) => (
            <React.Fragment key={crumb}>
              {i === arr.length - 1 ? (
                <span className="text-[#0F1111]">{crumb}</span>
              ) : (
                <Link to={`/s?category=${encodeURIComponent(crumb)}`} className="text-[#007185] hover:underline">
                  {crumb}
                </Link>
              )}
              {i < arr.length - 1 && <span>›</span>}
            </React.Fragment>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr_280px] gap-6">
          {/* LEFT: Images */}
          <div className="lg:sticky lg:top-20 self-start">
            {/* Main image */}
            <div className="border border-gray-200 rounded-lg bg-white flex items-center justify-center overflow-hidden mb-3" style={{ minHeight: 360, maxHeight: 400 }}>
              <img
                src={product.images?.[selectedImage] || product.thumbnail}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-6"
                onError={(e) => { e.target.src = `https://placehold.co/400x400/EAEDED/131921?text=${encodeURIComponent(product.brand)}`; }}
              />
            </div>

            {/* Thumbnail strip */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-14 h-14 border-2 rounded overflow-hidden ${
                      selectedImage === i ? "border-[#FF9900]" : "border-gray-200 hover:border-[#007185]"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" onError={(e) => { e.target.src = "https://via.placeholder.com/56"; }} />
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button className="flex items-center gap-1.5 text-xs text-[#007185] hover:text-[#C7511F] hover:underline">
                <Share2 size={13} /> Share
              </button>
              <button className="flex items-center gap-1.5 text-xs text-[#007185] hover:text-[#C7511F] hover:underline">
                <Heart size={13} /> Wishlist
              </button>
            </div>
          </div>

          {/* MIDDLE: Product details */}
          <div className="min-w-0">
            {/* Brand */}
            <Link to={`/s?q=${product.brand}`} className="text-xs text-[#007185] hover:underline hover:text-[#C7511F]">
              Visit the {product.brand} Store
            </Link>

            {/* Title */}
            <h1 className="text-xl font-medium text-[#0F1111] mt-1 leading-snug">{product.name}</h1>

            {/* Ratings */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StarRating rating={product.rating} count={product.reviewCount} size="md" />
              <span className="text-xs text-[#565959]">|</span>
              <a href="#reviews" className="text-xs text-[#007185] hover:underline">
                {product.reviewCount.toLocaleString("en-IN")} ratings
              </a>
              <span className="text-xs text-[#565959]">|</span>
              <span className="text-xs text-[#C7511F]">Search this page</span>
            </div>

            <hr className="my-3 border-gray-200" />

            {/* ── TRUSTLENS PANEL ── */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200 rounded-xl p-4 mb-4">
              {/* TrustLens header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#131921]" />
                  <span className="font-bold text-[#0F1111] text-sm">TrustLens™</span>
                  <span className="text-[10px] bg-[#131921] text-white px-2 py-0.5 rounded-full font-bold">BETA</span>
                </div>
                <button
                  onClick={() => setTrustExpanded(!trustExpanded)}
                  className="text-xs text-[#007185] hover:underline"
                >
                  {trustExpanded ? "Collapse" : "Expand"}
                </button>
              </div>

              {/* Trust score always visible */}
              <TrustScore score={product.trustScore} size="lg" product={product} />

              {trustExpanded && (
                <div className="mt-4 space-y-4">
                  {/* TrustLens analysis reasons (from backend) */}
                  {product.trustReasons && product.trustReasons.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="text-xs text-[#565959] font-medium mb-2">Why this score?</div>
                      <ul className="list-disc list-inside text-xs text-[#0F1111] space-y-1">
                        {product.trustReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Fake discount alert */}
                  {product.isFakeDiscount && (
                    <FakeDiscountAlert note={product.fakeDiscountNote} />
                  )}

                  {/* Buy/Wait recommendation */}
                  <BuyWaitBox buyNowOrWait={product.buyNowOrWait} waitReason={product.waitReason} />

                  {/* Price history graph */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <PriceHistory
                      priceHistory={product.priceHistory}
                      currentPrice={product.price}
                      spikePriceMonths={product.spikePriceMonths}
                    />
                  </div>

                  {/* Suspicious reviews */}
                  <SuspiciousReviews reviews={product.reviews || []} />
                </div>
              )}
            </div>

            {/* ── PRICING ── */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-[#565959]">M.R.P.:</span>
                <span className="text-[#565959] text-sm line-through">{formatPrice(product.originalPrice)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${trust.bg} ${trust.text}`}>
                  -{product.discount}% (TrustLens verified)
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-medium text-[#0F1111]">
                  <span className="text-xl">₹</span>
                  {product.price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-xs text-[#565959] mt-0.5">Inclusive of all taxes</div>

              {product.isPrime && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[#00A8E1] font-bold text-sm">prime</span>
                  <span className="text-xs text-[#007600] font-medium">FREE delivery</span>
                  <span className="text-xs text-[#0F1111]">{product.delivery}</span>
                </div>
              )}
            </div>

            {/* ── DESCRIPTION ── */}
            <div className="mb-4">
              <p className="text-sm text-[#0F1111] leading-relaxed">{product.description}</p>
            </div>

            {/* ── FEATURES ── */}
            {product.features?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-[#0F1111] text-sm mb-2">About this item</h3>
                <ul className="space-y-1.5">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#0F1111]">
                      <span className="text-[#FF9900] mt-0.5 flex-shrink-0">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── SPECIFICATIONS ── */}
            {product.specs && (
              <div className="mb-6">
                <h3 className="font-bold text-[#0F1111] text-sm mb-2">Technical Details</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {Object.entries(product.specs).map(([key, val], i) => (
                      <tr key={key} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="py-2 px-3 text-[#565959] font-medium w-2/5 border border-gray-200">{key}</td>
                        <td className="py-2 px-3 text-[#0F1111] border border-gray-200">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── WITNESS PANEL ── */}
            {product.witnesses?.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white mb-6">
                <WitnessPanel witnesses={product.witnesses} product={product} />
              </div>
            )}

            {/* ── CUSTOMER REVIEWS ── */}
            <div id="reviews" className="mb-6">
              <h2 className="font-bold text-[#0F1111] text-base mb-4">Customer Reviews</h2>

              {/* Rating breakdown */}
              <div className="flex items-start gap-6 mb-4 flex-wrap">
                <div className="text-center">
                  <div className="text-5xl font-bold text-[#0F1111]">{product.rating}</div>
                  <StarRating rating={product.rating} size="sm" />
                  <div className="text-xs text-[#565959] mt-1">out of 5</div>
                </div>
                <div className="flex-1 min-w-48">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = star === 5 ? 52 : star === 4 ? 28 : star === 3 ? 12 : star === 2 ? 5 : 3;
                    return (
                      <div key={star} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#007185] hover:underline cursor-pointer w-10">{star} star</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div className="bg-[#FF9900] h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#007185] w-8">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-4">
                {nonSuspicious.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-[#EAEDED] flex items-center justify-center text-xs font-bold text-[#565959]">
                        {review.author[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#0F1111]">{review.author}</span>
                      {review.verified && (
                        <span className="text-xs text-[#C7511F]">Verified Purchase</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm font-bold text-[#0F1111]">{review.title}</span>
                    </div>
                    <p className="text-xs text-[#565959] mb-1">Reviewed in India on {review.date}</p>
                    <p className="text-sm text-[#0F1111]">{review.body}</p>
                    <p className="text-xs text-[#565959] mt-2">{review.helpful} people found this helpful</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Buy box */}
          <div className="lg:sticky lg:top-20 self-start">
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
              {/* Price */}
              <div className="text-2xl font-medium text-[#0F1111] mb-1">
                <span className="text-base">₹</span>
                {product.price.toLocaleString("en-IN")}
              </div>

              {/* Prime delivery */}
              {product.isPrime && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#00A8E1] font-bold">prime</span>
                    <span className="text-[#007600] font-medium">FREE Delivery</span>
                  </div>
                  <div className="text-xs text-[#0F1111] mt-0.5">{product.delivery}</div>
                </div>
              )}

              {/* Delivery location */}
              <div className="text-xs text-[#0F1111] mb-3">
                Deliver to <span className="text-[#007185] font-medium cursor-pointer hover:underline">Bengaluru 560001</span>
              </div>

              {/* Stock */}
              <div className="text-base text-[#007600] font-medium mb-3">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-[#0F1111]">Qty:</span>
                <select
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="border border-[#DDD] rounded px-2 py-1 text-sm text-[#0F1111] bg-[#F7F8F8] cursor-pointer"
                >
                  {QTY_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-2.5 rounded-full text-sm font-bold transition-all ${
                    addedToCart
                      ? "bg-[#067D62] text-white"
                      : "bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111]"
                  }`}
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check size={14} /> Added to Cart
                    </span>
                  ) : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] py-2.5 rounded-full text-sm font-bold"
                >
                  Buy Now
                </button>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Seller info */}
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#565959]">Sold by</span>
                  <span className="text-[#007185] hover:underline cursor-pointer">{product.soldBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#565959]">Seller rating</span>
                  <span className="text-[#0F1111] font-medium">{product.soldByRating} ★</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#565959]">Seller since</span>
                  <span className="text-[#0F1111]">{product.sellerSince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#565959]">Fulfilled by</span>
                  <span className="text-[#0F1111]">{product.fulfillment}</span>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Trust badges */}
              <div className="space-y-2.5 text-xs text-[#0F1111]">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-[#565959]" />
                  <span>Amazon.in Return Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[#565959]" />
                  <span>Free delivery on orders above ₹499</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="text-[#565959]" />
                  <span>10 days replacement guarantee</span>
                </div>
              </div>

              {/* TrustLens mini-badge in buy box */}
              <div className={`mt-4 ${trust.bg} rounded-lg px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-xs font-bold">TrustLens Score</div>
                    <div className="text-white/80 text-[10px]">{trust.label}</div>
                  </div>
                  <div className="text-white text-2xl font-bold">{product.trustScore}</div>
                </div>
                {product.buyNowOrWait === "wait" && (
                  <div className="text-white/90 text-[10px] mt-1 border-t border-white/20 pt-1">
                    ⏳ {product.waitReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
