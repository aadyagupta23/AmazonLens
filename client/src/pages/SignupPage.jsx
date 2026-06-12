import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pwStrength = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
        <h1 className="text-[#0F1111] text-2xl font-medium mb-4">Create account</h1>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3 text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-[#0F1111] mb-1">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="First and last name"
              required
              className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F1111] mb-1">Mobile number or email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F1111] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                required
                className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)] pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565959]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="flex items-center gap-1 mt-1">
                <div className={`h-1 flex-1 rounded ${pwStrength ? "bg-green-500" : "bg-yellow-400"}`} />
                <span className={`text-[10px] ${pwStrength ? "text-green-600" : "text-yellow-600"}`}>
                  {pwStrength ? "Strong" : "Weak"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F1111] mb-1">Re-enter password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                className="w-full border border-[#A6A6A6] rounded px-3 py-2 text-sm text-[#0F1111] outline-none focus:border-[#E77600] focus:shadow-[0_0_0_3px_rgba(231,118,0,0.15)] pr-10"
              />
              {form.confirm && form.password === form.confirm && (
                <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2 rounded-lg text-sm font-medium disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        <p className="text-[10px] text-[#565959] mt-3">
          By creating an account, you agree to Amazon's{" "}
          <a href="#" className="text-[#007185] hover:underline">Conditions of Use</a> and{" "}
          <a href="#" className="text-[#007185] hover:underline">Privacy Notice</a>.
        </p>

        <p className="text-sm text-[#0F1111] mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-[#007185] hover:text-[#C7511F] hover:underline">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
