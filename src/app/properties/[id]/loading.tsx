export default function Loading() {
  return (
    <div className="container py-6 sm:py-8" aria-busy="true" aria-label="Loading property">
      <div className="skeleton mb-4 h-4 w-56" />
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="skeleton aspect-[4/3] rounded-3xl sm:col-span-3 sm:row-span-2 sm:aspect-[16/10]" />
        <div className="skeleton hidden rounded-3xl sm:block" />
        <div className="skeleton hidden rounded-3xl sm:block" />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-4 w-2/3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-40 w-full" />
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  );
}
