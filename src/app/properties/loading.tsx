import { PropertyCardSkeleton } from "@/components/PropertyCard";

export default function Loading() {
  return (
    <div className="container py-8 sm:py-10" aria-busy="true" aria-label="Loading listings">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-3 h-9 w-80 max-w-full" />
      <div className="skeleton mt-2 h-4 w-40" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="hidden space-y-4 rounded-2xl border border-stone-200 bg-white p-5 lg:block">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-11 w-full" />
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-end">
            <div className="skeleton h-11 w-56" />
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
