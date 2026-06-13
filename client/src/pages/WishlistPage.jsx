import React from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../contexts/WishlistContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import { Heart, ShoppingCart, X } from "lucide-react";
import StarRating from "../components/StarRating.jsx";

export default function WishlistPage() {
  const { wishlist, remove } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleMoveToCart = (product) => {
    addToCart(product);
    remove(product.id);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-medium text-[#0F1111] mb-5 flex items-center gap-2">
        <Heart size={22} className="text-[#CC0C39] fill-[#CC0C39]" />
        Wishlist
        {wishlist.length > 0 && (
          <span className="text-sm text-[#565959] font-normal ml-1">
            ({wishlist.length} {wishlist.length === 1 ? "item" : "items"})
          </span>
        )}
      </h1>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <Heart size={56} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-[#0F1111] mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-[#565959] mb-5">
            Tap the heart icon on any product to save it here.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group"
            >
              {/* Image + remove button */}
              <div className="relative">
                <div
                  className="h-40 flex items-center justify-center p-4 cursor-pointer bg-white"
                  onClick={() => navigate(`/dp/${product.id}`)}
                >
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/200x200/EAEDED/131921?text=${encodeURIComponent(product.brand || "Item")}`;
                    }}
                  />
                </div>
                <button
                  onClick={() => remove(product.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#CC0C39] hover:border-red-200 transition-colors"
                  title="Remove from wishlist"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p
                  className="text-xs text-[#0F1111] line-clamp-2 leading-snug mb-1 cursor-pointer hover:text-[#C7511F]"
                  onClick={() => navigate(`/dp/${product.id}`)}
                >
                  {product.name}
                </p>
                <div className="mb-1">
                  <StarRating rating={product.rating} size="sm" />
                </div>
                <div className="flex items-baseline gap-1 flex-wrap mt-auto mb-2">
                  <span className="text-sm font-bold text-[#0F1111]">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-xs text-[#CC0C39]">-{product.discount}%</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-bold py-1.5 rounded-full flex items-center justify-center gap-1"
                  >
                    <ShoppingCart size={11} /> Add to Cart
                  </button>
                  <button
                    onClick={() => navigate(`/dp/${product.id}`)}
                    className="w-full border border-gray-300 text-[#0F1111] text-xs font-medium py-1.5 rounded-full hover:bg-gray-50"
                  >
                    View product
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
