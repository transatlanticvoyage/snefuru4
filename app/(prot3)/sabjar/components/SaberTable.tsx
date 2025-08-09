'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface SitesprenData {
  id: string;
  created_at?: string;
  sitespren_base?: string;
  true_root_domain?: string;
  full_subdomain?: string;
  webproperty_type?: string;
  fk_users_id?: string;
  updated_at?: string;
  wpuser1?: string;
  wppass1?: string;
  wp_plugin_installed1?: boolean;
  wp_plugin_connected2?: boolean;
  fk_domreg_hostaccount?: string;
  is_wp_site?: boolean;
  wp_rest_app_pass?: string;
  driggs_industry?: string;
  driggs_city?: string;
  driggs_brand_name?: string;
  driggs_site_type_purpose?: string;
  driggs_email_1?: string;
  driggs_address_full?: string;
  driggs_phone_1?: string;
  driggs_special_note_for_ai_tool?: string;
  ns_full?: string;
  ip_address?: string;
  is_starred1?: string;
  icon_name?: string;
  icon_color?: string;
  is_bulldozer?: boolean;
  driggs_phone1_platform_id?: number;
  driggs_cgig_id?: number;
  driggs_revenue_goal?: number;
  driggs_address_species_id?: number;
  is_competitor?: boolean;
  is_external?: boolean;
  is_internal?: boolean;
  is_ppx?: boolean;
  is_ms?: boolean;
  is_wayback_rebuild?: boolean;
  is_naked_wp_build?: boolean;
  is_rnr?: boolean;
  is_aff?: boolean;
  is_other1?: boolean;
  is_other2?: boolean;
  driggs_citations_done?: boolean;
  is_flylocal?: boolean;
}

interface SaberTableProps {
  className?: string;
}

