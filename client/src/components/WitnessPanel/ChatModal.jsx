import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader, Radio, AlertCircle } from "lucide-react";
import axios from "axios";
import { API } from "../../utils/format.js";
import { getSocket } from "../../utils/socket.js";

const QUICK_QUESTIONS = [
  "Is the picture quality good?",
  "Any issues after long-term use?",
  "How's the sound?",
  "Worth the price?",
];

export default function ChatModal({ witness, product, onClose }) {
  const isLive = !!witness.isLive;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: isLive
        ? `Hi! I'm ${witness.name} from ${witness.city}. Connecting you now...`
        : `Hi! I'm ${witness.name} from ${witness.city}. I've had this ${product.name.split(" ").slice(0, 4).join(" ")} for ${witness.monthsOwned} months now. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState(isLive ? "connecting" : "ai"); // connecting | waiting | active | declined | timeout | ai
  const [roomId] = useState(() => `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLive) {
      inputRef.current?.focus();
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // Initiate live chat request
    socket.emit("chat:start", {
      productId: product.id,
      witnessSocketId: witness.socketId,
      roomId,
      buyerName: "A shopper",
    });
    setLiveStatus("waiting");
    setMessages([{
      role: "assistant",
      content: `Connecting to ${witness.name}... They'll get a notification now.`,
    }]);

    socket.on("chat:accepted", ({ roomId: rid }) => {
      if (rid !== roomId) return;
      setLiveStatus("active");
      setMessages([{
        role: "assistant",
        content: `${witness.name} accepted! Ask them anything — they're typing live.`,
      }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    });

    socket.on("chat:declined", ({ roomId: rid }) => {
      if (rid !== roomId) return;
      setLiveStatus("declined");
      setMessages([{
        role: "assistant",
        content: `${witness.name} isn't available right now. Switching to AI simulation instead — same persona, based on their real ownership data.`,
      }]);
      setTimeout(() => setLiveStatus("ai"), 2000);
    });

    socket.on("chat:timeout", ({ roomId: rid }) => {
      if (rid !== roomId) return;
      setLiveStatus("timeout");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `${witness.name} didn't respond. Switching to AI simulation.` },
      ]);
      setTimeout(() => setLiveStatus("ai"), 2000);
    });

    socket.on("chat:message", ({ roomId: rid, text, from }) => {
      if (rid !== roomId || from !== "witness") return;
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    });

    socket.on("chat:ended", ({ roomId: rid }) => {
      if (rid !== roomId) return;
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `${witness.name} ended the chat.` },
      ]);
      setLiveStatus("ended");
    });

    return () => {
      socket.off("chat:accepted");
      socket.off("chat:declined");
      socket.off("chat:timeout");
      socket.off("chat:message");
      socket.off("chat:ended");
    };
  }, [isLive]);

  const handleClose = () => {
    if (isLive && (liveStatus === "active" || liveStatus === "waiting")) {
      socketRef.current?.emit("chat:end", { roomId });
    }
    onClose();
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    // Live socket path
    if (liveStatus === "active") {
      socketRef.current.emit("chat:message", { roomId, text: userMsg });
      return;
    }

    // AI HTTP path
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
      const { data } = await axios.post(`${API}/api/witness/chat`, {
        productId: product.id,
        witnessId: witness.id || `live_${witness.socketId}`,
        message: userMsg,
        history,
        witnessContext: isLive ? {
          name: witness.name,
          city: witness.city,
          monthsOwned: witness.monthsOwned,
          wouldBuyAgain: witness.wouldBuyAgain,
        } : null,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Having a bit of trouble — try again in a moment!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const canSend = liveStatus === "active" || liveStatus === "ai";
  const isConnecting = liveStatus === "connecting" || liveStatus === "waiting";

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white font-bold text-sm">
                {witness.avatar}
              </div>
              {liveStatus === "active" && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-[#0F1111] text-sm">{witness.name}</h3>
              <div className="flex items-center gap-1.5">
                {liveStatus === "active" && (
                  <>
                    <Radio size={10} className="text-green-600 animate-pulse" />
                    <p className="text-xs text-green-600 font-medium">Live</p>
                  </>
                )}
                {isConnecting && (
                  <>
                    <Loader size={10} className="animate-spin text-[#007185]" />
                    <p className="text-xs text-[#007185]">Connecting...</p>
                  </>
                )}
                {(liveStatus === "ai" || !isLive) && (
                  <p className="text-xs text-[#565959]">{witness.monthsOwned} months owned · {witness.city}</p>
                )}
                {liveStatus === "ended" && (
                  <>
                    <AlertCircle size={10} className="text-[#999]" />
                    <p className="text-xs text-[#999]">Chat ended</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, i) => {
            if (msg.role === "system") {
              return (
                <div key={i} className="text-center text-xs text-[#999] py-1">{msg.content}</div>
              );
            }
            return (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-1">
                    {witness.avatar}
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#131921] text-white rounded-br-sm"
                    : "bg-gray-100 text-[#0F1111] rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white text-[10px] font-bold">
                {witness.avatar}
              </div>
              <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                <Loader size={14} className="animate-spin" />
                <span className="text-sm text-[#565959]">Typing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions — only when AI and just opened */}
        {(liveStatus === "ai" || !isLive) && messages.length <= 2 && (
          <div className="px-5 pb-2">
            <p className="text-xs text-[#565959] mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-blue-50 border border-blue-200 text-[#007185] hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
            canSend ? "bg-gray-50 border-gray-200" : "bg-gray-100 border-gray-100"
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                isConnecting
                  ? "Waiting for witness to accept..."
                  : `Ask ${witness.name.split(" ")[0]}...`
              }
              disabled={!canSend}
              className="flex-1 bg-transparent text-sm text-[#0F1111] outline-none placeholder-gray-400 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || !canSend || loading}
              className="text-[#131921] hover:text-[#FF9900] disabled:text-gray-300 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
