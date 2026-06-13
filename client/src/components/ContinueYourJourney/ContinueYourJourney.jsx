import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { CONTINUE_MOCK } from "./continueData.js";
import { products } from "../../../../server/data/mockData.js";
import ProductCard from "../ProductCard.jsx";

const BUNDLE_PALETTE = {
  study_completion: {
    from: "#1a3a5c",
    to: "#2d6a9f",
    label: "Study Setup",
  },
  hostel_expansion: {
    from: "#1c4a2e",
    to: "#2e7d52",
    label: "Hostel Kit",
  },
  fitness_upgrade: {
    from: "#6b1f1f",
    to: "#c0392b",
    label: "Fitness Gear",
  },
};

export default function ContinueYourJourney({
  bundles = CONTINUE_MOCK,
}) {
  const navigate = useNavigate();

  const featured = [...bundles].sort(
    (a, b) => b.confidence - a.confidence
  )[0];

  if (!featured) return null;

  const resolvedProducts = featured.items
    .map((item) =>
      products.find((p) => p.id === item.productId)
    )
    .filter(Boolean);

  const totalBudget = resolvedProducts.reduce(
    (sum, p) => sum + p.price,
    0
  );

  const productCount = resolvedProducts.length;

  const {
    title,
    reason,
    confidence,
    query,
    tag,
    id,
  } = featured;

  const palette =
    BUNDLE_PALETTE[id] || {
      from: "#131921",
      to: "#232F3E",
      label: title,
    };

  const handleExplore = () =>
    navigate(`/s?q=${encodeURIComponent(query)}`);

  const fmt = (n) =>
    n >= 1000
      ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

  return (
  <div className="bg-white rounded shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-bold text-[#0F1111] text-lg">
          Continue Your Journey
        </h2>

        <p className="text-xs text-[#565959] mt-0.5">
          Based on your recent purchases and browsing activity
        </p>
      </div>

      <button
        onClick={() => navigate("/s?q=bundles")}
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

        <span className="bg-[#E7F4EE] text-[#067D62] text-xs font-bold px-2 py-1 rounded-full">
          {confidence}% match
        </span>
      </div>

      <h3 className="font-bold text-[#0F1111] text-lg mt-2">
      {title}
      </h3>
          <p className="text-[#565959] mb-6 text-base">
        {reason}
      </p>

      {/* <div className="flex gap-6 flex-wrap mb-6">
        {resolvedProducts.map((product) => (
          <div
            key={product.id}
            className="w-[110px] flex flex-col items-center text-center"
          >
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-24 h-24 object-cover border border-[#DDD] rounded-md bg-white"
            />

            <p className="text-xs mt-2 line-clamp-2 leading-tight">
              {product.name}
            </p>
          </div>
        ))}
      </div> */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
  {resolvedProducts.map((product) => (
    <ProductCard
      key={product.id}
      product={product}
    />
  ))}
</div>

      <div className="flex items-center gap-6 flex-wrap">
        <span className="text-sm text-[#565959]">
          <strong className="text-[#0F1111]">
            {productCount}
          </strong>{" "}
          items
        </span>

        <span className="text-sm text-[#565959]">
          <strong className="text-[#0F1111]">
            {fmt(totalBudget)}
          </strong>{" "}
          est. total
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExplore();
          }}
          className="bg-[#FFD814] hover:bg-[#F7CA00]
                     text-[#0F1111]
                     font-bold
                     px-6
                     py-3
                     rounded-md
                     flex items-center gap-2"
        >
          Explore Bundle
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  </div>
);
}