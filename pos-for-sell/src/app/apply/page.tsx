import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ApplyForm } from "./Form";

export default async function ApplyPage() {
  const { t } = await getDict();
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-2xl items-center justify-end px-5 pt-4">
        <LanguageSwitcher />
      </div>
      <section className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
          {t.apply.kicker}
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-accent-strong">
          {t.apply.title}
        </h1>
        <p className="mt-3 text-text/85">{t.apply.body}</p>

        <div className="panel mt-8 p-6 sm:p-8">
          <ApplyForm />
        </div>
      </section>
    </main>
  );
}
