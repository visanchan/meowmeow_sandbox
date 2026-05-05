// Demo product catalog persisted to localStorage.
// Replaced by Supabase `products` table at DD-43..54. Marked clearly so the
// future swap is a focused refactor.

import type { Product } from "@/lib/pos/types";

export const DEMO_CATALOG_KEY = "pos-for-sell:demo-catalog:v1";

export function readDemoCatalog(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CATALOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoCatalog(items: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_CATALOG_KEY, JSON.stringify(items));
  } catch {
    // quota / disabled — silent
  }
}

export function clearDemoCatalog(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_CATALOG_KEY);
}

export function newDemoProductId(): string {
  return `demo-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
