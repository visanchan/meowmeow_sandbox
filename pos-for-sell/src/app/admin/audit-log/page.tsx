import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { formatDateTimeTH } from "@/lib/date";
import { Pill, type PillTone } from "@/components/ui/Pill";

type Row = Database["public"]["Tables"]["audit_logs"]["Row"];

const actionTone = (action: string): PillTone =>
  /void|delete|cancel|reject/i.test(action)
    ? "danger"
    : /approve|create|register|redeem/i.test(action)
      ? "ok"
      : /correct|refund|update|suspend/i.test(action)
        ? "warn"
        : "accent";

const MOCK: Row[] = [
  {
    id: "a-1",
    workspace_id: null,
    user_id: null,
    action: "approve_application",
    target_table: "applications",
    target_id: "00000000-0000-0000-0000-000000000010",
    old_value: null,
    new_value: { brand_name: "Meow House" },
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "a-2",
    workspace_id: "11111111-1111-1111-1111-111111111111",
    user_id: "00000000-0000-0000-0000-aaaaaaaaaaaa",
    action: "create_order",
    target_table: "orders",
    target_id: "00000000-0000-0000-0000-c000000c000c",
    old_value: null,
    new_value: { order_number: "event_017", total_satang: 89000 },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "a-3",
    workspace_id: "11111111-1111-1111-1111-111111111111",
    user_id: "00000000-0000-0000-0000-aaaaaaaaaaaa",
    action: "void_order",
    target_table: "orders",
    target_id: "00000000-0000-0000-0000-c000000c0001",
    old_value: { order_number: "event_011" },
    new_value: { reason: "wrong total" },
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];

export default async function AuditLogPage() {
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
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      rows = data ?? [];
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Failed to load audit log.";
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-accent-strong">Audit log</h1>
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

      <ul className="mt-6 grid gap-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <Pill tone={actionTone(r.action)}>{r.action}</Pill>
              <span className="text-xs text-muted">on {r.target_table}</span>
              <span className="ml-auto text-xs text-muted">
                {formatDateTimeTH(r.created_at)}
              </span>
            </div>
            {r.target_id && (
              <p className="num mt-1 text-[11px] text-muted">{r.target_id}</p>
            )}
            {r.new_value && (
              <pre className="num mt-1 overflow-x-auto rounded-md bg-soft px-2 py-1 text-[11px] text-text">
                {JSON.stringify(r.new_value, null, 0)}
              </pre>
            )}
          </li>
        ))}
        {!errorMsg && rows.length === 0 && (
          <li className="text-sm text-muted">No audit entries.</li>
        )}
      </ul>
    </div>
  );
}
