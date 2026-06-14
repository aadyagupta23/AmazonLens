import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useCoPlanner } from "../contexts/CoPlannerContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatPrice, API } from "../utils/format.js";
import { useSustainability } from "../contexts/SustainabilityContext.jsx";
import { useDna } from "../contexts/DnaContext.jsx";
import ReturnRiskBadge from "../components/ReturnRiskBadge.jsx";

import { getUserSustainabilityScore, getSustainabilityData, getSustainabilityColor } from "../utils/sustainability.js";
import { Trash2, RefreshCw, ShoppingBag, Clock, Leaf, Users, Eye, EyeOff, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";
import axios from "axios";

const TABS = ["Cart", "Soon"];

export default function CartPage() {
  const { items, addToCart, removeFromCart, updateQty } = useCart();
  const { plans } = useCoPlanner();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prefs } = useSustainability();
  const [activeTab, setActiveTab] = useState("Cart");
  const [senseItems, setSenseItems] = useState([]);
  const [sharedPlans, setSharedPlans] = useState([]);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [hideShared, setHideShared] = useState(() => localStorage.getItem("al_hideSharedItems") === "true");

  // Selection state: { [itemId]: boolean }
  const [selected, setSelected] = useState(() => {
    try { return JSON.parse(localStorage.getItem("al_cartSelection") || "{}"); } catch (_) { return {}; }
  });

  const userName = user?.name;

  useEffect(() => { localStorage.setItem("al_hideSharedItems", String(hideShared)); }, [hideShared]);
  useEffect(() => { localStorage.setItem("al_cartSelection", JSON.stringify(selected)); }, [selected]);

  // Sustainability
  const cartSustainScore = getUserSustainabilityScore(items, prefs);
  const cartSustainColor = getSustainabilityColor(cartSustainScore);
  const ecoItemCount = items.filter((item) => getSustainabilityData(item.id).score >= 70).length;

  useEffect(() => {
    axios.get(`${API}/api/sense/predictions`)
      .then(({ data }) => setSenseItems(data.predictions || []))
      .catch(() => {
        setSenseItems([{ productId: "p005", productName: "Nescafé Gold Blend 200g", price: 649, trustScore: 88, urgency: "Due today", daysOverdue: 0, thumbnail: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Instant_Coffee_Grains_Inside_Jar.jpeg" }]);
      });
  }, []);

  // Fetch co-plan items that belong to current user
  useEffect(() => {
    if (plans.length === 0 || !userName) { setSharedPlans([]); return; }
    Promise.all(
      plans.map((p) =>
        fetch(`${API}/api/co-planner/${p.id}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            if (!d?.plan) return null;
            const myItems = d.plan.items.filter((item) =>
              item.assignedTo === userName || (!item.assignedTo && item.addedBy === userName)
            );
            if (myItems.length === 0) return null;
            return { planId: d.plan.id, name: d.plan.name, items: myItems, budget: d.plan.budget, memberCount: d.plan.members?.length || 1 };
          })
          .catch(() => null)
      )
    ).then((results) => setSharedPlans(results.filter(Boolean)));
  }, [plans, userName]);

  // ── Auto-select new items (default selected) ──
  useEffect(() => {
    setSelected((prev) => {
      const next = { ...prev };
      items.forEach((i) => { if (next[i.id] === undefined) next[i.id] = true; });
      sharedPlans.forEach((sp) => sp.items.forEach((i) => { if (next[`cp_${i.productId}`] === undefined) next[`cp_${i.productId}`] = true; }));
      return next;
    });
  }, [items, sharedPlans]);

  const togglePlan = (planId) => { setExpandedPlans((prev) => ({ ...prev, [planId]: !prev[planId] })); };

  const handleCoPlanQty = async (planId, productId, delta, currentQty) => {
    if (delta < 0 && currentQty <= 1) {
      await fetch(`${API}/api/co-planner/${planId}/remove-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, memberName: userName }),
      });
    } else {
      await fetch(`${API}/api/co-planner/${planId}/increase-quantity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, additionalQuantity: delta, memberName: userName }),
      });
    }
    // Refresh co-plan data
    Promise.all(
      plans.map((p) =>
        fetch(`${API}/api/co-planner/${p.id}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            if (!d?.plan) return null;
            const myItems = d.plan.items.filter((item) =>
              item.assignedTo === userName || (!item.assignedTo && item.addedBy === userName)
            );
            if (myItems.length === 0) return null;
            return { planId: d.plan.id, name: d.plan.name, items: myItems, budget: d.plan.budget, memberCount: d.plan.members?.length || 1 };
          })
          .catch(() => null)
      )
    ).then((results) => setSharedPlans(results.filter(Boolean)));
  };

  // ── Selection helpers ──
  const isSelected = (id) => selected[id] !== false; // default true
  const toggleItem = (id) => setSelected((prev) => ({ ...prev, [id]: !isSelected(id) }));

  const toggleAllPersonal = () => {
    const allSelected = items.every((i) => isSelected(i.id));
    setSelected((prev) => {
      const next = { ...prev };
      items.forEach((i) => { next[i.id] = !allSelected; });
      return next;
    });
  };

  const togglePlanSelection = (sp) => {
    const allSelected = sp.items.every((i) => isSelected(`cp_${i.productId}`));
    setSelected((prev) => {
      const next = { ...prev };
      sp.items.forEach((i) => { next[`cp_${i.productId}`] = !allSelected; });
      return next;
    });
  };

  const selectAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      items.forEach((i) => { next[i.id] = true; });
      sharedPlans.forEach((sp) => sp.items.forEach((i) => { next[`cp_${i.productId}`] = true; }));
      return next;
    });
  };

  const deselectAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      items.forEach((i) => { next[i.id] = false; });
      sharedPlans.forEach((sp) => sp.items.forEach((i) => { next[`cp_${i.productId}`] = false; }));
      return next;
    });
  };

  // ── Derived counts ──
  const personalItems = items;
  const visibleShared = hideShared ? [] : sharedPlans;
  const allVisibleItems = [
    ...personalItems.map((i) => ({ id: i.id, price: i.price * i.qty, qty: i.qty })),
    ...visibleShared.flatMap((sp) => sp.items.map((i) => ({ id: `cp_${i.productId}`, price: (i.product?.price || 0) * (i.quantityNeeded || 1), qty: i.quantityNeeded || 1, planId: sp.planId, productId: i.productId }))),
  ];
  const visibleItemCount = allVisibleItems.reduce((s, i) => s + i.qty, 0);
  const selectedItems = allVisibleItems.filter((i) => isSelected(i.id));
  const selectedCount = selectedItems.reduce((s, i) => s + i.qty, 0);
  const selectedSubtotal = selectedItems.reduce((s, i) => s + i.price, 0);
  const allAreSelected = allVisibleItems.length > 0 && allVisibleItems.every((i) => isSelected(i.id));

  // Checkbox component
  const Checkbox = ({ checked, onChange, className = "" }) => (
    <button onClick={(e) => { e.stopPropagation(); onChange(); }} className={`flex-shrink-0 ${className}`}>
      {checked
        ? <CheckSquare size={20} className="text-[#FF9900]" />
        : <Square size={20} className="text-gray-300 hover:text-gray-400" />
      }
    </button>
  );

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-4">
      <h1 className="text-2xl font-medium text-[#0F1111] mb-4">Shopping Cart</h1>

      {/* Tab nav */}
      <div className="flex border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-[#C7511F] border-b-2 border-[#C7511F]" : "text-[#007185] hover:text-[#C7511F]"}`}>
            {tab}
            {tab === "Soon" && senseItems.length > 0 && (
              <span className="ml-1.5 bg-[#FF9900] text-[#131921] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{senseItems.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "Cart" ? (
        <div className="flex gap-6 flex-wrap lg:flex-nowrap">
          <div className="flex-1 min-w-0 space-y-4">

            {/* ═══ GLOBAL SELECT ALL ═══ */}
            {visibleItemCount > 0 && (
              <div className="flex items-center justify-between px-1">
                <button onClick={allAreSelected ? deselectAll : selectAll} className="flex items-center gap-2 text-sm text-[#007185] hover:text-[#C7511F]">
                  <Checkbox checked={allAreSelected} onChange={allAreSelected ? deselectAll : selectAll} />
                  <span>{allAreSelected ? "Deselect All" : "Select All Items"}</span>
                </button>
                <span className="text-xs text-[#565959]">
                  {visibleItemCount} item{visibleItemCount !== 1 ? "s" : ""} in cart · <span className="font-medium text-[#0F1111]">{selectedCount} selected for purchase</span>
                </span>
              </div>
            )}

            {/* ═══ MY CART SECTION ═══ */}
            <div className="bg-white rounded shadow-sm">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked={personalItems.length > 0 && personalItems.every((i) => isSelected(i.id))} onChange={toggleAllPersonal} />
                  <span className="text-sm font-medium text-[#0F1111]">My Cart ({personalItems.length} Item{personalItems.length !== 1 ? "s" : ""})</span>
                </div>
                <span className="text-sm text-[#565959]">Price</span>
              </div>

              {personalItems.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <ShoppingBag size={36} className="text-[#EAEDED] mx-auto mb-3" />
                  <p className="text-sm text-[#565959] mb-3">Your personal cart is empty</p>
                  <Link to="/" className="text-xs text-[#007185] hover:underline">Continue Shopping</Link>
                </div>
              ) : (
                <>
                  {personalItems.map((item) => (
                    <div key={item.id} className={`px-5 py-4 border-b border-gray-100 last:border-0 flex gap-4 ${!isSelected(item.id) ? "opacity-60" : ""}`}>
                      <Checkbox checked={isSelected(item.id)} onChange={() => toggleItem(item.id)} />
                      <div className="w-24 h-24 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/dp/${item.id}`)}>
                        <img src={item.thumbnail || item.image} alt={item.name} className="w-full h-full object-contain" onError={(e) => { e.target.src = "https://via.placeholder.com/96"; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-[#0F1111] hover:text-[#C7511F] cursor-pointer leading-snug mb-1" onClick={() => navigate(`/dp/${item.id}`)}>{item.name}</h3>
                        {item.isPrime && <div className="text-[#00A8E1] text-xs font-bold mb-1">prime</div>}
                        <div className="text-xs text-[#007600] mb-2">In stock</div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-50">−</button>
                            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-50">+</button>
                          </div>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Delete</button>
                          <span className="text-gray-300">|</span>
                          <button className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Save for later</button>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#0F1111] flex-shrink-0">{formatPrice(item.price * item.qty)}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* ═══ SHARED CARTS SECTION ═══ */}
            {sharedPlans.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-medium text-[#0F1111]">Shared Carts</span>
                  <button onClick={() => setHideShared((v) => !v)} className="flex items-center gap-1.5 text-xs text-[#007185] hover:text-[#C7511F] transition-colors">
                    {hideShared ? <><Eye size={12} /> Show Shared Carts</> : <><EyeOff size={12} /> Hide Shared Carts</>}
                  </button>
                </div>

                {!hideShared && sharedPlans.map((sp) => {
                  const isExpanded = expandedPlans[sp.planId] || false;
                  const planTotal = sp.items.reduce((s, i) => s + (i.product?.price || 0) * (i.quantityNeeded || 1), 0);
                  const allPlanSelected = sp.items.every((i) => isSelected(`cp_${i.productId}`));

                  return (
                    <div key={sp.planId} className="bg-white rounded shadow-sm mb-3 overflow-hidden">
                      {/* Header */}
                      <div className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => togglePlan(sp.planId)}>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={allPlanSelected} onChange={() => togglePlanSelection(sp)} />
                          {isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                          <Link to={`/co-planner?id=${sp.planId}`} onClick={(e) => e.stopPropagation()} className="text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline">
                            {sp.name}
                          </Link>
                          <span className="text-xs text-[#565959]">
                            {sp.items.reduce((s, i) => s + (i.quantityNeeded || 1), 0)} Item{sp.items.reduce((s, i) => s + (i.quantityNeeded || 1), 0) !== 1 ? "s" : ""} • {sp.memberCount} Member{sp.memberCount !== 1 ? "s" : ""} • {formatPrice(planTotal)}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#0F1111]">{formatPrice(planTotal)}</span>
                      </div>

                      {/* Expanded items */}
                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          {sp.items.map((item) => {
                            const p = item.product;
                            if (!p) return null;
                            const itemKey = `cp_${item.productId}`;
                            return (
                              <div key={item.productId} className={`px-5 py-4 border-b border-gray-100 last:border-0 flex gap-4 ${!isSelected(itemKey) ? "opacity-60" : ""}`}>
                                <Checkbox checked={isSelected(itemKey)} onChange={() => toggleItem(itemKey)} />
                                <div className="w-24 h-24 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/dp/${p.id}`)}>
                                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" onError={(e) => { e.target.src = "https://via.placeholder.com/96"; }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm text-[#0F1111] hover:text-[#C7511F] cursor-pointer leading-snug mb-1" onClick={() => navigate(`/dp/${p.id}`)}>{p.name}</h3>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF8E1] border border-[#FFE082] text-[#F57C00] mb-1">
                                    <Users size={9} /> {item.assignedTo === userName ? "Assigned to You" : "Added by You"}
                                  </span>
                                  <div className="text-xs text-[#007600] mb-2">In stock</div>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleCoPlanQty(sp.planId, item.productId, -1, item.quantityNeeded || 1)}
                                        className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-50"
                                      >−</button>
                                      <span className="w-8 text-center text-sm font-medium">{item.quantityNeeded || 1}</span>
                                      <button
                                        onClick={() => handleCoPlanQty(sp.planId, item.productId, 1, item.quantityNeeded || 1)}
                                        className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-sm hover:bg-gray-50"
                                      >+</button>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                    <button
                                      onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, thumbnail: p.image, image: p.image, isPrime: true })}
                                      className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
                                    >Move to Personal Cart</button>
                                  </div>
                                </div>
                                <div className="text-sm font-bold text-[#0F1111] flex-shrink-0">{formatPrice(p.price * (item.quantityNeeded || 1))}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ CHECKOUT SIDEBAR ═══ */}
          {visibleItemCount > 0 && (
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded shadow-sm p-5 sticky top-24">
                <div className="text-[#007600] text-sm mb-2">✓ Your order qualifies for FREE Delivery.</div>
                <div className="text-base text-[#0F1111] mb-1">
                  Subtotal ({selectedCount} item{selectedCount !== 1 ? "s" : ""} selected):
                  <span className="font-bold ml-1">{formatPrice(selectedSubtotal)}</span>
                </div>
                {selectedCount < visibleItemCount && (
                  <p className="text-xs text-[#565959] mb-3">{visibleItemCount - selectedCount} item{(visibleItemCount - selectedCount) !== 1 ? "s" : ""} not selected</p>
                )}
                <label className="flex items-center gap-2 text-sm text-[#0F1111] mb-4 cursor-pointer">
                  <input type="checkbox" className="accent-[#FF9900]" />
                  This order contains a gift
                </label>
                <button onClick={() => navigate("/checkout")} className="w-full btn-primary py-2.5 rounded-full font-bold text-sm">
                  Proceed to Buy ({selectedCount} Item{selectedCount !== 1 ? "s" : ""})
                </button>

                {prefs.enabled && items.length > 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Leaf size={13} className="text-[#1B5E20]" />
                      <span className="text-xs font-bold text-[#1B5E20]">Cart Sustainability</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#565959]">Cart Score</span>
                      <span className="text-sm font-bold" style={{ color: cartSustainColor.hex }}>{cartSustainScore}/100</span>
                    </div>
                    <div className="h-1.5 bg-green-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full" style={{ width: `${cartSustainScore}%`, backgroundColor: cartSustainColor.hex }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#565959]">
                      <span>🌱 Eco-friendly items: {ecoItemCount}</span>
                      <Link to="/sustainability" className="text-[#007185] hover:underline">Details →</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ═══ SOON TAB ═══ */
        <div>
          <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] rounded-xl p-5 mb-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-[#FF9900]" />
              <h2 className="font-bold text-base">Amazon Sense™ — Coming Up</h2>
            </div>
            <p className="text-gray-300 text-sm">Based on your order history, these items may be running low.</p>
          </div>
          {senseItems.length === 0 ? (
            <div className="bg-white rounded shadow-sm p-10 text-center">
              <Clock size={40} className="text-[#EAEDED] mx-auto mb-3" />
              <p className="text-sm text-[#565959]">No upcoming reorders detected yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm divide-y divide-gray-100">
              {senseItems.map((si) => (
                <div key={si.productId} className="px-5 py-4 flex items-center gap-4">
                  <img src={si.thumbnail} alt={si.productName} className="w-16 h-16 object-contain flex-shrink-0" onError={(e) => { e.target.src = "https://via.placeholder.com/64"; }} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#0F1111] leading-snug">{si.productName}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-[#0F1111]">{formatPrice(si.price)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${si.daysOverdue > 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{si.urgency}</span>
                    </div>
                    <p className="text-xs text-[#565959] mt-0.5">Avg. cycle: every {si.avgCycleDays} days · Last ordered {si.lastOrderDate}</p>
                  </div>
                  <button
                    onClick={() => { addToCart({ id: si.productId, name: si.productName, price: si.price, trustScore: si.trustScore, thumbnail: si.thumbnail, isPrime: true }); setActiveTab("Cart"); }}
                    className="flex-shrink-0 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-xs font-bold px-4 py-2 rounded-full"
                  >
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
