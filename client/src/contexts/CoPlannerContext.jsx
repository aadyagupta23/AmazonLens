import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { API } from "../utils/format.js";
import { getSocket } from "../utils/socket.js";

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
  const getStorageKey = () => user?.name ? `al_coplanner_plans_${user.name}` : "al_coplanner_plans";

  // Load user's plans from server (single source of truth)
  const [plansLoaded, setPlansLoaded] = useState(false);
  
  useEffect(() => {
    const userName = user?.name;
    if (!userName) {
      setPlans([]);
      return;
    }

    fetch(`${API}/api/co-planner/my-plans?member=${encodeURIComponent(userName)}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then(({ plans: serverPlans }) => {
        if (serverPlans && serverPlans.length > 0) {
          setPlans(serverPlans);
          localStorage.setItem(getStorageKey(), JSON.stringify(serverPlans));
        } else {
          const stored = localStorage.getItem(getStorageKey());
          if (stored) {
            try {
              const local = JSON.parse(stored);
              if (local.length > 0) setPlans(local);
            } catch (_) {}
          }
        }
        setPlansLoaded(true);
      })
      .catch(() => {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          try {
            const local = JSON.parse(stored);
            if (local.length > 0) setPlans(local);
          } catch (_) {}
        }
        setPlansLoaded(true);
      });
  }, [user?.name, memberName]);

  // Add plan to local tracking
  const trackPlan = useCallback((plan) => {
    setPlans((prev) => {
      const exists = prev.find((p) => p.id === plan.id);
      const updated = exists
        ? prev.map((p) => p.id === plan.id ? { id: plan.id, name: plan.name, budget: plan.budget } : p)
        : [...prev, { id: plan.id, name: plan.name, budget: plan.budget }];
      localStorage.setItem(getStorageKey(), JSON.stringify(updated));
      return updated;
    });
  }, [user?.name]);

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
            localStorage.setItem(getStorageKey(), JSON.stringify(updated));
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
          localStorage.setItem(getStorageKey(), JSON.stringify(plans.filter((p) => p.id !== planId)));
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
      localStorage.setItem(getStorageKey(), JSON.stringify(updated));
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

  // ── Joint cart helpers ────────────────────────────────────────────────────
  const addToJointCart = useCallback(async (planId, productId, quantity = 1) => {
    const res = await fetch(`${API}/api/co-planner/${planId}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, memberName, quantity }),
    });
    const data = await res.json();
    if (data.plan) setActivePlan(data.plan);
    return data;
  }, [memberName]);

  const updateJointCartQty = useCallback(async (planId, productId, quantity) => {
    const res = await fetch(`${API}/api/co-planner/${planId}/cart/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, memberName }),
    });
    const data = await res.json();
    if (data.plan) setActivePlan(data.plan);
    return data;
  }, [memberName]);

  const clearJointCart = useCallback(async (planId) => {
    const res = await fetch(`${API}/api/co-planner/${planId}/cart`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberName }),
    });
    const data = await res.json();
    if (data.plan) setActivePlan(data.plan);
    return data;
  }, [memberName]);

  // ── Socket.IO: real-time sync for co-plan purchases ───────────────────────
  const joinedRoomsRef = useRef(new Set());

  useEffect(() => {
    const socket = getSocket();
    const joinedRooms = joinedRoomsRef.current;

    // Join rooms for all plans the user is part of
    plans.forEach((p) => {
      if (!joinedRooms.has(p.id)) {
        socket.emit("coplan:join", { planId: p.id });
        joinedRooms.add(p.id);
      }
    });

    // Leave rooms for plans no longer tracked
    const toLeave = [...joinedRooms].filter((id) => !plans.find((p) => p.id === id));
    toLeave.forEach((planId) => {
      socket.emit("coplan:leave", { planId });
      joinedRooms.delete(planId);
    });
  }, [plans]);

  useEffect(() => {
    const socket = getSocket();

    const handleItemPurchased = (data) => {
      // Update activePlan if it matches the incoming plan update
      setActivePlan((prev) => {
        if (!prev || prev.id !== data.planId) return prev;
        return data.plan || prev;
      });
    };

    const handleCartUpdated = (data) => {
      setActivePlan((prev) => {
        if (!prev || prev.id !== data.planId) return prev;
        return { ...prev, cart: data.cart };
      });
    };

    socket.on("coplan:item-purchased", handleItemPurchased);
    socket.on("coplan:cart-updated", handleCartUpdated);
    return () => {
      socket.off("coplan:item-purchased", handleItemPurchased);
      socket.off("coplan:cart-updated", handleCartUpdated);
    };
  }, []);

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
      addToJointCart,
      updateJointCartQty,
      clearJointCart,
      showPlanPicker,
      pendingProduct,
      lastAddedProductId,
    }}>
      {children}
    </CoPlannerContext.Provider>
  );
}

export const useCoPlanner = () => useContext(CoPlannerContext);
