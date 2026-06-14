import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, ThumbsUp, ThumbsDown, Users, Radio } from "lucide-react";
import ChatModal from "./ChatModal.jsx";
import { getSocket } from "../../utils/socket.js";

export default function WitnessPanel({ witnesses = [], product }) {
  const [activeWitness, setActiveWitness] = useState(null);
  const [liveWitnesses, setLiveWitnesses] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("witnesses:subscribe", { productId: product.id });

    socket.on("witnesses:list", (list) => setLiveWitnesses(list));
    socket.on("witnesses:updated", (list) => setLiveWitnesses(list));

    return () => {
      socket.off("witnesses:list");
      socket.off("witnesses:updated");
    };
  }, [product.id]);

  const allWitnesses = [
    ...liveWitnesses.map((w) => ({ ...w, isLive: true })),
    ...witnesses.map((w) => ({ ...w, isLive: false })),
  ];

  if (allWitnesses.length === 0) return null;

  const liveCount = liveWitnesses.length;

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#131921]" />
          <div>
            <h2 className="font-bold text-[#0F1111] text-base">WitnessPanel™</h2>
            <p className="text-xs text-[#565959]">
              Real owners who bought this product
            </p>
          </div>
        </div>
        {liveCount > 0 && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
            <Radio size={12} className="text-green-600 animate-pulse" />
            <span className="text-xs font-semibold text-green-700">
              {liveCount} live now
            </span>
          </div>
        )}
      </div>

      {/* Witness cards */}
      <div className="grid grid-cols-1 gap-3">
        {allWitnesses.map((witness) => (
          <div
            key={witness.isLive ? `live-${witness.socketId}` : witness.id}
            className={`border rounded-xl p-4 hover:shadow-sm transition-all bg-white ${
              witness.isLive
                ? "border-green-300 hover:border-green-400"
                : "border-gray-200 hover:border-[#007185]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white font-bold text-sm">
                    {witness.avatar}
                  </div>
                  {witness.isLive && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#0F1111] text-sm">{witness.name}</h4>
                    {witness.isLive ? (
                      <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">
                        LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-[#565959] px-1.5 py-0.5 rounded-full">
                        AI simulation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#565959]">
                    {witness.monthsOwned} months owned · Family of {witness.familySize || "—"}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs bg-gray-100 text-[#565959] px-2 py-0.5 rounded-full">
                      📍 {witness.city}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      witness.wouldBuyAgain
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {witness.wouldBuyAgain ? (
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={10} /> Would buy again
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ThumbsDown size={10} /> Would not buy again
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat button */}
              <button
                onClick={() => setActiveWitness(witness)}
                className={`flex items-center gap-1.5 text-white text-xs font-medium px-3 py-2 rounded-full flex-shrink-0 transition-colors ${
                  witness.isLive
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#131921] hover:bg-[#232F3E]"
                }`}
              >
                <MessageCircle size={13} />
                {witness.isLive ? "Chat Live" : "Chat"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {liveCount === 0 && (
        <p className="text-[10px] text-[#999] mt-3 text-center">
          Witness responses are AI-generated. Real owners can go live at{" "}
          <a href="/witness" className="underline text-[#007185]" target="_blank" rel="noopener noreferrer">
            /witness
          </a>
        </p>
      )}

      {activeWitness && (
        <ChatModal
          witness={activeWitness}
          product={product}
          onClose={() => setActiveWitness(null)}
        />
      )}
    </div>
  );
}
