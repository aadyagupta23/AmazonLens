import React, { useState, useRef, useEffect } from "react";
import { useWitness } from "../contexts/WitnessContext.jsx";
import {
  Radio, Send, CheckCircle, XCircle, MessageCircle, ChevronDown, ChevronUp, Maximize2, Minimize2, LogOut,
} from "lucide-react";

const QUICK_REPLIES = ["Yes, absolutely!", "In my experience, yes.", "Hmm, it depends.", "I'd say no, actually."];

export default function WitnessToast() {
  const { witnessInfo, incomingRequest, activeRoom, chatMessages, acceptChat, declineChat, sendMessage, endChat, goOffline } = useWitness();
  const [input, setInput] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (activeRoom) setChatOpen(true); }, [activeRoom]);
  useEffect(() => { if (incomingRequest) setChatOpen(true); }, [incomingRequest]);
  useEffect(() => {
    if (chatOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);
  useEffect(() => {
    if (activeRoom && chatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [activeRoom, chatOpen]);

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    sendMessage(msg);
  };

  if (!witnessInfo) return null;

  // ── Incoming request ──────────────────────────────────────────────────────
  if (incomingRequest) {
    return (
      <div className="fixed top-20 right-4 z-[9998] w-80 bg-white rounded-2xl shadow-2xl border-2 border-[#FF9900] overflow-hidden">
        <div className="bg-[#FF9900] px-4 py-3 flex items-center gap-2">
          <MessageCircle size={16} className="text-[#131921]" />
          <span className="text-[#131921] font-bold text-sm">Someone wants to chat!</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-[#0F1111] mb-1">
            <strong>{incomingRequest.buyerName}</strong> is asking about your{" "}
            <span className="text-[#007185]">{witnessInfo.productName?.slice(0, 40)}</span>
          </p>
          <p className="text-xs text-[#565959] mb-4">They want your honest take as an owner.</p>
          <div className="flex gap-2">
            <button
              onClick={declineChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 rounded-full text-sm text-[#565959] hover:border-gray-400 transition-colors"
            >
              <XCircle size={14} /> Decline
            </button>
            <button
              onClick={acceptChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#131921] text-white rounded-full text-sm font-bold hover:bg-[#232F3E] transition-colors"
            >
              <CheckCircle size={14} /> Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active chat ───────────────────────────────────────────────────────────
  if (activeRoom) {
    const containerCls = expanded
      ? "fixed left-4 top-20 bottom-4 z-[9998] bg-white rounded-2xl shadow-2xl border border-green-300 flex flex-col"
      : "fixed top-20 right-4 z-[9998] w-80 bg-white rounded-2xl shadow-2xl border border-green-300 overflow-hidden flex flex-col";
    const expandedWidth = "42vw";
    const msgHeight = expanded ? undefined : 220;

    return (
      <div className={containerCls} style={expanded ? { width: expandedWidth } : { maxHeight: 420 }}>
        <div className="flex items-center justify-between px-4 py-3 bg-[#131921] text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-bold">Live Chat</span>
            <span className="text-xs text-gray-400">· {activeRoom.buyerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 hover:text-white p-1" title={expanded ? "Minimise" : "Expand"}>
              {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button onClick={() => setChatOpen((o) => !o)} className="text-gray-400 hover:text-white p-1">
              {chatOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button
              onClick={endChat}
              className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-0.5 rounded-full ml-1"
            >
              End
            </button>
          </div>
        </div>

        {chatOpen && (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={msgHeight ? { maxHeight: msgHeight } : {}}>
              {chatMessages.map((msg, i) => {
                if (msg.from === "system") return <div key={i} className="text-center text-[10px] text-[#999]">{msg.text}</div>;
                const isWitness = msg.from === "witness";
                return (
                  <div key={i} className={`flex ${isWitness ? "justify-end" : "justify-start"}`}>
                    {!isWitness && (
                      <div className="w-6 h-6 rounded-full bg-[#007185] flex items-center justify-center text-white text-[9px] font-bold mr-1.5 flex-shrink-0 mt-0.5">S</div>
                    )}
                    <div className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${
                      isWitness ? "bg-[#131921] text-white rounded-br-sm" : "bg-gray-100 text-[#0F1111] rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="px-3 pb-1.5 flex flex-wrap gap-1">
              {QUICK_REPLIES.map((q) => (
                <button key={q} onClick={() => handleSend(q)} className="text-[10px] bg-gray-50 border border-gray-200 text-[#565959] hover:border-[#FF9900] hover:text-[#C45500] px-2 py-0.5 rounded-full transition-colors">
                  {q}
                </button>
              ))}
            </div>

            <div className="px-3 pb-3">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Share your experience..."
                  className="flex-1 bg-transparent text-xs text-[#0F1111] outline-none placeholder-gray-400"
                />
                <button onClick={() => handleSend()} disabled={!input.trim()} className="text-[#131921] hover:text-[#FF9900] disabled:text-gray-300 transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Online / waiting pill ─────────────────────────────────────────────────
  return (
    <div className="fixed top-20 right-4 z-[9998] bg-white border border-green-300 rounded-2xl shadow-md px-4 py-3 flex items-center gap-3">
      <Radio size={13} className="text-green-600 animate-pulse flex-shrink-0" />
      <div>
        <p className="text-xs font-bold text-[#0F1111] leading-tight">Witness Live · {witnessInfo.name}</p>
        <p className="text-[10px] text-[#565959] leading-tight">Waiting for shoppers…</p>
      </div>
      <button
        onClick={goOffline}
        className="flex items-center gap-1 text-[11px] text-[#CC0C39] border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-full transition-colors ml-1 font-medium flex-shrink-0"
      >
        <LogOut size={11} /> End Witness
      </button>
    </div>
  );
}
