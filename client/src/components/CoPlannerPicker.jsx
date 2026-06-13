import { useState } from "react";
import { useCoPlanner } from "../contexts/CoPlannerContext.jsx";
import { useNavigate } from "react-router-dom";
import { X, Users, Plus, CheckCircle2, AlertTriangle, Target } from "lucide-react";
import { formatPrice } from "../utils/format.js";

export default function CoPlannerPicker() {
  const navigate = useNavigate();
  const { showPlanPicker, pendingProduct, plans, confirmAddToPlan, cancelPlanPicker, createPlan } = useCoPlanner();
  const [result, setResult] = useState(null); // { success, error, message }
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  if (!showPlanPicker || !pendingProduct) return null;

  const handleSelect = async (planId) => {
    const res = await confirmAddToPlan(planId);
    if (res?.error) {
      setResult({ error: true, message: res.message });
    } else {
      setResult({ success: true });
      setTimeout(() => { setResult(null); cancelPlanPicker(); }, 1500);
    }
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    const plan = await createPlan({ name: newName.trim(), budget: 100000 });
    if (plan) {
      const res = await confirmAddToPlan(plan.id);
      if (res?.success) {
        setResult({ success: true });
        setTimeout(() => { setResult(null); cancelPlanPicker(); }, 1500);
      }
    }
    setCreating(false);
    setNewName("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={cancelPlanPicker}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-sm text-[#0F1111] flex items-center gap-2">
            <Users size={16} className="text-[#FF9900]" /> Add to Co-Plan
          </h3>
          <button onClick={cancelPlanPicker} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Product preview */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <img
            src={pendingProduct.thumbnail || pendingProduct.image}
            alt={pendingProduct.name}
            className="w-12 h-12 object-contain rounded bg-gray-50 p-1"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700 line-clamp-1">{pendingProduct.name}</p>
            <p className="text-sm font-bold text-[#0F1111]">{formatPrice(pendingProduct.price)}</p>
          </div>
        </div>

        {/* Success/Error states */}
        {result?.success && (
          <div className="px-5 py-6 text-center">
            <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-700">Added to Co-Plan!</p>
          </div>
        )}
        {result?.error && (
          <div className="px-5 py-4">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">{result.message?.includes("duplicate") || result.message?.includes("Similar") ? "Duplicate Detected" : "Couldn't Add"}</p>
                <p className="text-xs text-amber-700 mt-0.5">{result.message}</p>
              </div>
            </div>
            <button onClick={() => setResult(null)} className="text-xs text-[#007185] hover:underline mt-2">Dismiss</button>
          </div>
        )}

        {/* Plan list */}
        {!result && (
          <div className="px-5 py-3">
            {plans.length > 0 ? (
              <div className="space-y-2 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Plans</p>
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#FF9900] hover:bg-amber-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-[#FF9900]" />
                      <span className="text-sm font-medium text-[#0F1111]">{p.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatPrice(p.budget)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-3">No plans yet. Create one below.</p>
            )}

            {/* Create new */}
            {creating ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
                  placeholder="Plan name..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF9900]"
                  autoFocus
                />
                <button onClick={handleCreateNew} className="px-3 py-2 bg-[#FFD814] text-xs font-bold rounded-lg border border-[#FCD200]">Create</button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
              >
                <Plus size={14} /> Create New Plan
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
