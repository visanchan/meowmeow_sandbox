import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-3xl text-accent-strong">
          Register with invite code
        </h1>
        <p className="mt-3 text-text/85">
          Got an invite email? Use the code to create your workspace.
        </p>
        <p className="mt-2 text-sm text-muted">
          (DD-33 to DD-38 will wire this page to the invite-redemption flow.)
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-bold text-accent-strong"
        >
          ← Home
        </Link>
      </section>
    </main>
  );
}
