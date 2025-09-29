'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 6,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            {showHeader && (
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {Array(columns)
                    .fill(0)
                    .map((_, i) => (
                      <th key={i} className="px-6 py-3">
                        <Skeleton className="h-4 w-20" />
                      </th>
                    ))}
                </tr>
              </thead>
            )}
            <tbody className="bg-white divide-y divide-gray-200">
              {Array(rows)
                .fill(0)
                .map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array(columns)
                      .fill(0)
                      .map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {colIndex === 0 ? (
                            // First column with avatar-like skeleton
                            <div className="flex items-center">
                              <Skeleton className="h-8 w-8 rounded-full mr-3" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ) : (
                            <Skeleton className="h-4 w-24" />
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface TableSkeletonRowProps {
  columns?: number;
  className?: string;
}

export function TableSkeletonRow({
  columns = 6,
  className,
}: TableSkeletonRowProps) {
  return (
    <tr className={className}>
      {Array(columns)
        .fill(0)
        .map((_, colIndex) => (
          <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
            {colIndex === 0 ? (
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </td>
        ))}
    </tr>
  );
}

export default TableSkeleton;
