export default function SessionsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
        </div>

        {/* Search skeleton */}
        <div className="mb-4">
          <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-4 py-3">Session name</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created at</th>
                <th className="px-4 py-3">Last updated</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-50" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
