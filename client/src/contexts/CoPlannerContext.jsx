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
  const [dashboardResetKey, setDashboardResetKey] = useState(0);
  const [lastAddedProductId, setLastAddedProductId] = useState(null); // for green "Added" feedback

  const memberName = user?.name || "You";

  // Load user's plans from localStorage + sync with server
  useEffect(() => {
    // Load from localStorage first for instant display
    const stored = localStorage.getItem("al_coplanner_plans");
    let localPlans = [];
    if (stored) {
      try { localPlans = JSON.parse(stored); } catch (_) {}
    }

    // Then sync with server to get any plans user joined from other devices/sessions
    if (user?.name) {
      fetch(`${API}/api/co-planner/my-plans?member=${encodeURIComponent(user.name)}`)
        .then((r) => r.ok ? r.json() : { plans: [] })
        .then(({ plans: serverPlans }) => {
          // Merge: combine localStorage plans with server plans (deduplicate by ID)
          const merged = new Map();
          localPlans.forEach((p) => merged.set(p.id, p));
          serverPlans.forEach((p) => merged.set(p.id, p));
          const final = [...merged.values()];
          setPlans(final);
          localStorage.setItem("al_coplanner_plans", JSON.stringify(final));
        })
        .catch(() => {
          // Fallback: just use localStorage, validate against server
          Promise.all(
            localPlans.map((p) =>
              fetch(`${API}/api/co-planner/${p.id}`)
                .then((r) => r.ok ? p : null)
                .catch(() => null)
            )
          ).then((results) => {
            const valid = results.filter(Boolean);
            setPlans(valid);
            localStorage.setItem("al_coplanner_plans", JSON.stringify(valid));
          });
        });
    } else {
      // Not logged in — just validate localStorage plans
      if (localPlans.length > 0) {
        Promise.all(
          localPlans.map((p) =>
            fetch(`${API}/api/co-planner/${p.id}`)
              .then((r) => r.ok ? p : null)
              .catch(() => null)
          )
        ).then((results) => {
          const valid = results.filter(Boolean);
          setPlans(valid);
          localStorage.setItem("al_coplanner_plans", JSON.stringify(valid));
        });
      }
    }
  }, [user]);

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
  const addToPlan = useCallback(async (planId, productId, quantity) => {
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, memberName, quantity: quantity || 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "duplicate" || data.error === "similar_exists") {
          return { error: true, message: data.message, existingItem: data.existingItem, canIncreaseQuantity: data.canIncreaseQuantity, currentQuantity: data.currentQuantity, addedBy: data.addedBy };
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
        return { success: true, plan: data.plan, quantityIncreased: data.quantityIncreased };
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
  const confirmAddToPlan = useCallback(async (planId, quantity) => {
    if (!pendingProduct) return;
    const result = await addToPlan(planId, pendingProduct.id, quantity);
    // Only close the picker on success — keep it open on error so user can pick another plan
    if (result?.success) {
      setLastAddedProductId(pendingProduct.id);
      setPendingProduct(null);
      setShowPlanPicker(false);
    }
    return result;
  }, [pendingProduct, addToPlan]);

  const cancelPlanPicker = useCallback(() => {
    setPendingProduct(null);
    setShowPlanPicker(false);
  }, []);

  // Called from navbar to force CoPlannerPage back to dashboard
  const goToDashboard = useCallback(() => {
    setActivePlan(null);
    setDashboardResetKey((k) => k + 1);
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

  // Increase quantity for an existing item
  const increaseQuantity = useCallback(async (planId, productId, additionalQuantity) => {
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/increase-quantity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, additionalQuantity, memberName }),
      });
      const data = await res.json();
      if (data.plan) setActivePlan(data.plan);
      return data;
    } catch (err) {
      return { error: true, message: "Network error" };
    }
  }, [memberName]);

  // Mark purchased count for an item
  const markPurchased = useCallback(async (planId, productId, purchasedCount) => {
    try {
      const res = await fetch(`${API}/api/co-planner/${planId}/mark-purchased`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, purchasedCount, memberName }),
      });
      const data = await res.json();
      if (data.plan) setActivePlan(data.plan);
      return data;
    } catch (err) {
      return { error: true, message: "Network error" };
    }
  }, [memberName]);

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
      goToDashboard,
      dashboardResetKey,
      increaseQuantity,
      markPurchased,
      showPlanPicker,
      pendingProduct,
      lastAddedProductId,
    }}>
      {children}
    </CoPlannerContext.Provider>
  );
}

export const useCoPlanner = () => useContext(CoPlannerContext);
