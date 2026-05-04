import { Skeleton } from "@/components/ui/States";

export default function AdminLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-40" />
      <div className="mt-6 grid gap-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
