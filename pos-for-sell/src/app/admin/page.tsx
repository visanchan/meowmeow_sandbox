import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-accent-strong">Admin home</h1>
      <p className="mt-2 text-text/85">Pilot operations.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card
          href="/admin/applications"
          title="Applications"
          body="Pending pilot applications."
        />
        <Card
          href="/admin/invite-codes"
          title="Invite codes"
          body="Issued, used, expired."
        />
        <Card
          href="/admin/workspaces"
          title="Workspaces"
          body="Active pilot brands."
        />
        <Card
          href="/admin/audit-log"
          title="Audit log"
          body="Approvals, voids, corrections."
        />
      </ul>
    </div>
  );
}

function Card({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4 hover:border-accent"
      >
        <p className="font-bold text-accent-strong">{title}</p>
        <p className="mt-1 text-sm text-text/80">{body}</p>
      </Link>
    </li>
  );
}
