// In-memory witness presence and chat room state (demo — no DB needed)

// productId → Map(socketId → witnessInfo)
const liveWitnesses = new Map();

// roomId → { productId, buyerSocketId, witnessSocketId, status, messages: [{from, text, at}] }
export const chatRooms = new Map();

export function appendRoomMessage(roomId, from, text) {
  const room = chatRooms.get(roomId);
  if (!room) return;
  if (!room.messages) room.messages = [];
  room.messages.push({ from, text, at: Date.now() });
  if (room.messages.length > 50) room.messages = room.messages.slice(-50);
}

export function getProductWitnesses(productId) {
  const m = liveWitnesses.get(productId);
  return m ? Array.from(m.values()) : [];
}

export function registerWitness(socketId, productId, info) {
  if (!liveWitnesses.has(productId)) liveWitnesses.set(productId, new Map());
  liveWitnesses.get(productId).set(socketId, { ...info, socketId });
}

export function unregisterWitness(socketId) {
  for (const [productId, witnesses] of liveWitnesses) {
    if (witnesses.has(socketId)) {
      witnesses.delete(socketId);
      if (!witnesses.size) liveWitnesses.delete(productId);
      return productId;
    }
  }
  return null;
}
