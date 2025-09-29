import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="mt-6">
          {Array(7)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center space-x-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 overflow-auto">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32 hidden md:inline-block" />
          </div>
        </header>

        {/* Dashboard Cards Skeleton */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Filter Bar Skeleton */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="p-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <th key={i} className="px-6 py-3">
                            <Skeleton className="h-4 w-full" />
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array(10)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i}>
                          {Array(8)
                            .fill(0)
                            .map((_, j) => (
                              <td key={j} className="px-6 py-4">
                                <Skeleton className="h-4 w-full" />
                              </td>
                            ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pagination Skeleton */}
        <div className="p-4 flex items-center justify-between border-t border-gray-200 bg-white">
          <Skeleton className="h-4 w-40" />
          <div className="flex space-x-1">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
