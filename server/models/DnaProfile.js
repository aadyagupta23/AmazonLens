import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["view", "cart_add", "purchase", "return"],
      required: true,
    },
    productId:  { type: String, required: true },
    category:   { type: String, default: "" },
    brand:      { type: String, default: "" },
    price:      { type: Number, default: 0 },
    sustainable:{ type: Boolean, default: false },
    at:         { type: Date, default: Date.now },
  },
  { _id: false }
);

const brandScoreSchema = new mongoose.Schema(
  { brand: String, score: Number },
  { _id: false }
);

const categoryScoreSchema = new mongoose.Schema(
  { category: String, score: Number },
  { _id: false }
);

const returnPatternSchema = new mongoose.Schema(
  { category: String, returnRate: Number, returnCount: Number, purchaseCount: Number },
  { _id: false }
);

const dnaProfileSchema = new mongoose.Schema(
  {
    // One of these will be set — userId for logged-in, guestId for guests
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: null },

    // Raw event log — capped at 200 entries
    events: { type: [eventSchema], default: [] },

    // Derived profile — recomputed on every event write
    preferredBrands:      { type: [brandScoreSchema],    default: [] },
    preferredCategories:  { type: [categoryScoreSchema], default: [] },
    budgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      avg: { type: Number, default: 0 },
    },
    sustainabilityAffinity: { type: Number, default: 0 }, // 0–1
    returnPatterns:         { type: [returnPatternSchema], default: [] },
    returnedProductIds:     { type: [String], default: [] },
    returnedBrands:         { type: [String], default: [] },
    purchasedProductIds:    { type: [String], default: [] },
  },
  { timestamps: true }
);

// Compound index so lookups are fast
dnaProfileSchema.index({ userId: 1 });
dnaProfileSchema.index({ guestId: 1 });

export default mongoose.model("DnaProfile", dnaProfileSchema);