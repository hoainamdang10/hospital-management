'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState, EmptyState } from '@/components/common/LoadingSpinner';

export interface Column<T = any> {
  key: string;
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  hidden?: boolean;
  responsive?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T, index: number) => void;
  keyExtractor?: (item: T, index: number) => string | number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    showInfo?: boolean;
    showControls?: boolean;
  };
  actions?: {
    label: string;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    icon?: React.ReactNode;
    className?: string;
    disabled?: (item: T) => boolean;
    hidden?: (item: T) => boolean;
  }[];
}

const getResponsiveClass = (responsive?: string) => {
  switch (responsive) {
    case 'sm':
      return 'hidden sm:table-cell';
    case 'md':
      return 'hidden md:table-cell';
    case 'lg':
      return 'hidden lg:table-cell';
    case 'xl':
      return 'hidden xl:table-cell';
    default:
      return '';
  }
};

const getCellValue = <T,>(item: T, column: Column<T>): React.ReactNode => {
  if (typeof column.accessor === 'function') {
    return column.accessor(item);
  }
  if (typeof column.accessor === 'string') {
    return item[column.accessor] as React.ReactNode;
  }
  return item[column.key as keyof T] as React.ReactNode;
};

export function DataTable<T = any>({
  data,
  columns,
  isLoading = false,
  loadingMessage = 'Loading...',
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items to display.',
  emptyAction,
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  onRowClick,
  keyExtractor,
  pagination,
  actions,
}: DataTableProps<T>) {
  const visibleColumns = columns.filter(col => !col.hidden);
  const totalColumns = visibleColumns.length + (actions && actions.length > 0 ? 1 : 0);

  const getRowKey = (item: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    if (item && typeof item === 'object' && 'id' in item) {
      return (item as any).id;
    }
    return index;
  };

  const getRowClassName = (item: T, index: number): string => {
    const baseClass = 'hover:bg-gray-50';
    const clickableClass = onRowClick ? 'cursor-pointer' : '';

    if (typeof rowClassName === 'function') {
      return cn(baseClass, clickableClass, rowClassName(item, index));
    }
    return cn(baseClass, clickableClass, rowClassName);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <LoadingState message={loadingMessage} />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={cn('w-full', tableClassName)}>
              <thead>
                <tr className={cn(
                  'bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  headerClassName
                )}>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-6 py-3',
                        getResponsiveClass(column.responsive),
                        column.headerClassName
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                  {actions && actions.length > 0 && (
                    <th className="px-6 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr
                    key={getRowKey(item, index)}
                    className={getRowClassName(item, index)}
                    onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                  >
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 whitespace-nowrap',
                          getResponsiveClass(column.responsive),
                          column.className
                        )}
                      >
                        {getCellValue(item, column)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {actions
                            .filter(action => !action.hidden?.(item))
                            .map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                variant={action.variant || 'ghost'}
                                size={action.size || 'sm'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(item);
                                }}
                                disabled={action.disabled?.(item)}
                                className={action.className}
                              >
                                {action.icon}
                                {action.label && <span className={action.icon ? 'ml-1' : ''}>{action.label}</span>}
                              </Button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          {pagination.showInfo !== false && (
            <div className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {pagination.totalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalItems}</span> results
            </div>
          )}
          {pagination.showControls !== false && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;
