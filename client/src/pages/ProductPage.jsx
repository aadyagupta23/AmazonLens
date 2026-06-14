import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, formatPrice } from "../utils/format.js";
import { useCart } from "../contexts/CartContext.jsx";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { useHistory } from "../contexts/HistoryContext.jsx";
import { useReviews } from "../contexts/ReviewsContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCoPlanner } from "../contexts/CoPlannerContext.jsx";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { getSustainabilityData } from "../utils/sustainability.js";
import StarRating from "../components/StarRating.jsx";
import TrustPanel from "../components/TrustLens/TrustPanel.jsx";
import UserTrustVote from "../components/TrustLens/UserTrustVote.jsx";
import MockReturn from "../components/TrustLens/MockReturn.jsx";
import { useDna } from "../contexts/DnaContext.jsx";
import ReturnRiskBadge from "../components/ReturnRiskBadge.jsx";
import SuspiciousReviews from "../components/TrustLens/SuspiciousReviews.jsx";
import PriceDropPrediction from "../components/TrustLens/PriceDropPrediction.jsx";
import WitnessPanel from "../components/WitnessPanel/WitnessPanel.jsx";
import SustainabilityPanel from "../components/Sustainability/SustainabilityPanel.jsx";
import SustainabilityBadge from "../components/Sustainability/SustainabilityBadge.jsx";
import { Check, Truck, RotateCcw, Share2, Heart, Shield, Star, Users as UsersIcon } from "lucide-react";

const QTY_OPTIONS = [1, 2, 3, 4, 5];

