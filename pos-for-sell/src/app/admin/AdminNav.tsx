"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Admin top-bar nav. Client component so it can highlight the active route
 * (the Mochi indigo nav pill, mirroring the app shell's TopNav).
 */
const ITEMS = [
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/invite-codes", label: "Invite codes" },
  { href: "/admin/workspaces", label: "Workspaces" },
  { href: "/admin/audit-log", label: "Audit log" },
  { href: "/admin/pilot-status", label: "Pilot status" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {ITEMS.map((it) => {
        const active =
          pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-[10px] px-3 py-2 text-[13px] font-bold text-accent"
                : "rounded-[10px] px-3 py-2 text-[13px] font-bold text-muted transition-colors hover:text-text"
            }
            style={active ? { background: "var(--indigo-50)" } : undefined}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
