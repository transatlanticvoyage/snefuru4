'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import ExportButton from './ExportButton';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface City {
  city_id: number;
  city_name: string | null;
  state_code: string | null;
  state_full: string | null;
  country: string | null;
  rank_in_pop: number | null;
  gmaps_link: string | null;
  classification: string | null;
  is_suburb: boolean | null;
  associated_principal_city: string | null;
  city_and_state_code: string | null;
  city_population: number | null;
  latitude: number | null;
  longitude: number | null;
  rel_metro_id: number | null;
  fk_dfs_location_code: number | null;
  qty_of_zips_found_in_leadsmart_zip_codes_list: number | null;
  population_last_updated: string | null;
  created_at: string;
  updated_at: string | null;
}

interface CityjarTableProps {
  classificationFilter?: string;
  countryFilter?: string;
}

export default function CityjarTable({ classificationFilter = 'all', countryFilter = 'us' }: CityjarTableProps) {
  const [data, setData] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof City>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    city_name: '',
    state_code: '',
    state_full: '',
    country: '',
    rank_in_pop: 0,
    gmaps_link: '',
    is_suburb: false,
    associated_principal_city: '',
    city_and_state_code: '',
    city_population: 0,
    latitude: 0,
    longitude: 0,
    rel_metro_id: 0,
    population_last_updated: ''
  });

  const supabase = createClientComponentClient();

  // Define columns
  const columns = [
    { key: 'city_id' as keyof City, label: 'city_id', type: 'number', readOnly: true },
    { key: 'city_name' as keyof City, label: 'city_name', type: 'text' },
    { key: 'state_code' as keyof City, label: 'state_code', type: 'text' },
    { key: 'state_full' as keyof City, label: 'state_full', type: 'text' },
    { key: 'country' as keyof City, label: 'country', type: 'text' },
    { key: 'rank_in_pop' as keyof City, label: 'rank_in_pop', type: 'number' },
    { key: 'gmaps_link' as keyof City, label: 'gmaps_link', type: 'text', width: '100px', readOnly: true },
    { key: 'classification' as keyof City, label: 'classification', type: 'text' },
    { key: 'is_suburb' as keyof City, label: 'is_suburb', type: 'boolean' },
    { key: 'associated_principal_city' as keyof City, label: 'associated_principal_city', type: 'text' },
    { key: 'city_and_state_code' as keyof City, label: 'city_and_state_code', type: 'text' },
    { key: 'city_population' as keyof City, label: 'city_population', type: 'number' },
    { key: 'latitude' as keyof City, label: 'latitude', type: 'number' },
    { key: 'longitude' as keyof City, label: 'longitude', type: 'number' },
    { key: 'rel_metro_id' as keyof City, label: 'rel_metro_id', type: 'number' },
    { key: 'fk_dfs_location_code' as keyof City, label: 'fk_dfs_location_code', type: 'number' },
    { key: 'qty_of_zips_found_in_leadsmart_zip_codes_list' as keyof City, label: '~zips~qty~ls', type: 'number' },
    { key: 'population_last_updated' as keyof City, label: 'population_last_updated', type: 'datetime' },
    { key: 'created_at' as keyof City, label: 'created_at', type: 'datetime', readOnly: true },
    { key: 'updated_at' as keyof City, label: 'updated_at', type: 'datetime', readOnly: true }
  ];

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: citiesData, error } = await supabase
        .from('cities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(citiesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    // Apply classification filter
    if (classificationFilter && classificationFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.classification === classificationFilter
      );
    }
    
    // Apply country filter
    if (countryFilter) {
      // Map filter values to actual country names
      const countryMapping: { [key: string]: string } = {
        'us': 'united states',
        'ca': 'canada', 
        'uk': 'united kingdom',
        'nz': 'new zealand',
        'za': 'south africa',
        'au': 'australia'
      };
      
      const targetCountry = countryMapping[countryFilter.toLowerCase()];
      if (targetCountry) {
        filtered = filtered.filter(item => 
          item.country?.toLowerCase() === targetCountry
        );
      }
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
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
  }, [data, searchTerm, sortField, sortOrder, classificationFilter, countryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const startIndex = (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage);
  const paginatedData = itemsPerPage === -1 ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof City) => {
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

      const { error } = await supabase
        .from('cities')
        .update({ [editingCell.field]: processedValue })
        .eq('city_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.city_id === editingCell.id 
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
  const handleBooleanToggle = async (id: number, field: keyof City, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      const { error } = await supabase
        .from('cities')
        .update({ [field]: newValue })
        .eq('city_id', id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.city_id === id ? { ...item, [field]: newValue } : item
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update field');
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    try {
      const newRecord = {
        city_name: 'New City',
        state_code: 'ST',
        state_full: 'State Name',
        country: 'Country',
        rank_in_pop: null,
        gmaps_link: '',
        is_suburb: false,
        associated_principal_city: '',
        city_and_state_code: 'New City, ST',
        city_population: null,
        latitude: null,
        longitude: null,
        rel_metro_id: null,
        population_last_updated: null
      };

      const { data: insertedData, error } = await supabase
        .from('cities')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData([insertedData, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.city_id, field: 'city_name' });
      setEditingValue('New City');
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    try {
      const insertData = {
        city_name: formData.city_name?.trim() || null,
        state_code: formData.state_code?.trim() || null,
        state_full: formData.state_full?.trim() || null,
        country: formData.country?.trim() || null,
        rank_in_pop: formData.rank_in_pop || null,
        gmaps_link: formData.gmaps_link?.trim() || null,
        is_suburb: formData.is_suburb,
        associated_principal_city: formData.associated_principal_city?.trim() || null,
        city_and_state_code: formData.city_and_state_code?.trim() || null,
        city_population: formData.city_population || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        rel_metro_id: formData.rel_metro_id || null,
        population_last_updated: formData.population_last_updated?.trim() || null
      };
      
      const { data: insertedData, error } = await supabase
        .from('cities')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      setData([insertedData, ...data]);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      city_name: '',
      state_code: '',
      state_full: '',
      country: '',
      rank_in_pop: 0,
      gmaps_link: '',
      is_suburb: false,
      associated_principal_city: '',
      city_and_state_code: '',
      city_population: 0,
      latitude: 0,
      longitude: 0,
      rel_metro_id: 0,
      population_last_updated: ''
    });
  };

  // Format population display
  const formatPopulation = (population: number | null) => {
    if (!population) return '';
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    } else if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toString();
  };

  // Render cell content
  const renderCell = (item: City, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.city_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly;

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.city_id, column.key, value as boolean | null)}
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

    // Special handling for gmaps_link column
    if (column.key === 'gmaps_link') {
      // Generate Google Maps URL dynamically
      const generateGoogleMapsUrl = (cityName: string | null, stateFull: string | null) => {
        if (!cityName || !stateFull) return '';
        const searchQuery = `${cityName} ${stateFull}`.replace(/\s+/g, ' ').trim();
        return `https://www.google.com/maps/place/${encodeURIComponent(searchQuery)}`;
      };
      
      const generatedUrl = generateGoogleMapsUrl(item.city_name, item.state_full);
      
      return (
        <div className="flex items-center space-x-1" style={{ width: '100px', maxWidth: '100px', minWidth: '100px' }}>
          {/* Copy button */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (generatedUrl) {
                try {
                  await navigator.clipboard.writeText(generatedUrl);
                  // You could add a toast notification here
                } catch (err) {
                  console.error('Failed to copy to clipboard:', err);
                }
              }
            }}
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold flex items-center justify-center"
            title="Copy Google Maps link to clipboard"
          >
            📋
          </button>
          
          {/* Open button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (generatedUrl) {
                window.open(generatedUrl, '_blank');
              }
            }}
            className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold flex items-center justify-center"
            title="Open in Google Maps"
          >
            OP
          </button>
          
          {/* Map icon instead of text */}
          <div
            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold flex items-center justify-center cursor-pointer"
            title={`Google Maps: ${item.city_name} ${item.state_full}`}
          >
            🗺️
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => handleCellClick(item.city_id, column.key, value)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'}`}
      >
        {column.type === 'datetime' && value ? 
          new Date(value).toLocaleString() : 
          column.key === 'city_population' ? formatPopulation(value as number) :
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
        <div className="text-gray-500">Loading cities...</div>
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
            <NubraTablefaceKite tableType="cities-grid" />
            <ExportButton 
              selectedRows={selectedRows}
              filteredData={filteredAndSortedData}
            />
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
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
          <table className="w-full border-collapse border border-gray-200" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '50px' }}>
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(paginatedData.map(item => item.city_id)));
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
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1"
                    style={(column as any).width ? { 
                      width: (column as any).width, 
                      maxWidth: (column as any).width, 
                      minWidth: (column as any).width 
                    } : {}}
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
                <tr key={item.city_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.city_id)) {
                          newSelected.delete(item.city_id);
                        } else {
                          newSelected.add(item.city_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.city_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
                    </div>
                  </td>
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className="border border-gray-200"
                      style={(column as any).width ? { 
                        width: (column as any).width, 
                        maxWidth: (column as any).width, 
                        minWidth: (column as any).width 
                      } : {}}
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
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>
            <PaginationControls />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New City</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Name</label>
                <input
                  type="text"
                  value={formData.city_name}
                  onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter city name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                <input
                  type="text"
                  value={formData.state_code}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="CA, TX, NY, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Full Name</label>
                <input
                  type="text"
                  value={formData.state_full}
                  onChange={(e) => setFormData({ ...formData, state_full: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="California, Texas, New York, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="United States, Canada, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Population Rank</label>
                <input
                  type="number"
                  value={formData.rank_in_pop}
                  onChange={(e) => setFormData({ ...formData, rank_in_pop: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="1, 2, 3, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Population</label>
                <input
                  type="number"
                  value={formData.city_population}
                  onChange={(e) => setFormData({ ...formData, city_population: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Population count"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="40.7128"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="-74.0060"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metro Area ID</label>
                <input
                  type="number"
                  value={formData.rel_metro_id}
                  onChange={(e) => setFormData({ ...formData, rel_metro_id: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Metro area reference ID"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input
                  type="text"
                  value={formData.gmaps_link}
                  onChange={(e) => setFormData({ ...formData, gmaps_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City and State Code</label>
                <input
                  type="text"
                  value={formData.city_and_state_code}
                  onChange={(e) => setFormData({ ...formData, city_and_state_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="San Francisco, CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Population Last Updated</label>
                <input
                  type="datetime-local"
                  value={formData.population_last_updated}
                  onChange={(e) => setFormData({ ...formData, population_last_updated: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_suburb"
                  checked={formData.is_suburb}
                  onChange={(e) => setFormData({ ...formData, is_suburb: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_suburb" className="text-sm font-medium text-gray-700">
                  Is Suburb
                </label>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated Principal City</label>
                <input
                  type="text"
                  value={formData.associated_principal_city}
                  onChange={(e) => setFormData({ ...formData, associated_principal_city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter associated principal city"
                />
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
                Create City
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}