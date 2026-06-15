import React, { createContext, useContext, useState } from "react";
import { API } from "../utils/format.js";

const OrdersContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem("amz_orders") || "[]"); }
  catch { return []; }
}

function save(orders) {
  localStorage.setItem("amz_orders", JSON.stringify(orders));
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(load);

  const placeOrder = ({ items, total, address, payment, userEmail }) => {
    const order = {
      id: `OD${Date.now()}`,
      items: items.map((i) => ({ ...i, returnStatus: null, review: null })),
      total,
      address,
      payment,
      userEmail: userEmail || null,
      placedAt: new Date().toISOString(),
      status: "Delivered",
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const updated = [order, ...orders];
    setOrders(updated);
    save(updated);
    window.dispatchEvent(new CustomEvent("orders:updated"));
    return order;
  };

  const _patchItem = (orderId, itemId, patch) => {
    const updated = orders.map((o) =>
      o.id !== orderId
        ? o
        : { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
    );
    setOrders(updated);
    save(updated);
  };

  const returnItem = (orderId, itemId, email = null) => {
    _patchItem(orderId, itemId, { returnStatus: "Returned", returnedAt: new Date().toISOString() });
    if (email && itemId) {
      fetch(`${API}/api/customers/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId: itemId }),
      }).catch(() => {});
    }
  };

  const addReview = (orderId, itemId, review) =>
    _patchItem(orderId, itemId, { review });

  return (
    <OrdersContext.Provider value={{ orders, placeOrder, returnItem, addReview }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
