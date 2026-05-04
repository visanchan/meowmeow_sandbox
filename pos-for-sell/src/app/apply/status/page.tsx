import Link from "next/link";

export default function ApplyStatusPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-accent-strong">
          Check application status
        </h1>
        <p className="mt-3 text-text/85">
          Status check is opening soon. In the meantime, watch your inbox — we
          reply within three working days.
        </p>
        <p className="mt-2 text-sm text-muted">
          (DD-19 will wire this page to the database.)
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-bold text-accent-strong"
        >
          ← Home
        </Link>
      </section>
    </main>
  );
}
