import React, { createContext, useContext, useState } from "react";

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

  const placeOrder = ({ items, total, address, payment }) => {
    const order = {
      id: `OD${Date.now()}`,
      items: items.map((i) => ({ ...i, returnStatus: null, review: null })),
      total,
      address,
      payment,
      placedAt: new Date().toISOString(),
      status: "Delivered",
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const updated = [order, ...orders];
    setOrders(updated);
    save(updated);
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

  const returnItem = (orderId, itemId) =>
    _patchItem(orderId, itemId, { returnStatus: "Returned", returnedAt: new Date().toISOString() });

  const addReview = (orderId, itemId, review) =>
    _patchItem(orderId, itemId, { review });

  return (
    <OrdersContext.Provider value={{ orders, placeOrder, returnItem, addReview }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
