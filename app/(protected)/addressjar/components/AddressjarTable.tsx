'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface AddressData {
  // addresspren fields
  addresspren_id: number;
  user_id: string;
  address_label: string | null;
  fk_addressglub_id: number | null;
  street_1_override: string | null;
  street_2_override: string | null;
  city_override: string | null;
  state_code_override: string | null;
  state_full_override: string | null;
  zip_code_override: string | null;
  country_override: string | null;
  internal_notes: string | null;
  address_purpose: string | null;
  is_primary: boolean | null;
  is_active: boolean | null;
  is_favorite: boolean | null;
  last_used_at: string | null;
  usage_count: number | null;
  sharing_permissions: any;
  addresspren_created_at: string;
  addresspren_updated_at: string | null;
  
  // addressglub fields (joined)
  addressglub_id: number | null;
  full_address_input: string | null;
  street_1: string | null;
  street_2: string | null;
  city: string | null;
  state_code: string | null;
  state_full: string | null;
  zip_code: string | null;
  country_code: string | null;
  country: string | null;
  street_1_clean: string | null;
  full_address_formatted: string | null;
  latitude: number | null;
  longitude: number | null;
  is_validated: boolean | null;
  validation_source: string | null;
  validation_accuracy: string | null;
  plus_four: string | null;
  fk_city_id: number | null;
  fk_address_species_id: number | null;
  addressglub_usage_count: number | null;
  quality_score: number | null;
  confidence_level: number | null;
  is_business: boolean | null;
  is_residential: boolean | null;
  is_po_box: boolean | null;
  is_apartment: boolean | null;
  is_suite: boolean | null;
  data_source: string | null;
  source_reference: string | null;
  addressglub_created_at: string | null;
  addressglub_updated_at: string | null;
  address_hash: string | null;
}

interface AddressjarTableProps {
  onColumnPaginationRender?: (controls: {
    ColumnPaginationBar1: () => JSX.Element | null;
    ColumnPaginationBar2: () => JSX.Element | null;
  }) => void;
}

