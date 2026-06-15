/**
 * SenseContext (formerly DnaContext)
 *
 * Amazon Sense — Unified Preference & Purchase Intelligence
 *
 * TWO CAPABILITIES:
 * 1. Purchase Timing Intelligence (handled by SensePopup — restock reminders)
 * 2. Preference Intelligence (match scoring, recommendations, risk assessment)
 *
 * Provides:
 *   recordEvent(type, product)   — fire a behavioural event (view / cart_add / purchase / return)
 *   profile                      — the user's preference profile object
 *   getProductRisk(product)      — fetch return-risk data for a product
 *   getProductMatch(product)     — fetch match score
 *   getRecommendations()         — fetch personalized product recommendations
 *   senseReady                   — true once profile has loaded
 */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { API } from "../utils/format.js";

const SenseContext = createContext(null);

function getGuestId() {
  let id = localStorage.getItem("sense_guest_id") || localStorage.getItem("dna_guest_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("sense_guest_id", id);
  } else if (!localStorage.getItem("sense_guest_id")) {
    localStorage.setItem("sense_guest_id", id);
  }
  return id;
}

// Build purchased-categories from localStorage orders so cards can show labels on first load
function buildLocalPurchasedCats() {
  try {
    const orders = JSON.parse(localStorage.getItem("amz_orders") || "[]");
    const catMap = {};
    for (const order of orders) {
      for (const item of order.items || []) {
        const cat = item.category || "";
        if (!cat) continue;
        if (!catMap[cat]) catMap[cat] = { count: 0, brands: new Set() };
        catMap[cat].count++;
        if (item.brand) catMap[cat].brands.add(item.brand);
      }
    }
    return Object.entries(catMap).map(([category, { count, brands }]) => ({
      category,
      count,
      brands: [...brands],
    }));
  } catch {
    return [];
  }
}

export function SenseProvider({ children }) {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [senseReady, setSenseReady] = useState(false);
  const [aiScores, setAiScores] = useState({});
  // Populated synchronously from localStorage — available before any async profile fetch
  const [localPurchasedCats, setLocalPurchasedCats] = useState(buildLocalPurchasedCats);
  const guestId = useRef(getGuestId());

  const headers = useCallback(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Keep localPurchasedCats in sync when the user places a new order (same tab or other tab)
  useEffect(() => {
    const refresh = () => setLocalPurchasedCats(buildLocalPurchasedCats());
    window.addEventListener("orders:updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("orders:updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const params = token ? "" : `?guestId=${guestId.current}`;
    fetch(`${API}/api/sense/profile${params}`, { headers: headers() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setProfile(data); })
      .catch(() => {})
      .finally(() => setSenseReady(true));
  }, [token]);

  const recordEvent = useCallback(async (type, product) => {
    if (!product?.id) return;
    try {
      const body = {
        type,
        productId: product.id,
        category: product.category || "",
        brand: product.brand || "",
        price: product.price || 0,
        sustainable: !!(product.trustScore > 80 && (product.category || "").includes("Eco")),
        guestId: token ? undefined : guestId.current,
      };
      const res = await fetch(`${API}/api/sense/event`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const params = token ? "" : `?guestId=${guestId.current}`;
        fetch(`${API}/api/sense/profile${params}`, { headers: headers() })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) setProfile(data); })
          .catch(() => {});
      }
    } catch { /* non-critical */ }
  }, [token, headers]);

  useEffect(() => {
    const handler = (e) => recordEvent(e.detail.type || "cart_add", e.detail.product);
    window.addEventListener("dna:event", handler);
    window.addEventListener("sense:event", handler);
    return () => {
      window.removeEventListener("dna:event", handler);
      window.removeEventListener("sense:event", handler);
    };
  }, [recordEvent]);

  const getProductRisk = useCallback(async (product) => {
    if (!product?.id) return null;
    try {
      const params = new URLSearchParams({
        category: product.category || "",
        brand: product.brand || "",
        price: product.price || 0,
      });
      if (!token) params.set("guestId", guestId.current);
      const res = await fetch(`${API}/api/sense/risk/${product.id}?${params}`, { headers: headers() });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [token, headers]);

  const getProductMatch = useCallback(async (product) => {
    if (!product?.id) return null;
    try {
      const params = new URLSearchParams({
        category: product.category || "",
        brand: product.brand || "",
        price: product.price || 0,
        rating: product.rating || 0,
      });
      if (!token) params.set("guestId", guestId.current);
      const res = await fetch(`${API}/api/sense/match/${product.id}?${params}`, { headers: headers() });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [token, headers]);

  const setProductAiScore = useCallback((productId, scoreData) => {
    setAiScores(prev => ({ ...prev, [productId]: scoreData }));
  }, []);

  const getRecommendations = useCallback(async () => {
    try {
      const params = token ? "" : `?guestId=${guestId.current}`;
      const res = await fetch(`${API}/api/sense/recommendations${params}`, { headers: headers() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.recommendations || [];
    } catch { return []; }
  }, [token, headers]);

  return (
    <SenseContext.Provider value={{ profile, senseReady, dnaReady: senseReady, recordEvent, getProductRisk, getProductMatch, getRecommendations, setProductAiScore, aiScores, localPurchasedCats, guestId: guestId.current }}>
      {children}
    </SenseContext.Provider>
  );
}

export const useSense = () => useContext(SenseContext);
export const useDna = useSense;
export const DnaProvider = SenseProvider;
