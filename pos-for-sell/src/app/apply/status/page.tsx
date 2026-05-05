import Link from "next/link";
import { getDict } from "@/lib/i18n/server";

export default async function ApplyStatusPage() {
  const { t } = await getDict();
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-accent-strong">
          {t.apply.statusTitle}
        </h1>
        <p className="mt-3 text-text/85">{t.apply.statusBody}</p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-bold text-accent-strong"
        >
          ← {t.common.home}
        </Link>
      </section>
    </main>
  );
}
