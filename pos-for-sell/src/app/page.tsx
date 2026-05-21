import Link from "next/link";
import Image from "next/image";
import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function HomePage() {
  const { t } = await getDict();

  const features = [
    { title: t.landing.feature1Title, body: t.landing.feature1Body },
    { title: t.landing.feature2Title, body: t.landing.feature2Body },
    { title: t.landing.feature3Title, body: t.landing.feature3Body },
    { title: t.landing.feature4Title, body: t.landing.feature4Body },
  ];

  return (
    <main className="flex-1">
      {/* Public topbar — shared brand lockup (mirrors /apply) */}
      <header className="mx-auto flex max-w-[1144px] items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <Wordmark className="text-lg" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-bold text-text hover:bg-soft"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero — pitch + brand card */}
      <section className="mx-auto grid max-w-[1144px] items-center gap-12 px-6 pb-4 pt-6 sm:pt-10 lg:grid-cols-[1fr_420px] lg:gap-16">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">
            {t.landing.kicker}
          </p>
          <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight text-accent-strong sm:text-6xl">
            {t.landing.title1}
            <br />
            {t.landing.title2}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text/85">
            {t.landing.body}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="btn-accent inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-base font-bold"
            >
              {t.landing.ctaApply}
            </Link>
            <Link
              href="/apply/status"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-panel px-5 py-3 text-sm font-bold text-accent-strong hover:bg-soft"
            >
              {t.landing.ctaStatus}
            </Link>
          </div>
        </div>

        {/* Brand card — mascot + wordmark + value-prop signature */}
        <aside
          className="grid place-items-center gap-4 rounded-[28px] border border-line px-8 py-12 text-center shadow-[var(--shadow-card)]"
          style={{
            background:
              "linear-gradient(155deg, var(--cream), var(--lavender-100))",
          }}
        >
          <Image
            src="/mochi-mascot.png"
            alt="Mochi the mascot"
            width={320}
            height={320}
            className="h-40 w-40 object-contain drop-shadow-sm sm:h-44 sm:w-44"
            priority
          />
          <Wordmark className="text-3xl" />
          <p className="font-display text-sm italic leading-relaxed text-text/75">
            {t.landing.tagline}
          </p>
        </aside>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-[1144px] px-6 py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <li
              key={f.title}
              className="rounded-2xl border border-line bg-panel p-5 shadow-[var(--shadow-card)]"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-[13px] font-extrabold"
                style={{
                  background: "var(--lavender-200)",
                  color: "var(--color-accent)",
                }}
                aria-hidden
              >
                {i + 1}
              </span>
              <p className="mt-3 font-bold text-accent-strong">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-text/80">
                {f.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing CTA band */}
      <section className="mx-auto max-w-[1144px] px-6 pb-16">
        <div
          className="flex flex-wrap items-center gap-x-8 gap-y-5 rounded-[24px] px-8 py-7"
          style={{ background: "var(--indigo-50)" }}
        >
          <div className="min-w-[260px] flex-1">
            <p
              className="font-display text-xl font-extrabold tracking-tight"
              style={{ color: "var(--color-accent)" }}
            >
              {t.landing.feature4Title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text/85">
              {t.landing.feature4Body}
            </p>
          </div>
          <Link
            href="/apply"
            className="btn-accent inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-base font-bold"
          >
            {t.landing.ctaApply}
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-[1144px] px-6 py-10 text-xs text-muted">
        © {new Date().getFullYear()} {t.landing.footer}
      </footer>
    </main>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight text-accent ${className}`}
    >
      Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
    </span>
  );
}
