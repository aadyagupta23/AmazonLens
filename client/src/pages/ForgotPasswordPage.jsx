import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock } from "lucide-react";

const USERS_KEY = "al_users";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (form.next.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (form.next !== form.confirm) { setError("Passwords do not match."); return; }

    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === form.email.toLowerCase());
    if (idx === -1) { setError("No account found with this email."); return; }
    if (users[idx].password !== form.current) { setError("Current password is incorrect."); return; }

    users[idx].password = form.next;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-[#0F1111] mb-2">Password updated!</h2>
          <p className="text-sm text-[#565959] mb-6">Your password has been changed successfully.</p>
          <Link to="/login" className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-[#0F1111] mb-1">Change password</h1>
        <p className="text-xs text-[#565959] mb-6">Enter your email and current password to set a new one.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "email",   label: "Email address",    type: "email",    placeholder: "you@example.com" },
            { key: "current", label: "Current password", type: "password", placeholder: "••••••••" },
            { key: "next",    label: "New password",     type: "password", placeholder: "Min. 6 characters" },
            { key: "confirm", label: "Confirm new password", type: "password", placeholder: "••••••••" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#565959] mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF9900]"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-2.5 rounded-full text-sm mt-2"
          >
            Update password
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
