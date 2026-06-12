import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Legend
} from "recharts";
import { formatPrice, MONTHS } from "../../utils/format.js";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-bold text-[#131921] mb-1">{label}</p>
        <p className="text-[#007185]">Price: {formatPrice(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function PriceHistory({ priceHistory, currentPrice, spikePriceMonths = [] }) {
  const data = priceHistory.map((price, i) => ({
    month: MONTHS[i % 12],
    price,
    idx: i
  }));

  const minPrice = Math.min(...priceHistory);
  const maxPrice = Math.max(...priceHistory);
  const yMin = Math.floor(minPrice * 0.9 / 1000) * 1000;
  const yMax = Math.ceil(maxPrice * 1.05 / 1000) * 1000;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-[#0F1111] text-sm">12-Month Price History</h3>
        <div className="flex items-center gap-3 text-xs text-[#565959]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-[#007185]"></span> Actual price
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-px border-t-2 border-dashed border-[#CC0C39]"></span> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-[#CC0C39] opacity-20"></span> Spike months
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#565959" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 11, fill: "#565959" }}
            tickLine={false}
            axisLine={false}
            domain={[yMin, yMax]}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Spike price month highlights */}
          {spikePriceMonths.map((idx) => (
            <ReferenceArea
              key={idx}
              x1={MONTHS[idx % 12]}
              x2={MONTHS[idx % 12]}
              fill="#CC0C39"
              fillOpacity={0.12}
            />
          ))}

          {/* Current price dashed line */}
          <ReferenceLine
            y={currentPrice}
            stroke="#CC0C39"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: "Current", position: "insideTopRight", fontSize: 10, fill: "#CC0C39" }}
          />

          <Line
            type="monotone"
            dataKey="price"
            stroke="#007185"
            strokeWidth={2}
            dot={{ r: 3, fill: "#007185", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#007185" }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-xs text-red-700">
        <strong>TrustLens:</strong> Red zones show months when the listed "M.R.P." was inflated.
        The product spent {spikePriceMonths.length} of the last 12 months at an inflated price before being "discounted."
      </div>
    </div>
  );
}
