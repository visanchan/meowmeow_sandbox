"use client";

import { CartProvider } from "@/lib/pos/cart-store";
import type { Product } from "@/lib/pos/types";
import { ProductGrid } from "./ProductGrid";
import { CartPanel } from "./CartPanel";

export function POSWorkspace({ products }: { products: Product[] }) {
  return (
    <CartProvider>
      <div className="mx-auto flex max-w-7xl gap-5 px-3 py-4 lg:px-5">
        <div className="min-w-0 flex-1 pb-[40dvh] lg:pb-0">
          <ProductGrid products={products} />
        </div>
        <aside className="hidden w-[440px] flex-none lg:block">
          <div className="sticky top-4">
            <CartPanel products={products} />
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-panel/95 backdrop-blur shadow-[0_-12px_30px_rgba(77,53,29,0.12)] lg:hidden">
        <CartPanel products={products} compact />
      </div>
    </CartProvider>
  );
}
