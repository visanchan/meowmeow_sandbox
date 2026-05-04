import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Pilot · invitation only · Thailand
        </p>
        <h1 className="font-display text-5xl leading-[0.92] tracking-tight text-accent-strong sm:text-6xl">
          A POS built for
          <br />
          cat-product booths.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-text/85">
          Sell faster at events. Track stock per event. Take cash, PromptPay,
          transfer or card. Send-later orders included. Close each day in five
          minutes.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="btn-accent inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-base font-bold"
          >
            Apply to join the pilot
          </Link>
          <Link
            href="/apply/status"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-bold text-accent-strong"
          >
            Check application status
          </Link>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          <Feature
            title="Made for booths"
            body="Built from a year of selling at pet expos. Same workflow as our event booth, just multi-tenant."
          />
          <Feature
            title="Real database"
            body="Every sale is in Supabase. Backups, audit trail, cross-device — no localStorage gambles."
          />
          <Feature
            title="Send-later included"
            body="Out-of-stock at the booth? Take payment, ship later. Status flow built in."
          />
          <Feature
            title="Pilot first, free"
            body="Five brands in the cat niche. Hand-picked. Free during pilot."
          />
        </ul>
      </section>

      <footer className="mx-auto max-w-3xl px-5 py-10 text-xs text-muted">
        © {new Date().getFullYear()} Cat Booth POS · pilot
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-[var(--radius-lg)] border border-line bg-panel/70 px-5 py-4">
      <p className="font-bold text-accent-strong">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-text/80">{body}</p>
    </li>
  );
}
