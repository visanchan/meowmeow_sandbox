import Link from "next/link";
import { redirect } from "next/navigation";
import { checkAdmin } from "@/lib/auth/admin-check";

// Admin gate must run per request.
export const dynamic = "force-dynamic";

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
          <h1 className="font-display text-3xl text-accent-strong">
            Admin offline
          </h1>
          <p className="mt-3 text-text/85">{guard.message}</p>
          <p className="mt-4 text-sm text-muted">
            See <code>pos-for-sell/README.md</code> § Setup.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="flex-1">
      <header className="border-b border-line bg-panel/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-3">
          <Link
            href="/admin"
            className="font-display text-xl text-accent-strong"
          >
            Admin
          </Link>
          <nav className="flex gap-4 text-sm font-bold text-accent-strong/85">
            <Link href="/admin/applications" className="hover:text-accent">
              Applications
            </Link>
            <Link href="/admin/invite-codes" className="hover:text-accent">
              Invite codes
            </Link>
            <Link href="/admin/workspaces" className="hover:text-accent">
              Workspaces
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
