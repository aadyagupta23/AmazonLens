import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { CONTINUE_MOCK } from "./continueData.js";
import { products } from "../../../../server/data/mockData.js";
import { useOrders } from "../../contexts/OrdersContext.jsx";
import { useHistory } from "../../contexts/HistoryContext.jsx";
import { API } from "../../utils/format.js";
import ProductCard from "../ProductCard.jsx";

export default function ContinueYourJourney() {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { history } = useHistory();

  const [bundles, setBundles] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const orderedItems = orders.slice(0, 3).flatMap((o) =>
      o.items.map((i) => ({ id: i.id, name: i.name, category: i.category || "" }))
    );

    if (orderedItems.length === 0) {
      setBundles(CONTINUE_MOCK);
      return;
    }

    setLoading(true);
    fetch(`${API}/api/bundles/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: orderedItems,
        history: history.slice(0, 5).map((h) => ({ name: h.name })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.bundles?.length > 0) {
          setBundles(data.bundles);
          localStorage.setItem("amz_ai_bundles", JSON.stringify(data.bundles));
        } else {
          setBundles(CONTINUE_MOCK);
        }
      })
      .catch(() => setBundles(CONTINUE_MOCK))
      .finally(() => setLoading(false));
  }, [orders.length]);

  const featured = bundles
    ? [...bundles].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
    : null;

  const fmt = (n) => (n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`);

  if (loading) {
    return (
      <div className="bg-white rounded shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#0F1111] text-lg">Continue Your Journey</h2>
          <span className="text-xs text-[#007185]">Personalizing…</span>
        </div>
        <div className="border border-[#E7E7E7] rounded-lg p-6 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-gray-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!featured) return null;

  // normalise: CONTINUE_MOCK uses items:[{productId}], AI also uses items:[{productId}]
  const resolvedProducts = (featured.items || [])
    .map((item) => products.find((p) => p.id === item.productId))
    .filter(Boolean);

  if (resolvedProducts.length === 0) return null;

  const totalBudget = resolvedProducts.reduce((s, p) => s + p.price, 0);
  const productCount = resolvedProducts.length;
  const { title, reason, confidence, tag, id } = featured;

  const handleExplore = () => navigate(`/bundles/${id}`);

  return (
    <div className="bg-white rounded shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-[#0F1111] text-lg">Continue Your Journey</h2>
          <p className="text-xs text-[#565959] mt-0.5">
            Based on your recent purchases and browsing activity
          </p>
        </div>
        <button
          onClick={() => navigate("/bundles")}
          className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline"
        >
          View more bundles →
        </button>
      </div>

      <div
        className="border border-[#E7E7E7] rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleExplore}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#007185]">
            {tag}
          </span>
          {confidence && (
            <span className="bg-[#E7F4EE] text-[#067D62] text-xs font-bold px-2 py-1 rounded-full">
              {confidence}% match
            </span>
          )}
        </div>

        <h3 className="font-bold text-[#0F1111] text-lg mt-2">{title}</h3>
        <p className="text-[#565959] mb-6 text-base">{reason}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {resolvedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-sm text-[#565959]">
            <strong className="text-[#0F1111]">{productCount}</strong> items
          </span>
          <span className="text-sm text-[#565959]">
            <strong className="text-[#0F1111]">{fmt(totalBudget)}</strong> est. total
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleExplore(); }}
            className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-6 py-3 rounded-md flex items-center gap-2"
          >
            Explore Bundle
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
