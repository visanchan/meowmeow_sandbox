"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { ProductFormModal } from "./ProductFormModal";
import type { Product } from "@/lib/pos/types";

const DEMO_WORKSPACE_ID = "demo-workspace";

export function CatalogManager() {
  const { items, ready, create, update, remove, setActive } = useDemoCatalog();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const { push } = useToast();

  function add() {
    setEditing(null);
    setOpen(true);
  }

  function edit(p: Product) {
    setEditing(p);
    setOpen(true);
  }

  function handleSubmit(values: Omit<Product, "id">, originalId: string | null) {
    if (originalId) {
      update(originalId, values);
    } else {
      create(values);
    }
  }

  function handleRemove(p: Product) {
    if (confirm(`Remove ${p.sku} — ${p.name}? This cannot be undone in demo mode.`)) {
      remove(p.id);
      push({
        kind: "info",
        title: "Removed",
        message: `${p.sku} deleted from demo catalog.`,
      });
    }
  }

  if (!ready) {
    return (
      <div className="panel mt-8 p-8 text-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            title="No products yet."
            body="Add your first product card. It saves to your browser only — replaced by Supabase rows once configured."
            action={<Button onClick={add}>+ Add product</Button>}
          />
        </div>
        <Link
          href="/app/pos"
          className="mt-6 inline-block text-sm font-bold text-accent-strong"
        >
          Try the POS with bundled demo products →
        </Link>
        <ProductFormModal
          open={open}
          onClose={() => setOpen(false)}
          initial={editing}
          workspaceId={DEMO_WORKSPACE_ID}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length} product{items.length === 1 ? "" : "s"} ·{" "}
          {items.filter((p) => p.is_active).length} active
        </p>
        <Button onClick={add}>+ Add product</Button>
      </div>

      <ul className="mt-4 grid gap-2">
        {items.map((p) => (
          <li
            key={p.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[var(--radius-lg)] border border-line ${p.is_active ? "bg-panel" : "bg-soft/40"} px-4 py-3`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="num text-xs font-bold text-muted">{p.sku}</span>
                <span className="font-extrabold text-text">{p.name}</span>
                {!p.is_active && <Pill tone="neutral">inactive</Pill>}
                {p.send_later_enabled && <Pill tone="ok">send-later</Pill>}
              </div>
              <p className="mt-1 text-xs text-muted">
                {p.category} ·{" "}
                <span className="num">
                  {formatTHB(p.price_satang)} THB
                </span>
                {p.shipping_fee_satang > 0 && (
                  <>
                    {" · ship "}
                    <span className="num">
                      {formatTHB(p.shipping_fee_satang)} THB
                    </span>
                  </>
                )}
                {" · stock "}
                <span className="num">{p.current_qty}</span>
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => edit(p)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActive(p.id, !p.is_active)}
              >
                {p.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRemove(p)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/app/pos"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        Open POS →
      </Link>

      <ProductFormModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        workspaceId={DEMO_WORKSPACE_ID}
        onSubmit={handleSubmit}
      />
    </>
  );
}
