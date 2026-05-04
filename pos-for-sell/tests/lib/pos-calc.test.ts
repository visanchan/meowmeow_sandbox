import { describe, it, expect } from "vitest";
import { calculateCart } from "@/lib/pos/calc";
import type { CartLine, Product } from "@/lib/pos/types";

const products: Record<string, Product> = {
  a: {
    id: "a",
    workspace_id: "w",
    sku: "A",
    name: "Hoodie",
    category: "apparel",
    price_satang: 89000, // 890 THB
    shipping_fee_satang: 5000, // 50 THB
    send_later_enabled: true,
    is_active: true,
    image_path: null,
    current_qty: 30,
  },
  b: {
    id: "b",
    workspace_id: "w",
    sku: "B",
    name: "Toy",
    category: "toys",
    price_satang: 19000,
    shipping_fee_satang: 3000,
    send_later_enabled: true,
    is_active: true,
    image_path: null,
    current_qty: 50,
  },
};

const lines = (...ls: CartLine[]) => ls;
const line = (productId: string, qty: number, fulfillment: CartLine["fulfillment"] = "take_now"): CartLine =>
  ({ productId, qty, fulfillment });

describe("pos/calculateCart", () => {
  it("zero lines = zero totals", () => {
    expect(calculateCart([], products)).toEqual({
      subtotal: 0, shipping: 0, discount: 0, total: 0,
    });
  });

  it("subtotal = sum(price * qty)", () => {
    expect(calculateCart(lines(line("a", 2), line("b", 3)), products).subtotal).toBe(
      89000 * 2 + 19000 * 3,
    );
  });

  it("shipping is added only for send_later lines", () => {
    const r = calculateCart(
      lines(line("a", 1, "send_later"), line("b", 2, "take_now")),
      products,
    );
    expect(r.shipping).toBe(5000); // only product a, qty 1
    expect(r.subtotal).toBe(89000 + 19000 * 2);
    expect(r.total).toBe(r.subtotal + r.shipping);
  });

  it("discount clamps to non-negative and ≤ subtotal+shipping", () => {
    const r = calculateCart(lines(line("a", 1)), products, 100000);
    expect(r.discount).toBe(89000); // clamped to subtotal
    expect(r.total).toBe(0);
  });

  it("ignores qty <= 0 lines", () => {
    const r = calculateCart(lines(line("a", 0), line("b", -1), line("a", 1)), products);
    expect(r.subtotal).toBe(89000);
  });

  it("ignores unknown productIds", () => {
    const r = calculateCart(lines(line("zzz", 99)), products);
    expect(r.subtotal).toBe(0);
  });

  it("works with Map and Record products", () => {
    const map = new Map(Object.entries(products));
    const r1 = calculateCart(lines(line("a", 1)), map);
    const r2 = calculateCart(lines(line("a", 1)), products);
    expect(r1).toEqual(r2);
  });
});
