'use client';

import React, { useState, useMemo } from 'react';
import { DataTable, DataTableProps, Column } from './DataTable';
import { SearchBar } from '@/components/inputs/SearchBar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SearchableDataTableProps<T = any> extends Omit<DataTableProps<T>, 'data'> {
  data: T[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  onAdd?: () => void;
  addButtonLabel?: string;
  showAddButton?: boolean;
  headerActions?: React.ReactNode;
  title?: string;
  description?: string;
}

export function SearchableDataTable<T = any>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchFields = [],
  onAdd,
  addButtonLabel = 'Add New',
  showAddButton = true,
  headerActions,
  title,
  description,
  pagination,
  ...dataTableProps
}: SearchableDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    return data.filter((item) => {
      // If no search fields specified, search all string fields
      if (searchFields.length === 0) {
        return Object.values(item as any).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Search only specified fields
      return searchFields.some((field) => {
        const value = item[field];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchFields]);

  // Calculate pagination for filtered data
  const itemsPerPage = pagination?.itemsPerPage || 10;
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    pagination?.onPageChange?.(page);
  };

  const paginationConfig = pagination ? {
    ...pagination,
    currentPage,
    totalPages,
    totalItems,
    onPageChange: handlePageChange,
  } : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description || showAddButton || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {showAddButton && onAdd && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        {...dataTableProps}
        data={paginatedData}
        columns={columns}
        pagination={paginationConfig}
      />

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredData.length === 0 ? (
            `No results found for "${searchTerm}"`
          ) : (
            `Found ${filteredData.length} result${filteredData.length === 1 ? '' : 's'} for "${searchTerm}"`
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableDataTable;
