export const CONTINUE_MOCK = [
  {
    id: "study_completion",
    title: "Complete your Study Setup",
    reason:
      "You bought a laptop stand last week. These items are commonly added next.",
    items: [
      { productId: "p023" },
      { productId: "p019" },
      { productId: "p017" },
      { productId: "p020" },
      { productId: "p022" },
    ],
    confidence: 87,
    query: "study setup",
    tag: "Based on recent purchase",
  },

  {
    id: "hostel_expansion",
    title: "Hostel Essentials — Round 2",
    reason:
      "Frequently bought together by students who ordered bedding sets.",
    items: [
      { productId: "p031" },
      { productId: "p032" },
      { productId: "p033" },
      { productId: "p015" },
    ],
    confidence: 79,
    query: "hostel essentials",
    tag: "Customers also bought",
  },

  {
    id: "fitness_upgrade",
    title: "Level Up Your Fitness Kit",
    reason:
      "You browsed gym accessories in the last 3 days.",
    items: [
      { productId: "p024" },
      { productId: "p025" },
      { productId: "p026" },
      { productId: "p027" },
    ],
    confidence: 82,
    query: "fitness kit",
    tag: "Based on browsing history",
  },
];