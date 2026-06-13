import React, { createContext, useContext, useState } from "react";

const WishlistContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem("amz_wishlist") || "[]"); }
  catch { return []; }
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(load);

  const toggle = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      const updated = exists
        ? prev.filter((i) => i.id !== product.id)
        : [...prev, product];
      localStorage.setItem("amz_wishlist", JSON.stringify(updated));
      return updated;
    });
  };

  const remove = (productId) => {
    setWishlist((prev) => {
      const updated = prev.filter((i) => i.id !== productId);
      localStorage.setItem("amz_wishlist", JSON.stringify(updated));
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
