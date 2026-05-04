import Link from "next/link";

export default function SetupProductsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl text-accent-strong">Products</h1>
      <p className="mt-2 text-text/85">Set up SKUs, prices, and images.</p>

      <div className="panel mt-8 p-8 text-center">
        <p className="font-display text-2xl text-accent-strong">
          No products yet.
        </p>
        <p className="mt-2 text-sm text-muted">
          Add your first product card to start using the POS.
        </p>
        <button
          type="button"
          disabled
          className="btn-accent mt-5 inline-flex rounded-2xl px-5 py-3 text-base font-extrabold"
        >
          + Add product
        </button>
        <p className="mt-2 text-xs text-muted">
          (DD-44 wires the create-product modal.)
        </p>
      </div>

      <Link
        href="/app/pos"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        Try the POS with demo products →
      </Link>
    </main>
  );
}
