"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { validateSku } from "@/lib/sku";
import { bahtToSatang } from "@/lib/money/format";
import type { Product } from "@/lib/pos/types";

type FormValues = {
  sku: string;
  name: string;
  category: string;
  priceBaht: string;
  shippingFeeBaht: string;
  startingQty: string;
  sendLaterEnabled: boolean;
};

const empty = (): FormValues => ({
  sku: "",
  name: "",
  category: "uncategorized",
  priceBaht: "",
  shippingFeeBaht: "0",
  startingQty: "0",
  sendLaterEnabled: true,
});

function fromProduct(p: Product): FormValues {
  return {
    sku: p.sku,
    name: p.name,
    category: p.category,
    priceBaht: (p.price_satang / 100).toString(),
    shippingFeeBaht: (p.shipping_fee_satang / 100).toString(),
    startingQty: String(p.current_qty),
    sendLaterEnabled: p.send_later_enabled,
  };
}

export function ProductFormModal({
  open,
  onClose,
  initial,
  workspaceId,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: Product | null;
  workspaceId: string;
  onSubmit: (values: Omit<Product, "id">, originalId: string | null) => void;
}) {
  const [v, setV] = useState<FormValues>(empty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const { push } = useToast();

  useEffect(() => {
    if (open) {
      setV(initial ? fromProduct(initial) : empty());
      setErrors({});
    }
  }, [open, initial]);

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setV((s) => ({ ...s, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};

    const sku = validateSku(v.sku);
    if (!sku.ok) next.sku = sku.reason;

    if (!v.name.trim()) next.name = "Name is required";
    if (v.name.length > 160) next.name = "Name is too long";

    const price = Number(v.priceBaht);
    if (!Number.isFinite(price) || price < 0) {
      next.priceBaht = "Price must be ≥ 0";
    }

    const shipping = v.shippingFeeBaht.trim() === "" ? 0 : Number(v.shippingFeeBaht);
    if (!Number.isFinite(shipping) || shipping < 0) {
      next.shippingFeeBaht = "Shipping fee must be ≥ 0";
    }

    const qty = v.startingQty.trim() === "" ? 0 : Number(v.startingQty);
    if (!Number.isInteger(qty) || qty < 0) {
      next.startingQty = "Starting qty must be a non-negative integer";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const product: Omit<Product, "id"> = {
      workspace_id: workspaceId,
      sku: sku.ok ? sku.normalized : v.sku,
      name: v.name.trim(),
      category: v.category.trim() || "uncategorized",
      price_satang: bahtToSatang(price),
      shipping_fee_satang: bahtToSatang(shipping),
      send_later_enabled: v.sendLaterEnabled,
      is_active: initial?.is_active ?? true,
      image_path: initial?.image_path ?? null,
      current_qty: qty,
    };

    onSubmit(product, initial?.id ?? null);
    push({
      kind: "success",
      title: initial ? "Product updated" : "Product added",
      message: `${product.sku} — ${product.name}`,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit product" : "Add product"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="grid gap-3">
        <TextInput
          label="SKU"
          value={v.sku}
          onChange={(e) => set("sku", e.currentTarget.value)}
          placeholder="DEMO-001"
          autoComplete="off"
          autoCapitalize="characters"
          error={errors.sku}
          maxLength={32}
          disabled={!!initial}
          hint={initial ? "SKU cannot be changed after creation" : undefined}
        />
        <TextInput
          label="Name"
          value={v.name}
          onChange={(e) => set("name", e.currentTarget.value)}
          placeholder="Cat Hoodie"
          error={errors.name}
          maxLength={160}
        />
        <TextInput
          label="Category"
          value={v.category}
          onChange={(e) => set("category", e.currentTarget.value)}
          placeholder="apparel"
          maxLength={80}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberInput
            label="Price (THB)"
            value={v.priceBaht}
            onChange={(e) => set("priceBaht", e.currentTarget.value)}
            placeholder="890"
            min={0}
            step={1}
            error={errors.priceBaht}
          />
          <NumberInput
            label="Shipping fee (THB, send-later)"
            value={v.shippingFeeBaht}
            onChange={(e) => set("shippingFeeBaht", e.currentTarget.value)}
            placeholder="0"
            min={0}
            step={1}
            error={errors.shippingFeeBaht}
          />
        </div>
        <NumberInput
          label="Starting qty"
          value={v.startingQty}
          onChange={(e) => set("startingQty", e.currentTarget.value)}
          placeholder="30"
          min={0}
          step={1}
          error={errors.startingQty}
        />
        <Checkbox
          checked={v.sendLaterEnabled}
          onChange={(e) => set("sendLaterEnabled", e.currentTarget.checked)}
          label="Send-later enabled"
          hint="Customer can buy this even when out of stock at the booth."
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initial ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
