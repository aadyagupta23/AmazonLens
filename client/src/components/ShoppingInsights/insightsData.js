/**
 * Computes shopping insights from real localStorage data.
 * Reads amz_orders and amz_wishlist — no hardcoded values.
 */
export function computeInsights() {
  let orders = [];
  let wishlist = [];
  try { orders = JSON.parse(localStorage.getItem("amz_orders") || "[]"); } catch {}
  try { wishlist = JSON.parse(localStorage.getItem("amz_wishlist") || "[]"); } catch {}

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthOrders = orders.filter((o) => {
    const d = new Date(o.placedAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const lastMonthOrders = orders.filter((o) => {
    const d = new Date(o.placedAt);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const thisMonthSpent = thisMonthOrders.reduce((s, o) => s + (o.total || 0), 0);
  const lastMonthSpent = lastMonthOrders.reduce((s, o) => s + (o.total || 0), 0);

  // Total saved = sum of discounts across all orders
  const allOrderItems = orders.flatMap((o) => o.items || []);
  const totalSaved = allOrderItems.reduce((s, i) => {
    if (i.originalPrice && i.originalPrice > i.price) {
      return s + (i.originalPrice - i.price) * (i.qty || 1);
    }
    return s;
  }, 0);

  // Wishlist items that have dropped below original price
  const priceDropItems = wishlist.filter(
    (p) => p.originalPrice && p.originalPrice > p.price
  );

  const insights = [];

  if (totalSaved > 0) {
    insights.push({
      id: "money_saved",
      type: "money_saved",
      title: "Saved on purchases",
      value: `₹${Math.round(totalSaved).toLocaleString("en-IN")}`,
      subtext: `Across ${allOrderItems.length} item${allOrderItems.length !== 1 ? "s" : ""} ordered`,
      delta: null,
      deltaLabel: null,
      cta: { label: "View orders", href: "/orders" },
      icon: "piggy_bank",
      accentColor: "green",
    });
  }

  if (priceDropItems.length > 0) {
    const avgDropPct = Math.round(
      priceDropItems.reduce(
        (s, p) => s + ((p.originalPrice - p.price) / p.originalPrice) * 100,
        0
      ) / priceDropItems.length
    );
    const names = priceDropItems
      .slice(0, 2)
      .map((p) => (p.name || "").split(" ").slice(0, 3).join(" "))
      .join(" · ");
    insights.push({
      id: "price_drop",
      type: "price_drop",
      title: "Wishlist price drops",
      value: `${priceDropItems.length} item${priceDropItems.length !== 1 ? "s" : ""} dropped`,
      subtext: names || "Check your wishlist",
      delta: -avgDropPct,
      deltaLabel: "avg drop",
      cta: { label: "See wishlist deals", href: "/wishlist" },
      icon: "tag",
      accentColor: "red",
    });
  }

  if (thisMonthSpent > 0) {
    const delta =
      lastMonthSpent > 0
        ? Math.round(((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100)
        : null;
    insights.push({
      id: "spending_trend",
      type: "spending_trend",
      title: "This month's spending",
      value: `₹${Math.round(thisMonthSpent).toLocaleString("en-IN")}`,
      subtext:
        delta !== null
          ? `${delta >= 0 ? "+" : ""}${delta}% vs ₹${Math.round(lastMonthSpent).toLocaleString("en-IN")} last month`
          : `${thisMonthOrders.length} order${thisMonthOrders.length !== 1 ? "s" : ""} this month`,
      delta,
      deltaLabel: "vs last month",
      cta: { label: "Review spending", href: "/orders" },
      icon: "bar_chart",
      accentColor: delta !== null && delta > 0 ? "blue" : "green",
    });
  }

  if (orders.length > 0) {
    insights.push({
      id: "total_orders",
      type: "total_orders",
      title: "Total orders placed",
      value: `${orders.length} order${orders.length !== 1 ? "s" : ""}`,
      subtext: `${allOrderItems.length} item${allOrderItems.length !== 1 ? "s" : ""} purchased overall`,
      delta: null,
      deltaLabel: null,
      cta: { label: "View all orders", href: "/orders" },
      icon: "refresh",
      accentColor: "orange",
    });
  }

  return insights;
}
