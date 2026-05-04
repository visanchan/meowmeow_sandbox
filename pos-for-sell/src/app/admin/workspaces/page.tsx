import { createClient } from "@/lib/supabase/server";
import type { Database, WorkspaceStatus } from "@/lib/database.types";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { formatDateTimeTH } from "@/lib/date";

type Row = Database["public"]["Tables"]["workspaces"]["Row"];

const toneFor = (s: WorkspaceStatus): PillTone =>
  s === "active" ? "ok" : s === "suspended" ? "warn" : "neutral";

const MOCK: Row[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    brand_name: "Meow House",
    slug: "meow-house",
    owner_user_id: "00000000-0000-0000-0000-aaaaaaaaaaaa",
    industry: "cat_product",
    status: "active",
    setup_complete: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    brand_name: "Cat Tokyo",
    slug: "cat-tokyo",
    owner_user_id: "00000000-0000-0000-0000-bbbbbbbbbbbb",
    industry: "cat_product",
    status: "active",
    setup_complete: false,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export default async function WorkspacesPage() {
  let rows: Row[] = [];
  let isMock = false;
  let errorMsg: string | null = null;

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      isMock = true;
      rows = MOCK;
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      rows = data ?? [];
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Failed to load workspaces.";
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-accent-strong">Workspaces</h1>
      {isMock && (
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--color-warn-soft-fg)]">
          Demo mode
        </p>
      )}

      {errorMsg && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]">
          {errorMsg}
        </p>
      )}

      <ul className="mt-6 grid gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="font-display text-lg text-accent-strong">
                  {row.brand_name}
                </p>
                <p className="text-xs text-muted">/{row.slug}</p>
              </div>
              <div className="flex gap-2">
                <Pill tone={toneFor(row.status)}>{row.status}</Pill>
                <Pill tone={row.setup_complete ? "ok" : "warn"}>
                  {row.setup_complete ? "set up" : "setup pending"}
                </Pill>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">
              {row.industry} · created {formatDateTimeTH(row.created_at)}
            </p>
          </li>
        ))}
        {!errorMsg && rows.length === 0 && (
          <li className="text-sm text-muted">No workspaces yet.</li>
        )}
      </ul>
    </div>
  );
}
