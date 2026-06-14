import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getSocket } from "../utils/socket.js";

const WitnessContext = createContext(null);
const STORAGE_KEY = "al_witness_session";

export function WitnessProvider({ children }) {
  const [witnessInfo, setWitnessInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
  });
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);    // { roomId, buyerName }
  const [chatMessages, setChatMessages] = useState([]);

  // Refs so socket callbacks always see latest values without re-registering
  const activeRoomRef = useRef(null);
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("chat:request", ({ roomId, buyerName, productId }) => {
      setIncomingRequest({ roomId, buyerName, productId });
    });

    socket.on("chat:message", ({ roomId, text, from }) => {
      if (from === "buyer" && activeRoomRef.current?.roomId === roomId) {
        setChatMessages((prev) => [...prev, { from: "buyer", text }]);
      }
    });

    socket.on("chat:ended", ({ roomId }) => {
      if (activeRoomRef.current?.roomId === roomId) {
        setChatMessages((prev) => [
          ...prev,
          { from: "system", text: "The shopper ended the chat. Thanks for helping!" },
        ]);
        setTimeout(() => {
          setActiveRoom(null);
          setChatMessages([]);
        }, 3000);
      }
    });

    return () => {
      socket.off("chat:request");
      socket.off("chat:message");
      socket.off("chat:ended");
    };
  }, []);

  const goOnline = (info) => {
    const avatar = info.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const session = { ...info, avatar };
    getSocket().emit("witness:online", {
      productId: info.productId,
      productName: info.productName,
      name: info.name,
      city: info.city,
      monthsOwned: info.monthsOwned,
      wouldBuyAgain: info.wouldBuyAgain,
      avatar,
    });
    setWitnessInfo(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const goOffline = () => {
    getSocket().emit("witness:offline");
    setWitnessInfo(null);
    localStorage.removeItem(STORAGE_KEY);
    setIncomingRequest(null);
    setActiveRoom(null);
    setChatMessages([]);
  };

  const acceptChat = () => {
    if (!incomingRequest) return;
    getSocket().emit("chat:accept", { roomId: incomingRequest.roomId });
    setActiveRoom({ roomId: incomingRequest.roomId, buyerName: incomingRequest.buyerName });
    setChatMessages([
      { from: "system", text: `Connected with ${incomingRequest.buyerName}. Share your honest experience!` },
    ]);
    setIncomingRequest(null);
  };

  const declineChat = () => {
    if (!incomingRequest) return;
    getSocket().emit("chat:decline", { roomId: incomingRequest.roomId });
    setIncomingRequest(null);
  };

  const sendMessage = (text) => {
    if (!activeRoom || !text.trim()) return;
    getSocket().emit("chat:message", { roomId: activeRoom.roomId, text });
    setChatMessages((prev) => [...prev, { from: "witness", text }]);
  };

  const endChat = () => {
    if (!activeRoom) return;
    getSocket().emit("chat:end", { roomId: activeRoom.roomId });
    setActiveRoom(null);
    setChatMessages([]);
  };

  return (
    <WitnessContext.Provider
      value={{
        witnessInfo,
        incomingRequest,
        activeRoom,
        chatMessages,
        goOnline,
        goOffline,
        acceptChat,
        declineChat,
        sendMessage,
        endChat,
      }}
    >
      {children}
    </WitnessContext.Provider>
  );
}

export const useWitness = () => useContext(WitnessContext);
