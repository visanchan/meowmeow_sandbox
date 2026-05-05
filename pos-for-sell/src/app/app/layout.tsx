import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const dynamic = "force-dynamic";

type AppGuard =
  | { mode: "configured"; workspaceName: string; userId: string }
  | { mode: "demo"; reason: string };

async function checkClient(): Promise<AppGuard | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { mode: "demo", reason: "Supabase not configured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) {
    return { mode: "demo", reason: "No workspace yet" };
  }

  const { data: ws } = await supabase
    .from("workspaces")
    .select("brand_name")
    .eq("id", member.workspace_id)
    .maybeSingle();

  if (!ws) {
    return { mode: "demo", reason: "Workspace missing" };
  }

  return {
    mode: "configured",
    workspaceName: ws.brand_name,
    userId: user.id,
  };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guard = await checkClient();
  if (guard === null) redirect("/login?next=/app");

  const { t } = await getDict();
  const headerName =
    guard.mode === "configured" ? guard.workspaceName : "Demo Brand";

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-line bg-panel/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-5">
          <Link
            href="/app"
            className="font-display text-xl text-accent-strong"
          >
            {headerName}
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold text-accent-strong/85 sm:gap-4">
            <Link href="/app/pos" className="hover:text-accent">
              {t.chrome.pos}
            </Link>
            <Link href="/app/setup/products" className="hover:text-accent">
              {t.chrome.products}
            </Link>
            <Link href="/app/dashboard" className="hover:text-accent">
              {t.chrome.dashboard}
            </Link>
            <Link href="/app/send-later" className="hover:text-accent">
              {t.chrome.sendLater}
            </Link>
            <Link href="/app/correction" className="hover:text-accent">
              {t.chrome.corrections}
            </Link>
            <Link href="/app/audit-log" className="hover:text-accent">
              {t.chrome.auditLog}
            </Link>
            <Link href="/app/settings" className="hover:text-accent">
              {t.chrome.settings}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {guard.mode === "demo" && (
              <span className="rounded-full border border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-warn-soft-fg)]">
                {t.common.demoMode} · {guard.reason}
              </span>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
