import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, formatPrice } from "../utils/format.js";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { getSustainabilityData } from "../utils/sustainability.js";
import StarRating from "../components/StarRating.jsx";
import TrustPanel from "../components/TrustLens/TrustPanel.jsx";
import UserTrustVote from "../components/TrustLens/UserTrustVote.jsx";
import MockReturn from "../components/TrustLens/MockReturn.jsx";
import SuspiciousReviews from "../components/TrustLens/SuspiciousReviews.jsx";
import WitnessPanel from "../components/WitnessPanel/WitnessPanel.jsx";
import SustainabilityPanel from "../components/Sustainability/SustainabilityPanel.jsx";
import SustainabilityBadge from "../components/Sustainability/SustainabilityBadge.jsx";
import { Check, Truck, RotateCcw, Share2, Heart, Shield } from "lucide-react";

const QTY_OPTIONS = [1, 2, 3, 4, 5];

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle: toggleWishlist, isInWishlist } = useWishlist();
  const { showOnProduct } = useSustainability();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [trustData, setTrustData] = useState(null);
  const [trustAnalyzing, setTrustAnalyzing] = useState(false);
  const [userReturnCount, setUserReturnCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchSellerTrust = async (pid, returns = 0) => {
    setTrustAnalyzing(true);
    try {
      const { data: res } = await axios.post(`${API}/api/sense/seller-trust`, {
        productId: pid,
        userReturns: returns,
      });
      setTrustData(res);
    } catch (err) {
      console.warn("TrustLens seller-trust failed:", err?.message || err);
    } finally {
      setTrustAnalyzing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/api/products/${productId}`)
      .then(({ data }) => {
        setProduct(data.product);
        setSelectedImage(0);

        // Company trust score (seller-level formula)
        const pid = data.product.id;
        const savedReturns = JSON.parse(localStorage.getItem(`returns_${pid}`) || "[]");
        setUserReturnCount(savedReturns.length);
        fetchSellerTrust(pid, savedReturns.length);
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

  const nonSuspicious = (product.reviews || []).filter((r) => !r.suspicious);
  const sustainData = getSustainabilityData(product.id);

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
              <button
                onClick={() => product && toggleWishlist(product)}
                className="flex items-center gap-1.5 text-xs hover:underline"
                style={{ color: product && isInWishlist(product.id) ? "#CC0C39" : "#007185" }}
              >
                <Heart
                  size={13}
                  className={product && isInWishlist(product.id) ? "fill-[#CC0C39] text-[#CC0C39]" : ""}
                />
                {product && isInWishlist(product.id) ? "Wishlisted" : "Wishlist"}
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
            <div className="mb-4">
              <TrustPanel
                data={trustData}
                loading={trustAnalyzing}
                sellerName={trustData?.sellerName}
              />
              {/* User vote + mock return — shown once data loads */}
              {!trustAnalyzing && trustData && (
                <div className="mt-1 bg-white border border-gray-200 rounded-2xl px-4 py-1 shadow-sm">
                  <UserTrustVote productId={productId} />
                  <MockReturn
                    productId={productId}
                    productName={product.name}
                    onReturnFiled={(count) => {
                      setUserReturnCount(count);
                      fetchSellerTrust(productId, count);
                    }}
                  />
                </div>
              )}
              {/* Suspicious reviews (shown below panel) */}
              {!trustAnalyzing && (product.reviews || []).some((r) => r.suspicious) && (
                <div className="mt-2">
                  <SuspiciousReviews reviews={product.reviews || []} />
                </div>
              )}
            </div>

            {/* ── SUSTAINABILITY PANEL (visible when Sustainability Mode is on) ── */}
            {showOnProduct && <SustainabilityPanel data={sustainData} />}

            {/* ── PRICING ── */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-[#565959]">M.R.P.:</span>
                <span className="text-[#565959] text-sm line-through">{formatPrice(product.originalPrice)}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#CC0C39] text-white">
                  -{product.discount}%
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
              {(() => {
                const statusBg = !trustData ? "#FF9900"
                  : trustData.status === "VERIFIED" ? "#16a34a"
                  : trustData.status === "MIXED" ? "#ea580c"
                  : "#dc2626";
                return (
                  <div
                    className="mt-4 rounded-lg px-3 py-2 transition-colors duration-700"
                    style={{ backgroundColor: statusBg }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-xs font-bold">TrustLens™</div>
                        <div className="text-white/80 text-[10px]">
                          {trustAnalyzing ? "Analyzing…" : (trustData?.status || "—")}
                        </div>
                      </div>
                      <div className="text-white text-2xl font-bold">
                        {trustAnalyzing ? "…" : (trustData ? `${trustData.companyScore}` : "—")}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sustainability mini-badge in buy box (only when mode is on) */}
              {showOnProduct && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#1B5E20] text-xs font-bold">Sustainability</div>
                      <div className="text-[#1B5E20]/70 text-[10px]">
                        {sustainData.score >= 75 ? "Eco-Friendly" : sustainData.score >= 50 ? "Moderate" : "Low Impact"}
                      </div>
                    </div>
                    <div className="text-[#1B5E20] text-2xl font-bold">{sustainData.score}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
