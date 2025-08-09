'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@apollo/client';
import { GET_SITESPREN_DATA, SitesprenData, FilterInput, SortInput } from '../../lib/graphql-queries';
import { useAuth } from '@/app/context/AuthContext';

interface AdvancedDataGridProps {
  className?: string;
}

export default function AdvancedDataGrid({ className = '' }: AdvancedDataGridProps) {
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Convert table state to GraphQL variables
  const graphqlVariables = useMemo(() => {
    const filters: FilterInput[] = [];
    
    // Add global filter
    if (globalFilter) {
      filters.push({
        field: 'sitespren_base',
        operator: 'contains',
        value: globalFilter,
      });
    }

    // Add column filters
    columnFilters.forEach((filter) => {
      filters.push({
        field: filter.id,
        operator: 'contains',
        value: String(filter.value),
      });
    });

    const sort: SortInput[] = sorting.map((s) => ({
      field: s.id,
      direction: s.desc ? 'desc' : 'asc',
    }));

    return {
      filters,
      sort,
      pagination: {
        offset: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
      },
    };
  }, [sorting, columnFilters, globalFilter, pagination]);

  const { data, loading, error, refetch } = useQuery(GET_SITESPREN_DATA, {
    variables: graphqlVariables,
    skip: !user,
  });

  // Define columns based on sitespren table structure
  const columns = useMemo<ColumnDef<SitesprenData>[]>(() => [
    // Checkbox column
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 50,
    },
    // All sitespren columns in database order
    {
      accessorKey: 'created_at',
      header: 'created_at',
      cell: (info) => info.getValue() ? new Date(String(info.getValue())).toLocaleDateString() : '',
    },
    {
      accessorKey: 'sitespren_base',
      header: 'sitespren_base',
    },
    {
      accessorKey: 'true_root_domain',
      header: 'true_root_domain',
    },
    {
      accessorKey: 'full_subdomain',
      header: 'full_subdomain',
    },
    {
      accessorKey: 'webproperty_type',
      header: 'webproperty_type',
    },
    {
      accessorKey: 'fk_users_id',
      header: 'fk_users_id',
    },
    {
      accessorKey: 'updated_at',
      header: 'updated_at',
      cell: (info) => info.getValue() ? new Date(String(info.getValue())).toLocaleDateString() : '',
    },
    {
      accessorKey: 'wpuser1',
      header: 'wpuser1',
    },
    {
      accessorKey: 'wppass1',
      header: 'wppass1',
    },
    {
      accessorKey: 'wp_plugin_installed1',
      header: 'wp_plugin_installed1',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'wp_plugin_connected2',
      header: 'wp_plugin_connected2',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'fk_domreg_hostaccount',
      header: 'fk_domreg_hostaccount',
    },
    {
      accessorKey: 'is_wp_site',
      header: 'is_wp_site',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'wp_rest_app_pass',
      header: 'wp_rest_app_pass',
    },
    {
      accessorKey: 'driggs_industry',
      header: 'driggs_industry',
    },
    {
      accessorKey: 'driggs_city',
      header: 'driggs_city',
    },
    {
      accessorKey: 'driggs_brand_name',
      header: 'driggs_brand_name',
    },
    {
      accessorKey: 'driggs_site_type_purpose',
      header: 'driggs_site_type_purpose',
    },
    {
      accessorKey: 'driggs_email_1',
      header: 'driggs_email_1',
    },
    {
      accessorKey: 'driggs_address_full',
      header: 'driggs_address_full',
    },
    {
      accessorKey: 'driggs_phone_1',
      header: 'driggs_phone_1',
    },
    {
      accessorKey: 'driggs_special_note_for_ai_tool',
      header: 'driggs_special_note_for_ai_tool',
    },
    {
      accessorKey: 'ns_full',
      header: 'ns_full',
    },
    {
      accessorKey: 'ip_address',
      header: 'ip_address',
    },
    {
      accessorKey: 'is_starred1',
      header: 'is_starred1',
    },
    {
      accessorKey: 'icon_name',
      header: 'icon_name',
    },
    {
      accessorKey: 'icon_color',
      header: 'icon_color',
    },
    {
      accessorKey: 'is_bulldozer',
      header: 'is_bulldozer',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'driggs_phone1_platform_id',
      header: 'driggs_phone1_platform_id',
    },
    {
      accessorKey: 'driggs_cgig_id',
      header: 'driggs_cgig_id',
    },
    {
      accessorKey: 'driggs_revenue_goal',
      header: 'driggs_revenue_goal',
    },
    {
      accessorKey: 'driggs_address_species_id',
      header: 'driggs_address_species_id',
    },
    {
      accessorKey: 'is_competitor',
      header: 'is_competitor',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_external',
      header: 'is_external',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_internal',
      header: 'is_internal',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_ppx',
      header: 'is_ppx',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_ms',
      header: 'is_ms',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_wayback_rebuild',
      header: 'is_wayback_rebuild',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_naked_wp_build',
      header: 'is_naked_wp_build',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_rnr',
      header: 'is_rnr',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_aff',
      header: 'is_aff',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_other1',
      header: 'is_other1',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_other2',
      header: 'is_other2',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'driggs_citations_done',
      header: 'driggs_citations_done',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
    {
      accessorKey: 'is_flylocal',
      header: 'is_flylocal',
      cell: (info) => info.getValue() ? '✓' : '✗',
    },
  ], []);

  const tableData = data?.sitesprenData?.data || [];
  const totalCount = data?.sitesprenData?.totalCount || 0;

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    enableRowSelection: true,
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => {
      return table.getAllColumns()[index]?.getSize() || 150;
    },
    overscan: 5,
  });

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Global search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-600">
          {Object.keys(rowSelection).length} of {totalCount} row(s) selected
        </div>
      </div>

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className="border border-gray-200 rounded-lg overflow-auto"
        style={{ height: '600px' }}
      >
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                  const header = headerGroup.headers[virtualColumn.index];
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-200 cursor-pointer hover:bg-gray-100"
                      style={{
                        position: 'absolute',
                        left: `${virtualColumn.start}px`,
                        width: `${virtualColumn.size}px`,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                      {/* Column Filter */}
                      {header.column.getCanFilter() && (
                        <input
                          type="text"
                          placeholder="Filter..."
                          value={(header.column.getFilterValue() as string) || ''}
                          onChange={(e) => header.column.setFilterValue(e.target.value)}
                          className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50"
                  style={{
                    position: 'absolute',
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                    const cell = row.getVisibleCells()[virtualColumn.index];
                    return (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200"
                        style={{
                          position: 'absolute',
                          left: `${virtualColumn.start}px`,
                          width: `${virtualColumn.size}px`,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>Page</span>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1"
          >
            {[25, 50, 100, 200].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>
      </div>
    </div>
  );
}