/**
 * Mock data for the ShoppingInsights section.
 * Shape is stable — swap fetchInsights prop for a live API when ready.
 *
 * Sustainability insights (type: "sustainability_*") are filtered in/out
 * by ShoppingInsights based on whether Sustainability Mode is enabled.
 */

export const INSIGHTS_BASE = [
  {
    id: "money_saved",
    type: "money_saved",
    title: "Saved via price tracking",
    value: "₹4,280",
    subtext: "Across 8 purchases this month",
    delta: +22,
    deltaLabel: "vs last month",
    cta: { label: "View breakdown", href: "/orders" },
    icon: "piggy_bank",
    accentColor: "green",
  },
  {
    id: "price_drop",
    type: "price_drop",
    title: "Wishlist price drops",
    value: "3 items dropped",
    subtext: "boAt Airdopes · Sony headphones · Kindle",
    delta: -18,
    deltaLabel: "avg drop",
    cta: { label: "See wishlist deals", href: "/wishlist" },
    icon: "tag",
    accentColor: "red",
  },
  {
    id: "spending_trend",
    type: "spending_trend",
    title: "Electronics spend up",
    value: "+12% this month",
    subtext: "₹14,200 spent · Budget avg: ₹12,650",
    delta: +12,
    deltaLabel: "vs your average",
    cta: { label: "Review spending", href: "/orders" },
    icon: "bar_chart",
    accentColor: "blue",
  },
  {
    id: "upcoming_purchase",
    type: "upcoming_purchase",
    title: "Predicted reorder",
    value: "Power bank likely needed",
    subtext: "Based on usage pattern · Est. in ~2 weeks",
    delta: null,
    deltaLabel: null,
    cta: { label: "Browse power banks", href: "/s?q=power+bank" },
    icon: "refresh",
    accentColor: "orange",
  },
];

export const INSIGHTS_SUSTAINABILITY = [
  {
    id: "sustainability_score",
    type: "sustainability_score",
    title: "Your sustainability score",
    value: "78/100",
    subtext: "Better than 68% of shoppers",
    delta: null,
    deltaLabel: null,
    cta: { label: "View dashboard", href: "/sustainability" },
    icon: "leaf",
    accentColor: "green",
  },
  {
    id: "sustainability_recyclable",
    type: "sustainability_recyclable",
    title: "Recyclable purchases",
    value: "12 products",
    subtext: "This month · 73% of total",
    delta: null,
    deltaLabel: null,
    cta: { label: "Shop more", href: "/s?q=eco+certified" },
    icon: "leaf",
    accentColor: "green",
  },
];

// Default export — base insights only (sustainability added dynamically)
export const INSIGHTS_MOCK = INSIGHTS_BASE;
