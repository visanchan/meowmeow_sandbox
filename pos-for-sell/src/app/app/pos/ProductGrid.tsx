"use client";

import type { Product } from "@/lib/pos/types";
import { ProductCard } from "./ProductCard";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";

export function ProductGrid({ products }: { products: Product[] }) {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const reservedById = new Map(cart.lines.map((l) => [l.productId, l.qty]));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const reserved = reservedById.get(p.id) ?? 0;
        const remaining = Math.max(0, p.current_qty - reserved);
        return (
          <ProductCard
            key={p.id}
            product={p}
            remaining={remaining}
            onAdd={() => dispatch({ type: "ADD", productId: p.id })}
          />
        );
      })}
    </div>
  );
}
