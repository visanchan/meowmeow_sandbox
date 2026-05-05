// Pre-order capture: a customer wants a sold-out product. Capture their
// phone + qty + (optional) note so the booth seller can notify or fulfil
// when stock returns.
//
// Stored separately from DemoOrder because pre-orders aren't sales yet —
// they're declared intent. When a pre-order is fulfilled, the seller can
// either ring it up as a normal sale (linking the pre-order id) or simply
// mark it complete here.

export const DEMO_PRE_ORDERS_KEY = "pos-for-sell:demo-pre-orders:v1";

export type PreOrderStatus = "pending" | "notified" | "fulfilled" | "cancelled";

export type DemoPreOrder = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  qty: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  note: string | null;
  status: PreOrderStatus;
  createdAt: string;
  updatedAt: string;
};

export function readDemoPreOrders(): DemoPreOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_PRE_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoPreOrder[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoPreOrders(items: DemoPreOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_PRE_ORDERS_KEY, JSON.stringify(items));
  } catch {
    // quota — silently drop
  }
}

export function clearDemoPreOrders(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_PRE_ORDERS_KEY);
}

export function newPreOrderId(): string {
  return `preorder-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Pure: filter by status. */
export function filterByStatus(
  preorders: DemoPreOrder[],
  status: PreOrderStatus | "all",
): DemoPreOrder[] {
  if (status === "all") return preorders;
  return preorders.filter((p) => p.status === status);
}

/** Pure: count per-status, including "all". */
export function countByStatus(
  preorders: DemoPreOrder[],
): Record<PreOrderStatus | "all", number> {
  const out = {
    all: preorders.length,
    pending: 0,
    notified: 0,
    fulfilled: 0,
    cancelled: 0,
  } satisfies Record<PreOrderStatus | "all", number>;
  for (const p of preorders) out[p.status] += 1;
  return out;
}
