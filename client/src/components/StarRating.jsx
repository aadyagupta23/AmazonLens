import React from "react";

export default function StarRating({ rating, count, size = "sm" }) {
  const stars = [1, 2, 3, 4, 5];
  const sz = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${sz}`}>
        {stars.map((s) => {
          const fill = rating >= s ? 1 : rating >= s - 0.5 ? 0.5 : 0;
          return (
            <span key={s} className="relative inline-block text-[#DDD]">
              ★
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden text-[#FF9900]"
                  style={{ width: `${fill * 100}%` }}
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-[#007185] hover:text-[#C7511F] text-xs cursor-pointer hover:underline">
          {count.toLocaleString("en-IN")}
        </span>
      )}
    </div>
  );
}
