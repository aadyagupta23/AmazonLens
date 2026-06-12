import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = Router();

// In-memory store (replace with MongoDB in production)
const users = [];
const resetTokens = new Map();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";
const signToken = (user) => jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
  if (users.find((u) => u.email === email)) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = { id: crypto.randomUUID(), name, email, password: hashed };
  users.push(user);

  res.status(201).json({ token: signToken(user), user: { name: user.name, email: user.email } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ token: signToken(user), user: { name: user.name, email: user.email } });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = users.find((u) => u.email === email);

  // Always respond 200 to prevent email enumeration
  if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, { userId: user.id, expires: Date.now() + 3600000 });

  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await getTransporter().sendMail({
        from: `"Amazon Lens" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset your Amazon Lens password",
        html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, ignore this email.</p>`
      });
    } catch (err) {
      console.error("Email send error:", err.message);
    }
  } else {
    console.log("Reset link (no email configured):", resetUrl);
  }

  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const record = resetTokens.get(token);

  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ message: "Reset link expired or invalid" });
  }

  const user = users.find((u) => u.id === record.userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  user.password = await bcrypt.hash(newPassword, 10);
  resetTokens.delete(token);

  res.json({ message: "Password reset successfully" });
});

export default router;
