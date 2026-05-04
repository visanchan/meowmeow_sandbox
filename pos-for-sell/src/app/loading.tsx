import { Skeleton } from "@/components/ui/States";

export default function RootLoading() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-5 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-6 w-3/4" />
        <Skeleton className="mt-2 h-6 w-1/2" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </section>
    </main>
  );
}
