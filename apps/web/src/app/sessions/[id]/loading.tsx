export default function SessionDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <header className="border-b bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="h-7 w-7 animate-pulse rounded bg-gray-100" />
          <div>
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="ml-auto h-5 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>
      </header>

      {/* Tabs skeleton */}
      <div className="border-b bg-white px-6">
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Upload zone skeleton */}
          <div className="h-28 animate-pulse rounded-xl border-2 border-dashed border-gray-200 bg-gray-50" />

          {/* Document list skeleton */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-transparent p-3">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-gray-50" />
              </div>
              <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
