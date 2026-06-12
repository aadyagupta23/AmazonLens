import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Sign-in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center bg-white py-8 px-4">
      {/* Amazon logo */}
      <Link to="/" className="mb-6">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[#0F1111] font-bold text-3xl" style={{ fontFamily: "Arial Black, sans-serif" }}>amazon</span>
          <span className="text-[#FF9900] text-xs font-bold self-end -mt-1">.in</span>
        </div>
      </Link>

      <div className="w-full max-w-[350px] border border-gray-300 rounded-lg px-6 py-5">
        <h1 className="text-[#0F1111] text-2xl font-medium mb-4">Sign in</h1>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3 text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-[#0F1111] mb-1">Email or mobile phone number</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-[#0F1111]">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565959]"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2 rounded-lg text-sm font-medium disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div className="mt-3">
          <p className="text-[10px] text-[#565959]">
            By continuing, you agree to Amazon's{" "}
            <a href="#" className="text-[#007185] hover:underline">Conditions of Use</a> and{" "}
            <a href="#" className="text-[#007185] hover:underline">Privacy Notice</a>.
          </p>
        </div>

        <div className="mt-3">
          <Link
            to="/forgot-password"
            className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-[350px] flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-[#767676]">New to Amazon?</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <div className="w-full max-w-[350px]">
        <Link
          to="/signup"
          className="block w-full btn-secondary py-2 rounded-lg text-sm font-medium text-center"
        >
          Create your Amazon account
        </Link>
      </div>
    </div>
  );
}
