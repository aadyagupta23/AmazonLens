import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { API } from "../utils/format.js";

const WishlistContext = createContext(null);

const LOCAL_KEY = "amz_wishlist";
const GUEST_KEY = "amz_wishlist_uid";

function getUserId() {
  try {
    const session = JSON.parse(localStorage.getItem("al_session") || "null");
    if (session?.email) return encodeURIComponent(session.email);
  } catch { /* ignore */ }
  let guest = localStorage.getItem(GUEST_KEY);
  if (!guest) {
    guest = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(GUEST_KEY, guest);
  }
  return guest;
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
  catch { return []; }
}

function saveLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(loadLocal);
  const syncTimer = useRef(null);

  // On mount: try to load from server (merge with local)
  useEffect(() => {
    const uid = getUserId();
    fetch(`${API}/api/wishlists/${uid}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(({ items }) => {
        if (!Array.isArray(items) || items.length === 0) return;
        setWishlist((local) => {
          const merged = [...local];
          items.forEach((si) => {
            if (!merged.find((li) => li.id === si.id)) merged.push(si);
          });
          saveLocal(merged);
          return merged;
        });
      })
      .catch(() => { /* server unavailable — local-only */ });
  }, []);

  const syncToServer = (items) => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const uid = getUserId();
      fetch(`${API}/api/wishlists/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => { /* ignore sync errors */ });
    }, 500);
  };

  const toggle = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      const updated = exists ? prev.filter((i) => i.id !== product.id) : [...prev, product];
      saveLocal(updated);
      syncToServer(updated);
      return updated;
    });
  };

  const remove = (productId) => {
    setWishlist((prev) => {
      const updated = prev.filter((i) => i.id !== productId);
      saveLocal(updated);
      syncToServer(updated);
      return updated;
    });
  };

  const isInWishlist = (productId) => wishlist.some((i) => i.id === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, remove, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
