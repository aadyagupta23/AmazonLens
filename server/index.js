import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import productRoutes from "./routes/products.js";
import witnessRoutes from "./routes/witness.js";
import senseRoutes from "./routes/sense.js";
import authRoutes from "./routes/auth.js";
import smartSearch from "./routes/smartSearch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use('/api/smart-search', smartSearch);
app.use("/api/witness", witnessRoutes);
app.use("/api/sense", senseRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/amazon-lens")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection failed:", err.message));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
