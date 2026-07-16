// Skeleton shimmer shown while server pages load.
export default function Loading() {
  return (
    <div className="py-8 animate-pulse" aria-busy="true" aria-label="loading">
      <div className="h-40 bg-souq-goldlight/30 rounded-3xl mb-6" />
      <div className="h-10 bg-souq-goldlight/30 rounded-full w-full mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-souq-goldlight/40 overflow-hidden">
            <div className="h-36 bg-souq-goldlight/20" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-souq-goldlight/30 rounded w-3/4" />
              <div className="h-3 bg-souq-goldlight/20 rounded w-full" />
              <div className="h-6 bg-souq-goldlight/30 rounded w-1/3 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
