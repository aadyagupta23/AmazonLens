import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "../utils/format.js";
import ProductCard from "../components/ProductCard.jsx";
import BundleCard from "../components/BundleCard.jsx";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Avg. Customer Review", "Newest Arrivals"];

const FILTER_SECTIONS = [
  {
    title: "Brand",
    options: ["Sony", "Samsung", "Apple", "boAt", "JBL", "Prestige", "Nescafé"]
  },
  {
    title: "Customer Reviews",
    options: ["4★ & above", "3★ & above", "2★ & above"]
  },
  {
    title: "Price",
    options: ["Under ₹1,000", "₹1,000–₹5,000", "₹5,000–₹20,000", "₹20,000–₹50,000", "Over ₹50,000"]
  }
];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState({ type: "product", products: [], bundle: null });
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("Featured");

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    axios
      .post(`${API}/api/products/search`, { query })
      .then(({ data }) => setResults(data))
      .catch(() => setResults({ type: "product", products: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  const sortedProducts = [...(results.products || [])].sort((a, b) => {
    if (sort === "Price: Low to High") return a.price - b.price;
    if (sort === "Price: High to Low") return b.price - a.price;
    if (sort === "Avg. Customer Review") return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <div className="text-xs text-[#565959] mb-3 flex items-center gap-1">
        <Link to="/" className="text-[#007185] hover:underline">Home</Link>
        <span>›</span>
        <span>Search results for "{query}"</span>
      </div>

      <div className="flex gap-4">
        {/* Filter sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded shadow-sm p-4 sticky top-24">
            <h3 className="font-bold text-[#0F1111] text-sm mb-3 flex items-center gap-2">
              <SlidersHorizontal size={14} />
              Filter Results
            </h3>
            {FILTER_SECTIONS.map((section) => (
              <div key={section.title} className="mb-4 border-t border-gray-100 pt-3">
                <h4 className="font-bold text-[#0F1111] text-xs mb-2">{section.title}</h4>
                <div className="space-y-1.5">
                  {section.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-xs text-[#0F1111] cursor-pointer hover:text-[#C7511F]">
                      <input type="checkbox" className="accent-[#FF9900]" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Results header */}
          <div className="flex items-center justify-between mb-3 bg-white rounded shadow-sm px-4 py-2.5">
            <p className="text-sm text-[#565959]">
              {loading ? "Searching..." : (
                <>
                  1–{sortedProducts.length} of <strong>{sortedProducts.length}</strong> results for{" "}
                  <span className="text-[#C7511F] font-medium">"{query}"</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#565959]">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs border border-[#DDD] rounded px-2 py-1 text-[#0F1111] bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#565959]">Finding the best matches...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Bundle card (if applicable) */}
              {results.type === "bundle" && results.bundle && (
                <BundleCard
                  bundle={results.bundle}
                  products={results.bundleProducts || []}
                />
              )}

              {/* Product grid */}
              {sortedProducts.length === 0 ? (
                <div className="bg-white rounded shadow-sm p-10 text-center">
                  <p className="text-[#565959] text-sm">No results found for "{query}"</p>
                  <p className="text-xs text-[#565959] mt-1">Try different keywords or browse categories</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
