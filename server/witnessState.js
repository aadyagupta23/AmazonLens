// In-memory witness presence and chat room state (demo — no DB needed)

// productId → Map(socketId → witnessInfo)
const liveWitnesses = new Map();

// roomId → { productId, buyerSocketId, witnessSocketId, status }
export const chatRooms = new Map();

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
