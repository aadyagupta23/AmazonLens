import React, { useState } from "react";
import { MessageCircle, ThumbsUp, ThumbsDown, Users } from "lucide-react";
import ChatModal from "./ChatModal.jsx";

export default function WitnessPanel({ witnesses, product }) {
  const [activeWitness, setActiveWitness] = useState(null);

  if (!witnesses || witnesses.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-[#131921]" />
        <div>
          <h2 className="font-bold text-[#0F1111] text-base">WitnessPanel™</h2>
          <p className="text-xs text-[#565959]">Chat with real verified owners — powered by AI personas</p>
        </div>
      </div>

      {/* Witness cards */}
      <div className="grid grid-cols-1 gap-3">
        {witnesses.map((witness) => (
          <div
            key={witness.id}
            className="border border-gray-200 rounded-xl p-4 hover:border-[#007185] hover:shadow-sm transition-all bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {witness.avatar}
                </div>

                {/* Info */}
                <div>
                  <h4 className="font-bold text-[#0F1111] text-sm">{witness.name}</h4>
                  <p className="text-xs text-[#565959]">{witness.tagline}</p>
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
                className="flex items-center gap-1.5 bg-[#131921] hover:bg-[#232F3E] text-white text-xs font-medium px-3 py-2 rounded-full flex-shrink-0 transition-colors"
              >
                <MessageCircle size={13} />
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#999] mt-3 text-center">
        Witness responses are AI-generated based on verified purchase patterns. For illustrative purposes.
      </p>

      {/* Chat Modal */}
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
