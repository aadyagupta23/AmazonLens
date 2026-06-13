import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { ShoppingCart, Search, MapPin, ChevronDown, Menu, Sparkles, Leaf } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";

const CATEGORIES = [
  "All", "Electronics", "Mobiles", "Fashion", "Home & Kitchen",
  "Books", "Sports", "Grocery", "Beauty"
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, realUser, logout } = useAuth();
  const { itemCount } = useCart();
  const { prefs, toggleMode } = useSustainability();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showAccount, setShowAccount] = useState(false);
  const [smartMode, setSmartMode] = useState(false);
  const inputRef = useRef(null);

  // Sync query from URL when on smart-search page
  useEffect(() => {
    if (location.pathname === "/smart-search") {
      const urlQuery = searchParams.get("q") || "";
      setQuery(urlQuery);
      setSmartMode(true);
    }
  }, [location.pathname, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (smartMode) {
      navigate(`/smart-search?q=${encodeURIComponent(query.trim())}`);
    } else {
      const params = new URLSearchParams();
      params.set("q", query.trim());
      if (category !== "All") params.set("category", category);
      navigate(`/s?${params.toString()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-[1500px] mx-auto px-3 py-2 flex items-center gap-2">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 mr-2 border border-transparent hover:border-white rounded px-1 py-1">
            <div className="flex flex-col items-center leading-none">
              <span className="text-white font-bold text-2xl tracking-tight" style={{ fontFamily: "Arial Black, sans-serif" }}>
                amazon
              </span>
              <span className="text-[#FF9900] text-[10px] font-bold self-end -mt-1">.in</span>
            </div>
          </Link>

          {/* Delivery location */}
          <Link
            to="/"
            className="flex-shrink-0 hidden md:flex items-end gap-1 border border-transparent hover:border-white rounded px-1 py-1 text-xs min-w-[100px]"
          >
            <MapPin size={16} className="text-white mb-0.5" />
            <div>
              <div className="text-[#CCC] text-[11px]">Deliver to</div>
              <div className="text-white font-bold text-[13px] whitespace-nowrap">Bengaluru 560001</div>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-1 h-10 rounded overflow-hidden">
            {/* Smart Search toggle button */}
            <button
              type="button"
              onClick={() => {
                setSmartMode((v) => !v);
                inputRef.current?.focus();
              }}
              title={smartMode ? "AI Smart Search active — click for normal search" : "Normal search — click for AI Smart Search"}
              className={`flex items-center gap-1 px-2.5 text-xs font-semibold border-r border-gray-300 transition-colors whitespace-nowrap ${
                smartMode
                  ? "bg-[#FF9900] text-white"
                  : "bg-[#F3F3F3] text-[#131921] hover:bg-[#e8e8e8]"
              }`}
            >
              <Sparkles size={13} className={smartMode ? "text-white" : "text-[#FF9900]"} />
              <span className="hidden sm:inline">{smartMode ? "✨ Smart" : "AI"}</span>
            </button>

            {/* Category selector (hidden in smart mode) */}
            {!smartMode && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#F3F3F3] text-[#131921] text-xs px-2 border-r border-gray-300 cursor-pointer hidden sm:block min-w-[80px] max-w-[120px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Search input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={smartMode ? 'Try "TV setup under ₹70,000" or "best earbuds"' : "Search Amazon.in"}
              className="flex-1 px-3 text-[#131921] text-sm outline-none bg-white"
            />

            {/* Search button */}
            <button
              type="submit"
              className="bg-[#FF9900] hover:bg-[#F3A847] px-4 flex items-center justify-center transition-colors"
            >
              <Search size={20} className="text-[#131921]" />
            </button>
          </form>

          {/* Language */}
          <button className="hidden lg:flex items-center gap-0.5 border border-transparent hover:border-white rounded px-1 py-1 text-sm flex-shrink-0">
            <span className="text-white text-xs">EN</span>
            <ChevronDown size={12} className="text-white" />
          </button>

          {/* Account */}
          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => setShowAccount(true)}
            onMouseLeave={() => setShowAccount(false)}
          >
            <Link
              to={realUser ? "/account" : "/login"}
              className="flex flex-col border border-transparent hover:border-white rounded px-1 py-1 min-w-[100px]"
            >
              <span className="text-[#CCC] text-[11px]">Hello, {user?.name?.split(" ")[0] || "Sign in"}</span>
              <span className="text-white font-bold text-[13px] flex items-center gap-0.5">
                Account & Lists <ChevronDown size={12} />
              </span>
            </Link>

            {showAccount && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded shadow-2xl border border-gray-200 w-64 z-50 text-[#0F1111] p-4">
                {!realUser ? (
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="block w-full btn-primary text-center py-2 rounded mb-3"
                    >
                      Sign in
                    </Link>
                    <p className="text-xs text-gray-600 mb-2">
                      New customer?{" "}
                      <Link to="/signup" className="text-[#007185] hover:text-[#C7511F] hover:underline">
                        Start here
                      </Link>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={logout}
                    className="text-sm text-[#007185] hover:underline"
                  >
                    Sign out ({user.name})
                  </button>
                )}
                <hr className="my-3 border-gray-200" />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "Your Account", href: "/account" },
                    { label: "Your Orders", href: "/orders" },
                    { label: "Your Wishlist", href: "/wishlist" },
                    { label: "Your Prime", href: "/prime" },
                    { label: "Recommendations", href: "/" },
                    { label: "Browsing History", href: "/history" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="hover:underline text-[#0F1111]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <hr className="my-3 border-gray-200" />
                {/* Sustainability quick-access */}
                <div className="flex items-center justify-between">
                  <Link
                    to="/sustainability"
                    className="flex items-center gap-1 text-xs text-[#1B5E20] hover:underline font-medium"
                  >
                    <Leaf size={11} />
                    Sustainability
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMode(); }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      prefs.enabled
                        ? "bg-[#1B5E20] text-white"
                        : "border border-[#1B5E20] text-[#1B5E20]"
                    }`}
                  >
                    {prefs.enabled ? "Eco On" : "Eco Off"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Returns & Orders */}
          <Link
            to="/orders"
            className="hidden md:flex flex-col border border-transparent hover:border-white rounded px-1 py-1 flex-shrink-0"
          >
            <span className="text-[#CCC] text-[11px]">Returns</span>
            <span className="text-white font-bold text-[13px]">& Orders</span>
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="flex items-end gap-1 border border-transparent hover:border-white rounded px-2 py-1 flex-shrink-0"
          >
            <div className="relative">
              <ShoppingCart size={32} className="text-white" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF9900] text-[#131921] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-white font-bold text-[13px] hidden sm:block">Cart</span>
          </Link>
        </div>
      </div>

      {/* Secondary navigation bar */}
      <div className="bg-[#232F3E] text-white">
        <div className="max-w-[1500px] mx-auto px-3 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => navigate("/s")}
            className="flex items-center gap-1 px-2 py-2 hover:bg-white/10 rounded text-sm font-medium flex-shrink-0"
          >
            <Menu size={16} />
            <span>All</span>
          </button>

          {[
            { label: "Today's Deals", href: "/s?q=deals" },
            { label: "Customer Service", href: "/help" },
            { label: "Registry", href: "/registry" },
            { label: "Gift Cards", href: "/gift-cards" },
            { label: "Sell", href: "/sell" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="px-3 py-2 hover:bg-white/10 rounded text-sm flex-shrink-0"
            >
              {item.label}
            </Link>
          ))}

          <Link to="/prime" className="px-3 py-2 hover:bg-white/10 rounded text-sm text-[#FF9900] font-medium flex-shrink-0">
            Prime
          </Link>
          <Link to="/amazon-pay" className="px-3 py-2 hover:bg-white/10 rounded text-sm flex-shrink-0">
            Amazon Pay
          </Link>
          <Link to="/cart" className="px-3 py-2 hover:bg-white/10 rounded text-sm flex-shrink-0">
            Buy Again
          </Link>
          <Link to="/minitv" className="px-3 py-2 hover:bg-white/10 rounded text-sm flex-shrink-0">
            Amazon miniTV
          </Link>

          {/* Sustainability Mode indicator */}
          {prefs.enabled && (
            <Link
              to="/sustainability"
              className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-[#1B5E20]/80 hover:bg-[#1B5E20] rounded text-xs font-medium text-white flex-shrink-0 transition-colors"
            >
              <Leaf size={11} />
              Eco Mode On
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
