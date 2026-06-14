import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { Leaf, User, Package, Heart, Clock, Star, ChevronRight, Pencil, Check, X } from "lucide-react";
import DnaPanel from "../components/DnaPanel.jsx";

export default function AccountPage() {
  const { user, realUser, logout, updateProfile } = useAuth();
  const { prefs, updatePref, toggleMode } = useSustainability();
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === "#security") {
      setTimeout(() => document.getElementById("security")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [hash]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: user.name, city: user.city || "", phone: user.phone || "" });

  const saveProfile = () => {
    updateProfile({ name: profileDraft.name.trim(), city: profileDraft.city.trim(), phone: profileDraft.phone.trim() });
    setEditingProfile(false);
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium text-[#0F1111] mb-6">Your Account</h1>

      {/* ── PROFILE INFO ── */}
      <div className="bg-white border border-[#DDD] rounded p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#565959]" />
            <h2 className="font-bold text-[#0F1111] text-base">Profile Information</h2>
          </div>
          {!editingProfile ? (
            <button
              onClick={() => { setProfileDraft({ name: user.name, city: user.city || "", phone: user.phone || "" }); setEditingProfile(true); }}
              className="flex items-center gap-1.5 text-sm text-[#007185] hover:underline"
            >
              <Pencil size={13} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={saveProfile} className="flex items-center gap-1 text-xs bg-[#131921] text-white px-3 py-1.5 rounded-full hover:bg-[#232F3E]">
                <Check size={12} /> Save
              </button>
              <button onClick={() => setEditingProfile(false)} className="text-[#999] hover:text-[#CC0C39]">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {!editingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Full name",    value: user.name },
              { label: "City",         value: user.city  || <span className="text-[#CC0C39] text-xs">Not set — required for WitnessPanel</span> },
              { label: "Phone",        value: user.phone || <span className="text-[#999] text-xs">Not set</span> },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[#565959] mb-0.5">{label}</p>
                <p className="text-sm font-medium text-[#0F1111]">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Full name", key: "name",  placeholder: "Your full name" },
              { label: "City",      key: "city",  placeholder: "e.g. Bengaluru" },
              { label: "Phone",     key: "phone", placeholder: "+91 98765 43210" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-[#565959] mb-1">{label}</label>
                <input
                  type="text"
                  value={profileDraft[key]}
                  onChange={(e) => setProfileDraft((d) => ({ ...d, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#007185]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Account links */}
        {[
          { Icon: Package, label: "Your Orders",   sub: "Track, return, or buy again",    href: "/orders"   },
          { Icon: Heart,   label: "Your Wishlist",  sub: "Saved items and wish lists",     href: "/wishlist" },
          { Icon: Clock,   label: "Browsing History", sub: "Recently viewed items",        href: "/history"  },
          { Icon: Star,    label: "Your Reviews",    sub: "Reviews you've written",         href: "/my-reviews" },
          { Icon: User,    label: "Login & Security", sub: "Update password and email",    href: "/account#security"  },
        ].map(({ Icon, label, sub, href }) => (
          <Link
            key={label}
            to={href}
            className="flex items-center gap-4 bg-white border border-[#DDD] rounded p-4 hover:border-[#007185] hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-[#F7F8F8] flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-[#565959] group-hover:text-[#007185]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0F1111] group-hover:text-[#C7511F]">{label}</p>
              <p className="text-xs text-[#565959]">{sub}</p>
            </div>
            <ChevronRight size={14} className="text-[#565959] flex-shrink-0" />
          </Link>
        ))}
      </div>
      {/* ── AMAZON LENS DNA ── */}
    <div className="mb-4">
      <DnaPanel />
    </div>
      {/* ── SUSTAINABILITY PREFERENCES ── */}
      <div className="bg-white border border-[#DDD] rounded p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf size={18} className="text-[#1B5E20]" />
            <h2 className="font-bold text-[#0F1111] text-base">Sustainability Preferences</h2>
          </div>
          {/* Master toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-[#565959]">{prefs.enabled ? "Mode On" : "Mode Off"}</span>
            <div
              onClick={toggleMode}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                prefs.enabled ? "bg-[#1B5E20]" : "bg-[#DDD]"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  prefs.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>

        <p className="text-xs text-[#565959] mb-4">
          When Sustainability Mode is on, eco-friendly signals appear across product pages,
          search results, and your cart.
        </p>

        <div className="space-y-3">
          {[
            { key: "prioritizeEco",       label: "Prioritize Eco-Friendly Products",           sub: "Boost greener alternatives in search and recommendations."       },
            { key: "recyclablePackaging", label: "Prefer Recyclable Packaging",                sub: "Highlight products shipped with minimal or recyclable packaging." },
            { key: "ethicalBrands",       label: "Prefer Ethical Brands",                      sub: "Surface products from brands with fair labour certifications."   },
            { key: "showOnProducts",      label: "Show Sustainability Information on Products", sub: "Display the Sustainability Score panel on product pages."        },
          ].map(({ key, label, sub }) => (
            <label
              key={key}
              className={`flex items-start gap-3 cursor-pointer rounded p-3 border transition-colors ${
                prefs.enabled ? "border-[#C8E6C9] hover:bg-green-50/30" : "border-transparent opacity-50 pointer-events-none"
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-[#1B5E20]"
                checked={!!prefs[key]}
                onChange={(e) => updatePref(key, e.target.checked)}
                disabled={!prefs.enabled}
              />
              <div>
                <p className="text-sm font-medium text-[#0F1111]">{label}</p>
                <p className="text-xs text-[#565959]">{sub}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#DDD]">
          <button
            onClick={() => navigate("/sustainability")}
            className="flex items-center gap-1.5 text-sm text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            <Leaf size={13} />
            View your Sustainability Dashboard →
          </button>
        </div>
      </div>

      {/* ── LOGIN & SECURITY ── */}
      <div id="security" className="bg-white border border-[#DDD] rounded p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-[#565959]" />
          <h2 className="font-bold text-[#0F1111] text-base">Login & Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0]">
            <div>
              <p className="text-sm font-medium text-[#0F1111]">Email address</p>
              <p className="text-xs text-[#565959]">{user.email}</p>
            </div>
            <span className="text-xs text-[#007185]">Managed locally</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0]">
            <div>
              <p className="text-sm font-medium text-[#0F1111]">Password</p>
              <p className="text-xs text-[#565959]">Last updated: account creation</p>
            </div>
            <Link to="/forgot-password" className="text-xs text-[#007185] hover:underline">Change</Link>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[#0F1111]">Mobile number</p>
              <p className="text-xs text-[#565959]">{user.phone || "Not added"}</p>
            </div>
            <button
              onClick={() => { setProfileDraft({ name: user.name, city: user.city || "", phone: user.phone || "" }); setEditingProfile(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-[#007185] hover:underline"
            >
              {user.phone ? "Edit" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Sign out */}
      {realUser && (
        <div className="bg-white border border-[#DDD] rounded p-4">
          <p className="text-sm text-[#0F1111] mb-2">Signed in as <strong>{user.name}</strong> ({user.email})</p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
