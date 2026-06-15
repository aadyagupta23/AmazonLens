import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";

const USERS_KEY = "al_users";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Please enter your email address."); return; }

    // Store email in sessionStorage so ResetPasswordPage can use it (mock flow)
    sessionStorage.setItem("reset_email", trimmed);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-[#0F1111] mb-2">Check your inbox</h2>
          <p className="text-sm text-[#565959] mb-1">
            We've sent a password reset link to
          </p>
          <p className="text-sm font-semibold text-[#0F1111] mb-6">{email}</p>
          <button
            onClick={() => navigate("/reset-password")}
            className="w-full flex items-center justify-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-2.5 rounded-full text-sm mb-4"
          >
            Continue to Reset Password <ArrowRight size={14} />
          </button>
          <Link to="/login" className="text-xs text-[#007185] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-[#0F1111] mb-1">Forgot your password?</h1>
        <p className="text-xs text-[#565959] mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#565959] mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF9900]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-2.5 rounded-full text-sm mt-2"
          >
            Send reset link
          </button>
        </form>

        <p className="text-xs text-center text-[#565959] mt-4">
          Remember it?{" "}
          <Link to="/login" className="text-[#007185] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
