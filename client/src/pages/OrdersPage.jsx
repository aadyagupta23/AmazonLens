import React from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Leaf,
  TrendingDown,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { products } from "../../../server/data/mockData.js";

const ORDERS = [
  {
    productId: "p019",
    delivered: "7 days ago",
    trustScore: 91,
    sustainability: 92,
    priceDrop: 350,
  },
  {
    productId: "p022",
    delivered: "3 days ago",
    trustScore: 95,
    sustainability: 81,
    priceDrop: 150,
  },
];

export default function OrdersPage() {
  const resolvedOrders = ORDERS.map((order) => ({
    ...order,
    product: products.find((p) => p.id === order.productId),
  })).filter((o) => o.product);

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-[#0F1111] mb-6">
        Your Orders
      </h1>

      <div className="space-y-5">
        {resolvedOrders.map((order) => (
          <div
            key={order.product.id}
            className="bg-white rounded-lg border border-[#DDD] shadow-sm p-5"
          >
            <div className="flex flex-col lg:flex-row gap-5">
              {/* PRODUCT IMAGE */}
              <Link
                to={`/dp/${order.product.id}`}
                className="flex-shrink-0"
              >
                <img
                  src={order.product.thumbnail}
                  alt={order.product.name}
                  className="w-28 h-28 object-cover rounded border"
                />
              </Link>

              {/* PRODUCT INFO */}
              <div className="flex-1">
                <Link
                  to={`/dp/${order.product.id}`}
                  className="hover:text-[#C7511F]"
                >
                  <h2 className="text-xl font-bold mb-1">
                    {order.product.name}
                  </h2>
                </Link>

                <p className="text-green-700 mb-4">
                  Delivered {order.delivered}
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    TrustLens {order.trustScore}
                  </span>

                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Sustainability {order.sustainability}
                  </span>

                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Saved ₹{order.priceDrop}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-[#F7F8F8] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} />
                      <span className="font-semibold">
                        TrustLens Score
                      </span>
                    </div>

                    <div className="text-xl font-bold">
                      {order.trustScore}/100
                    </div>

                    <p className="text-sm text-[#565959] mt-1">
                      Verified buyer confidence
                    </p>
                  </div>

                  <div className="bg-[#F7F8F8] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown size={16} />
                      <span className="font-semibold">
                        Price Change
                      </span>
                    </div>

                    <div className="text-2xl font-bold text-green-700">
                      ↓ ₹{order.priceDrop}
                    </div>

                    <p className="text-sm text-[#565959] mt-1">
                      Cheaper than when purchased
                    </p>
                  </div>

                  <div className="bg-[#F7F8F8] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf size={16} />
                      <span className="font-semibold">
                        Sustainability
                      </span>
                    </div>

                    <div className="text-2xl font-bold">
                      {order.sustainability}/100
                    </div>

                    <p className="text-sm text-[#565959] mt-1">
                      Better than similar products
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-3 mt-5">
                  <Link
                    to={`/dp/${order.product.id}`}
                    className="bg-[#FFD814] hover:bg-[#F7CA00]
                               px-5 py-2 rounded font-semibold"
                  >
                    Buy Again
                  </Link>

                  <button
                    className="border border-[#DDD]
                               px-5 py-2 rounded
                               hover:bg-[#F7F8F8]"
                  >
                    Write Review
                  </button>

                  <button
                    className="border border-[#DDD]
                               px-5 py-2 rounded
                               hover:bg-[#F7F8F8]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RECOMMENDED BUNDLE */}
      <div className="bg-white border rounded-lg shadow-sm p-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} />
          <h2 className="text-xl font-bold">
            Recommended Next Purchase
          </h2>
        </div>

        <div className="bg-[#F7F8F8] rounded-lg p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[#007185] text-xs font-bold uppercase">
              Based on recent purchase
            </div>

            <h3 className="font-bold text-xl mt-1">
              Complete your Study Setup
            </h3>

            <p className="text-[#565959] mt-1">
              Monitor, desk lamp, ergonomic chair and
              cable management accessories.
            </p>
          </div>

          <Link
            to="/"
            className="bg-[#FFD814] hover:bg-[#F7CA00]
                       px-5 py-3 rounded
                       font-semibold flex items-center gap-2"
          >
            Explore Bundle
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* IMPACT SUMMARY */}
      <div className="bg-white border rounded-lg shadow-sm p-5 mt-6">
        <h2 className="text-xl font-bold mb-4">
          Shopping Impact Summary
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">12</div>
            <div className="text-sm text-[#565959]">
              Products Purchased
            </div>
          </div>

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">81</div>
            <div className="text-sm text-[#565959]">
              Avg Sustainability Score
            </div>
          </div>

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">18%</div>
            <div className="text-sm text-[#565959]">
              CO₂ Saved
            </div>
          </div>

          <div className="bg-[#F7F8F8] rounded p-4">
            <div className="text-3xl font-bold">₹4,280</div>
            <div className="text-sm text-[#565959]">
              Total Saved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}