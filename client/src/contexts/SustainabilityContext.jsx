import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "al_sustainability_prefs";

const DEFAULT_PREFS = {
  enabled: false,           // master switch — Sustainability Mode on/off
  prioritizeEco: true,      // Prioritize Eco-Friendly Products
  recyclablePackaging: true, // Prefer Recyclable Packaging
  ethicalBrands: false,     // Prefer Ethical Brands
  showOnProducts: true,     // Show Sustainability Information on Products
};

const SustainabilityContext = createContext(null);

export function SustainabilityProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  // Persist to localStorage whenever prefs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const updatePref = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMode = () => {
    setPrefs((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  // Convenience: is mode on AND showOnProducts enabled?
  const showOnProduct = prefs.enabled && prefs.showOnProducts;

  return (
    <SustainabilityContext.Provider value={{ prefs, updatePref, toggleMode, showOnProduct }}>
      {children}
    </SustainabilityContext.Provider>
  );
}

export const useSustainability = () => useContext(SustainabilityContext);
