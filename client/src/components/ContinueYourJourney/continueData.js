/**
 * Mock data for "Continue Your Journey" section.
 * Each card represents a detected in-progress shopping goal with
 * suggested completion items.
 *
 * confidence – 0–100, how certain Amazon Sense™ is about this recommendation
 */
export const CONTINUE_MOCK = [
  {
    id: "study_completion",
    title: "Complete your Study Setup",
    reason: "You bought a laptop stand last week. These items are commonly added next.",
    items: [
      { name: "Monitor Arm",       price: 1299 },
      { name: "LED Desk Lamp",     price:  849 },
      { name: "Ergonomic Chair",   price: 3999 },
      { name: "Cable Organiser",   price:  349 },
    ],
    totalBudget: 6496,
    productCount: 4,
    confidence: 87,
    query: "study setup monitor arm desk lamp ergonomic chair",
    tag: "Based on recent purchase",
  },
  {
    id: "hostel_expansion",
    title: "Hostel Essentials — Round 2",
    reason: "Frequently bought together by students who ordered bedding sets.",
    items: [
      { name: "Laundry Basket",    price:  549 },
      { name: "Extension Board",   price:  699 },
      { name: "Power Bank 10000mAh", price: 1299 },
      { name: "Storage Organiser", price:  649 },
    ],
    totalBudget: 3196,
    productCount: 4,
    confidence: 79,
    query: "hostel essentials laundry basket extension board",
    tag: "Customers also bought",
  },
  {
    id: "fitness_upgrade",
    title: "Level Up Your Fitness Kit",
    reason: "You browsed gym gloves and protein shakers in the last 3 days.",
    items: [
      { name: "Protein Shaker",    price:  349 },
      { name: "Resistance Bands",  price:  599 },
      { name: "Gym Gloves",        price:  499 },
      { name: "Foam Roller",       price:  799 },
    ],
    totalBudget: 2246,
    productCount: 4,
    confidence: 82,
    query: "fitness upgrade gym gloves protein shaker bands",
    tag: "Based on browsing history",
  },
];
