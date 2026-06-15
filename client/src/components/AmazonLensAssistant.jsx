import React, { useState, useEffect } from "react";
import { MessageCircle, X, Send, Leaf, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { getSustainabilityData } from "../utils/sustainability.js";
import { API } from "../utils/format.js";

export default function AmazonLensAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then(({ products }) => setAllProducts(products || []))
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const q = query.toLowerCase();

    let filtered = [...allProducts];

    if (q.includes("tv")) {
      filtered = filtered.filter((p) =>
        p.category.toLowerCase().includes("television")
      );
    }

    if (q.includes("study")) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes("monitor") ||
          p.name.toLowerCase().includes("lamp") ||
          p.name.toLowerCase().includes("chair") ||
          p.name.toLowerCase().includes("mouse")
      );
    }

    if (q.includes("trust")) {
      filtered.sort(
        (a, b) => (b.trustScore || 0) - (a.trustScore || 0)
      );
    }

    if (
      q.includes("eco") ||
      q.includes("green") ||
      q.includes("sustainable")
    ) {
      filtered.sort(
        (a, b) =>
          getSustainabilityData(b.id).score -
          getSustainabilityData(a.id).score
      );
    }

    setResults(filtered.slice(0, 4));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#FF9900] hover:bg-[#E68A00]
                   text-white rounded-full w-14 h-14 shadow-lg
                   flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 bg-white w-[420px]
                        rounded-xl shadow-2xl border border-[#DDD] overflow-hidden">

          <div className="bg-[#131921] text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">AmazonLens Assistant</h3>
              <p className="text-xs text-gray-300">
                Trust-aware shopping recommendations
              </p>
            </div>

            <button onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find trustworthy TVs, study setups..."
                className="flex-1 border rounded px-3 py-2 text-sm"
              />

              <button
                onClick={handleSearch}
                className="bg-[#FFD814] px-4 rounded"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[450px] overflow-y-auto p-4 space-y-3">
            {results.length === 0 ? (
              <div className="text-sm text-[#565959]">
                Try:
                <ul className="mt-2 space-y-1">
                  <li>• trustworthy products</li>
                  <li>• sustainable products</li>
                  <li>• study setup</li>
                  <li>• tv recommendations</li>
                </ul>
              </div>
            ) : (
              results.map((product) => {
                const eco = getSustainabilityData(product.id);

                return (
                  <Link
                    key={product.id}
                    to={`/dp/${product.id}`}
                    className="block border rounded-lg p-3 hover:bg-[#F7F8F8]"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex gap-3">
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-16 h-16 object-cover border rounded"
                      />

                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-2">
                          {product.name}
                        </div>

                        <div className="text-[#B12704] font-bold mt-1">
                          ₹{product.price.toLocaleString("en-IN")}
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <ShieldCheck size={12} />
                            {product.trustScore}
                          </span>

                          <span className="text-xs bg-lime-100 text-lime-700 px-2 py-1 rounded flex items-center gap-1">
                            <Leaf size={12} />
                            {eco.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}