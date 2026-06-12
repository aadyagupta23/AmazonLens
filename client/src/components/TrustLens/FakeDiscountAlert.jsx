import React from "react";
import { AlertTriangle } from "lucide-react";

export default function FakeDiscountAlert({ note }) {
  return (
    <div className="bg-[#CC0C39] text-white px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-sm">TrustLens: Fake Discount Detected</p>
        <p className="text-sm text-red-100 mt-0.5">
          {note || "This price has been 'discounted' for most of the last 12 months."}
        </p>
      </div>
    </div>
  );
}
