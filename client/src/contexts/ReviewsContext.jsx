import React, { createContext, useContext, useState } from "react";

const ReviewsContext = createContext(null);

const KEY = "amz_my_reviews";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function ReviewsProvider({ children }) {
  const [myReviews, setMyReviews] = useState(load);

  const saveReview = (review) => {
    setMyReviews((prev) => {
      // replace if already reviewed this product, otherwise prepend
      const filtered = prev.filter((r) => r.productId !== review.productId);
      const next = [review, ...filtered];
      save(next);
      return next;
    });
  };

  const clearReview = (productId) => {
    setMyReviews((prev) => {
      const next = prev.filter((r) => r.productId !== productId);
      save(next);
      return next;
    });
  };

  const hasReviewed = (productId) => myReviews.some((r) => r.productId === productId);

  // Returns blended rating if user has reviewed, null otherwise
  const getAdjustedRating = (productId, origRating, origCount) => {
    const review = myReviews.find((r) => r.productId === productId);
    if (!review) return null;
    const count = Math.max(1, origCount || 1);
    return {
      rating: parseFloat(((origRating * count + review.rating) / (count + 1)).toFixed(1)),
      count: count + 1,
    };
  };

  return (
    <ReviewsContext.Provider value={{ myReviews, saveReview, clearReview, hasReviewed, getAdjustedRating }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export const useReviews = () => useContext(ReviewsContext);
