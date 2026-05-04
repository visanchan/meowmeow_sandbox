import Link from "next/link";

export default async function PosSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  // DD-67 will fetch the real order. Until then, demo-render.
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <div className="panel p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-2xl text-[var(--color-ok-soft-fg)]">
          ✓
        </span>
        <h1 className="mt-4 font-display text-3xl text-accent-strong">
          Sale recorded
        </h1>
        <p className="num mt-2 text-sm text-muted">{orderId}</p>
        <p className="mt-3 text-text/85">
          Receipt emailed to the customer if email was provided.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/app/pos"
            className="btn-accent rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-bold"
          >
            Next sale
          </Link>
          <Link
            href="/app/dashboard"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent-strong"
          >
            Dashboard
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          (DD-67 will render the real order details from the database.)
        </p>
      </div>
    </main>
  );
}
