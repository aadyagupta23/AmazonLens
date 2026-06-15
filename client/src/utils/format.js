export const formatPrice = (n) => `₹${n.toLocaleString("en-IN")}`;

export const formatPriceShort = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

export const getDiscount = (original, current) => Math.round(((original - current) / original) * 100);

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getTrustColor = (score) => {
  if (score >= 75) return { bg: "bg-[#067D62]", text: "text-white", label: "Verified", hex: "#067D62" };
  return { bg: "bg-[#0284c7]", text: "text-white", label: "Trusted", hex: "#0284c7" };
};

export const API = "";
