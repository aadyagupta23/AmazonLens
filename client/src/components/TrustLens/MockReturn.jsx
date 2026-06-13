import React, { useState } from "react";
import { PackageOpen, X, Check, AlertTriangle } from "lucide-react";

const REASONS = [
  "Item not as described",
  "Defective or doesn't work",
  "Wrong item sent",
  "Changed my mind",
  "Better price available",
  "Arrived damaged",
  "Missing parts or accessories",
];

export default function MockReturn({ productId, productName, onReturnFiled }) {
  const storageKey = `returns_${productId}`;
  const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState("select"); // select | confirm | done
  const [returns, setReturns] = useState(existing);

  const handleSubmit = () => {
    if (!reason) return;
    setStep("confirm");
  };

  const handleConfirm = () => {
    const entry = { reason, timestamp: new Date().toISOString(), productId };
    const updated = [...returns, entry];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setReturns(updated);
    setStep("done");
    onReturnFiled?.(updated.length);
  };

  const handleClose = () => {
    setOpen(false);
    setStep("select");
    setReason("");
  };

  const returnCount = returns.length;

  return (
    <>
      {/* Trigger row */}
      <div className="flex items-center justify-between py-3 px-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <PackageOpen size={13} className="text-[#565959]" />
          <span className="text-xs text-[#565959]">
            {returnCount > 0
              ? `${returnCount} return${returnCount > 1 ? "s" : ""} simulated for this product`
              : "Simulate a return to affect the trust signal"}
          </span>
        </div>
        <button
          onClick={() => { setOpen(true); setStep("select"); setReason(""); }}
          className="text-xs text-[#007185] hover:underline font-medium"
        >
          Return this item
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#FF9900] text-[11px] font-bold uppercase tracking-widest">
                  Return Request — Simulated
                </p>
                <p className="text-white text-sm font-semibold mt-0.5 leading-snug line-clamp-1">
                  {productName}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5">
              {step === "select" && (
                <>
                  <p className="text-sm font-medium text-[#0F1111] mb-3">
                    Why are you returning this item?
                  </p>
                  <div className="space-y-2">
                    {REASONS.map((r) => (
                      <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="returnReason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="accent-[#FF9900]"
                        />
                        <span className="text-sm text-[#0F1111] group-hover:text-[#C7511F]">{r}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-700">
                      This is a <strong>simulated return</strong> for demo purposes. It will update the TrustLens return rate signal for this seller in real time.
                    </p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason}
                    className="mt-4 w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:opacity-40 text-[#0F1111] font-bold text-sm py-2.5 rounded-full"
                  >
                    Continue
                  </button>
                </>
              )}

              {step === "confirm" && (
                <>
                  <p className="text-sm font-medium text-[#0F1111] mb-2">Confirm your return</p>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs text-[#565959] mb-1">Reason selected</p>
                    <p className="text-sm font-medium text-[#0F1111]">{reason}</p>
                  </div>
                  <p className="text-xs text-[#565959] mb-4">
                    Confirming this return will increment the seller's global return rate (Rg) in the TrustLens formula, lowering the company trust score.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("select")}
                      className="flex-1 border border-gray-300 text-sm text-[#0F1111] py-2.5 rounded-full hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 bg-[#CC0C39] hover:bg-[#B00832] text-white font-bold text-sm py-2.5 rounded-full"
                    >
                      Confirm Return
                    </button>
                  </div>
                </>
              )}

              {step === "done" && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <p className="font-bold text-[#0F1111] text-sm">Return filed successfully</p>
                  <p className="text-xs text-[#565959] mt-1">
                    Seller return rate updated — TrustLens will recalculate the company score.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold text-sm py-2.5 rounded-full"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