export default function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggle: toggleWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useHistory();
  const { saveReview, hasReviewed } = useReviews();
  const { user: authUser, realUser } = useAuth();
  const { plans: coPlannerPlans, startAddToPlan } = useCoPlanner();
  const { showOnProduct } = useSustainability();
  const { recordEvent } = useDna();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [trustData, setTrustData] = useState(null);
  const [trustAnalyzing, setTrustAnalyzing] = useState(false);
  const [userReturnCount, setUserReturnCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", email: "", password: "", rating: 0, hoverRating: 0, title: "", body: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchReviews = async (pid, page = 1) => {
    setReviewsLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/customers/reviews/${pid}?page=${page}&limit=10`);
      if (page === 1) setDbReviews(data.reviews);
      else setDbReviews((prev) => [...prev, ...data.reviews]);
      setReviewsTotal(data.total);
      setReviewsPage(page);
    } catch (err) {
      console.warn("Reviews fetch failed:", err?.message);
    } finally {
      setReviewsLoading(false);
    }
  };

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
        addToHistory(data.product);

        const pid = data.product.id;
        const savedReturns = JSON.parse(localStorage.getItem(`returns_${pid}`) || "[]");
        setUserReturnCount(savedReturns.length);
        fetchSellerTrust(pid, savedReturns.length);
        fetchReviews(pid, 1);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [productId]);
  useEffect(() => {
      if (product) recordEvent("view", product);
    }, [product?.id]);


  const handleAddToCart = () => {
    addToCart(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    navigate("/cart");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) { setReviewError("Please select a star rating."); return; }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const { data: newReview } = await axios.post(`${API}/api/customers/reviews`, {
        name: authUser?.name || "Anonymous",
        email: authUser?.email || "",
        productId,
        seller: product?.soldBy,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
      });
      // prepend so new review appears at top + update count
      setDbReviews((prev) => [newReview, ...prev]);
      setReviewsTotal((t) => t + 1);
      // also save to localStorage for My Reviews page
      saveReview({
        productId,
        productName: product.name,
        productThumbnail: product.thumbnail,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
        date: new Date().toISOString(),
      });
      setReviewSuccess(true);
      setReviewForm({ name: "", email: "", password: "", rating: 0, hoverRating: 0, title: "", body: "" });
    } catch (err) {
      setReviewError(err?.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
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

  // Live rating computed from all loaded reviews (updates when new review submitted)
  const liveRating = dbReviews.length > 0
    ? parseFloat((dbReviews.reduce((s, r) => s + r.rating, 0) / dbReviews.length).toFixed(1))
    : product.rating;

  // Star distribution from loaded reviews (falls back to static percentages)
  const starDist = dbReviews.length > 0
    ? [5, 4, 3, 2, 1].map((star) => {
        const cnt = dbReviews.filter((r) => r.rating === star).length;
        return { star, pct: Math.round((cnt / dbReviews.length) * 100) };
      })
    : [5, 4, 3, 2, 1].map((star, i) => ({ star, pct: [52, 28, 12, 5, 3][i] }));

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

        <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[420px_1fr_280px]
          gap-6
          lg:h-[calc(100vh-90px)]
        "
      >
          {/* LEFT: Images */}
          <div
          className="
            lg:sticky
            lg:top-20
            lg:h-[calc(100vh-110px)]
            overflow-y-auto
            overscroll-contain
          "
        >
            <div className="border border-gray-200 rounded-lg bg-white flex items-center justify-center overflow-hidden mb-3" style={{ minHeight: 360, maxHeight: 400 }}>
              <img
                src={product.images?.[selectedImage] || product.thumbnail}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-6"
                onError={(e) => { e.target.src = `https://placehold.co/400x400/EAEDED/131921?text=${encodeURIComponent(product.brand)}`; }}
              />
            </div>

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
          <div
          className="
            min-w-0
            lg:h-[calc(100vh-110px)]
            overflow-y-auto
            overscroll-contain
            pr-2
          "
        >
            <Link to={`/s?q=${product.brand}`} className="text-xs text-[#007185] hover:underline hover:text-[#C7511F]">
              Visit the {product.brand} Store
            </Link>

            <h1 className="text-xl font-medium text-[#0F1111] mt-1 leading-snug">{product.name}</h1>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StarRating rating={liveRating} count={reviewsTotal || product.reviewCount} size="md" />
              <span className="text-xs text-[#565959]">|</span>
              <a href="#reviews" className="text-xs text-[#007185] hover:underline">
                {(reviewsTotal || product.reviewCount).toLocaleString("en-IN")} ratings
              </a>
              <span className="text-xs text-[#565959]">|</span>
              <span className="text-xs text-[#C7511F]">Search this page</span>
            </div>

            <hr className="my-3 border-gray-200" />

            {/* TrustLens Panel */}
            <div className="mb-4">
            <div className="rounded-xl">
            <TrustPanel
              data={trustData}
              loading={trustAnalyzing}
              sellerName={trustData?.sellerName}
            />
          </div>
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
              {!trustAnalyzing && (product.reviews || []).some((r) => r.suspicious) && (
                <div className="mt-2">
                  <SuspiciousReviews reviews={product.reviews || []} />
                </div>
              )}
            </div>

            {showOnProduct && <SustainabilityPanel data={sustainData} />}

            {/* Pricing */}
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

            <div className="mb-4">
              <p className="text-sm text-[#0F1111] leading-relaxed">{product.description}</p>
            </div>

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

            <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white mb-6">
              <WitnessPanel product={product} />
            </div>

            <div id="reviews" className="mb-6">
              <h2 className="font-bold text-[#0F1111] text-base mb-4">Customer Reviews</h2>
              <div className="flex items-start gap-6 mb-4 flex-wrap">
                <div className="text-center">
                  <div className="text-5xl font-bold text-[#0F1111]">{liveRating}</div>
                  <StarRating rating={liveRating} size="sm" />
                  <div className="text-xs text-[#565959] mt-1">out of 5</div>
                </div>
                <div className="flex-1 min-w-48">
                  {starDist.map(({ star, pct }) => (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#007185] hover:underline cursor-pointer w-10">{star} star</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-[#FF9900] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-[#007185] w-8">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── WRITE A REVIEW (above list) ── */}
              <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-[#FAFAFA]">
                <h3 className="font-bold text-[#0F1111] text-sm mb-3">Write a customer review</h3>
                {reviewSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                    ✓ Your review has been submitted and now appears at the top.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    {/* Reviewing as */}
                    <div className="flex items-center gap-2 text-sm text-[#565959]">
                      <div className="w-6 h-6 rounded-full bg-[#232F3E] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {authUser?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      Reviewing as <span className="font-medium text-[#0F1111]">{authUser?.name || "Guest"}</span>
                    </div>

                    {/* Star rating */}
                    <div>
                      <label className="text-xs font-medium text-[#0F1111] block mb-1">Overall rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                            onMouseEnter={() => setReviewForm((f) => ({ ...f, hoverRating: s }))}
                            onMouseLeave={() => setReviewForm((f) => ({ ...f, hoverRating: 0 }))}
                            className="p-0.5"
                          >
                            <Star
                              size={24}
                              className={s <= (reviewForm.hoverRating || reviewForm.rating) ? "text-[#FF9900] fill-[#FF9900]" : "text-gray-300"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#0F1111] block mb-1">Review headline</label>
                      <input
                        type="text"
                        required
                        placeholder="What's most important to know?"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-[#0F1111] focus:outline-none focus:border-[#FF9900]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#0F1111] block mb-1">Your review</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="What did you like or dislike? What did you use this product for?"
                        value={reviewForm.body}
                        onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-[#0F1111] focus:outline-none focus:border-[#FF9900] resize-none"
                      />
                    </div>

                    {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-sm font-bold px-6 py-2 rounded-full disabled:opacity-50"
                    >
                      {reviewSubmitting ? "Submitting…" : "Submit review"}
                    </button>
                  </form>
                )}
              </div>

              {/* Review list — from customer database */}
              <div className="space-y-4 pr-2">
                {dbReviews.map((review, i) => (
                  <div key={`${review.customerId}-${i}`} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-[#EAEDED] flex items-center justify-center text-xs font-bold text-[#565959]">
                        {review.author[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#0F1111]">{review.author}</span>
                      <span className="text-xs text-[#565959]">{review.city}</span>
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
                  </div>
                ))}
                {reviewsLoading && (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!reviewsLoading && dbReviews.length < reviewsTotal && (
                  <button
                    onClick={() => fetchReviews(productId, reviewsPage + 1)}
                    className="text-sm text-[#007185] hover:underline mt-2"
                  >
                    Load more reviews ({reviewsTotal - dbReviews.length} remaining)
                  </button>
                )}
                {!reviewsLoading && dbReviews.length === 0 && (
                  <p className="text-sm text-[#565959]">No reviews yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Buy box */}
        <div
          className="
            lg:h-[calc(100vh-110px)]
            overflow-y-auto
            overscroll-contain
          "
        >
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
              <div className="text-2xl font-medium text-[#0F1111] mb-1">
                <span className="text-base">₹</span>
                {product.price.toLocaleString("en-IN")}
              </div>

              {product.isPrime && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#00A8E1] font-bold">prime</span>
                    <span className="text-[#007600] font-medium">FREE Delivery</span>
                  </div>
                  <div className="text-xs text-[#0F1111] mt-0.5">{product.delivery}</div>
                </div>
              )}

              <div className="text-xs text-[#0F1111] mb-3">
                Deliver to <span className="text-[#007185] font-medium cursor-pointer hover:underline">Bengaluru 560001</span>
              </div>

              <div className="text-base text-[#007600] font-medium mb-3">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </div>

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
                <ReturnRiskBadge product={product} />
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] py-2.5 rounded-full text-sm font-bold"
                >
                  Buy Now
                </button>
                {coPlannerPlans.length > 0 && (
                  <button
                    onClick={() => startAddToPlan(product)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium border border-gray-300 text-[#0F1111] hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
                  >
                    <UsersIcon size={14} /> Add to Co-Plan
                  </button>
                )}
              </div>

              <hr className="my-4 border-gray-200" />

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
                        {trustAnalyzing ? "…" : (trustData ? `${trustData.productScore}` : "—")}
                      </div>
                    </div>
                  </div>
                );
              })()}

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
