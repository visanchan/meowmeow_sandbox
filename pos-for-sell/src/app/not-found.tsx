import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          404
        </p>
        <h1 className="font-display text-4xl text-accent-strong">
          Page not found.
        </h1>
        <p className="mt-3 text-text/85">
          That URL doesn&rsquo;t lead anywhere. Try one of these instead.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="btn-accent rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-bold"
          >
            Home
          </Link>
          <Link
            href="/apply"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent-strong"
          >
            Apply to join
          </Link>
        </div>
      </section>
    </main>
  );
}
