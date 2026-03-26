import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = () => (
  <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  </div>
);

export default PageSkeleton;
