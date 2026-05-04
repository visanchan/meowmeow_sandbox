"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error]", error);
  }, [error]);

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl text-accent-strong">
          Something broke.
        </h1>
        <p className="mt-3 text-text/85">
          The page hit an error. We&rsquo;ve logged it; please try again.
        </p>
        {error.digest && (
          <p className="num mt-2 text-xs text-muted">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-accent rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-bold"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent-strong"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
