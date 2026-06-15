import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext.jsx";
import { useOrders } from "../contexts/OrdersContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatPrice, API } from "../utils/format.js";
import { Check, MapPin, CreditCard, ShoppingBag } from "lucide-react";

const PAYMENT_OPTIONS = [
  { id: "upi",        label: "UPI",                 icon: "📱", detail: "Pay via any UPI app" },
  { id: "card",       label: "Credit / Debit Card", icon: "💳", detail: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking",          icon: "🏦", detail: "All major banks supported" },
  { id: "cod",        label: "Cash on Delivery",     icon: "💵", detail: "Pay when delivered" },
];

function StepBadge({ num, done, active }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        done ? "bg-green-500 text-white" : active ? "bg-[#FF9900] text-white" : "bg-gray-200 text-gray-400"
      }`}
    >
      {done ? <Check size={14} /> : num}
    </div>
  );
}

function StepHeader({ num, title, done, active, onEdit }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 ${active ? "border-b border-gray-200" : ""}`}>
      <div className="flex items-center gap-3">
        <StepBadge num={num} done={done} active={active} />
        <span className={`font-bold text-sm ${active ? "text-[#0F1111]" : done ? "text-[#007185]" : "text-[#999]"}`}>
          {title}
        </span>
      </div>
      {done && onEdit && (
        <button onClick={onEdit} className="text-xs text-[#007185] hover:underline">
          Change
        </button>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, itemCount, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [addressForm, setAddressForm] = useState({
    name: user?.name || "",
    line1: "",
    city: user?.city || "",
    pin: "",
    phone: user?.phone || "",
  });
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_OPTIONS[0]);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Shared cart items passed from CartPage (NOT in personal cart)
  const [sharedCheckoutItems] = useState(() => {
    try {
      const raw = localStorage.getItem("al_checkout_shared");
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  });

  // Combined items for checkout display and total calculation
  const allCheckoutItems = [
    ...items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, thumbnail: i.thumbnail, isShared: false })),
    ...sharedCheckoutItems.map((i) => ({ id: i.productId, name: i.name, price: i.price, qty: i.quantity, thumbnail: i.image, isShared: true, coPlanId: i.coPlanId, coPlanName: i.coPlanName })),
  ];
  const checkoutTotal = allCheckoutItems.reduce((s, i) => s + i.price * i.qty, 0);
  const checkoutItemCount = allCheckoutItems.reduce((s, i) => s + i.qty, 0);

  const addressSummary = `${addressForm.line1}, ${addressForm.city} ${addressForm.pin}`.trim().replace(/^,\s*/, "");
  const addressValid = addressForm.name && addressForm.line1 && addressForm.city && addressForm.pin;

  if (allCheckoutItems.length === 0 && step < 4) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-[#0F1111] mb-2">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm mt-2"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    // Place order with all items (personal + shared)
    const orderItems = allCheckoutItems.map((i) => ({
      id: i.id, name: i.name, price: i.price, qty: i.qty, thumbnail: i.thumbnail,
      ...(i.isShared ? { coPlanId: i.coPlanId, coPlanName: i.coPlanName } : {}),
    }));
    const order = placeOrder({ items: orderItems, total: checkoutTotal, address: addressSummary, payment: selectedPayment, userEmail: user?.email });

    // Auto-mark shared cart items as purchased in their specific plans
    if (user?.name && sharedCheckoutItems.length > 0) {
      // Group by plan: { planId: [productId, ...] }
      const planPurchases = {};
      sharedCheckoutItems.forEach((i) => {
        if (!planPurchases[i.coPlanId]) planPurchases[i.coPlanId] = [];
        planPurchases[i.coPlanId].push(i.productId);
      });

      Object.entries(planPurchases).forEach(([planId, productIds]) => {
        fetch(`${API}/api/co-planner/${planId}/checkout-mark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds, memberName: user.name }),
        }).catch(() => {});
      });
    }

    // Clean up
    localStorage.removeItem("al_checkout_shared");
    clearCart();
    setPlacedOrder(order);
    setStep(4);
  };

  // ── Order Confirmation ──────────────────────────────────────────────────
  if (step === 4 && placedOrder) {
    const deliveryDate = new Date(placedOrder.estimatedDelivery).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    });
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={36} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F1111] mb-1">Order placed, thank you!</h1>
          <p className="text-[#565959] text-sm mb-5">
            Confirmation will be sent to your registered email.
          </p>
          <div className="inline-block bg-[#FFF3E0] border border-[#FF9900] rounded-xl px-8 py-3 mb-5">
            <p className="text-[10px] text-[#C7511F] font-bold uppercase tracking-widest mb-0.5">Order ID</p>
            <span className="text-[#C7511F] font-bold text-lg tracking-wide">{placedOrder.id}</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-8 text-sm text-[#007600]">
            Estimated delivery: <strong>{deliveryDate}</strong>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate("/orders")}
              className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm"
            >
              View your orders
            </button>
            <button
              onClick={() => navigate("/")}
              className="border border-gray-300 text-[#0F1111] font-medium px-8 py-2.5 rounded-full text-sm hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#0F1111] mb-5 flex items-center gap-2">
        <ShoppingBag size={20} /> Checkout
      </h1>

      <div className="flex gap-5 flex-wrap lg:flex-nowrap">
        {/* Left: Steps */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* ── Step 1: Address ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <StepHeader
              num={1} title="Delivery Address"
              done={step > 1} active={step === 1}
              onEdit={() => setStep(1)}
            />
            {step === 1 && (
              <div className="px-5 pb-5">
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { key: "name",  label: "Full name",      placeholder: "Your full name",      span: true },
                    { key: "line1", label: "Address",         placeholder: "Street, apartment, area" },
                    { key: "city",  label: "City",            placeholder: "e.g. Bengaluru" },
                    { key: "pin",   label: "PIN code",        placeholder: "6-digit PIN" },
                    { key: "phone", label: "Phone (optional)", placeholder: "+91 XXXXX XXXXX" },
                  ].map(({ key, label, placeholder, span }) => (
                    <div key={key} className={span ? "sm:col-span-2" : ""}>
                      <label className="block text-xs font-medium text-[#565959] mb-1">{label}</label>
                      <input
                        type="text"
                        value={addressForm[key]}
                        onChange={(e) => setAddressForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF9900]"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addressValid && setStep(2)}
                  disabled={!addressValid}
                  className="bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-gray-200 disabled:cursor-not-allowed text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm"
                >
                  Deliver to this address
                </button>
              </div>
            )}
            {step > 1 && (
              <div className="px-5 pb-4 text-sm text-[#565959] flex items-center gap-1.5">
                <MapPin size={12} className="text-[#FF9900]" />
                {addressForm.name} · {addressSummary}
              </div>
            )}
          </div>

          {/* ── Step 2: Payment ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <StepHeader
              num={2} title="Payment Method"
              done={step > 2} active={step === 2}
              onEdit={() => setStep(2)}
            />
            {step === 2 && (
              <div className="px-5 pb-5">
                <div className="space-y-2 mb-4">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPayment.id === opt.id
                          ? "border-[#FF9900] bg-[#FFF8EC]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        className="accent-[#FF9900]"
                        checked={selectedPayment.id === opt.id}
                        onChange={() => setSelectedPayment(opt)}
                      />
                      <span className="text-lg">{opt.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-[#0F1111]">{opt.label}</div>
                        <div className="text-xs text-[#565959]">{opt.detail}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm"
                >
                  Use this payment method
                </button>
              </div>
            )}
            {step > 2 && (
              <div className="px-5 pb-4 text-sm text-[#565959] flex items-center gap-1.5">
                <CreditCard size={12} className="text-[#FF9900]" />
                {selectedPayment.icon} {selectedPayment.label}
              </div>
            )}
          </div>

          {/* ── Step 3: Review & Place Order ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <StepHeader
              num={3} title="Review Items & Place Order"
              done={false} active={step === 3}
              onEdit={null}
            />
            {step === 3 && (
              <div className="px-5 pb-5">
                <div className="divide-y divide-gray-100 mb-5">
                  {allCheckoutItems.map((item) => (
                    <div key={`${item.coPlanId || "personal"}_${item.id}`} className="flex items-center gap-3 py-3">
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-14 h-14 object-contain flex-shrink-0 border border-gray-100 rounded"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/56"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0F1111] line-clamp-2 leading-snug">{item.name}</p>
                        <p className="text-xs text-[#565959] mt-0.5">Qty: {item.qty}</p>
                        {item.isShared && (
                          <p className="text-[10px] text-[#F57C00] mt-0.5">From: {item.coPlanName}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#0F1111] flex-shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[#565959]">Items ({checkoutItemCount})</span>
                    <span className="font-medium">{formatPrice(checkoutTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[#565959]">Delivery</span>
                    <span className="text-[#007600] font-medium">FREE</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2.5 mt-2.5 flex justify-between">
                    <span className="font-bold text-[#0F1111]">Order Total</span>
                    <span className="font-bold text-[#B12704] text-lg">{formatPrice(checkoutTotal)}</span>
                  </div>
                </div>

                <p className="text-xs text-[#565959] mb-4">
                  By placing your order, you agree to Amazon's privacy notice and conditions of use.
                </p>
                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] font-bold py-3 rounded-full text-base"
                >
                  Place your order &nbsp;·&nbsp; {formatPrice(checkoutTotal)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sticky summary */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <button
              onClick={step === 3 ? handlePlaceOrder : undefined}
              disabled={step !== 3}
              className={`w-full font-bold py-2.5 rounded-full text-sm mb-3 transition-colors ${
                step === 3
                  ? "bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Place your order
            </button>
            <p className="text-[11px] text-[#565959] text-center mb-3">
              By placing your order you agree to Amazon's conditions of use.
            </p>
            <div className="border-t border-gray-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#565959]">Items ({checkoutItemCount}):</span>
                <span className="font-bold">{formatPrice(checkoutTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#565959]">Delivery:</span>
                <span className="text-[#007600] font-bold">FREE</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                <span>Order Total:</span>
                <span className="text-[#B12704]">{formatPrice(checkoutTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
