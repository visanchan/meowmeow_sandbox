import { Skeleton } from "@/components/ui/States";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Skeleton className="h-9 w-48" />
      <div className="mt-6 grid gap-3">
        <Skeleton className="h-16" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  );
}
