import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users, Plus, ShoppingCart, Wallet, UserCheck, Package,
  Trash2, Share2, CheckCircle2, AlertTriangle, Link2,
  Calendar, Crown, ChevronDown, ChevronUp, Copy, X, Loader2,
  Clock, Target, BarChart3, MessageSquare, ThumbsUp,
  ArrowRight, Shield, Bell, Activity, Archive, LogOut,
  CircleDot, Sparkles, UserPlus, QrCode, ExternalLink, Search, ThumbsDown,
  GripVertical
} from "lucide-react";
import { useCoPlanner } from "../contexts/CoPlannerContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { API, formatPrice } from "../utils/format.js";

const fmt = (n) => formatPrice(n);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  need_to_buy: { label: "Need to Buy", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
  assigned: { label: "Assigned", color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  purchased: { label: "Purchased", color: "bg-green-50 text-green-700", dot: "bg-green-500" },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "text-red-700 bg-red-50 border-red-200" },
  important: { label: "Important", color: "text-amber-700 bg-amber-50 border-amber-200" },
  optional: { label: "Optional", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

// ─── InviteModal ──────────────────────────────────────────────────────────────
function InviteModal({ planId, onClose }) {
  const [invite, setInvite] = useState(null);
  const [expiration, setExpiration] = useState("never");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiration }),
      });
      const data = await res.json();
      setInvite(data.invite);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generateInvite(); }, []);

  const inviteUrl = invite ? `${window.location.origin}/co-planner?join=${invite.token}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#0F1111] flex items-center gap-2">
            <UserPlus size={18} className="text-[#FF9900]" /> Invite Members
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6">
          {loading && !invite && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#FF9900]" />
            </div>
          )}

          {invite && (
            <>
              {/* Invite link */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Invite Link</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 text-xs text-gray-700 bg-transparent outline-none truncate"
                  />
                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      copied ? "bg-green-100 text-green-700" : "bg-[#FF9900] text-white hover:bg-[#e88b00]"
                    }`}
                  >
                    {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* QR Code placeholder */}
              <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="text-center">
                  <QrCode size={64} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">QR Code for mobile sharing</p>
                </div>
              </div>

              {/* Expiration */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Link Expiration</p>
                <div className="flex gap-2">
                  {[
                    { value: "never", label: "Never" },
                    { value: "24h", label: "24 Hours" },
                    { value: "7d", label: "7 Days" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setExpiration(opt.value); generateInvite(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        expiration === opt.value
                          ? "bg-[#131921] text-white border-[#131921]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users size={12} /> {invite.usedCount} joined</span>
                {invite.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CreateGoalForm ───────────────────────────────────────────────────────────
function CreateGoalForm({ onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(50000);
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  const examples = [
    "Moving into a new apartment",
    "Home office setup",
    "Wedding planning",
    "College hostel essentials",
    "New baby essentials",
    "Startup office setup",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/co-planner/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, budget: parseInt(budget), targetDate: targetDate || null, createdBy: user?.name || "You" }),
      });
      const data = await res.json();
      onCreated(data.plan);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      <div className="bg-[#131921] py-8 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target size={20} className="text-[#FF9900]" />
            <h1 className="text-xl font-bold text-white">Co-Planner</h1>
          </div>
          <p className="text-sm text-gray-400">
            Plan purchases together. Split budgets, prevent duplicates, and stay synchronized.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-bold text-[#0F1111] mb-4">Create a Goal</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Goal Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Moving into a new apartment"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900]"
                required
              />
              {/* Suggestions */}
              {!name && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setName(ex)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you planning for?"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Budget</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full mt-5 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 border border-[#FCD200]"
          >
            {loading ? "Creating..." : "Create Co-Plan"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── PlansDashboard ───────────────────────────────────────────────────────────
function PlansDashboard({ plans, onCreated, onOpenPlan, onDeletePlan }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [planDetails, setPlanDetails] = useState({}); // planId -> fetched data

  // Fetch details for each plan
  useEffect(() => {
    plans.forEach((p) => {
      if (!planDetails[p.id]) {
        fetch(`${API}/api/co-planner/${p.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.plan) setPlanDetails((prev) => ({ ...prev, [p.id]: d.plan }));
          })
          .catch(() => {});
      }
    });
  }, [plans]);

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const da = planDetails[a.id];
    const db = planDetails[b.id];
    if (sort === "budget") {
      const pctA = da ? da.stats.totalSpent / da.budget : 0;
      const pctB = db ? db.stats.totalSpent / db.budget : 0;
      return pctB - pctA;
    }
    return 0; // default: order as stored (recently created)
  });

  if (showCreateForm) {
    return <CreateGoalForm onCreated={(plan) => { setShowCreateForm(false); onCreated(plan); }} />;
  }

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-[#0F1111]">Your Co-Plans</h1>
              <p className="text-sm text-[#565959] mt-0.5">Collaborate on purchases with friends, family, or roommates.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] rounded-lg text-sm font-bold text-[#0F1111] border border-[#FCD200] transition-colors"
            >
              <Plus size={16} /> Create Co-Plan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-5">
        {/* Empty state */}
        {plans.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users size={48} className="text-[#EAEDED] mx-auto mb-4" />
            <h2 className="text-lg font-medium text-[#0F1111] mb-1">No Co-Plans Yet</h2>
            <p className="text-sm text-[#565959] mb-5">Create your first collaborative shopping plan and shop together.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] rounded-full text-sm font-bold text-[#0F1111] border border-[#FCD200] transition-colors"
            >
              Create Co-Plan
            </button>
          </div>
        )}

        {/* Search + Sort */}
        {plans.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your Co-Plans..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-[#FF9900]"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white text-[#0F1111]"
              >
                <option value="recent">Recently Active</option>
                <option value="budget">Budget Progress</option>
                <option value="created">Created Date</option>
              </select>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((p) => {
                const detail = planDetails[p.id];
                const stats = detail?.stats;
                const budgetPct = stats ? Math.min(100, Math.round((stats.totalSpent / detail.budget) * 100)) : 0;
                const lastActivity = detail?.activity?.[0];

                return (
                  <div key={p.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Card content */}
                    <div className="p-5 cursor-pointer" onClick={() => onOpenPlan(p.id)}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-bold text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-1">{p.name}</h3>
                        {detail && (
                          <span className="text-[10px] text-[#565959] flex items-center gap-1 flex-shrink-0">
                            <Users size={10} /> {detail.members?.length || 1}
                          </span>
                        )}
                      </div>

                      {/* Budget bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] text-[#565959] mb-1">
                          <span>{fmt(stats?.totalSpent || 0)} spent</span>
                          <span>{fmt(p.budget)} budget</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 60 ? "bg-amber-500" : "bg-[#FF9900]"}`}
                            style={{ width: `${budgetPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats row */}
                      {stats && (
                        <div className="flex items-center gap-4 text-[11px] text-[#565959] mb-3">
                          <span>{stats.itemCount} items</span>
                          <span className="text-green-700">{stats.purchasedCount} purchased</span>
                          <span>{stats.pendingCount} pending</span>
                        </div>
                      )}

                      {/* Last activity */}
                      {lastActivity && (
                        <p className="text-[10px] text-[#565959] truncate">
                          Last: {lastActivity.action} — {new Date(lastActivity.at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Card actions */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => onOpenPlan(p.id)}
                        className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
                      >
                        Invite Members
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.name}"? This cannot be undone.`)) onDeletePlan(p.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PlanItem ─────────────────────────────────────────────────────────────────
function PlanItem({ item, members, currentUser, onAssign, onUpdateStatus, onRemove, onComment, onVote, index, onDragStart, onDragOver, onDrop, isDragging }) {
  const p = item.product;
  if (!p) return null;

  const isPurchased = item.status === "purchased" || item.status === "delivered";
  const assignedMember = members.find((m) => m.name === item.assignedTo);
  const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.important;

  const handleCheck = () => {
    if (isPurchased) {
      onUpdateStatus(item.productId, "need_to_buy");
    } else {
      onUpdateStatus(item.productId, "purchased");
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isDragging ? "opacity-40 scale-95 border-[#FF9900] bg-amber-50" : isPurchased ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0">
        <GripVertical size={16} />
      </div>

      {/* Priority indicator — removed from item, shown in header instead */}

      {/* Checkbox */}
      <button
        onClick={handleCheck}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isPurchased
            ? "bg-[#067D62] border-[#067D62] text-white"
            : "border-gray-300 hover:border-[#FF9900]"
        }`}
      >
        {isPurchased && <CheckCircle2 size={12} />}
      </button>

      {/* Product image */}
      <img
        src={p.image}
        alt={p.name}
        className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-0.5 flex-shrink-0"
        onError={(e) => { e.target.src = `https://placehold.co/48x48/f3f4f6/6b7280?text=Item`; }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium line-clamp-1 ${isPurchased ? "text-gray-400 line-through" : "text-[#0F1111]"}`}>
          {p.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-sm font-bold ${isPurchased ? "text-gray-400" : "text-[#0F1111]"}`}>{fmt(p.price)}</span>
          {item.assignedTo && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100" style={{ color: assignedMember?.color || "#565959" }}>
              {item.assignedTo}
            </span>
          )}
          {!item.assignedTo && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) onAssign(item.productId, e.target.value); }}
              className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-gray-400 bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Assign...</option>
              {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Vote + Delete */}
      <button
        onClick={() => onVote(item.productId, "up")}
        className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-gray-500 hover:text-[#FF9900] hover:bg-amber-50 rounded transition-colors flex-shrink-0"
        title="Vote up"
      >
        <ThumbsUp size={12} /> {item.votes > 0 && <span className="font-bold">{item.votes}</span>}
      </button>
      <button
        onClick={() => onVote(item.productId, "down")}
        className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
        title="Vote down"
      >
        <ThumbsDown size={12} /> {item.downvotes > 0 && <span className="font-bold">{item.downvotes}</span>}
      </button>
      <button
        onClick={() => onRemove(item.productId)}
        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        title="Remove item"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
function ActivityFeed({ activity }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? activity : activity.slice(0, 5);

  return (
    <div>
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Activity size={12} /> Activity
      </h3>
      <div className="space-y-2">
        {shown.map((a) => (
          <div key={a.id} className="flex items-start gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF9900] mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-gray-700">{a.action}</span>
              <span className="text-gray-400 ml-1">— {a.by}</span>
              <p className="text-[10px] text-gray-400">{new Date(a.at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      {activity.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#007185] hover:underline mt-2">
          {expanded ? "Show less" : `Show all (${activity.length})`}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CoPlannerPage() {
  const [searchParams] = useSearchParams();
  const planIdFromUrl = searchParams.get("id");
  const joinToken = searchParams.get("join");

  const { user } = useAuth();
  const { plans: trackedPlans, trackPlan, loadPlan, addToPlan, memberName, deletePlan } = useCoPlanner();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const currentUser = memberName;

  // Load plan
  useEffect(() => {
    if (planIdFromUrl) {
      setLoading(true);
      fetch(`${API}/api/co-planner/${planIdFromUrl}`)
        .then((r) => r.json())
        .then((d) => {
          setPlan(d.plan);
          if (d.plan) {
            trackPlan(d.plan);
            loadRecommendations(d.plan.id);
            loadAiSuggestions(d.plan.id);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [planIdFromUrl]);

  // Join via token — use authenticated user name
  useEffect(() => {
    if (joinToken) {
      setLoading(true);
      fetch(`${API}/api/co-planner/join/${joinToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName: user?.name || "Guest" }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.plan) {
            setPlan(d.plan);
            trackPlan(d.plan);
            window.history.replaceState(null, "", `/co-planner?id=${d.plan.id}`);
            loadAiSuggestions(d.plan.id);
          } else if (d.error) {
            console.warn("Join failed:", d.error);
            window.history.replaceState(null, "", `/co-planner`);
          }
        })
        .catch(() => {
          window.history.replaceState(null, "", `/co-planner`);
        })
        .finally(() => setLoading(false));
    }
  }, [joinToken]);

  const handleCreated = (newPlan) => {
    setPlan(newPlan);
    trackPlan(newPlan);
    window.history.replaceState(null, "", `/co-planner?id=${newPlan.id}`);
    loadRecommendations(newPlan.id);
    loadAiSuggestions(newPlan.id);
  };

  const loadRecommendations = async (planId) => {
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/recommendations`);
      const data = await res.json();
      setRecommendations(data.recommended || []);
    } catch (_) {}
  };

  const loadAiSuggestions = async (planId) => {
    setAiLoading(true);
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/ai-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
      setAiPowered(data.aiPowered || false);
    } catch (_) {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const addItem = async (productId) => {
    const res = await fetch(`${API}/api/co-planner/${plan.id}/add-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, memberName: currentUser }),
    });
    const data = await res.json();
    if (data.error === "duplicate" || data.error === "similar_exists") {
      alert(data.message);
    } else if (data.plan) {
      setPlan(data.plan);
      loadRecommendations(plan.id);
    }
  };

  const assignItem = async (productId, assignTo) => {
    const res = await fetch(`${API}/api/co-planner/${plan.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, assignTo }),
    });
    const data = await res.json();
    if (data.plan) setPlan(data.plan);
  };

  const updateStatus = async (productId, status) => {
    const res = await fetch(`${API}/api/co-planner/${plan.id}/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, status, memberName: currentUser }),
    });
    const data = await res.json();
    if (data.plan) setPlan(data.plan);
  };

  const removeItem = async (productId) => {
    const res = await fetch(`${API}/api/co-planner/${plan.id}/remove-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, memberName: currentUser }),
    });
    const data = await res.json();
    if (data.plan) { setPlan(data.plan); loadRecommendations(plan.id); }
  };

  const voteItem = async (productId, direction = "up") => {
    const res = await fetch(`${API}/api/co-planner/${plan.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, direction }),
    });
    const data = await res.json();
    if (data.plan) setPlan(data.plan);
  };

  // ── Drag and drop handlers ──
  const PRIORITY_ORDER = ["critical", "important", "optional"];

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }

    // Reorder items locally
    const items = [...plan.items];
    const [dragged] = items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, dragged);

    // Assign priority based on new position
    const total = items.length;
    const updatedItems = items.map((item, i) => {
      let priority;
      if (i < total / 3) priority = "critical";
      else if (i < (total * 2) / 3) priority = "important";
      else priority = "optional";
      return { ...item, priority };
    });

    // Update local state immediately for responsiveness
    setPlan((prev) => ({ ...prev, items: updatedItems }));
    setDragIndex(null);

    // Persist to server
    try {
      await fetch(`${API}/api/co-planner/${plan.id}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedProductIds: updatedItems.map((i) => i.productId) }),
      });
    } catch (_) {}
  };

  // ── Show loading while fetching ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF9900]" />
      </div>
    );
  }

  if (!plan) {
    // Still waiting for join or load to complete
    if (loading) {
      return (
        <div className="min-h-screen bg-[#EAEDED] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#FF9900]" />
        </div>
      );
    }
    // Join/load failed or no plan context — show dashboard
    return <PlansDashboard plans={trackedPlans} onCreated={handleCreated} onDeletePlan={deletePlan} onOpenPlan={(id) => {
      window.history.replaceState(null, "", `/co-planner?id=${id}`);
      setLoading(true);
      fetch(`${API}/api/co-planner/${id}`)
        .then((r) => {
          if (!r.ok) throw new Error("not found");
          return r.json();
        })
        .then((d) => { if (d.plan) { setPlan(d.plan); trackPlan(d.plan); loadRecommendations(d.plan.id); loadAiSuggestions(d.plan.id); } })
        .catch(() => { deletePlan(id); })
        .finally(() => setLoading(false));
    }} />;
  }

  const stats = plan.stats;
  const budgetPct = Math.min(100, Math.round((stats.totalSpent / plan.budget) * 100));

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#0F1111]">{plan.name}</h1>
              {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FFD814] hover:bg-[#F7CA00] rounded-lg text-xs font-bold text-[#0F1111] border border-[#FCD200] transition-colors"
              >
                <UserPlus size={14} /> Invite
              </button>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-2 mt-3">
            {plan.members.map((m, i) => (
              <span
                key={m.name}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.role === "owner" && <Crown size={10} />}
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Members</p>
            <p className="text-lg font-bold text-[#0F1111]">{plan.members.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Budget</p>
            <p className="text-lg font-bold text-[#0F1111]">{fmt(plan.budget)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Spent</p>
            <p className={`text-lg font-bold ${stats.overBudget ? "text-red-600" : "text-[#0F1111]"}`}>{fmt(stats.totalSpent)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Remaining</p>
            <p className="text-lg font-bold text-green-700">{fmt(stats.remaining)}</p>
          </div>
        </div>

        {/* Budget bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-gray-700">Budget Progress</span>
            <span className="text-gray-500">{budgetPct}% used</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.overBudget ? "bg-red-500" : budgetPct > 80 ? "bg-amber-500" : "bg-[#FF9900]"
              }`}
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            />
          </div>
          {stats.overBudget && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Over budget by {fmt(stats.totalSpent - plan.budget)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0F1111] flex items-center gap-1.5">
                <Package size={15} /> Items ({stats.itemCount})
                <span className="text-[10px] font-normal text-gray-400 ml-2">
                  Priority ⬆
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{stats.purchasedCount} purchased</span>
                <span>{stats.itemCount - stats.purchasedCount} pending</span>
              </div>
            </div>

            {plan.items.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-3">No items yet. Browse products and add them to this plan.</p>
                <a
                  href="/s"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] rounded-full text-sm font-bold text-[#0F1111] border border-[#FCD200] transition-colors"
                >
                  <Search size={14} /> Shop Now
                </a>
              </div>
            ) : (
              plan.items.map((item, index) => (
                <PlanItem
                  key={item.productId}
                  item={item}
                  index={index}
                  members={plan.members}
                  currentUser={currentUser}
                  onAssign={assignItem}
                  onUpdateStatus={updateStatus}
                  onRemove={removeItem}
                  onVote={voteItem}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={dragIndex === index}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Suggestions */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#FF9900]" />
                  {aiPowered ? "AI Suggestions" : "Smart Suggestions"}
                </h3>
                <button
                  onClick={() => loadAiSuggestions(plan.id)}
                  disabled={aiLoading}
                  className="text-[10px] text-[#007185] hover:underline disabled:opacity-50"
                >
                  {aiLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
              {aiPowered && (
                <p className="text-[10px] text-amber-700 mb-2 flex items-center gap-1">
                  <Sparkles size={9} /> AI analyzed your goal "{plan.name}" to find these
                </p>
              )}
              {aiLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-[#FF9900]" />
                </div>
              )}
              {!aiLoading && aiSuggestions.length === 0 && (
                <p className="text-xs text-gray-500 py-4 text-center">No suggestions yet. Click refresh to generate.</p>
              )}
              {!aiLoading && aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  {aiSuggestions.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100 hover:border-[#FF9900] transition-colors">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-contain bg-gray-50 p-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-700 line-clamp-1">{p.name}</p>
                        <p className="text-xs font-bold text-[#0F1111]">{fmt(p.price)}</p>
                        {p.aiReason && (
                          <p className="text-[10px] text-amber-700 line-clamp-1 mt-0.5">{p.aiReason}</p>
                        )}
                      </div>
                      <button onClick={() => addItem(p.id)} className="p-1.5 text-[#FF9900] hover:bg-amber-50 rounded flex-shrink-0">
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <ActivityFeed activity={plan.activity || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && <InviteModal planId={plan.id} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