export default function SaberTable({ className = '' }: SaberTableProps) {
  const { user } = useAuth();
  const [data, setData] = useState<SitesprenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Fetch data function
  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('sitespren')
        .select('*', { count: 'exact' })
        .eq('fk_users_id', user.id);

      // Apply global filter
      if (globalFilter) {
        query = query.or(`sitespren_base.ilike.%${globalFilter}%,driggs_brand_name.ilike.%${globalFilter}%,driggs_industry.ilike.%${globalFilter}%`);
      }

      // Apply column filters
      columnFilters.forEach((filter) => {
        const value = String(filter.value);
        if (value) {
          query = query.ilike(filter.id, `%${value}%`);
        }
      });

      // Apply sorting
      if (sorting.length > 0) {
        const sortItem = sorting[0];
        query = query.order(sortItem.id, { ascending: !sortItem.desc });
      }

      // Apply pagination
      const start = pagination.pageIndex * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);

      const { data: result, error, count } = await query;

      if (error) {
        throw error;
      }

      setData(result || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [user?.id, sorting, columnFilters, globalFilter, pagination.pageIndex, pagination.pageSize]);

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
      header: () => <div className="font-bold lowercase">created_at</div>,
      cell: (info) => info.getValue() ? new Date(String(info.getValue())).toLocaleDateString() : '',
      size: 120,
    },
    {
      accessorKey: 'sitespren_base',
      header: () => <div className="font-bold lowercase">sitespren_base</div>,
      size: 200,
    },
    {
      accessorKey: 'true_root_domain',
      header: () => <div className="font-bold lowercase">true_root_domain</div>,
      size: 150,
    },
    {
      accessorKey: 'full_subdomain',
      header: () => <div className="font-bold lowercase">full_subdomain</div>,
      size: 150,
    },
    {
      accessorKey: 'webproperty_type',
      header: () => <div className="font-bold lowercase">webproperty_type</div>,
      size: 130,
    },
    {
      accessorKey: 'fk_users_id',
      header: () => <div className="font-bold lowercase">fk_users_id</div>,
      size: 120,
    },
    {
      accessorKey: 'updated_at',
      header: () => <div className="font-bold lowercase">updated_at</div>,
      cell: (info) => info.getValue() ? new Date(String(info.getValue())).toLocaleDateString() : '',
      size: 120,
    },
    {
      accessorKey: 'wpuser1',
      header: () => <div className="font-bold lowercase">wpuser1</div>,
      size: 120,
    },
    {
      accessorKey: 'wppass1',
      header: () => <div className="font-bold lowercase">wppass1</div>,
      size: 120,
    },
    {
      accessorKey: 'wp_plugin_installed1',
      header: () => <div className="font-bold lowercase">wp_plugin_installed1</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 120,
    },
    {
      accessorKey: 'wp_plugin_connected2',
      header: () => <div className="font-bold lowercase">wp_plugin_connected2</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 120,
    },
    {
      accessorKey: 'fk_domreg_hostaccount',
      header: () => <div className="font-bold lowercase">fk_domreg_hostaccount</div>,
      size: 150,
    },
    {
      accessorKey: 'is_wp_site',
      header: () => <div className="font-bold lowercase">is_wp_site</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
    {
      accessorKey: 'wp_rest_app_pass',
      header: () => <div className="font-bold lowercase">wp_rest_app_pass</div>,
      size: 150,
    },
    {
      accessorKey: 'driggs_industry',
      header: () => <div className="font-bold lowercase">driggs_industry</div>,
      size: 130,
    },
    {
      accessorKey: 'driggs_city',
      header: () => <div className="font-bold lowercase">driggs_city</div>,
      size: 120,
    },
    {
      accessorKey: 'driggs_brand_name',
      header: () => <div className="font-bold lowercase">driggs_brand_name</div>,
      size: 150,
    },
    {
      accessorKey: 'driggs_site_type_purpose',
      header: () => <div className="font-bold lowercase">driggs_site_type_purpose</div>,
      size: 180,
    },
    {
      accessorKey: 'driggs_email_1',
      header: () => <div className="font-bold lowercase">driggs_email_1</div>,
      size: 150,
    },
    {
      accessorKey: 'driggs_address_full',
      header: () => <div className="font-bold lowercase">driggs_address_full</div>,
      size: 200,
    },
    {
      accessorKey: 'driggs_phone_1',
      header: () => <div className="font-bold lowercase">driggs_phone_1</div>,
      size: 130,
    },
    {
      accessorKey: 'driggs_special_note_for_ai_tool',
      header: () => <div className="font-bold lowercase">driggs_special_note_for_ai_tool</div>,
      size: 220,
    },
    {
      accessorKey: 'ns_full',
      header: () => <div className="font-bold lowercase">ns_full</div>,
      size: 120,
    },
    {
      accessorKey: 'ip_address',
      header: () => <div className="font-bold lowercase">ip_address</div>,
      size: 120,
    },
    {
      accessorKey: 'is_starred1',
      header: () => <div className="font-bold lowercase">is_starred1</div>,
      size: 100,
    },
    {
      accessorKey: 'icon_name',
      header: () => <div className="font-bold lowercase">icon_name</div>,
      size: 100,
    },
    {
      accessorKey: 'icon_color',
      header: () => <div className="font-bold lowercase">icon_color</div>,
      size: 100,
    },
    {
      accessorKey: 'is_bulldozer',
      header: () => <div className="font-bold lowercase">is_bulldozer</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
    {
      accessorKey: 'driggs_phone1_platform_id',
      header: () => <div className="font-bold lowercase">driggs_phone1_platform_id</div>,
      size: 170,
    },
    {
      accessorKey: 'driggs_cgig_id',
      header: () => <div className="font-bold lowercase">driggs_cgig_id</div>,
      size: 120,
    },
    {
      accessorKey: 'driggs_revenue_goal',
      header: () => <div className="font-bold lowercase">driggs_revenue_goal</div>,
      size: 140,
    },
    {
      accessorKey: 'driggs_address_species_id',
      header: () => <div className="font-bold lowercase">driggs_address_species_id</div>,
      size: 170,
    },
    {
      accessorKey: 'is_competitor',
      header: () => <div className="font-bold lowercase">is_competitor</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 110,
    },
    {
      accessorKey: 'is_external',
      header: () => <div className="font-bold lowercase">is_external</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
    {
      accessorKey: 'is_internal',
      header: () => <div className="font-bold lowercase">is_internal</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
    {
      accessorKey: 'is_ppx',
      header: () => <div className="font-bold lowercase">is_ppx</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 80,
    },
    {
      accessorKey: 'is_ms',
      header: () => <div className="font-bold lowercase">is_ms</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 80,
    },
    {
      accessorKey: 'is_wayback_rebuild',
      header: () => <div className="font-bold lowercase">is_wayback_rebuild</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 140,
    },
    {
      accessorKey: 'is_naked_wp_build',
      header: () => <div className="font-bold lowercase">is_naked_wp_build</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 140,
    },
    {
      accessorKey: 'is_rnr',
      header: () => <div className="font-bold lowercase">is_rnr</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 80,
    },
    {
      accessorKey: 'is_aff',
      header: () => <div className="font-bold lowercase">is_aff</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 80,
    },
    {
      accessorKey: 'is_other1',
      header: () => <div className="font-bold lowercase">is_other1</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
    {
      accessorKey: 'is_other2',
      header: () => <div className="font-bold lowercase">is_other2</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
    {
      accessorKey: 'driggs_citations_done',
      header: () => <div className="font-bold lowercase">driggs_citations_done</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 150,
    },
    {
      accessorKey: 'is_flylocal',
      header: () => <div className="font-bold lowercase">is_flylocal</div>,
      cell: (info) => info.getValue() ? '✓' : '✗',
      size: 100,
    },
  ], []);

  const table = useReactTable({
    data,
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

  // Virtual scrolling for rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  // Virtual scrolling for columns
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => {
      return columns[index]?.size || 150;
    },
    overscan: 5,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading Sabertooth Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Global search across all sitespren data..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
          <strong>{Object.keys(rowSelection).length}</strong> of <strong>{totalCount}</strong> selected
        </div>
        <button
          onClick={() => setRowSelection({})}
          className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          Clear Selection
        </button>
      </div>

      {/* Advanced Table Container */}
      <div className="bg-white rounded-lg border shadow">
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ height: '600px' }}
        >
          <div style={{ position: 'relative' }}>
            {/* Fixed Header */}
            <div className="sticky top-0 z-20 bg-gray-50 border-b-2 border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className="flex" style={{ height: '120px' }}>
                  {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                    const header = headerGroup.headers[virtualColumn.index];
                    return (
                      <div
                        key={header.id}
                        className="flex-none border-r border-gray-200 bg-gray-50"
                        style={{
                          width: `${virtualColumn.size}px`,
                          left: `${virtualColumn.start}px`,
                        }}
                      >
                        <div className="p-3 space-y-2">
                          {/* Header with sorting */}
                          <div
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center justify-between"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() && (
                              <span className="ml-1 text-blue-600">
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
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Virtual Rows */}
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    className="absolute left-0 w-full flex hover:bg-blue-50 border-b border-gray-100"
                    style={{
                      height: `${virtualRow.size}px`,
                      top: `${virtualRow.start}px`,
                    }}
                  >
                    {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                      const cell = row.getVisibleCells()[virtualColumn.index];
                      return (
                        <div
                          key={cell.id}
                          className="flex-none px-3 py-4 text-sm text-gray-900 border-r border-gray-100 flex items-center"
                          style={{
                            width: `${virtualColumn.size}px`,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {'<<'}
            </button>
            <button
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {'<'}
            </button>
            <button
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {'>'}
            </button>
            <button
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {'>>'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
              <strong>{table.getPageCount()}</strong>
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Show:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                {[25, 50, 100, 200].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="text-sm">entries</span>
            </div>

            <div className="text-sm text-gray-600">
              Total: <strong>{totalCount}</strong> records
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}