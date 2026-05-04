import { ApplyForm } from "./Form";

export default function ApplyPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Pilot · cat-product booths
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-accent-strong">
          Apply to join the pilot
        </h1>
        <p className="mt-3 text-text/85">
          Tell us a bit about your brand. We hand-pick five pilots in the cat
          niche. We&apos;ll reply within three working days.
        </p>

        <div className="panel mt-8 p-6 sm:p-8">
          <ApplyForm />
        </div>
      </section>
    </main>
  );
}
