import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API } from "../utils/format.js";
import { useWitness } from "../contexts/WitnessContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Users, ThumbsUp, ThumbsDown, CheckCircle, Radio, Search, Loader, AlertCircle } from "lucide-react";

export default function WitnessPortal() {
  const { goOnline, goOffline, witnessInfo } = useWitness();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({ monthsOwned: 6, wouldBuyAgain: true });
  const dropdownRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API}/api/products?limit=50`)
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const handleGoOnline = () => {
    if (!selectedProduct || !user?.city) return;
    goOnline({
      name: user.name,
      city: user.city,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      monthsOwned: Number(form.monthsOwned),
      wouldBuyAgain: form.wouldBuyAgain,
    });
  };

  if (witnessInfo) {
    return (
      <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#131921] to-[#232F3E] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {witnessInfo.avatar}
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-[#0F1111] mb-1">You're Live!</h2>
          <p className="text-sm text-[#565959] mb-2">{witnessInfo.name} · {witnessInfo.city}</p>
          <p className="text-xs text-[#007185] bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 inline-block">
            {witnessInfo.productName?.slice(0, 55)}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#565959] mb-3">
            <Radio size={14} className="animate-pulse text-green-500" />
            Waiting for shoppers…
          </div>
          <p className="text-xs text-[#999] mb-6">
            You can now browse Amazon normally — a notification pops up top-right when someone wants to chat.
          </p>
          <button onClick={goOffline} className="text-sm text-[#CC0C39] hover:underline">
            Go Offline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#131921] to-[#232F3E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F1111]">WitnessPanel™</h1>
          <p className="text-sm text-[#565959] mt-1">Help shoppers. Earn rewards.</p>
        </div>

        <div className="space-y-4">
          {/* Identity from account */}
          {user?.city ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#131921] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1111]">{user.name}</p>
                <p className="text-xs text-[#565959]">{user.city}</p>
              </div>
              <Link to="/account" className="ml-auto text-xs text-[#007185] hover:underline">Edit</Link>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0F1111]">City not set</p>
                <p className="text-xs text-[#565959]">
                  Add your city in{" "}
                  <Link to="/account" className="text-[#007185] hover:underline">Account Settings</Link>{" "}
                  to go live as a witness.
                </p>
              </div>
            </div>
          )}

          {/* Product picker */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-[#0F1111] mb-1">Which product do you own?</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder={loadingProducts ? "Loading products…" : "Search or browse products…"}
                disabled={loadingProducts}
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#007185] disabled:bg-gray-50"
              />
              {loadingProducts && (
                <Loader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
              )}
            </div>

            {selectedProduct && (
              <div className="mt-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <CheckCircle size={12} />
                {selectedProduct.name.slice(0, 60)}{selectedProduct.name.length > 60 ? "…" : ""}
              </div>
            )}

            {showDropdown && !selectedProduct && !loadingProducts && (
              <div className="w-full absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-[#565959]">No products found.</p>
                ) : (
                  filtered.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedProduct(p);
                        setProductSearch(p.name.slice(0, 45));
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#EAEDED] border-b border-gray-100 last:border-0 flex items-start gap-2"
                    >
                      <img src={p.thumbnail} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded" onError={(e) => { e.target.style.display = "none"; }} />
                      <div>
                        <span className="font-medium text-[#0F1111] block leading-snug">{p.name.slice(0, 55)}</span>
                        <span className="text-[#565959]">₹{p.price.toLocaleString("en-IN")}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0F1111] mb-1">How long owned?</label>
            <select
              value={form.monthsOwned}
              onChange={(e) => setForm((f) => ({ ...f, monthsOwned: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#007185] bg-white"
            >
              {[1, 2, 3, 6, 9, 12, 18, 24, 36].map((m) => (
                <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0F1111] mb-2">Would you buy it again?</label>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setForm((f) => ({ ...f, wouldBuyAgain: val }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    form.wouldBuyAgain === val
                      ? val ? "bg-green-50 border-green-400 text-green-700" : "bg-red-50 border-red-400 text-red-700"
                      : "border-gray-300 text-[#565959]"
                  }`}
                >
                  {val ? <><ThumbsUp size={14} /> Yes</> : <><ThumbsDown size={14} /> No</>}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGoOnline}
            disabled={!selectedProduct || !user?.city}
            className="w-full bg-[#FF9900] hover:bg-[#F7CA00] disabled:bg-gray-200 disabled:text-gray-400 text-[#131921] font-bold py-3 rounded-full text-sm transition-colors"
          >
            Go Online as Witness
          </button>
        </div>
      </div>
    </div>
  );
}
