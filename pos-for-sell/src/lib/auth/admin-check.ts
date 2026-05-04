import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AdminGuard =
  | { ok: true; userId: string }
  | { ok: false; reason: "not-configured" | "not-authed" | "not-admin"; message: string };

export async function checkAdmin(): Promise<AdminGuard> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      ok: false,
      reason: "not-configured",
      message:
        "Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "not-authed", message: "Sign in required." };
  }

  const { data: row } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) {
    return {
      ok: false,
      reason: "not-admin",
      message: "Admin privilege required.",
    };
  }
  return { ok: true, userId: user.id };
}
