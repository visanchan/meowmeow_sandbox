import Link from "next/link";

export default function ApplySuccessPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-display text-4xl leading-tight tracking-tight text-accent-strong">
          Got it. Thanks.
        </h1>
        <p className="mt-4 text-text/85">
          We&apos;ll review your application and reply within three working
          days. If approved, you&apos;ll get an invite code by email.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-bold text-accent-strong"
          >
            Back to home
          </Link>
          <Link
            href="/apply/status"
            className="btn-accent rounded-[var(--radius-md)] px-5 py-3 text-sm font-bold"
          >
            Check status
          </Link>
        </div>
      </section>
    </main>
  );
}
