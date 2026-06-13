import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";

import { bundles, products } from "../../../server/data/mockData.js";

export default function BundlesPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F1111]">
          Shopping Bundles
        </h1>

        <p className="text-[#565959] mt-2">
          Curated collections built around real shopping goals.
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

          return (
            <div
              key={bundle.id}
              onClick={() => navigate(`/bundles/${bundle.id}`)}
              className="bg-white rounded-lg border border-[#DDD]
                shadow-sm hover:shadow-lg hover:-translate-y-1
                transition-all duration-200
                overflow-hidden cursor-pointer"
              >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] text-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={18} />
                  <span className="text-xs uppercase tracking-wide">
                    Bundle
                  </span>
                </div>

                <h2 className="text-xl font-bold">
                  {bundle.name}
                </h2>

                <p className="text-sm text-gray-300 mt-2">
                  {bundle.tagline}
                </p>
              </div>

              <div className="p-5">
                {/* Product Preview Images */}
                <div className="flex -space-x-3 mb-4">
                  {resolvedProducts.slice(0, 5).map((product) => (
                    <img
                      key={product.id}
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-14 h-14 rounded-full border-2 border-white object-cover bg-white"
                    />
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-[#F7F8F8] rounded p-3 text-center">
                    <div className="font-bold text-lg">
                      {resolvedProducts.length}
                    </div>
                    <div className="text-xs text-[#565959]">
                      Products
                    </div>
                  </div>

                  <div className="bg-[#F7F8F8] rounded p-3 text-center">
                    <div className="font-bold text-lg">
                      {avgTrust}
                    </div>
                    <div className="text-xs text-[#565959]">
                      TrustLens
                    </div>
                  </div>

                  <div className="bg-[#F7F8F8] rounded p-3 text-center">
                    <div className="font-bold text-green-700">
                      ₹{bundle.savings.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-[#565959]">
                      Saved
                    </div>
                  </div>
                </div>

                {/* Included Products */}
                <div className="space-y-2 mb-5">
                  {bundle.productDetails.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="line-clamp-1">
                        {product.name}
                      </span>

                      <span className="font-medium">
                        {product.isFree
                          ? "FREE"
                          : `₹${product.price.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#565959]">
                      Bundle Price
                    </span>

                    <span className="font-bold text-lg">
                      ₹{bundle.totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between mb-4">
                    <span className="text-[#565959]">
                      Original Price
                    </span>

                    <span className="text-[#565959] line-through">
                      ₹{bundle.originalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bundles/${bundle.id}`);
                    }}
                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00]
                                text-[#0F1111]
                                font-bold py-2 rounded-sm
                                flex items-center justify-center gap-2"
                    >
                    Explore Bundle
                    <ChevronRight size={16} />
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