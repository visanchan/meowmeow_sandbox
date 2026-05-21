import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { checkAdmin } from "@/lib/auth/admin-check";
import { AdminNav } from "./AdminNav";

// Admin gate must run per request.
export const dynamic = "force-dynamic";

function Brand({ withTag = true }: { withTag?: boolean }) {
  return (
    <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
      <Image
        src="/mochi-mascot.png"
        alt=""
        width={30}
        height={30}
        className="h-7 w-7 object-contain"
        priority
      />
      <span className="font-display text-lg font-extrabold tracking-tight text-accent">
        Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
      </span>
      {withTag && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent"
          style={{ background: "var(--indigo-50)" }}
        >
          Admin
        </span>
      )}
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guard = await checkAdmin();

  if (!guard.ok) {
    if (guard.reason === "not-authed") redirect("/login?next=/admin");
    if (guard.reason === "not-admin") redirect("/");
    // not-configured — render an explanatory page so local devs aren't stuck.
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-5 py-16">
          <Brand withTag={false} />
          <div className="mt-6 rounded-[var(--radius-lg)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-accent-strong">
              Admin offline
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text/85">
              {guard.message}
            </p>
            <p className="mt-3 text-xs text-muted">
              See <code>pos-for-sell/README.md</code> § Setup.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="flex-1">
      <header className="sticky top-0 z-10 border-b border-line bg-panel/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5">
          <Brand />
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
