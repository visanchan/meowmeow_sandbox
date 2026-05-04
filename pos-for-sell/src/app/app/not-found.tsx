import Link from "next/link";

export default function AppNotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        404 · /app
      </p>
      <h1 className="font-display text-3xl text-accent-strong">
        Page not found in your workspace.
      </h1>
      <p className="mt-3 text-text/85">
        Try the POS or the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/app"
          className="btn-accent rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-bold"
        >
          App home
        </Link>
        <Link
          href="/app/pos"
          className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent-strong"
        >
          POS
        </Link>
      </div>
    </main>
  );
}
