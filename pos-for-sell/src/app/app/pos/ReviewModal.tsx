"use client";

import { useState } from "react";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { formatTHB } from "@/lib/money/format";
import type { Product } from "@/lib/pos/types";

export function ReviewModal({
  products,
  subtotal,
  shipping,
  total,
  onClose,
}: {
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
  onClose: () => void;
}) {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const [confirmed, setConfirmed] = useState(false);
  const productIndex = new Map(products.map((p) => [p.id, p]));
  const hasSendLater = cart.lines.some((l) => l.fulfillment === "send_later");

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(() => {
      dispatch({ type: "CLEAR" });
      onClose();
    }, 1100);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-3 py-6">
      <div className="panel relative w-full max-w-lg p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-soft px-3 py-1 text-sm font-extrabold text-muted"
        >
          ✕
        </button>

        <h2 className="font-display text-2xl text-accent-strong">
          Review sale
        </h2>

        <ul className="mt-4 grid gap-2">
          {cart.lines.map((line) => {
            const p = productIndex.get(line.productId);
            if (!p) return null;
            return (
              <li
                key={line.productId}
                className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted">{p.sku}</p>
                  <p className="font-extrabold text-text">{p.name}</p>
                  <p className="text-xs text-muted">
                    {line.qty} × {formatTHB(p.price_satang)}
                    {line.fulfillment === "send_later" && " · send later"}
                  </p>
                </div>
                <p className="num shrink-0 text-sm font-extrabold text-accent-strong">
                  {formatTHB(p.price_satang * line.qty)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 grid gap-1 text-sm">
          <Row label="Subtotal" value={formatTHB(subtotal)} muted />
          {shipping > 0 && (
            <Row label="Shipping" value={formatTHB(shipping)} muted />
          )}
          {cart.discountSatang > 0 && (
            <Row
              label="Discount"
              value={`-${formatTHB(cart.discountSatang)}`}
              muted
            />
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2">
            <span className="font-display text-lg">Total</span>
            <span className="num text-2xl font-black text-accent-strong">
              {formatTHB(total)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Payment method:{" "}
            <strong className="text-accent-strong">
              {cart.paymentMethod ?? "—"}
            </strong>
          </p>
          {hasSendLater && (
            <p className="rounded-xl border border-[#ddc4a2] bg-[#fff7ec] px-3 py-2 text-xs text-[#6d4c28]">
              Send-later: customer info will be required at confirm (DD-76).
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmed}
          className="btn-accent mt-5 w-full rounded-2xl px-5 py-3 text-base font-extrabold"
        >
          {confirmed ? "Saved (mock)" : "Confirm sale"}
        </button>

        <p className="mt-2 text-center text-xs text-muted">
          DD-65 will replace this with the real <code>create_order</code> RPC.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={muted ? "font-bold text-muted" : "font-bold"}>
        {label}
      </span>
      <span className="num font-bold">{value}</span>
    </div>
  );
}
