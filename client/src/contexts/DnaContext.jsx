/**
 * DnaContext
 *
 * Provides:
 *   recordEvent(type, product)   — fire a DNA event (view / cart_add / purchase / return)
 *   profile                      — the user's DNA profile object
 *   getProductRisk(product)      — fetch return-risk data for a product → { riskScore, warnings }
 *   dnaReady                     — true once profile has loaded
 */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { API } from "../utils/format.js";

const DnaContext = createContext(null);

// Guest ID — persisted in localStorage so anonymous users still build DNA
function getGuestId() {
  let id = localStorage.getItem("dna_guest_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("dna_guest_id", id);
  }
  return id;
}

export function DnaProvider({ children }) {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dnaReady, setDnaReady] = useState(false);
  const guestId = useRef(getGuestId());

  // Auth headers — include token if logged in
  const headers = useCallback(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Fetch profile on mount and when auth changes
  useEffect(() => {
    const params = token ? "" : `?guestId=${guestId.current}`;
    fetch(`${API}/api/dna/profile${params}`, { headers: headers() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch(() => {})
      .finally(() => setDnaReady(true));
  }, [token]);
  // Listen for cart_add events from CartContext
    // useEffect(() => {
    //   const handler = (e) => recordEvent("cart_add", e.detail.product);
    //   window.addEventListener("dna:event", handler);
    //   return () => window.removeEventListener("dna:event", handler);
    // }, [recordEvent]);


  // Record a behavioural event
  const recordEvent = useCallback(async (type, product) => {
    if (!product?.id) return;
    try {
      const body = {
        type,
        productId:   product.id,
        category:    product.category    || "",
        brand:       product.brand       || "",
        price:       product.price       || 0,
        sustainable: !!(product.trustScore > 80 && (product.category || "").includes("Eco")),
        guestId:     token ? undefined : guestId.current,
      };
      const res = await fetch(`${API}/api/dna/event`, {
        method:  "POST",
        headers: headers(),
        body:    JSON.stringify(body),
      });
      if (res.ok) {
        // Refresh profile silently after every event
        const params = token ? "" : `?guestId=${guestId.current}`;
        fetch(`${API}/api/dna/profile${params}`, { headers: headers() })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) setProfile(data); })
          .catch(() => {});
      }
    } catch {
      // Never throw — DNA is non-critical
    }
  }, [token, headers]);

    useEffect(() => {
      const handler = (e) => recordEvent("cart_add", e.detail.product);
      window.addEventListener("dna:event", handler);
      return () => window.removeEventListener("dna:event", handler);
    }, [recordEvent]);

  // Fetch return risk for a product
  const getProductRisk = useCallback(async (product) => {
    if (!product?.id) return null;
    try {
      const params = new URLSearchParams({
        category: product.category || "",
        brand:    product.brand    || "",
        price:    product.price    || 0,
      });
      if (!token) params.set("guestId", guestId.current);

      const res = await fetch(`${API}/api/dna/risk/${product.id}?${params}`, {
        headers: headers(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [token, headers]);

  return (
    <DnaContext.Provider value={{ profile, dnaReady, recordEvent, getProductRisk, guestId: guestId.current }}>
      {children}
    </DnaContext.Provider>
  );
}

export const useDna = () => useContext(DnaContext);
