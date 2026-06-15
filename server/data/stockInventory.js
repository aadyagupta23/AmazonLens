// Mock stock inventory data
// Products with low stock are flagged for Sense™ early-buy alerts
export const stockInventory = {
  // Local products
  "p001": { stock: 142, threshold: 20 },
  "p002": { stock: 8, threshold: 15 },     // Low stock!
  "p003": { stock: 230, threshold: 30 },
  "p004": { stock: 3, threshold: 10 },     // Very low stock!
  "p005": { stock: 5, threshold: 15 },     // Low stock! (Nescafé - our demo item)
  "p006": { stock: 67, threshold: 20 },
  "p007": { stock: 12, threshold: 15 },    // Low stock!
  "p008": { stock: 189, threshold: 25 },
  "p009": { stock: 4, threshold: 10 },     // Very low stock!
  "p010": { stock: 45, threshold: 20 },
  "p011": { stock: 6, threshold: 15 },     // Low stock!
  "p012": { stock: 320, threshold: 30 },
  "p013": { stock: 9, threshold: 15 },     // Low stock!
  "p014": { stock: 78, threshold: 20 },
  "p015": { stock: 2, threshold: 10 },     // Very low stock!
  "p016": { stock: 156, threshold: 25 },
  "p017": { stock: 7, threshold: 15 },     // Low stock!
  "p018": { stock: 94, threshold: 20 },
  "p019": { stock: 11, threshold: 15 },    // Low stock!
  "p020": { stock: 210, threshold: 30 },
  "p021": { stock: 3, threshold: 10 },     // Very low stock!
  "p022": { stock: 52, threshold: 20 },
  "p023": { stock: 14, threshold: 15 },    // Low stock!
  "p024": { stock: 88, threshold: 20 },
  "p025": { stock: 6, threshold: 15 },     // Low stock!
  "p026": { stock: 175, threshold: 25 },
  "p027": { stock: 10, threshold: 15 },    // Low stock!
  "p028": { stock: 43, threshold: 20 },
  "p029": { stock: 5, threshold: 10 },     // Low stock!
  "p030": { stock: 120, threshold: 20 },
  "p031": { stock: 8, threshold: 15 },     // Low stock!
  "p032": { stock: 200, threshold: 25 },
  "p033": { stock: 15, threshold: 20 },    // Low stock!
  "p034": { stock: 2, threshold: 10 },     // Very low stock!
  "p035": { stock: 65, threshold: 20 },
  "p036": { stock: 4, threshold: 10 },     // Very low stock!
  "p037": { stock: 130, threshold: 25 },
  "p038": { stock: 7, threshold: 15 },     // Low stock!
};

// Helper: check if a product is low on stock
export function isLowStock(productId) {
  const entry = stockInventory[productId];
  if (!entry) return false;
  return entry.stock <= entry.threshold;
}

// Helper: get stock info for a product
export function getStockInfo(productId) {
  return stockInventory[productId] || null;
}
