import React, { createContext, useContext, useState } from "react";

const HistoryContext = createContext(null);

const HISTORY_KEY = "amz_history";
const MAX_ITEMS = 50;

function load() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function save(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState(load);

  const addToHistory = (product) => {
    if (!product?.id) return;
    setHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== product.id);
      const entry = {
        id: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        rating: product.rating,
        discount: product.discount,
        brand: product.brand,
        viewedAt: new Date().toISOString(),
      };
      const next = [entry, ...filtered].slice(0, MAX_ITEMS);
      save(next);
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    save([]);
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export const useHistory = () => useContext(HistoryContext);
