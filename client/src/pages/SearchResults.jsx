import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "../utils/format.js";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { getSustainabilityData } from "../utils/sustainability.js";
import ProductCard from "../components/ProductCard.jsx";
import BundleCard from "../components/BundleCard.jsx";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Leaf } from "lucide-react";

const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Avg. Customer Review", "Newest Arrivals"];

const RATING_OPTIONS = [
  { label: "4★ & above", value: 4 },
  { label: "3★ & above", value: 3 },
  { label: "2★ & above", value: 2 },
];

const PRICE_OPTIONS = [
  { label: "Under ₹1,000", min: 0, max: 999 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
  { label: "₹20,000 – ₹50,000", min: 20000, max: 50000 },
  { label: "Over ₹50,000", min: 50001, max: Infinity },
];

// Map navbar category names to product category keywords
const CATEGORY_KEYWORDS = {
  electronics: ["electronics"],
  mobiles: ["mobiles", "computers"],
  fashion: ["fashion"],
  "home & kitchen": ["home & kitchen"],
  books: ["books"],
  sports: ["sports"],
  grocery: ["grocery"],
  beauty: ["beauty"],
  toys: ["toys"],
};

function productMatchesCategory(productCategory, filterCat) {
  if (!filterCat || filterCat.toLowerCase() === "all") return true;
  const pc = (productCategory || "").toLowerCase();
  const keywords = CATEGORY_KEYWORDS[filterCat.toLowerCase()] || [filterCat.toLowerCase()];
  return keywords.some((kw) => pc.includes(kw));
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "All";
  const { prefs } = useSustainability();

  const [rawProducts, setRawProducts] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [bundleProducts, setBundleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState("Featured");
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedRating, setSelectedRating] = useState(null); // number or null
  const [selectedPrices, setSelectedPrices] = useState(new Set()); // set of label strings
  const [showAllBrands, setShowAllBrands] = useState(false);

  const isDeals = query === "deals";
  const isAll = !query;

  // Fetch products
  useEffect(() => {
    setLoading(true);
    setBundle(null);
    setBundleProducts([]);
    setSelectedBrands(new Set());
    setSelectedRating(null);
    setSelectedPrices(new Set());
    setShowAllBrands(false);

    if (isDeals || isAll) {
      axios
        .get(`${API}/api/products?limit=200`)
        .then(({ data }) => {
          let prods = data.products || [];
          if (isDeals) {
            prods = prods.filter((p) => p.originalPrice && p.originalPrice > p.price);
            prods.sort((a, b) => {
              const da = a.discount || Math.round(((a.originalPrice - a.price) / a.originalPrice) * 100);
              const db = b.discount || Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100);
              return db - da;
            });
          }
          setRawProducts(prods);
        })
        .catch(() => setRawProducts([]))
        .finally(() => setLoading(false));
    } else {
      axios
        .post(`${API}/api/products/search`, { query })
        .then(({ data }) => {
          setRawProducts(data.products || []);
          if (data.type === "bundle" && data.bundle) {
            setBundle(data.bundle);
            setBundleProducts(data.bundleProducts || []);
          }
        })
        .catch(() => setRawProducts([]))
        .finally(() => setLoading(false));
    }
  }, [query]);

  // Category-filtered products (for brand list — stable as brand checkboxes change)
  const categoryFilteredProducts = useMemo(() => {
    if (!categoryParam || categoryParam === "All") return rawProducts;
    return rawProducts.filter((p) => productMatchesCategory(p.category, categoryParam));
  }, [rawProducts, categoryParam]);

  // Dynamic brands from current category (not affected by brand selections)
  const allBrands = useMemo(() => {
    const counts = {};
    categoryFilteredProducts.forEach((p) => {
      if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ brand, count }));
  }, [categoryFilteredProducts]);

  const visibleBrands = showAllBrands ? allBrands : allBrands.slice(0, 8);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    let ps = rawProducts;

    if (categoryParam && categoryParam !== "All") {
      ps = ps.filter((p) => productMatchesCategory(p.category, categoryParam));
    }
    if (selectedBrands.size > 0) {
      ps = ps.filter((p) => selectedBrands.has(p.brand));
    }
    if (selectedRating !== null) {
      ps = ps.filter((p) => (p.rating || 0) >= selectedRating);
    }
    if (selectedPrices.size > 0) {
      ps = ps.filter((p) =>
        [...selectedPrices].some((label) => {
          const opt = PRICE_OPTIONS.find((o) => o.label === label);
          return opt && p.price >= opt.min && p.price <= opt.max;
        })
      );
    }
    return ps;
  }, [rawProducts, categoryParam, selectedBrands, selectedRating, selectedPrices]);

  // Sort — with optional eco boost when Sustainability Mode is on
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts].sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      if (sort === "Avg. Customer Review") return (b.rating || 0) - (a.rating || 0);
      if (sort === "Newest Arrivals") return (b.id || 0) - (a.id || 0);
      return 0;
    });

    // When eco mode + prioritizeEco: apply a secondary sort boost for high sustainability scores
    if (prefs.enabled && prefs.prioritizeEco && sort === "Featured") {
      sorted.sort((a, b) => {
        const sa = getSustainabilityData(a.id).score;
        const sb = getSustainabilityData(b.id).score;
        // Only boost when eco score difference is meaningful (>15 pts)
        if (Math.abs(sa - sb) > 15) return sb - sa;
        return 0;
      });
    }

    return sorted;
  }, [filteredProducts, sort, prefs]);

  const activeFilterCount =
    selectedBrands.size + (selectedRating !== null ? 1 : 0) + selectedPrices.size;

  function clearAllFilters() {
    setSelectedBrands(new Set());
    setSelectedRating(null);
    setSelectedPrices(new Set());
  }

  function toggleBrand(brand) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });
  }

  function togglePrice(label) {
    setSelectedPrices((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  // Header text
  let headerText;
  if (loading) {
    headerText = "Searching…";
  } else if (isAll) {
    const catLabel = categoryParam !== "All" ? categoryParam : "All";
    headerText = catLabel !== "All"
      ? `${catLabel} — ${sortedProducts.length} items`
      : `All Products — ${sortedProducts.length} items`;
  } else if (isDeals) {
    headerText = `Today's Deals — ${sortedProducts.length} deals`;
  } else {
    headerText = (
      <>
        1–{sortedProducts.length} of <strong>{sortedProducts.length}</strong> results for{" "}
        <span className="text-[#C7511F] font-medium">"{query}"</span>
        {categoryParam !== "All" && (
          <span className="text-[#565959]"> in <strong>{categoryParam}</strong></span>
        )}
      </>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4">
      {/* Breadcrumb */}
      <div className="text-xs text-[#565959] mb-3 flex items-center gap-1">
        <Link to="/" className="text-[#007185] hover:underline">Home</Link>
        <span>›</span>
        {isAll ? (
          <span>{categoryParam !== "All" ? categoryParam : "All Products"}</span>
        ) : isDeals ? (
          <span>Today's Deals</span>
        ) : (
          <span>Search results for "{query}"</span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Filter sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded shadow-sm p-4 sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#0F1111] text-sm flex items-center gap-2">
                <SlidersHorizontal size={14} />
                Filter Results
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-0.5"
                >
                  <X size={10} />
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Brand filter */}
            {allBrands.length > 0 && (
              <div className="mb-4 border-t border-gray-100 pt-3">
                <h4 className="font-bold text-[#0F1111] text-xs mb-2">Brand</h4>
                <div className="space-y-1.5">
                  {visibleBrands.map(({ brand, count }) => (
                    <label key={brand} className="flex items-center gap-2 text-xs text-[#0F1111] cursor-pointer hover:text-[#C7511F] group">
                      <input
                        type="checkbox"
                        className="accent-[#FF9900]"
                        checked={selectedBrands.has(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span className="flex-1 group-hover:text-[#C7511F]">{brand}</span>
                      <span className="text-[#999] text-[10px]">({count})</span>
                    </label>
                  ))}
                </div>
                {allBrands.length > 8 && (
                  <button
                    onClick={() => setShowAllBrands((v) => !v)}
                    className="mt-2 text-[11px] text-[#007185] hover:underline flex items-center gap-0.5"
                  >
                    {showAllBrands ? (
                      <><ChevronUp size={11} /> Show less</>
                    ) : (
                      <><ChevronDown size={11} /> See {allBrands.length - 8} more</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Customer Reviews */}
            <div className="mb-4 border-t border-gray-100 pt-3">
              <h4 className="font-bold text-[#0F1111] text-xs mb-2">Customer Reviews</h4>
              <div className="space-y-1.5">
                {RATING_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-xs text-[#0F1111] cursor-pointer hover:text-[#C7511F] group">
                    <input
                      type="radio"
                      name="rating"
                      className="accent-[#FF9900]"
                      checked={selectedRating === opt.value}
                      onChange={() => setSelectedRating(selectedRating === opt.value ? null : opt.value)}
                    />
                    <span className="text-[#FF9900]">{"★".repeat(opt.value)}</span>
                    <span className="text-[#565959] group-hover:text-[#C7511F]">& above</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-2 border-t border-gray-100 pt-3">
              <h4 className="font-bold text-[#0F1111] text-xs mb-2">Price</h4>
              <div className="space-y-1.5">
                {PRICE_OPTIONS.map((opt) => (
                  <label key={opt.label} className="flex items-center gap-2 text-xs text-[#0F1111] cursor-pointer hover:text-[#C7511F] group">
                    <input
                      type="checkbox"
                      className="accent-[#FF9900]"
                      checked={selectedPrices.has(opt.label)}
                      onChange={() => togglePrice(opt.label)}
                    />
                    <span className="group-hover:text-[#C7511F]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Results header */}
          <div className="flex items-center justify-between mb-3 bg-white rounded shadow-sm px-4 py-2.5 flex-wrap gap-2">
            <p className="text-sm text-[#565959]">{headerText}</p>
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

          {/* Eco mode banner */}
          {prefs.enabled && prefs.prioritizeEco && (
            <div className="flex items-center gap-2 mb-3 bg-green-50 border border-green-200 rounded px-3 py-2">
              <Leaf size={13} className="text-[#1B5E20] flex-shrink-0" />
              <span className="text-xs text-[#1B5E20] font-medium">
                Sustainability Mode is on — greener products are ranked higher.
              </span>
              <Link to="/account" className="ml-auto text-xs text-[#007185] hover:underline flex-shrink-0">
                Settings
              </Link>
            </div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {[...selectedBrands].map((b) => (
                <span key={b} className="flex items-center gap-1 bg-white border border-[#DDD] text-xs text-[#0F1111] px-2 py-1 rounded-full">
                  {b}
                  <button onClick={() => toggleBrand(b)} className="hover:text-[#C7511F]"><X size={10} /></button>
                </span>
              ))}
              {selectedRating !== null && (
                <span className="flex items-center gap-1 bg-white border border-[#DDD] text-xs text-[#0F1111] px-2 py-1 rounded-full">
                  {"★".repeat(selectedRating)} & above
                  <button onClick={() => setSelectedRating(null)} className="hover:text-[#C7511F]"><X size={10} /></button>
                </span>
              )}
              {[...selectedPrices].map((label) => (
                <span key={label} className="flex items-center gap-1 bg-white border border-[#DDD] text-xs text-[#0F1111] px-2 py-1 rounded-full">
                  {label}
                  <button onClick={() => togglePrice(label)} className="hover:text-[#C7511F]"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#565959]">Finding the best matches…</p>
              </div>
            </div>
          ) : (
            <>
              {/* Bundle card */}
              {bundle && bundleProducts.length > 0 && (
                <BundleCard bundle={bundle} products={bundleProducts} />
              )}

              {sortedProducts.length === 0 ? (
                <div className="bg-white rounded shadow-sm p-10 text-center">
                  <p className="text-[#565959] text-sm">No results found{query ? ` for "${query}"` : ""}</p>
                  <p className="text-xs text-[#565959] mt-1">
                    {activeFilterCount > 0
                      ? "Try removing some filters to see more results."
                      : "Try different keywords or browse categories."}
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 text-sm text-[#007185] hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedProducts.map((p) => {
                    const ecoScore = getSustainabilityData(p.id).score;
                    const isGreener = prefs.enabled && prefs.prioritizeEco && ecoScore > 80;
                    return (
                      <ProductCard key={p.id} product={p} greenerChoice={isGreener} />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