export default function AddressjarTable({ onColumnPaginationRender }: AddressjarTableProps) {
  const { user } = useAuth();
  const [data, setData] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof AddressData>('addresspren_created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Column pagination states
  const [columnsPerPage, setColumnsPerPage] = useState(12);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    address_label: '',
    fk_addressglub_id: null,
    street_1_override: '',
    street_2_override: '',
    city_override: '',
    state_code_override: '',
    state_full_override: '',
    zip_code_override: '',
    country_override: '',
    internal_notes: '',
    address_purpose: '',
    is_primary: false,
    is_active: true,
    is_favorite: false
  });

  const supabase = createClientComponentClient();

  // Define columns - addresspren on left, addressglub on right
  const columns = [
    // addresspren columns
    { key: 'addresspren_id' as keyof AddressData, label: 'addresspren_id', type: 'number', readOnly: true, width: '120px', group: 'addresspren' },
    { key: 'address_label' as keyof AddressData, label: 'address_label', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'fk_addressglub_id' as keyof AddressData, label: 'fk_addressglub_id', type: 'number', width: '140px', group: 'addresspren', separator: 'right' },
    { key: 'street_1_override' as keyof AddressData, label: 'street_1_override', type: 'text', width: '180px', group: 'addresspren' },
    { key: 'street_2_override' as keyof AddressData, label: 'street_2_override', type: 'text', width: '180px', group: 'addresspren' },
    { key: 'city_override' as keyof AddressData, label: 'city_override', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'state_code_override' as keyof AddressData, label: 'state_code_override', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'state_full_override' as keyof AddressData, label: 'state_full_override', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'zip_code_override' as keyof AddressData, label: 'zip_code_override', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'country_override' as keyof AddressData, label: 'country_override', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'internal_notes' as keyof AddressData, label: 'internal_notes', type: 'text', width: '200px', group: 'addresspren' },
    { key: 'address_purpose' as keyof AddressData, label: 'address_purpose', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'is_primary' as keyof AddressData, label: 'is_primary', type: 'boolean', width: '100px', group: 'addresspren' },
    { key: 'is_active' as keyof AddressData, label: 'is_active', type: 'boolean', width: '100px', group: 'addresspren' },
    { key: 'is_favorite' as keyof AddressData, label: 'is_favorite', type: 'boolean', width: '100px', group: 'addresspren' },
    { key: 'last_used_at' as keyof AddressData, label: 'last_used_at', type: 'datetime', readOnly: true, width: '160px', group: 'addresspren' },
    { key: 'usage_count' as keyof AddressData, label: 'usage_count', type: 'number', width: '120px', group: 'addresspren' },
    { key: 'addresspren_created_at' as keyof AddressData, label: 'created_at', type: 'datetime', readOnly: true, width: '160px', group: 'addresspren', separator: 'right' },
    
    // addressglub columns
    { key: 'addressglub_id' as keyof AddressData, label: 'addressglub_id', type: 'number', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'full_address_input' as keyof AddressData, label: 'full_address_input', type: 'text', width: '300px', group: 'addressglub' },
    { key: 'street_1' as keyof AddressData, label: 'street_1', type: 'text', width: '200px', group: 'addressglub' },
    { key: 'street_2' as keyof AddressData, label: 'street_2', type: 'text', width: '200px', group: 'addressglub' },
    { key: 'city' as keyof AddressData, label: 'city', type: 'text', width: '150px', group: 'addressglub' },
    { key: 'state_code' as keyof AddressData, label: 'state_code', type: 'text', width: '100px', group: 'addressglub' },
    { key: 'state_full' as keyof AddressData, label: 'state_full', type: 'text', width: '150px', group: 'addressglub' },
    { key: 'zip_code' as keyof AddressData, label: 'zip_code', type: 'text', width: '100px', group: 'addressglub' },
    { key: 'country_code' as keyof AddressData, label: 'country_code', type: 'text', width: '100px', group: 'addressglub' },
    { key: 'country' as keyof AddressData, label: 'country', type: 'text', width: '150px', group: 'addressglub' },
    { key: 'street_1_clean' as keyof AddressData, label: 'street_1_clean', type: 'text', readOnly: true, width: '200px', group: 'addressglub' },
    { key: 'full_address_formatted' as keyof AddressData, label: 'full_address_formatted', type: 'text', readOnly: true, width: '300px', group: 'addressglub' },
    { key: 'latitude' as keyof AddressData, label: 'latitude', type: 'number', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'longitude' as keyof AddressData, label: 'longitude', type: 'number', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'is_validated' as keyof AddressData, label: 'is_validated', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub' },
    { key: 'validation_source' as keyof AddressData, label: 'validation_source', type: 'text', readOnly: true, width: '150px', group: 'addressglub' },
    { key: 'validation_accuracy' as keyof AddressData, label: 'validation_accuracy', type: 'text', readOnly: true, width: '150px', group: 'addressglub' },
    { key: 'plus_four' as keyof AddressData, label: 'plus_four', type: 'text', width: '100px', group: 'addressglub' },
    { key: 'fk_city_id' as keyof AddressData, label: 'fk_city_id', type: 'number', readOnly: true, width: '100px', group: 'addressglub' },
    { key: 'fk_address_species_id' as keyof AddressData, label: 'fk_address_species_id', type: 'number', readOnly: true, width: '180px', group: 'addressglub' },
    { key: 'addressglub_usage_count' as keyof AddressData, label: 'usage_count', type: 'number', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'quality_score' as keyof AddressData, label: 'quality_score', type: 'number', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'confidence_level' as keyof AddressData, label: 'confidence_level', type: 'number', readOnly: true, width: '140px', group: 'addressglub' },
    { key: 'is_business' as keyof AddressData, label: 'is_business', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub' },
    { key: 'is_residential' as keyof AddressData, label: 'is_residential', type: 'boolean', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'is_po_box' as keyof AddressData, label: 'is_po_box', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub' },
    { key: 'is_apartment' as keyof AddressData, label: 'is_apartment', type: 'boolean', readOnly: true, width: '120px', group: 'addressglub' },
    { key: 'is_suite' as keyof AddressData, label: 'is_suite', type: 'boolean', readOnly: true, width: '100px', group: 'addressglub' },
    { key: 'data_source' as keyof AddressData, label: 'data_source', type: 'text', width: '120px', group: 'addressglub' },
    { key: 'source_reference' as keyof AddressData, label: 'source_reference', type: 'text', width: '180px', group: 'addressglub' },
    { key: 'addressglub_created_at' as keyof AddressData, label: 'created_at', type: 'datetime', readOnly: true, width: '160px', group: 'addressglub' },
    { key: 'addressglub_updated_at' as keyof AddressData, label: 'updated_at', type: 'datetime', readOnly: true, width: '160px', group: 'addressglub' },
    { key: 'address_hash' as keyof AddressData, label: 'address_hash', type: 'text', readOnly: true, width: '200px', group: 'addressglub' }
  ];

  // WolfExclusionBand - Sticky columns that are excluded from pagination
  const wolfExclusionBandColumns = [
    { key: 'addresspren_id' as keyof AddressData, label: 'addresspren_id', type: 'number', readOnly: true, width: '120px', group: 'addresspren' },
    { key: 'address_label' as keyof AddressData, label: 'address_label', type: 'text', width: '150px', group: 'addresspren' },
    { key: 'fk_addressglub_id' as keyof AddressData, label: 'fk_addressglub_id', type: 'number', width: '140px', group: 'addresspren', separator: 'right' }
  ];

  // Paginated columns - exclude WolfExclusionBand columns
  const paginatedColumns = columns.filter(column => 
    !wolfExclusionBandColumns.some(wolfCol => wolfCol.key === column.key)
  );

  // Column pagination logic
  const totalColumnPages = Math.ceil(paginatedColumns.length / columnsPerPage);
  const startColumnIndex = (currentColumnPage - 1) * columnsPerPage;
  const visiblePaginatedColumns = paginatedColumns.slice(startColumnIndex, startColumnIndex + columnsPerPage);
  
  // Combined visible columns: WolfExclusionBand + paginated columns
  const visibleColumns = [...wolfExclusionBandColumns, ...visiblePaginatedColumns];

  // Column Pagination Components
  // Bar 1: Columns per page quantity selector
  const ColumnPaginationBar1 = () => {
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Cols/page:</span>
          <button
            onClick={() => {
              setColumnsPerPage(6);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-l -mr-px cursor-pointer ${
              columnsPerPage === 6 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 6 ? '#f8f782' : undefined
            }}
          >
            6
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(8);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 8 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 8 ? '#f8f782' : undefined
            }}
          >
            8
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(10);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 10 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 10 ? '#f8f782' : undefined
            }}
          >
            10
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(12);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 12 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 12 ? '#f8f782' : undefined
            }}
          >
            12
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(15);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
              columnsPerPage === 15 ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === 15 ? '#f8f782' : undefined
            }}
          >
            15
          </button>
          <button
            onClick={() => {
              setColumnsPerPage(columns.length);
              setCurrentColumnPage(1);
            }}
            className={`px-2 py-2.5 text-sm border rounded-r cursor-pointer ${
              columnsPerPage === columns.length ? 'text-black border-black' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ 
              fontSize: '14px', 
              paddingTop: '10px', 
              paddingBottom: '10px',
              backgroundColor: columnsPerPage === columns.length ? '#f8f782' : undefined
            }}
          >
            All
          </button>
        </div>
      </div>
    );
  };

  // Bar 2: Current column page selector
  const ColumnPaginationBar2 = () => {
    if (totalColumnPages <= 1) return null;
    
    return (
      <div className="flex items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-600 mr-2">Col page:</span>
          <button
            onClick={() => setCurrentColumnPage(1)}
            disabled={currentColumnPage === 1}
            className="px-2 py-2.5 text-sm border rounded-l -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            First
          </button>
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage - 1)}
            disabled={currentColumnPage === 1}
            className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            Prev
          </button>
          
          {Array.from({ length: Math.min(5, totalColumnPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalColumnPages - 4, currentColumnPage - 2)) + i;
            if (pageNum > totalColumnPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentColumnPage(pageNum)}
                className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                  currentColumnPage === pageNum 
                    ? 'text-black border-black' 
                    : 'bg-white hover:bg-gray-200'
                }`}
                style={{ 
                  fontSize: '14px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px',
                  backgroundColor: currentColumnPage === pageNum ? '#f8f782' : undefined
                }}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentColumnPage(currentColumnPage + 1)}
            disabled={currentColumnPage === totalColumnPages}
            className="px-2 py-2.5 text-sm border -mr-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentColumnPage(totalColumnPages)}
            disabled={currentColumnPage === totalColumnPages}
            className="px-2 py-2.5 text-sm border rounded-r disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white hover:bg-gray-200"
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // Pass pagination components to parent
  useEffect(() => {
    if (onColumnPaginationRender) {
      onColumnPaginationRender({
        ColumnPaginationBar1,
        ColumnPaginationBar2
      });
    }
  }, [onColumnPaginationRender, currentColumnPage, totalColumnPages, columnsPerPage]);

  // Fetch data from Supabase
  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: addressData, error } = await supabase
        .from('addresspren')
        .select(`
          *,
          addressglub:fk_addressglub_id (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the joined data
      const transformedData = addressData?.map(addr => ({
        // addresspren fields
        addresspren_id: addr.addresspren_id,
        user_id: addr.user_id,
        address_label: addr.address_label,
        fk_addressglub_id: addr.fk_addressglub_id,
        street_1_override: addr.street_1_override,
        street_2_override: addr.street_2_override,
        city_override: addr.city_override,
        state_code_override: addr.state_code_override,
        state_full_override: addr.state_full_override,
        zip_code_override: addr.zip_code_override,
        country_override: addr.country_override,
        internal_notes: addr.internal_notes,
        address_purpose: addr.address_purpose,
        is_primary: addr.is_primary,
        is_active: addr.is_active,
        is_favorite: addr.is_favorite,
        last_used_at: addr.last_used_at,
        usage_count: addr.usage_count,
        sharing_permissions: addr.sharing_permissions,
        addresspren_created_at: addr.created_at,
        addresspren_updated_at: addr.updated_at,
        
        // addressglub fields
        addressglub_id: addr.addressglub?.addressglub_id || null,
        full_address_input: addr.addressglub?.full_address_input || null,
        street_1: addr.addressglub?.street_1 || null,
        street_2: addr.addressglub?.street_2 || null,
        city: addr.addressglub?.city || null,
        state_code: addr.addressglub?.state_code || null,
        state_full: addr.addressglub?.state_full || null,
        zip_code: addr.addressglub?.zip_code || null,
        country_code: addr.addressglub?.country_code || null,
        country: addr.addressglub?.country || null,
        street_1_clean: addr.addressglub?.street_1_clean || null,
        full_address_formatted: addr.addressglub?.full_address_formatted || null,
        latitude: addr.addressglub?.latitude || null,
        longitude: addr.addressglub?.longitude || null,
        is_validated: addr.addressglub?.is_validated || null,
        validation_source: addr.addressglub?.validation_source || null,
        validation_accuracy: addr.addressglub?.validation_accuracy || null,
        plus_four: addr.addressglub?.plus_four || null,
        fk_city_id: addr.addressglub?.fk_city_id || null,
        fk_address_species_id: addr.addressglub?.fk_address_species_id || null,
        addressglub_usage_count: addr.addressglub?.usage_count || null,
        quality_score: addr.addressglub?.quality_score || null,
        confidence_level: addr.addressglub?.confidence_level || null,
        is_business: addr.addressglub?.is_business || null,
        is_residential: addr.addressglub?.is_residential || null,
        is_po_box: addr.addressglub?.is_po_box || null,
        is_apartment: addr.addressglub?.is_apartment || null,
        is_suite: addr.addressglub?.is_suite || null,
        data_source: addr.addressglub?.data_source || null,
        source_reference: addr.addressglub?.source_reference || null,
        addressglub_created_at: addr.addressglub?.created_at || null,
        addressglub_updated_at: addr.addressglub?.updated_at || null,
        address_hash: addr.addressglub?.address_hash || null
      })) || [];

      setData(transformedData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    if (searchTerm) {
      filtered = data.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage);
  const paginatedData = itemsPerPage === -1 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof AddressData) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle cell editing
  const handleCellClick = (id: number, field: string, value: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.readOnly || column?.type === 'boolean') return;
    
    setEditingCell({ id, field });
    setEditingValue(value?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      let processedValue: any = editingValue;

      // Process value based on type
      const column = columns.find(col => col.key === editingCell.field);
      if (column?.type === 'number') {
        processedValue = editingValue === '' ? null : Number(editingValue);
      } else if (column?.type === 'datetime') {
        processedValue = editingValue === '' ? null : editingValue;
      } else {
        processedValue = editingValue === '' ? null : editingValue;
      }

      // Determine which table to update based on column group
      const currentItem = data.find(item => item.addresspren_id === editingCell.id);
      if (!currentItem) throw new Error('Item not found');

      if (column?.group === 'addressglub') {
        if (!currentItem.addressglub_id) {
          throw new Error('No addressglub record linked to this addresspren record. Cannot edit addressglub fields.');
        }
        
        // Update addressglub table
        console.log('Updating addressglub table:', {
          field: editingCell.field,
          value: processedValue,
          addressglub_id: currentItem.addressglub_id
        });
        
        const { error } = await supabase
          .from('addressglub')
          .update({ [editingCell.field]: processedValue })
          .eq('addressglub_id', currentItem.addressglub_id);

        if (error) {
          console.error('Addressglub update error:', error);
          throw error;
        }
      } else {
        // Update addresspren table
        const { error } = await supabase
          .from('addresspren')
          .update({ [editingCell.field]: processedValue })
          .eq('addresspren_id', editingCell.id);

        if (error) throw error;
      }

      // Update local data
      setData(data.map(item => 
        item.addresspren_id === editingCell.id 
          ? { ...item, [editingCell.field]: processedValue }
          : item
      ));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating cell:', err);
      alert('Failed to update cell');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle boolean toggle
  const handleBooleanToggle = async (id: number, field: keyof AddressData, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      // Determine which table to update based on column group
      const column = columns.find(col => col.key === field);
      const currentItem = data.find(item => item.addresspren_id === id);
      if (!currentItem) throw new Error('Item not found');

      if (column?.group === 'addressglub') {
        // Update addressglub table
        const { error } = await supabase
          .from('addressglub')
          .update({ [field]: newValue })
          .eq('addressglub_id', currentItem.addressglub_id);

        if (error) throw error;
      } else {
        // Update addresspren table
        const { error } = await supabase
          .from('addresspren')
          .update({ [field]: newValue })
          .eq('addresspren_id', id);

        if (error) throw error;
      }

      // Update local data
      setData(data.map(item => 
        item.addresspren_id === id ? { ...item, [field]: newValue } : item
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update field');
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    if (!user?.id) return;

    try {
      // First create an addressglub entry
      const { data: addressglubData, error: addressglubError } = await supabase
        .from('addressglub')
        .insert([{
          full_address_input: null,
          street_1: 'New Address',
          street_2: null,
          city: 'New City',
          state_code: null,
          state_full: null,
          zip_code: null,
          country_code: 'USA',
          country: 'United States',
          street_1_clean: null,
          full_address_formatted: null,
          latitude: null,
          longitude: null,
          is_validated: false,
          validation_source: null,
          validation_accuracy: null,
          plus_four: null,
          fk_city_id: null,
          fk_address_species_id: null,
          usage_count: 0,
          quality_score: null,
          confidence_level: null,
          is_business: false,
          is_residential: false,
          is_po_box: false,
          is_apartment: false,
          is_suite: false,
          data_source: 'manual',
          source_reference: null,
          address_hash: null
        }])
        .select()
        .single();

      if (addressglubError) throw addressglubError;

      // Now create the addresspren entry linked to the addressglub entry
      const newRecord = {
        user_id: user.id,
        address_label: 'New Address',
        fk_addressglub_id: addressglubData.addressglub_id,
        street_1_override: '',
        street_2_override: '',
        city_override: '',
        state_code_override: '',
        state_full_override: '',
        zip_code_override: '',
        country_override: '',
        internal_notes: '',
        address_purpose: '',
        is_primary: false,
        is_active: true,
        is_favorite: false,
        usage_count: 0
      };

      const { data: insertedData, error } = await supabase
        .from('addresspren')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Create full address data object for display
      const newAddressData: AddressData = {
        addresspren_id: insertedData.addresspren_id,
        user_id: insertedData.user_id,
        address_label: insertedData.address_label,
        fk_addressglub_id: insertedData.fk_addressglub_id,
        street_1_override: insertedData.street_1_override,
        street_2_override: insertedData.street_2_override,
        city_override: insertedData.city_override,
        state_code_override: insertedData.state_code_override,
        state_full_override: insertedData.state_full_override,
        zip_code_override: insertedData.zip_code_override,
        country_override: insertedData.country_override,
        internal_notes: insertedData.internal_notes,
        address_purpose: insertedData.address_purpose,
        is_primary: insertedData.is_primary,
        is_active: insertedData.is_active,
        is_favorite: insertedData.is_favorite,
        last_used_at: insertedData.last_used_at,
        usage_count: insertedData.usage_count,
        sharing_permissions: insertedData.sharing_permissions,
        addresspren_created_at: insertedData.created_at,
        addresspren_updated_at: insertedData.updated_at,
        
        // addressglub fields (from created record)
        addressglub_id: addressglubData.addressglub_id,
        full_address_input: addressglubData.full_address_input,
        street_1: addressglubData.street_1,
        street_2: addressglubData.street_2,
        city: addressglubData.city,
        state_code: addressglubData.state_code,
        state_full: addressglubData.state_full,
        zip_code: addressglubData.zip_code,
        country_code: addressglubData.country_code,
        country: addressglubData.country,
        street_1_clean: addressglubData.street_1_clean,
        full_address_formatted: addressglubData.full_address_formatted,
        latitude: addressglubData.latitude,
        longitude: addressglubData.longitude,
        is_validated: addressglubData.is_validated,
        validation_source: addressglubData.validation_source,
        validation_accuracy: addressglubData.validation_accuracy,
        plus_four: addressglubData.plus_four,
        fk_city_id: addressglubData.fk_city_id,
        fk_address_species_id: addressglubData.fk_address_species_id,
        addressglub_usage_count: addressglubData.usage_count,
        quality_score: addressglubData.quality_score,
        confidence_level: addressglubData.confidence_level,
        is_business: addressglubData.is_business,
        is_residential: addressglubData.is_residential,
        is_po_box: addressglubData.is_po_box,
        is_apartment: addressglubData.is_apartment,
        is_suite: addressglubData.is_suite,
        data_source: addressglubData.data_source,
        source_reference: addressglubData.source_reference,
        addressglub_created_at: addressglubData.created_at,
        addressglub_updated_at: addressglubData.updated_at,
        address_hash: addressglubData.address_hash
      };

      // Add to local data at the beginning
      setData([newAddressData, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.addresspren_id, field: 'address_label' });
      setEditingValue('New Address');
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    if (!user?.id) return;

    try {
      // First create an addressglub entry
      const { data: addressglubData, error: addressglubError } = await supabase
        .from('addressglub')
        .insert([{
          full_address_input: null,
          street_1: formData.street_1_override?.trim() || 'New Address',
          street_2: formData.street_2_override?.trim() || null,
          city: formData.city_override?.trim() || 'New City',
          state_code: formData.state_code_override?.trim() || null,
          state_full: formData.state_full_override?.trim() || null,
          zip_code: formData.zip_code_override?.trim() || null,
          country_code: formData.country_override?.trim() || 'USA',
          country: 'United States',
          street_1_clean: null,
          full_address_formatted: null,
          latitude: null,
          longitude: null,
          is_validated: false,
          validation_source: null,
          validation_accuracy: null,
          plus_four: null,
          fk_city_id: null,
          fk_address_species_id: null,
          usage_count: 0,
          quality_score: null,
          confidence_level: null,
          is_business: false,
          is_residential: false,
          is_po_box: false,
          is_apartment: false,
          is_suite: false,
          data_source: 'manual',
          source_reference: null,
          address_hash: null
        }])
        .select()
        .single();

      if (addressglubError) throw addressglubError;

      // Now create the addresspren entry linked to the addressglub entry
      const insertData = {
        user_id: user.id,
        address_label: formData.address_label?.trim() || null,
        fk_addressglub_id: addressglubData.addressglub_id,
        street_1_override: formData.street_1_override?.trim() || null,
        street_2_override: formData.street_2_override?.trim() || null,
        city_override: formData.city_override?.trim() || null,
        state_code_override: formData.state_code_override?.trim() || null,
        state_full_override: formData.state_full_override?.trim() || null,
        zip_code_override: formData.zip_code_override?.trim() || null,
        country_override: formData.country_override?.trim() || null,
        internal_notes: formData.internal_notes?.trim() || null,
        address_purpose: formData.address_purpose?.trim() || null,
        is_primary: formData.is_primary,
        is_active: formData.is_active,
        is_favorite: formData.is_favorite,
        usage_count: 0
      };
      
      const { data: insertedData, error } = await supabase
        .from('addresspren')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      
      // Refresh data to show new record
      fetchData();
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      address_label: '',
      fk_addressglub_id: null,
      street_1_override: '',
      street_2_override: '',
      city_override: '',
      state_code_override: '',
      state_full_override: '',
      zip_code_override: '',
      country_override: '',
      internal_notes: '',
      address_purpose: '',
      is_primary: false,
      is_active: true,
      is_favorite: false
    });
  };

  // Render cell content
  const renderCell = (item: AddressData, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.addresspren_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly;

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.addresspren_id, column.key, value as boolean | null)}
          className={`w-12 h-6 rounded-full transition-colors ${
            value === true ? 'bg-green-500' : 
            value === false ? 'bg-gray-300' : 'bg-yellow-300'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            value === true ? 'translate-x-6' : 
            value === false ? 'translate-x-1' : 'translate-x-3'
          }`} />
        </button>
      );
    }

    if (column.type === 'boolean' && isReadOnly) {
      return (
        <div className={`w-12 h-6 rounded-full ${
          value === true ? 'bg-green-500' : 
          value === false ? 'bg-gray-300' : 'bg-yellow-300'
        }`}>
          <div className={`w-5 h-5 bg-white rounded-full ${
            value === true ? 'translate-x-6' : 
            value === false ? 'translate-x-1' : 'translate-x-3'
          }`} />
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type={column.type === 'number' ? 'number' : 'text'}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
            autoFocus
          />
          <button onClick={handleCellSave} className="text-green-600 hover:text-green-800">
            ✓
          </button>
          <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">
            ✗
          </button>
        </div>
      );
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.addresspren_id, column.key, value)}
        className={`px-2 py-1 ${!isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'} truncate`}
        title={value?.toString() || ''}
      >
        {column.type === 'datetime' && value ? 
          new Date(value).toLocaleString() : 
          value?.toString() || ''
        }
      </div>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Per page:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setItemsPerPage(value === -1 ? filteredAndSortedData.length : value);
                setCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${itemsPerPage === (value === -1 ? filteredAndSortedData.length : value) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 6 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150 cursor-pointer
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`
                  px-3 py-2 text-sm font-medium border border-gray-300 border-l-0
                  ${currentPage === pageNum ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150 cursor-pointer
                `}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 border-l-0 rounded-r-md
              ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading addresses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NubraTablefaceKite tableType="addresspren-addressglub-join" />
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} addresses
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
            <div className="relative">
              <input
                type="text"
                placeholder="Search all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-80 px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium"
              >
                CL
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewRecordInline}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
            >
              Create New (Inline)
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md text-sm transition-colors"
            >
              Create New (Popup)
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 utg_addressjar" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50">
              {/* Table source row */}
              <tr className="shenfur_db_table_name_tr">
                <th className="px-2 py-2 text-left border border-gray-200 shenfur_db_table_name_row_th for_db_field_none for_db_table_none" style={{ width: '50px' }}>
                  <span className="text-xs">-</span>
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={`source-${column.key}`}
                    className={`text-left border border-gray-200 px-2 py-2 shenfur_db_table_name_row_th for_db_field_${column.group}_${column.key} for_db_table_${column.group} ${
                      column.separator === 'right' ? 'border-r-4 border-r-black' : ''
                    }`}
                    style={{
                      ...(column.width ? { 
                        width: column.width, 
                        maxWidth: column.width, 
                        minWidth: column.width 
                      } : {}),
                      ...(column.separator === 'right' ? { borderRightWidth: '3px', borderRightColor: '#000' } : {})
                    }}
                  >
                    <span className="font-bold text-xs lowercase">
                      {column.group === 'addresspren' ? 'addresspren' : 'addressglub'}
                    </span>
                  </th>
                ))}
              </tr>
              {/* Column names row */}
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200 for_db_field_none for_db_table_none" style={{ width: '50px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.addresspren_id)));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: '20px', height: '20px' }}
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}} // Handled by div onClick
                    />
                  </div>
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1 for_db_field_${column.group}_${column.key} for_db_table_${column.group} ${
                      column.separator === 'right' ? 'border-r-4 border-r-black' : ''
                    }`}
                    style={{
                      ...(column.width ? { 
                        width: column.width, 
                        maxWidth: column.width, 
                        minWidth: column.width 
                      } : {}),
                      ...(column.separator === 'right' ? { borderRightWidth: '3px', borderRightColor: '#000' } : {})
                    }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-xs lowercase">{column.label}</span>
                      {sortField === column.key && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedData.map((item) => (
                <tr key={item.addresspren_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border border-gray-200 for_db_field_none for_db_table_none">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.addresspren_id)) {
                          newSelected.delete(item.addresspren_id);
                        } else {
                          newSelected.add(item.addresspren_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.addresspren_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
                    </div>
                  </td>
                  {visibleColumns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`border border-gray-200 for_db_field_${column.group}_${column.key} for_db_table_${column.group} ${
                        column.separator === 'right' ? 'border-r-4 border-r-black' : ''
                      }`}
                      style={{
                        ...(column.width ? { 
                          width: column.width, 
                          maxWidth: column.width, 
                          minWidth: column.width 
                        } : {}),
                        ...(column.separator === 'right' ? { borderRightWidth: '3px', borderRightColor: '#000' } : {})
                      }}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} addresses
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Address</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
                <input
                  type="text"
                  value={formData.address_label}
                  onChange={(e) => setFormData({ ...formData, address_label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Home, Office, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Addressglub ID</label>
                <input
                  type="number"
                  value={formData.fk_addressglub_id || ''}
                  onChange={(e) => setFormData({ ...formData, fk_addressglub_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional global address reference"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street 1 Override</label>
                <input
                  type="text"
                  value={formData.street_1_override}
                  onChange={(e) => setFormData({ ...formData, street_1_override: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street 2 Override</label>
                <input
                  type="text"
                  value={formData.street_2_override}
                  onChange={(e) => setFormData({ ...formData, street_2_override: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Override</label>
                <input
                  type="text"
                  value={formData.city_override}
                  onChange={(e) => setFormData({ ...formData, city_override: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code Override</label>
                <input
                  type="text"
                  value={formData.state_code_override}
                  onChange={(e) => setFormData({ ...formData, state_code_override: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Purpose</label>
                <input
                  type="text"
                  value={formData.address_purpose}
                  onChange={(e) => setFormData({ ...formData, address_purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Citations, Listings, Shipping, etc."
                />
              </div>

              <div className="col-span-2 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="is_primary" className="text-sm font-medium text-gray-700">
                    Primary Address
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_favorite"
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="is_favorite" className="text-sm font-medium text-gray-700">
                    Favorite
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}