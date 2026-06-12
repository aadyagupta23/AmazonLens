import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader } from "lucide-react";
import axios from "axios";
import { API } from "../../utils/format.js";

export default function ChatModal({ witness, product, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm ${witness.name} from ${witness.city}. I've had this ${product.name.split(" ").slice(0, 4).join(" ")} for ${witness.monthsOwned} months now. What would you like to know?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const QUICK_QUESTIONS = [
    "Is the picture quality good?",
    "Any issues after long-term use?",
    "How's the sound?",
    "Worth the price?"
  ];

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await axios.post(`${API}/api/witness/chat`, {
        productId: product.id,
        witnessId: witness.id,
        message: userMsg,
        history
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, having a bit of connection trouble. Try again in a moment!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white font-bold text-sm">
              {witness.avatar}
            </div>
            <div>
              <h3 className="font-bold text-[#0F1111] text-sm">{witness.name}</h3>
              <p className="text-xs text-[#565959]">{witness.tagline}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#131921] to-[#232F3E] flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-1">
                  {witness.avatar}
                </div>
              )}
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#131921] text-white rounded-br-sm"
                    : "bg-gray-100 text-[#0F1111] rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-[#565959]">
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

        {/* Quick questions */}
        {messages.length <= 1 && (
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
          <div className="flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Ask ${witness.name.split(" ")[0]}...`}
              className="flex-1 bg-transparent text-sm text-[#0F1111] outline-none placeholder-gray-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
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
