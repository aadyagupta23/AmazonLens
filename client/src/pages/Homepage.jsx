import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, formatPrice, getTrustColor } from "../utils/format.js";
import ProductCard from "../components/ProductCard.jsx";
import SensePopup from "../components/SensePopup.jsx";
import { ChevronRight } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    bg: "from-[#131921] to-[#232F3E]",
    title: "Great Indian Festival Sale",
    subtitle: "Up to 80% off on top electronics",
    cta: "Shop Electronics",
    query: "electronics",
    badge: "LIVE NOW"
  },
  {
    id: 2,
    bg: "from-[#004B91] to-[#007185]",
    title: "Prime Members Save More",
    subtitle: "Exclusive deals on Sony, Samsung, Apple & more",
    cta: "Explore Deals",
    query: "home theatre setup under 40000",
    badge: "PRIME"
  }
];

const CATEGORIES_GRID = [
  { name: "Mobiles", icon: "📱", query: "mobiles" },
  { name: "Televisions", icon: "📺", query: "television" },
  { name: "Audio", icon: "🎵", query: "audio" },
  { name: "Kitchen", icon: "🍳", query: "kitchen" },
  { name: "Fashion", icon: "👗", query: "fashion" },
  { name: "Books", icon: "📚", query: "books" },
  { name: "Sports", icon: "⚽", query: "sports" },
  { name: "Grocery", icon: "🛒", query: "grocery" }
];

export default function Homepage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    axios.get(`${API}/api/products?limit=8`).then(({ data }) => setProducts(data.products || []));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[heroSlide];

  return (
    <div>
      <SensePopup />

      {/* Hero Banner */}
      <div className={`bg-gradient-to-r ${slide.bg} text-white relative overflow-hidden`}
           style={{ minHeight: 240 }}>
        <div className="max-w-[1500px] mx-auto px-4 py-12 relative z-10">
          {slide.badge && (
            <span className="inline-block bg-[#FF9900] text-[#131921] text-xs font-bold px-3 py-1 rounded-full mb-3">
              {slide.badge}
            </span>
          )}
          <h1 className="text-4xl font-bold mb-2">{slide.title}</h1>
          <p className="text-lg text-gray-200 mb-6">{slide.subtitle}</p>
          <button
            onClick={() => navigate(`/s?q=${encodeURIComponent(slide.query)}`)}
            className="flex items-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#131921] font-bold px-6 py-3 rounded-full text-sm"
          >
            {slide.cta}
            <ChevronRight size={16} />
          </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

        {/* Slide dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === heroSlide ? "bg-[#FF9900] w-4" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 py-6">
        {/* Categories grid */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="font-bold text-[#0F1111] text-lg mb-4">Shop by Category</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES_GRID.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/s?q=${cat.query}`)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-[#EAEDED] transition-colors group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-[#0F1111] text-center group-hover:text-[#C7511F]">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* TrustLens highlight banner */}
        <div className="bg-gradient-to-r from-[#131921] to-[#1d2d3e] rounded-lg p-5 mb-6 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#FF9900] text-lg">🔍</span>
                <span className="text-[#FF9900] text-xs font-bold uppercase tracking-wide">New Feature</span>
              </div>
              <h2 className="text-xl font-bold mb-1">Introducing TrustLens™</h2>
              <p className="text-gray-300 text-sm max-w-xl">
                See 12-month price history, trust scores, and real owner insights on every product — so you shop with confidence, not dark patterns.
              </p>
            </div>
            <button
              onClick={() => navigate("/dp/p001")}
              className="flex-shrink-0 bg-[#FFD814] hover:bg-[#F7CA00] text-[#131921] font-bold px-5 py-2.5 rounded-full text-sm"
            >
              Try it on Sony TV →
            </button>
          </div>
        </div>

        {/* Deal of the Day */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0F1111] text-lg">Deal of the Day</h2>
            <button
              onClick={() => navigate("/s?q=deals")}
              className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline"
            >
              See all deals →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Recommended for you */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0F1111] text-lg">Recommended for You</h2>
            <button
              onClick={() => navigate("/s?q=recommended")}
              className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline"
            >
              See all →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Footer strip */}
        <div className="bg-[#232F3E] text-white rounded-lg p-4 text-center">
          <p className="text-sm text-gray-300">
            Built for Amazon HackOn Season 6 · TrustLens™ · WitnessPanel™ · Amazon Sense™
          </p>
        </div>
      </div>
    </div>
  );
}
