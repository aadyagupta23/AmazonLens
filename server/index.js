import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import productRoutes from "./routes/products.js";
import witnessRoutes from "./routes/witness.js";
import senseRoutes from "./routes/sense.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/witness", witnessRoutes);
app.use("/api/sense", senseRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// MongoDB (optional - falls back to mock data if not configured)
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB skipped:", err.message));
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
