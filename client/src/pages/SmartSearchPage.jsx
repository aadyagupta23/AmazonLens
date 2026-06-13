import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingDown,
  Package,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  AlertTriangle,
  X,
  ArrowRightLeft,
  CheckCircle2,
  Info,
  Loader2,
  Brain,
  Target,
  Wallet,
  Tags,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const trustConfig = (score) => {
  if (score >= 80) return { color: 'text-green-600 bg-green-50 border-green-200', Icon: ShieldCheck, label: 'Genuine' };
  if (score >= 60) return { color: 'text-amber-600 bg-amber-50 border-amber-200', Icon: ShieldAlert, label: 'Mixed' };
  return { color: 'text-red-600 bg-red-50 border-red-200', Icon: ShieldX, label: 'Suspicious' };
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── TrustBadge ───────────────────────────────────────────────────────────────
function TrustBadge({ score }) {
  const { color, Icon, label } = trustConfig(score);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Icon size={11} />
      {score} · {label}
    </span>
  );
}

// ─── BudgetStatus ─────────────────────────────────────────────────────────────
function BudgetStatusBadge({ total, budget }) {
  if (!budget) return null;
  const diff = total - budget;
  const pct = total / budget;

  if (pct <= 0.9) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <CheckCircle2 size={16} />
        <span>✓ Within Budget</span>
        <span className="text-green-600 ml-1">Total: {fmt(total)}</span>
      </div>
    );
  }
  if (pct <= 1.0) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <AlertTriangle size={16} />
        <span>⚠ Near Budget Limit</span>
        <span className="text-amber-600 ml-1">Total: {fmt(total)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <X size={16} className="text-red-500" />
      <span>✗ Above Budget</span>
      <span className="text-red-600 ml-1">Total: {fmt(total)}</span>
      <span className="text-red-500 text-xs ml-1">{fmt(diff)} above your budget</span>
    </div>
  );
}

