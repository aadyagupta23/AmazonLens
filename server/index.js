import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import productRoutes from "./routes/products.js";
import witnessRoutes from "./routes/witness.js";
import senseRoutes from "./routes/sense.js";
import authRoutes from "./routes/auth.js";
import dnaRoutes from "./routes/dna.js";
import smartSearch from "./routes/smartSearch.js";
import { default as coPlannerRoutes, setIO as setCoPlannerIO } from "./routes/coPlanner.js";
import customerRoutes from "./routes/customers.js";
import companyRoutes from "./routes/companies.js";
import bundleRoutes from "./routes/bundles.js";
import returnsRoutes from "./routes/returns.js";
import {
  getProductWitnesses,
  registerWitness,
  unregisterWitness,
  chatRooms,
} from "./witnessState.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Allow all origins for local network demo
app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Pass io to co-planner routes for real-time updates
setCoPlannerIO(io);

io.on("connection", (socket) => {
  // ── Co-Planner: join plan room for real-time updates ───────────────────
  socket.on("coplan:join", ({ planId }) => {
    if (planId) socket.join(`coplan:${planId}`);
  });

  socket.on("coplan:leave", ({ planId }) => {
    if (planId) socket.leave(`coplan:${planId}`);
  });

  // ── Witness goes online for a product ──────────────────────────────────
  socket.on("witness:online", ({ productId, ...info }) => {
    registerWitness(socket.id, productId, info);
    socket.join(`product:${productId}`);
    io.to(`product:${productId}`).emit("witnesses:updated", getProductWitnesses(productId));
    console.log(`Witness online: ${info.name} for ${productId}`);
  });

  // ── Witness goes offline ────────────────────────────────────────────────
  socket.on("witness:offline", () => {
    const productId = unregisterWitness(socket.id);
    if (productId) {
      io.to(`product:${productId}`).emit("witnesses:updated", getProductWitnesses(productId));
    }
  });

  // ── Buyer subscribes to live witness list for a product ────────────────
  socket.on("witnesses:subscribe", ({ productId }) => {
    socket.join(`product:${productId}`);
    socket.emit("witnesses:list", getProductWitnesses(productId));
  });

  // ── Buyer requests chat with a specific live witness ───────────────────
  socket.on("chat:start", ({ productId, witnessSocketId, roomId, buyerName }) => {
    const witnesses = getProductWitnesses(productId);
    const witness = witnesses.find((w) => w.socketId === witnessSocketId);
    if (!witness) {
      socket.emit("chat:witness-offline");
      return;
    }
    chatRooms.set(roomId, {
      productId,
      buyerSocketId: socket.id,
      witnessSocketId,
      status: "pending",
    });
    socket.join(roomId);
    io.to(witnessSocketId).emit("chat:request", {
      roomId,
      buyerName: buyerName || "A shopper",
      productId,
    });
    // 30s timeout if witness doesn't respond
    setTimeout(() => {
      const room = chatRooms.get(roomId);
      if (room && room.status === "pending") {
        chatRooms.delete(roomId);
        socket.emit("chat:timeout", { roomId });
      }
    }, 30000);
  });

  // ── Witness accepts chat ────────────────────────────────────────────────
  socket.on("chat:accept", ({ roomId }) => {
    const room = chatRooms.get(roomId);
    if (!room || room.witnessSocketId !== socket.id) return;
    room.status = "active";
    socket.join(roomId);
    io.to(roomId).emit("chat:accepted", { roomId });
  });

  // ── Witness declines chat ───────────────────────────────────────────────
  socket.on("chat:decline", ({ roomId }) => {
    const room = chatRooms.get(roomId);
    if (!room) return;
    chatRooms.delete(roomId);
    io.to(room.buyerSocketId).emit("chat:declined", { roomId });
  });

  // ── Message in an active room ───────────────────────────────────────────
  socket.on("chat:message", ({ roomId, text }) => {
    const room = chatRooms.get(roomId);
    if (!room || room.status !== "active") return;
    const from = socket.id === room.buyerSocketId ? "buyer" : "witness";
    io.to(roomId).emit("chat:message", { roomId, text, from });
  });

  // ── Either side ends chat ───────────────────────────────────────────────
  socket.on("chat:end", ({ roomId }) => {
    const room = chatRooms.get(roomId);
    if (room) {
      io.to(roomId).emit("chat:ended", { roomId });
      chatRooms.delete(roomId);
    }
  });

  // ── Cleanup on disconnect ───────────────────────────────────────────────
  socket.on("disconnect", () => {
    const productId = unregisterWitness(socket.id);
    if (productId) {
      io.to(`product:${productId}`).emit("witnesses:updated", getProductWitnesses(productId));
    }
    for (const [roomId, room] of chatRooms) {
      if (room.buyerSocketId === socket.id || room.witnessSocketId === socket.id) {
        io.to(roomId).emit("chat:ended", { roomId });
        chatRooms.delete(roomId);
      }
    }
  });
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/smart-search", smartSearch);
app.use("/api/witness", witnessRoutes);
app.use("/api/sense", senseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/co-planner", coPlannerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/dna", dnaRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/returns", returnsRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/amazon-lens")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection failed:", err.message));

httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
