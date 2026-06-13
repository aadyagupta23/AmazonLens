import React from "react";
import { useParams } from "react-router-dom";
import { bundles, products } from "../../../server/data/mockData.js";
import ProductCard from "../components/ProductCard.jsx";

export default function BundleDetailPage() {
  const { bundleId } = useParams();

  const bundle = bundles.find((b) => b.id === bundleId);

  if (!bundle) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Bundle not found</h1>
      </div>
    );
  }

  const bundleProducts = bundle.products
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  const avgTrust =
    bundleProducts.length > 0
      ? Math.round(
          bundleProducts.reduce(
            (sum, p) => sum + (p.trustScore || 0),
            0
          ) / bundleProducts.length
        )
      : 0;

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">

      <div className="bg-white rounded-lg border border-[#DDD] p-6 mb-6">
        <div className="text-[#007185] text-xs font-bold uppercase">
          Shopping Bundle
        </div>

        <h1 className="text-3xl font-bold text-[#0F1111] mt-2">
          {bundle.name}
        </h1>

        <p className="text-[#565959] mt-2">
          {bundle.tagline}
        </p>

        <div className="grid md:grid-cols-4 gap-4 mt-6">

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {bundleProducts.length}
            </div>
            <div className="text-sm text-[#565959]">
              Products
            </div>
          </div>

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              {avgTrust}
            </div>
            <div className="text-sm text-[#565959]">
              Avg TrustLens
            </div>
          </div>

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold text-green-700">
              ₹{bundle.savings.toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-[#565959]">
              Bundle Savings
            </div>
          </div>

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">
              ₹{bundle.totalPrice.toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-[#565959]">
              Bundle Price
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#DDD] p-5 mb-6">
        <h2 className="text-xl font-bold mb-3">
          Included Products
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {bundleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#DDD] p-6">
        <h2 className="text-xl font-bold mb-4">
          Why this bundle?
        </h2>

        <p className="text-[#565959]">
          This bundle groups products that are frequently
          purchased together and help complete a specific
          shopping goal. TrustLens analysis indicates an
          average trust score of {avgTrust} across all
          included products.
        </p>
      </div>

    </div>
  );
}