// ─── QueryAnalysisCard ────────────────────────────────────────────────────────
function QueryAnalysisCard({ parsed, budget, query }) {
  if (!parsed && !budget) return null;

  const intent = parsed?.intent?.replace(/_/g, ' ') || 'keyword search';
  const categories = parsed?.categories || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Brain size={13} className="text-[#ff9900]" />
        How AmazonLens understood your query
      </h4>
      <div className="flex flex-wrap gap-2">
        {/* Intent */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200">
          <Target size={13} className="text-purple-600" />
          <span className="text-xs text-purple-600 font-medium">Intent:</span>
          <span className="text-xs font-bold text-purple-800 capitalize">{intent}</span>
        </div>

        {/* Budget */}
        {budget && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <Wallet size={13} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">Budget:</span>
            <span className="text-xs font-bold text-green-800">{fmt(budget)}</span>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <Tags size={13} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Categories:</span>
            <span className="text-xs font-bold text-blue-800 capitalize">{categories.join(', ')}</span>
          </div>
        )}

        {/* Priority */}
        {budget && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <Zap size={13} className="text-amber-600" />
            <span className="text-xs text-amber-600 font-medium">Priority:</span>
            <span className="text-xs font-bold text-amber-800">Best Value Within Budget</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WhyThisBundle ────────────────────────────────────────────────────────────
function WhyThisBundle({ reasons }) {
  if (!reasons || reasons.length === 0) return null;
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-2">
        <Info size={14} /> Why this bundle?
      </h4>
      <ul className="space-y-1">
        {reasons.map((r, i) => (
          <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
            <CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── SwapModal ────────────────────────────────────────────────────────────────
function SwapModal({ category, currentProductId, budget, onSelect, onClose }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlternatives() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ exclude: currentProductId });
        if (budget) params.set('budget', budget);
        const res = await fetch(`/api/smart-search/alternatives/${category}?${params}`);
        const data = await res.json();
        setAlternatives(data);
      } catch (err) {
        console.error('Failed to fetch alternatives:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlternatives();
  }, [category, currentProductId, budget]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-[#ff9900]" />
            Swap Product — <span className="capitalize">{category}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
          {!loading && alternatives.length === 0 && (
            <p className="text-center text-gray-500 py-8">No alternatives available in this category.</p>
          )}
          {!loading && alternatives.map((p) => {
            const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#ff9900] hover:bg-amber-50 transition-all text-left"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-14 h-14 object-contain rounded-lg bg-gray-50 p-1"
                  onError={(e) => { e.target.src = `https://placehold.co/100x100/f3f4f6/6b7280?text=${encodeURIComponent(p.name.slice(0, 6))}`; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-gray-900 text-sm">{fmt(p.price)}</span>
                    <span className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</span>
                    {discount > 0 && <span className="text-xs font-semibold text-green-600">{discount}% off</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <TrustBadge score={p.trustScore} />
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> {p.rating}
                    </span>
                  </div>
                </div>
                <ArrowRightLeft size={16} className="text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BundleProductCard ────────────────────────────────────────────────────────
function BundleProductCard({ product, onSwap }) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  return (
    <div className="flex flex-col p-3 bg-white rounded-xl border border-gray-100 hover:border-[#ff9900] hover:shadow-md transition-all duration-200 w-44 sm:w-48 flex-shrink-0">
      {/* Image */}
      <div className="w-full h-32 mb-2 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="object-contain w-full h-full p-1"
          onError={(e) => { e.target.src = `https://placehold.co/150x150/f3f4f6/6b7280?text=${encodeURIComponent(product.name.slice(0, 6))}`; }}
        />
      </div>
      {/* Info */}
      <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug mb-1">{product.name}</p>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-bold text-gray-900 text-sm">{fmt(product.price)}</span>
        <span className="text-[10px] text-gray-400 line-through">{fmt(product.originalPrice)}</span>
      </div>
      {discount > 0 && (
        <span className="text-[10px] font-semibold text-green-600 mb-1">{discount}% off</span>
      )}
      <div className="mb-2">
        <TrustBadge score={product.trustScore} />
      </div>
      {/* Swap button */}
      <button
        onClick={() => onSwap(product)}
        className="mt-auto flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-[#ff9900] border border-[#ff9900] rounded-lg hover:bg-[#ff9900] hover:text-white transition-colors w-full"
      >
        <ArrowRightLeft size={12} /> Swap
      </button>
    </div>
  );
}

// ─── BundleCard (v2) ──────────────────────────────────────────────────────────
function BundleCard({ bundle, budget, whyReasons }) {
  const [expanded, setExpanded] = useState(true);
  const [swapTarget, setSwapTarget] = useState(null);
  const [products, setProducts] = useState(bundle.products);
  const [metrics, setMetrics] = useState({
    total: bundle.total,
    originalTotal: bundle.originalTotal,
    savings: bundle.savings,
    avgTrust: bundle.avgTrust,
  });

  const handleSwap = (oldProduct) => {
    setSwapTarget(oldProduct);
  };

  const handleSwapSelect = async (newProduct) => {
    const updatedProducts = products.map((p) => (p.id === swapTarget.id ? newProduct : p));
    setProducts(updatedProducts);
    setSwapTarget(null);

    try {
      const res = await fetch('/api/smart-search/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: updatedProducts.map((p) => p.id), budget }),
      });
      const data = await res.json();
      setMetrics({
        total: data.total,
        originalTotal: data.originalTotal,
        savings: data.savings,
        avgTrust: data.avgTrust,
      });
    } catch (err) {
      const total = updatedProducts.reduce((s, p) => s + p.price, 0);
      const originalTotal = updatedProducts.reduce((s, p) => s + p.originalPrice, 0);
      const avgTrust = Math.round(updatedProducts.reduce((s, p) => s + p.trustScore, 0) / updatedProducts.length);
      setMetrics({ total, originalTotal, savings: originalTotal - total, avgTrust });
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[#ff9900] bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#ff9900]/10 border-b border-[#ff9900]/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{bundle.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900 text-base">{bundle.name}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ff9900] text-white">
                <Zap size={10} /> Best Within Budget
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">{bundle.tagline}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Toggle bundle details"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Customizable Bundle Builder */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ArrowRightLeft size={12} /> Customizable Bundle Builder — swap any item
            </p>
            <div className="flex items-stretch gap-0 overflow-x-auto pb-2 scrollbar-hide">
              {products.map((p, i) => (
                <div key={p.id} className="flex items-center flex-shrink-0">
                  {i > 0 && (
                    <span className="text-gray-400 font-bold text-lg px-2 flex-shrink-0 select-none">+</span>
                  )}
                  <BundleProductCard product={p} onSwap={handleSwap} />
                </div>
              ))}
            </div>
          </div>

          {/* Budget status */}
          {budget && (
            <div className="px-5 pb-3">
              <BudgetStatusBadge total={metrics.total} budget={budget} />
            </div>
          )}

          {/* Pricing bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-[#ff9900]/20 bg-white/60">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Bundle total</p>
                <p className="text-2xl font-extrabold text-gray-900">{fmt(metrics.total)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">You save</p>
                <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                  <TrendingDown size={16} /> {fmt(metrics.savings)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Avg trust score</p>
                <TrustBadge score={metrics.avgTrust} />
              </div>
            </div>
            <button className="bg-[#ff9900] hover:bg-[#f08800] text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm shadow-sm">
              Add Bundle to Cart
            </button>
          </div>

          {/* Why this bundle */}
          {whyReasons && whyReasons.length > 0 && (
            <div className="px-5 pb-5">
              <WhyThisBundle reasons={whyReasons} />
            </div>
          )}
        </>
      )}

      {/* Swap Modal */}
      {swapTarget && (
        <SwapModal
          category={swapTarget.category}
          currentProductId={swapTarget.id}
          budget={budget}
          onSelect={handleSwapSelect}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  );
}

// ─── ClosestAlternativeCard ───────────────────────────────────────────────────
function ClosestAlternativeCard({ alternative, budget }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
      {/* Warning header */}
      <div className="px-5 py-4 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle size={18} />
          <p className="text-sm font-semibold">No complete setup found within your budget of {fmt(budget)}.</p>
        </div>
      </div>

      {/* Closest alternative */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-lg">{alternative.icon}</span>
            Closest Alternative: {alternative.name}
          </h3>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            {expanded ? 'Hide' : 'Show'} details
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Price</p>
            <p className="text-base font-bold text-gray-900">{fmt(alternative.total)}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Your Budget</p>
            <p className="text-base font-bold text-gray-700">{fmt(budget)}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-red-100">
            <p className="text-[10px] text-red-500 uppercase tracking-wider">Above Budget</p>
            <p className="text-base font-bold text-red-600">+{fmt(alternative.overBudgetBy)}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Trust Score</p>
            <TrustBadge score={alternative.avgTrust} />
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-green-100">
            <p className="text-[10px] text-green-600 uppercase tracking-wider">Savings</p>
            <p className="text-base font-bold text-green-600">{fmt(alternative.savings)}</p>
          </div>
        </div>

        {/* Expanded products */}
        {expanded && (
          <div className="mt-4 space-y-2">
            {alternative.products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
                <img src={p.image} alt={p.name} className="w-12 h-12 object-contain rounded bg-gray-50 p-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-1">{p.name}</p>
                  <span className="text-sm font-bold text-gray-900">{fmt(p.price)}</span>
                </div>
                <TrustBadge score={p.trustScore} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  return (
    <a
      href={`/dp/${product.id}`}
      className="group flex flex-col p-4 bg-white rounded-xl border border-gray-100 hover:border-[#ff9900] hover:shadow-md transition-all duration-200"
    >
      <div className="w-full h-40 mb-3 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="object-contain w-full h-full p-1 group-hover:scale-105 transition-transform duration-200"
          onError={(e) => { e.target.src = `https://placehold.co/200x200/f3f4f6/6b7280?text=${encodeURIComponent(product.name.slice(0, 8))}`; }}
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="font-medium text-gray-800 leading-snug line-clamp-2 text-sm">{product.name}</p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span className="font-medium text-gray-700">{product.rating}</span>
          <span>({product.reviews.toLocaleString('en-IN')})</span>
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-bold text-gray-900">{fmt(product.price)}</span>
          <span className="text-xs text-gray-400 line-through">{fmt(product.originalPrice)}</span>
          {discount > 0 && <span className="text-xs font-semibold text-green-600">{discount}% off</span>}
        </div>
        <div className="mt-1">
          <TrustBadge score={product.trustScore} />
        </div>
        {product.badge && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded px-1.5 py-0.5 mt-0.5 w-fit">
            <AlertTriangle size={10} /> {product.badge}
          </span>
        )}
      </div>
    </a>
  );
}

// ─── CategorySection ──────────────────────────────────────────────────────────
function CategorySection({ categoryKey, products }) {
  const LABELS = {
    tv: '📺 Televisions',
    audio: '🔊 Audio & Soundbars',
    streaming: '📡 Streaming Devices',
    phone: '📱 Phones',
    kitchen: '🍳 Kitchen',
    grocery: '🛒 Grocery',
    cable: '🔌 Cables & Accessories',
  };
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        {LABELS[categoryKey] || categoryKey}
        <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">
          {products.length} result{products.length !== 1 ? 's' : ''}
        </span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SmartSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Sync input when URL changes externally (e.g., from Navbar search)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q && q !== inputVal) {
      setInputVal(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Run search ──
  const runSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setSearchParams({ q }, { replace: true });
    try {
      const res = await fetch('/api/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setResults({ results: [], bundle: null, closestAlternative: null, groups: {}, error: true });
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Initial load
  useEffect(() => {
    if (initialQuery && !results) runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autocomplete ──
  useEffect(() => {
    if (!inputVal.trim() || inputVal.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/smart-search/suggest?q=${encodeURIComponent(inputVal)}`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (_) { /* ignore */ }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [inputVal]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    runSearch(inputVal);
  };

  const handleSuggestionClick = (s) => {
    setInputVal(s);
    setShowSuggestions(false);
    runSearch(s);
  };

  // ── Derived state ──
  const hasBundle = results?.bundle;
  const hasClosestAlt = results?.closestAlternative;
  const hasGroups = results?.groups && Object.keys(results.groups).length > 0;
  const hasResults = results?.results?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Smart Search Hero Section ── */}
      <div className="bg-[#131921] py-6 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Enhanced header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-[#ff9900]" />
              <h1 className="text-lg font-bold text-white">AmazonLens Smart Search</h1>
            </div>
            <p className="text-xs text-gray-400">
              Understanding intent, budget, trust scores and bundle recommendations.
            </p>
          </div>

          {/* AI Search label */}
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} className="text-[#ff9900]" />
            <span className="text-[10px] font-semibold text-[#ff9900] uppercase tracking-widest">
              ✨ AI Search
            </span>
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-stretch rounded-lg overflow-hidden shadow-lg ring-2 ring-[#ff9900]">
              <input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true); }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder='Try "TV setup under ₹70,000" or "best soundbar under ₹15,000"'
                className="flex-1 px-4 py-3.5 text-sm bg-white text-gray-800 focus:outline-none placeholder:text-gray-400"
                autoComplete="off"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => { setInputVal(''); setSuggestions([]); inputRef.current?.focus(); }}
                  className="px-2 bg-white text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="bg-[#ff9900] hover:bg-[#f08800] px-5 flex items-center justify-center transition-colors"
              >
                <Search size={20} className="text-white" />
              </button>
            </div>

            {/* Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl mt-0.5 overflow-hidden">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <Search size={13} className="text-gray-400 flex-shrink-0" />
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {/* Current query display */}
          {results?.query && (
            <div className="mt-3 text-xs text-gray-400">
              Query: <span className="text-white font-medium">{results.query}</span>
            </div>
          )}

          {/* Example chips (only when no results yet) */}
          {!results && (
            <div className="flex flex-wrap gap-2 mt-3">
              {['TV setup under ₹40,000', 'TV setup under ₹70,000', 'home theatre under ₹30,000', 'wireless earbuds'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setInputVal(ex); runSearch(ex); }}
                  className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300 hover:bg-[#ff9900]/20 hover:text-[#ff9900] transition-colors border border-white/10"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results Area ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            <div className="rounded-2xl border-2 border-gray-200 h-64 animate-pulse bg-gray-100" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <>
            {/* ─ Query Analysis Card ─ */}
            <div className="mb-5">
              <QueryAnalysisCard parsed={results.parsed} budget={results.budget} query={results.query} />
            </div>

            {/* Result count */}
            {results.totalFound > 0 && (
              <p className="text-sm text-gray-500 mb-5">
                {results.totalFound} result{results.totalFound !== 1 ? 's' : ''} for{' '}
                <span className="font-semibold text-gray-800">"{results.query}"</span>
              </p>
            )}

            {/* ─ SECTION 1: Best Bundle Within Budget ─ */}
            {hasBundle && (
              <div className="mb-8">
                <BundleCard
                  bundle={results.bundle}
                  budget={results.budget}
                  whyReasons={results.whyReasons}
                />
              </div>
            )}

            {/* ─ SECTION 2: Closest Alternative (no valid bundle) ─ */}
            {!hasBundle && hasClosestAlt && (
              <div className="mb-8">
                <ClosestAlternativeCard
                  alternative={results.closestAlternative}
                  budget={results.budget}
                />
              </div>
            )}

            {/* ─ SECTION 3: Individual Products ─ */}
            {hasGroups && (
              <div className="space-y-8">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Package size={18} /> Individual Products
                </h2>
                {Object.entries(results.groups).map(([cat, prods]) => (
                  <CategorySection key={cat} categoryKey={cat} products={prods} />
                ))}
              </div>
            )}

            {!hasGroups && hasResults && (
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <Package size={18} /> Search Results
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {results.results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasBundle && !hasClosestAlt && !hasGroups && !hasResults && (
              <div className="text-center py-20">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-1">No results found</h3>
                <p className="text-sm text-gray-400">Try "TV setup under 70000" or "best soundbar"</p>
              </div>
            )}

            {results.error && (
              <div className="text-center py-12 text-red-500 text-sm">
                Search service unavailable. Please try again.
              </div>
            )}
          </>
        )}

        {/* Initial empty state */}
        {!loading && !results && (
          <div className="text-center py-20 text-gray-400">
            <Sparkles size={48} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-base font-semibold text-gray-500 mb-2">AI-Powered Shopping Assistant</h3>
            <p className="text-sm">Search with natural language — "TV setup under ₹70,000"</p>
            <p className="text-xs mt-1 text-gray-300">Get bundle recommendations, trust analysis, and budget-aware results</p>
          </div>
        )}
      </div>
    </div>
  );
}
