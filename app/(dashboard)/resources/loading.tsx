import { Skeleton } from "@/components/ui/skeleton";

export default function ResourcesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
