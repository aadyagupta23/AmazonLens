import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { API } from "../utils/format.js";

const CoPlannerContext = createContext(null);

export function CoPlannerProvider({ children }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]); // list of plan summaries
  const [activePlan, setActivePlan] = useState(null); // currently viewed plan (full)
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null); // product waiting to be added

  const memberName = user?.name || "You";

  // Load user's plans from localStorage (demo persistence)
  useEffect(() => {
    const stored = localStorage.getItem("al_coplanner_plans");
    if (stored) {
      try { setPlans(JSON.parse(stored)); } catch (_) {}
    }
  }, []);

  // Save plans to localStorage
  useEffect(() => {
    localStorage.setItem("al_coplanner_plans", JSON.stringify(plans));
  }, [plans]);

  // Add plan to local tracking
  const trackPlan = useCallback((plan) => {
    setPlans((prev) => {
      const exists = prev.find((p) => p.id === plan.id);
      if (exists) return prev.map((p) => p.id === plan.id ? { id: plan.id, name: plan.name, budget: plan.budget } : p);
      return [...prev, { id: plan.id, name: plan.name, budget: plan.budget }];
    });
  }, []);

  // Create a new plan
  const createPlan = useCallback(async ({ name, description, budget, targetDate }) => {
    const res = await fetch(`${API}/api/co-planner/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, budget, targetDate, createdBy: memberName }),
    });
    const data = await res.json();
    if (data.plan) {
      trackPlan(data.plan);
      setActivePlan(data.plan);
    }
    return data.plan;
  }, [memberName, trackPlan]);

  // Load a plan by ID
  const loadPlan = useCallback(async (planId) => {
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}`);
      if (!res.ok) {
        // Plan doesn't exist on server — remove stale reference
        if (res.status === 404) {
          setPlans((prev) => {
            const updated = prev.filter((p) => p.id !== planId);
            localStorage.setItem("al_coplanner_plans", JSON.stringify(updated));
            return updated;
          });
        }
        return null;
      }
      const data = await res.json();
      if (data.plan) {
        setActivePlan(data.plan);
        trackPlan(data.plan);
      }
      return data.plan;
    } catch (err) {
      return null;
    }
  }, [trackPlan]);

  // Add product to a specific plan
  const addToPlan = useCallback(async (planId, productId) => {
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, memberName }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "duplicate" || data.error === "similar_exists") {
          return { error: true, message: data.message, existingItem: data.existingItem };
        }
        // Plan not found on server — remove stale plan from local tracking
        if (res.status === 404) {
          setPlans((prev) => prev.filter((p) => p.id !== planId));
          localStorage.setItem("al_coplanner_plans", JSON.stringify(plans.filter((p) => p.id !== planId)));
          return { error: true, message: "This plan no longer exists. It may have been deleted." };
        }
        return { error: true, message: data.message || "Failed to add item" };
      }
      if (data.plan) {
        setActivePlan(data.plan);
        return { success: true, plan: data.plan };
      }
      return { error: true, message: "Unexpected response" };
    } catch (err) {
      return { error: true, message: "Network error — please try again" };
    }
  }, [memberName, plans]);

  // Trigger "Add to Co-Plan" picker (called from product cards/pages)
  const startAddToPlan = useCallback((product) => {
    setPendingProduct(product);
    setShowPlanPicker(true);
  }, []);

  // Complete the add after plan is selected
  const confirmAddToPlan = useCallback(async (planId) => {
    if (!pendingProduct) return;
    const result = await addToPlan(planId, pendingProduct.id);
    setPendingProduct(null);
    setShowPlanPicker(false);
    return result;
  }, [pendingProduct, addToPlan]);

  const cancelPlanPicker = useCallback(() => {
    setPendingProduct(null);
    setShowPlanPicker(false);
  }, []);

  // Delete a plan from local tracking (and archive on server if still exists)
  const deletePlan = useCallback(async (planId) => {
    try {
      await fetch(`${API}/api/co-planner/${planId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName }),
      });
    } catch (_) {}
    setPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId);
      localStorage.setItem("al_coplanner_plans", JSON.stringify(updated));
      return updated;
    });
    if (activePlan?.id === planId) setActivePlan(null);
  }, [memberName, activePlan]);

  return (
    <CoPlannerContext.Provider value={{
      plans,
      activePlan,
      setActivePlan,
      memberName,
      createPlan,
      loadPlan,
      addToPlan,
      trackPlan,
      deletePlan,
      startAddToPlan,
      confirmAddToPlan,
      cancelPlanPicker,
      showPlanPicker,
      pendingProduct,
    }}>
      {children}
    </CoPlannerContext.Provider>
  );
}

export const useCoPlanner = () => useContext(CoPlannerContext);
