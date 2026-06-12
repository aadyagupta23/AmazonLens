import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../utils/format.js";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center bg-white py-8 px-4">
      <Link to="/" className="mb-6">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[#0F1111] font-bold text-3xl" style={{ fontFamily: "Arial Black, sans-serif" }}>amazon</span>
          <span className="text-[#FF9900] text-xs font-bold self-end -mt-1">.in</span>
        </div>
      </Link>

      <div className="w-full max-w-[350px] border border-gray-300 rounded-lg px-6 py-5">
        <h1 className="text-[#0F1111] text-xl font-medium mb-1">Password assistance</h1>
        <p className="text-sm text-[#565959] mb-4">
          Enter the email address associated with your Amazon account.
        </p>

        {sent ? (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded px-3 py-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Reset link sent</p>
              <p className="text-xs text-green-700 mt-0.5">
                If that email exists, a password reset link has been sent. Check your inbox.
              </p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3 text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-[#0F1111] mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2 rounded-lg text-sm font-medium disabled:opacity-70"
              >
                {loading ? "Sending..." : "Continue"}
              </button>
            </form>
          </>
        )}

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-[#007185] hover:underline">← Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
