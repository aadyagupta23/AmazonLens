import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice, getTrustColor, API } from "../utils/format.js";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { getUserSustainabilityScore, getSustainabilityData, getSustainabilityColor } from "../utils/sustainability.js";
import { Trash2, RefreshCw, ShoppingBag, Clock, Leaf } from "lucide-react";
import axios from "axios";

const TABS = ["Cart", "Soon"];

export default function CartPage() {
  const { items, addToCart, removeFromCart, updateQty, total, itemCount } = useCart();
  const navigate = useNavigate();
  const { prefs } = useSustainability();
  const [activeTab, setActiveTab] = useState("Cart");
  const [senseItems, setSenseItems] = useState([]);

  // Cart sustainability score
  const cartSustainScore = getUserSustainabilityScore(items, prefs);
  const cartSustainColor = getSustainabilityColor(cartSustainScore);
  const ecoItemCount = items.filter((item) => getSustainabilityData(item.id).score >= 70).length;

  useEffect(() => {
    axios.get(`${API}/api/sense/predictions`)
      .then(({ data }) => setSenseItems(data.predictions || []))
      .catch(() => {
        setSenseItems([{
          productId: "p005",
          productName: "Nescafé Gold Blend 200g",
          price: 649,
          trustScore: 88,
          urgency: "Due today",
          daysOverdue: 0,
          thumbnail: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Instant_Coffee_Grains_Inside_Jar.jpeg"
        }]);
      });
  }, []);

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4">
      <h1 className="text-2xl font-medium text-[#0F1111] mb-4">Shopping Cart</h1>

      {/* Tab nav */}
      <div className="flex border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-[#C7511F] border-b-2 border-[#C7511F]"
                : "text-[#007185] hover:text-[#C7511F]"
            }`}
          >
            {tab}
            {tab === "Soon" && senseItems.length > 0 && (
              <span className="ml-1.5 bg-[#FF9900] text-[#131921] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {senseItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "Cart" ? (
        <div className="flex gap-6 flex-wrap lg:flex-nowrap">
          {/* Cart items */}
          <div className="flex-1 min-w-0">
            {items.length === 0 ? (
              <div className="bg-white rounded shadow-sm p-10 text-center">
                <ShoppingBag size={48} className="text-[#EAEDED] mx-auto mb-4" />
                <h2 className="text-lg font-medium text-[#0F1111] mb-2">Your Amazon Cart is empty</h2>
                <p className="text-sm text-[#565959] mb-4">Shop today's deals</p>
                <Link to="/" className="inline-block btn-primary px-6 py-2 rounded-full font-bold">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded shadow-sm">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-[#0F1111]">
                    {itemCount} item{itemCount !== 1 ? "s" : ""} in cart
                  </span>
                  <span className="text-sm text-[#565959]">Price</span>
                </div>

                {items.map((item) => {
                  const trust = getTrustColor(item.trustScore || 75);
                  return (
                    <div key={item.id} className="px-5 py-4 border-b border-gray-100 last:border-0 flex gap-4">
                      {/* Image */}
                      <div
                        className="w-24 h-24 flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/dp/${item.id}`)}
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/96"; }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm text-[#0F1111] hover:text-[#C7511F] cursor-pointer leading-snug mb-1"
                          onClick={() => navigate(`/dp/${item.id}`)}
                        >
                          {item.name}
                        </h3>

                        {item.isPrime && (
                          <div className="text-[#00A8E1] text-xs font-bold mb-1">prime</div>
                        )}

                        {/* TrustLens in cart */}
                        {item.trustScore && (
                          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${trust.bg} ${trust.text} mb-2`}>
                            🔍 TrustLens: {item.trustScore} · {trust.label}
                          </div>
                        )}

                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Qty selector */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-50"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                          <button className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">
                            Save for later
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-sm font-bold text-[#0F1111] flex-shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </div>
                    </div>
                  );
                })}

                {/* Subtotal */}
                <div className="px-5 py-3 text-right border-t border-gray-200">
                  <span className="text-base text-[#0F1111]">
                    Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""}):
                    <span className="font-bold ml-1">{formatPrice(total)}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          {items.length > 0 && (
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded shadow-sm p-5 sticky top-24">
                <div className="text-[#007600] text-sm mb-2">✓ Your order qualifies for FREE Delivery.</div>
                <div className="text-base text-[#0F1111] mb-4">
                  Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""}):
                  <span className="font-bold ml-1">{formatPrice(total)}</span>
                </div>
                <label className="flex items-center gap-2 text-sm text-[#0F1111] mb-4 cursor-pointer">
                  <input type="checkbox" className="accent-[#FF9900]" />
                  This order contains a gift
                </label>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full btn-primary py-2.5 rounded-full font-bold text-sm"
                >
                  Proceed to Buy
                </button>

                {/* Cart Sustainability Summary (shown when mode is on) */}
                {prefs.enabled && items.length > 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Leaf size={13} className="text-[#1B5E20]" />
                      <span className="text-xs font-bold text-[#1B5E20]">Cart Sustainability</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#565959]">Cart Score</span>
                      <span className="text-sm font-bold" style={{ color: cartSustainColor.hex }}>
                        {cartSustainScore}/100
                      </span>
                    </div>
                    <div className="h-1.5 bg-green-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cartSustainScore}%`, backgroundColor: cartSustainColor.hex }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#565959]">
                      <span>🌱 Eco-friendly items: {ecoItemCount}</span>
                      <Link to="/sustainability" className="text-[#007185] hover:underline">
                        Details →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SOON TAB */
        <div>
          <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] rounded-xl p-5 mb-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-[#FF9900]" />
              <h2 className="font-bold text-base">Amazon Sense™ — Coming Up</h2>
            </div>
            <p className="text-gray-300 text-sm">
              Based on your order history, these items may be running low. Reorder before you run out.
            </p>
          </div>

          {senseItems.length === 0 ? (
            <div className="bg-white rounded shadow-sm p-10 text-center">
              <Clock size={40} className="text-[#EAEDED] mx-auto mb-3" />
              <p className="text-sm text-[#565959]">No upcoming reorders detected yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm divide-y divide-gray-100">
              {senseItems.map((si) => (
                <div key={si.productId} className="px-5 py-4 flex items-center gap-4">
                  <img
                    src={si.thumbnail}
                    alt={si.productName}
                    className="w-16 h-16 object-contain flex-shrink-0"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/64"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#0F1111] leading-snug">{si.productName}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-[#0F1111]">{formatPrice(si.price)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        si.daysOverdue > 0
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {si.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-[#565959] mt-0.5">
                      Avg. cycle: every {si.avgCycleDays} days · Last ordered {si.lastOrderDate}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const product = { id: si.productId, name: si.productName, price: si.price, trustScore: si.trustScore, thumbnail: si.thumbnail, isPrime: true };
                      addToCart(product);
                      setActiveTab("Cart");
                    }}
                    className="flex-shrink-0 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-bold px-4 py-2 rounded-full"
                  >
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
