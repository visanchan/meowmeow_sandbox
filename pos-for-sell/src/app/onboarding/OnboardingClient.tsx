"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { formatTHB } from "@/lib/money/format";

const STEPS = ["Code", "Account", "Brand", "Products", "First event"];
const ACTIVE = 3; // 0-indexed → the Products step

export function OnboardingClient() {
  const { items, ready } = useDemoCatalog();
  const products = items.slice(0, 8);

  return (
    <main className="min-h-dvh">
      {/* Topbar */}
      <header className="mx-auto flex max-w-[1200px] items-center gap-3.5 border-b border-line px-6 py-3.5 sm:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-accent">
            Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
          </span>
        </Link>
        <div className="ml-auto text-xs text-muted">
          Stuck?{" "}
          <Link href="/" className="font-bold text-accent">
            LINE us
          </Link>{" "}
          ·{" "}
          <Link href="/login" className="font-bold text-accent">
            Sign out
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[920px] px-6 pb-20 pt-10 sm:px-7">
        {/* Progress rail */}
        <div className="mb-9 flex items-center gap-3">
          {STEPS.map((s, i) => {
            const done = i < ACTIVE;
            const on = i === ACTIVE;
            return (
              <Fragment key={s}>
                {i > 0 && (
                  <div
                    className="h-0.5 flex-1 rounded"
                    style={{
                      background:
                        i <= ACTIVE
                          ? "var(--color-ok-soft-fg)"
                          : "var(--color-soft)",
                    }}
                  />
                )}
                <div className="flex items-center gap-2.5">
                  <div
                    className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold"
                    style={
                      done
                        ? {
                            background: "var(--color-ok-soft-bg)",
                            color: "var(--color-ok-soft-fg)",
                          }
                        : on
                          ? {
                              background: "var(--color-accent)",
                              color: "#fff",
                              boxShadow: "0 0 0 4px var(--lavender-200)",
                            }
                          : {
                              background: "var(--color-soft)",
                              color: "var(--color-muted)",
                            }
                    }
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className="hidden text-[12px] font-extrabold uppercase tracking-[0.04em] sm:inline"
                    style={{
                      color:
                        i <= ACTIVE
                          ? "var(--color-text)"
                          : "var(--color-muted)",
                    }}
                  >
                    {s}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-line bg-panel p-7 shadow-[var(--shadow-card)] sm:p-10">
          {/* Welcome */}
          <div
            className="mb-7 flex items-center gap-3.5 rounded-2xl p-4"
            style={{ background: "var(--lavender-100)" }}
          >
            <Image
              src="/mochi-mascot.png"
              alt=""
              width={38}
              height={38}
              className="h-9 w-9 object-contain"
            />
            <div>
              <div className="text-sm font-extrabold text-accent">
                Welcome 👋
              </div>
              <div className="mt-0.5 text-xs text-text">
                Your invite is approved — let&apos;s set up your booth so you can
                start selling.
              </div>
            </div>
          </div>

          <div
            className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: "var(--lavender-700)" }}
          >
            Step 4 of 5 · Your products
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-text">
            Add your products
          </h1>
          <p className="mt-2 max-w-[540px] text-[15px] leading-relaxed text-muted">
            Add SKUs one at a time or bulk-import. Aim for ~30 in under 30
            minutes — you can stop and come back anytime.
          </p>

          {/* Product list (real demo catalog) */}
          <div className="mt-6 grid gap-3">
            {ready &&
              products.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-2xl p-3.5 sm:grid-cols-[48px_1fr_auto_auto]"
                  style={{ background: "var(--color-soft)" }}
                >
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl text-base font-extrabold"
                    style={{
                      background: "var(--color-panel)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold text-text">
                      {p.name}
                    </div>
                    <div className="num text-[11px] font-bold text-muted">
                      {p.sku}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted">
                      Price
                    </div>
                    <div className="num text-[13px] font-extrabold text-text">
                      ฿{formatTHB(p.price_satang)}
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="text-right">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-muted">
                        Stock
                      </div>
                      <div className="num text-[13px] font-extrabold text-text">
                        {p.current_qty}
                      </div>
                    </div>
                    {p.send_later_enabled && (
                      <span
                        className="rounded-full px-2 py-1 text-[10px] font-bold"
                        style={{
                          background: "var(--lavender-100)",
                          color: "var(--color-accent)",
                        }}
                      >
                        Send Later
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {ready && products.length === 0 && (
              <p
                className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted"
                style={{ background: "var(--color-soft)" }}
              >
                No products yet — add your first below.
              </p>
            )}

            <Link
              href="/app/setup/products"
              className="flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-line p-4 transition hover:bg-[var(--lavender-100)]"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-xl font-bold"
                style={{
                  background: "var(--color-panel)",
                  color: "var(--color-accent)",
                }}
              >
                +
              </span>
              <span>
                <span className="block text-sm font-extrabold text-text">
                  Add product
                </span>
                <span className="block text-xs text-muted">
                  Manage your full catalog · paste from CSV
                </span>
              </span>
            </Link>
          </div>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-[14px] border border-line bg-panel px-5 py-3.5 text-sm font-bold text-muted opacity-50"
            >
              ← Back
            </button>
            <Link
              href="/app"
              className="rounded-[14px] px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[var(--shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              style={{ background: "var(--grad-primary)" }}
            >
              Next: first event →
            </Link>
            <Link
              href="/app"
              className="ml-auto text-[13px] font-bold text-muted hover:text-accent"
            >
              Skip · I&apos;ll set up later
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {ready ? products.length : 0} product
          {products.length === 1 ? "" : "s"} · saved automatically ·{" "}
          <Link href="/app/setup/products" className="font-bold text-accent">
            view all
          </Link>
        </p>
      </div>
    </main>
  );
}
