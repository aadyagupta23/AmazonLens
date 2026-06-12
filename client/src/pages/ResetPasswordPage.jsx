import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../utils/format.js";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-[350px] border border-gray-300 rounded-lg px-6 py-5 text-center">
          <AlertCircle size={40} className="text-[#CC0C39] mx-auto mb-3" />
          <h2 className="text-lg font-medium text-[#0F1111] mb-2">Invalid reset link</h2>
          <p className="text-sm text-[#565959] mb-4">This link is missing a token. Request a new one.</p>
          <Link to="/forgot-password" className="text-[#007185] hover:underline text-sm">Request new link →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center bg-white py-8 px-4">
      <Link to="/" className="mb-6">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[#0F1111] font-bold text-3xl" style={{ fontFamily: "Arial Black, sans-serif" }}>amazon</span>
          <span className="text-[#FF9900] text-xs font-bold self-end -mt-1">.in</span>
        </div>
      </Link>

      <div className="w-full max-w-[350px] border border-gray-300 rounded-lg px-6 py-5">
        <h1 className="text-[#0F1111] text-xl font-medium mb-4">Create new password</h1>

        {done ? (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded px-3 py-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Password reset!</p>
              <p className="text-xs text-green-700 mt-0.5">Redirecting to sign in...</p>
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
                <label className="block text-sm font-bold text-[#0F1111] mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)] pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565959]">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F1111] mb-1">Re-enter new password</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2 rounded-lg text-sm font-medium disabled:opacity-70"
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
