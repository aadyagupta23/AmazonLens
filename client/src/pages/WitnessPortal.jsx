import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../utils/format.js";
import { useWitness } from "../contexts/WitnessContext.jsx";
import { Users, ThumbsUp, ThumbsDown, CheckCircle, Radio } from "lucide-react";

export default function WitnessPortal() {
  const { goOnline, goOffline, witnessInfo } = useWitness();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", monthsOwned: 6, wouldBuyAgain: true });

  useEffect(() => {
    axios.get(`${API}/api/products?limit=30`).then(({ data }) => setProducts(data.products || []));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleGoOnline = () => {
    if (!form.name.trim() || !selectedProduct) return;
    goOnline({
      name: form.name.trim(),
      city: form.city.trim() || "India",
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
          <div className="flex items-center justify-center gap-2 text-sm text-[#565959] mb-6">
            <Radio size={14} className="animate-pulse text-green-500" />
            Waiting for shoppers... you'll get a notification
          </div>
          <p className="text-xs text-[#999] mb-6">You can now browse Amazon normally — the notification will pop up when someone wants to chat.</p>
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
          <div>
            <label className="block text-xs font-medium text-[#0F1111] mb-1">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Arjun M."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#007185]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0F1111] mb-1">Your city</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="e.g. Bengaluru"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#007185]"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-[#0F1111] mb-1">Which product do you own?</label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(null); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search product..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#007185]"
            />
            {selectedProduct && (
              <div className="mt-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <CheckCircle size={12} />
                {selectedProduct.name.slice(0, 55)}
              </div>
            )}
            {showDropdown && productSearch && !selectedProduct && filtered.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtered.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => { setSelectedProduct(p); setProductSearch(p.name.slice(0, 40)); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#EAEDED] border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-[#0F1111] block">{p.name.slice(0, 55)}</span>
                    <span className="text-[#565959]">₹{p.price.toLocaleString("en-IN")}</span>
                  </button>
                ))}
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
            disabled={!form.name.trim() || !selectedProduct}
            className="w-full bg-[#FF9900] hover:bg-[#F7CA00] disabled:bg-gray-200 disabled:text-gray-400 text-[#131921] font-bold py-3 rounded-full text-sm transition-colors"
          >
            Go Online as Witness
          </button>
        </div>
      </div>
    </div>
  );
}
