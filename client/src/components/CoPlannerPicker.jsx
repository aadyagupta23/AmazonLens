import { useState, useEffect } from "react";
import { useCoPlanner } from "../contexts/CoPlannerContext.jsx";
import { X, Users, Plus, Minus, Check } from "lucide-react";
import { formatPrice, API } from "../utils/format.js";

export default function CoPlannerPicker() {
  const { showPlanPicker, pendingProduct, plans, confirmAddToPlan, cancelPlanPicker, createPlan, increaseQuantity, memberName } = useCoPlanner();
  const [result, setResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [planItemStatus, setPlanItemStatus] = useState({}); // { planId: { exists, quantity } }

  // Check which plans already contain this product
  useEffect(() => {
    if (!pendingProduct || plans.length === 0 || !showPlanPicker) { setPlanItemStatus({}); return; }
    Promise.all(
      plans.map((p) =>
        fetch(`${API}/api/co-planner/${p.id}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            if (!d?.plan) return [p.id, null];
            const existing = d.plan.items.find((i) => i.productId === pendingProduct.id);
            return [p.id, existing ? { exists: true, quantity: existing.quantityNeeded || 1 } : { exists: false }];
          })
          .catch(() => [p.id, null])
      )
    ).then((results) => {
      const status = {};
      results.forEach(([id, data]) => { if (data) status[id] = data; });
      setPlanItemStatus(status);
    });
  }, [pendingProduct, plans, showPlanPicker]);

  if (!showPlanPicker || !pendingProduct) return null;

  const handleAdd = async (planId) => {
    setResult(null);
    setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: true, quantity: 1 } }));
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pendingProduct.id, memberName, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: false } }));
        setResult({ error: true, message: data.message, planId });
      }
    } catch (_) {
      setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: false } }));
    }
  };

  const handleIncrease = async (planId) => {
    const currentQty = planItemStatus[planId]?.quantity || 1;
    setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: true, quantity: currentQty + 1 } }));
    const res = await fetch(`${API}/api/co-planner/${planId}/increase-quantity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: pendingProduct.id, additionalQuantity: 1, memberName }),
    });
    const data = await res.json();
    if (!data.plan) {
      setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: true, quantity: currentQty } }));
    }
  };

  const handleDecrease = async (planId) => {
    const currentQty = planItemStatus[planId]?.quantity || 1;
    if (currentQty <= 1) {
      setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: false } }));
      const res = await fetch(`${API}/api/co-planner/${planId}/remove-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pendingProduct.id, memberName }),
      });
      const data = await res.json();
      if (!data.plan) {
        setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: true, quantity: 1 } }));
      }
    } else {
      setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: true, quantity: currentQty - 1 } }));
      const res = await fetch(`${API}/api/co-planner/${planId}/increase-quantity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: pendingProduct.id, additionalQuantity: -1, memberName }),
      });
      const data = await res.json();
      if (!data.plan) {
        setPlanItemStatus((prev) => ({ ...prev, [planId]: { exists: true, quantity: currentQty } }));
      }
    }
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    const plan = await createPlan({ name: newName.trim(), budget: 100000 });
    if (plan) {
      setPlanItemStatus((prev) => ({ ...prev, [plan.id]: { exists: true, quantity: 1 } }));
      try {
        await fetch(`${API}/api/co-planner/${plan.id}/add-item`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: pendingProduct.id, memberName, quantity: 1 }),
        });
      } catch (_) {}
    }
    setCreating(false);
    setNewName("");
  };

  const handleCancel = () => {
    setResult(null);
    cancelPlanPicker();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={handleCancel}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-sm text-[#0F1111] flex items-center gap-2">
            <Users size={16} className="text-[#FF9900]" /> Add to Co-Plan
          </h3>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
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

        {/* Plan list */}
        <div className="px-5 py-3">
            {/* Inline error */}
            {result?.error && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                <p className="text-xs text-amber-700">{result.message}</p>
              </div>
            )}

            {plans.length > 0 ? (
              <div className="space-y-2 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Plans</p>
                {plans.map((p) => {
                  const itemInPlan = planItemStatus[p.id];
                  const alreadyExists = itemInPlan?.exists;
                  const qty = itemInPlan?.quantity || 0;

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        alreadyExists
                          ? "border-green-200 bg-green-50/50"
                          : "border-gray-200 hover:border-[#FF9900] hover:bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {alreadyExists ? (
                          <Check size={14} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <Plus size={14} className="text-[#FF9900] flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-[#0F1111] truncate">{p.name}</span>
                      </div>

                      {/* Quantity counter for existing items / Add button for new */}
                      {alreadyExists ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDecrease(p.id)}
                            className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors text-xs"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-[#0F1111]">{qty}</span>
                          <button
                            onClick={() => handleIncrease(p.id)}
                            className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors text-xs"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdd(p.id)}
                          className="px-3 py-1.5 text-xs font-bold text-[#0F1111] bg-[#FFD814] hover:bg-[#F7CA00] rounded-lg border border-[#FCD200] transition-colors flex-shrink-0"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
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
      </div>
    </div>
  );
}
