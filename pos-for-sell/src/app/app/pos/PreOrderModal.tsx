"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Textarea } from "@/components/ui/Textarea";
import { useDemoPreOrders } from "@/lib/demo/useDemoPreOrders";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/pos/types";

export function PreOrderModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const { create } = useDemoPreOrders();
  const { push } = useToast();
  const { t } = useT();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setQty("1");
    setNote("");
    setErrors({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Required";
    if (phone.replace(/\D/g, "").length < 8) next.phone = "Looks too short";
    const q = Number(qty);
    if (!Number.isInteger(q) || q < 1) next.qty = "Must be ≥ 1";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    create({
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      qty: q,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || null,
      note: note.trim() || null,
    });
    push({
      kind: "success",
      title: t.preOrders.captured,
      message: `${product.sku} · ${name.trim()}`,
    });
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={
        product ? `${t.preOrders.formTitle} · ${product.sku}` : t.preOrders.formTitle
      }
      size="md"
    >
      {product && (
        <p className="text-sm text-text/85">
          {t.preOrders.formBody(product.name)}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <NumberInput
          label={t.preOrders.fQty}
          value={qty}
          onChange={(e) => setQty(e.currentTarget.value)}
          min={1}
          error={errors.qty}
        />
        <TextInput
          label={t.preOrders.fName}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoComplete="name"
          error={errors.name}
        />
        <TextInput
          label={t.preOrders.fPhone}
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          autoComplete="tel"
          inputMode="tel"
          error={errors.phone}
        />
        <TextInput
          label={t.preOrders.fEmail}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          type="email"
          autoComplete="email"
        />
        <Textarea
          label={t.preOrders.fNote}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          placeholder={t.preOrders.fNotePlaceholder}
          rows={2}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit">{t.preOrders.save}</Button>
        </div>
      </form>
    </Modal>
  );
}
