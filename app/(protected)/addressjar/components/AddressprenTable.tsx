'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface Address {
  address_id: number;
  address_datum: string | null;
  street_number: string | null;
  street_name: string | null;
  apartment_unit: string | null;
  city: string | null;
  state_code: string | null;
  state_full: string | null;
  zip_code: string | null;
  country_code: string | null;
  country_full: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
  geocode_provider: string | null;
  geocode_confidence: number | null;
  address_formatted: string | null;
  address_validation_status: string | null;
  address_validated_at: string | null;
  validation_provider: string | null;
  usage_count: number | null;
  last_used_at: string | null;
  user_internal_id: string;
  created_at: string;
  updated_at: string | null;
  address_notes: string | null;
  address_source: string | null;
  is_primary: boolean | null;
  is_verified: boolean | null;
  
  // Organizational entities (joined data)
  org_entities?: {
    starred: boolean;
    flagged: boolean;
    circled: boolean;
    squared: boolean;
    triangled: boolean;
  };
  
  // Tags (joined data)
  tags?: Array<{
    tag_id: number;
    tag_name: string;
    tag_color: string | null;
  }>;
}

interface Tag {
  tag_id: number;
  tag_name: string;
  tag_color: string | null;
  tag_description: string | null;
}

export default function AddressprenTable() {
  const { user } = useAuth();
  const [data, setData] = useState<Address[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof Address>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTagForAddress, setEditingTagForAddress] = useState<number | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data for creating
  const [formData, setFormData] = useState({
    address_datum: '',
    street_number: '',
    street_name: '',
    apartment_unit: '',
    city: '',
    state_code: '',
    state_full: '',
    zip_code: '',
    country_code: 'US',
    country_full: 'United States',
    latitude: 0,
    longitude: 0,
    address_notes: '',
    address_source: 'manual',
    is_primary: false,
    is_verified: false
  });

  const supabase = createClientComponentClient();

  // Define columns
  const columns = [
    { key: 'address_id' as keyof Address, label: 'ID', type: 'number', readOnly: true, width: '80px' },
    { key: 'address_datum' as keyof Address, label: 'address', type: 'text', width: '300px' },
    { key: 'street_number' as keyof Address, label: 'st_num', type: 'text', width: '80px' },
    { key: 'street_name' as keyof Address, label: 'street', type: 'text', width: '200px' },
    { key: 'apartment_unit' as keyof Address, label: 'unit', type: 'text', width: '80px' },
    { key: 'city' as keyof Address, label: 'city', type: 'text', width: '150px' },
    { key: 'state_code' as keyof Address, label: 'state', type: 'text', width: '60px' },
    { key: 'zip_code' as keyof Address, label: 'zip', type: 'text', width: '80px' },
    { key: 'country_code' as keyof Address, label: 'country', type: 'text', width: '70px' },
    { key: 'latitude' as keyof Address, label: 'lat', type: 'number', width: '90px' },
    { key: 'longitude' as keyof Address, label: 'lng', type: 'number', width: '90px' },
    { key: 'address_validation_status' as keyof Address, label: 'status', type: 'text', width: '80px' },
    { key: 'usage_count' as keyof Address, label: 'usage', type: 'number', width: '70px' },
    { key: 'is_primary' as keyof Address, label: 'primary', type: 'boolean', width: '70px' },
    { key: 'is_verified' as keyof Address, label: 'verified', type: 'boolean', width: '70px' },
    { key: 'address_source' as keyof Address, label: 'source', type: 'text', width: '80px' },
    { key: 'last_used_at' as keyof Address, label: 'last_used', type: 'datetime', readOnly: true, width: '120px' },
    { key: 'created_at' as keyof Address, label: 'created', type: 'datetime', readOnly: true, width: '120px' }
  ];

  // Fetch data from Supabase
  const fetchData = async () => {
    if (!user?.user_internal_id) return;

    try {
      setLoading(true);
      
      // Fetch addresses with organizational entities
      const { data: addressData, error } = await supabase
        .from('addresspren')
        .select(`
          *,
          addresspren_org_entities (
            starred,
            flagged,
            circled,
            squared,
            triangled
          )
        `)
        .eq('user_internal_id', user.user_internal_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to flatten org_entities
      const transformedData = addressData?.map(addr => ({
        ...addr,
        org_entities: addr.addresspren_org_entities?.[0] || {
          starred: false,
          flagged: false,
          circled: false,
          squared: false,
          triangled: false
        }
      })) || [];

      setData(transformedData);
      
      // Also fetch available tags for this user
      const { data: tagsData, error: tagsError } = await supabase
        .from('addresspren_tags')
        .select('*')
        .eq('user_id', user.user_internal_id)
        .order('tag_position', { ascending: true });

      if (!tagsError) {
        setTags(tagsData || []);
      }
      
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
  const handleSort = (field: keyof Address) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle organizational entity toggle
  const handleEntityToggle = async (addressId: number, entity: 'starred' | 'flagged' | 'circled' | 'squared' | 'triangled') => {
    if (!user?.user_internal_id) return;

    try {
      const address = data.find(a => a.address_id === addressId);
      if (!address) return;

      const currentValue = address.org_entities?.[entity] || false;
      const newValue = !currentValue;

      // Update or create org entity record
      const { error } = await supabase
        .from('addresspren_org_entities')
        .upsert({
          fk_addresspren_id: addressId,
          user_id: user.user_internal_id,
          [entity]: newValue
        }, {
          onConflict: 'fk_addresspren_id,user_id'
        });

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.address_id === addressId 
          ? { 
              ...item, 
              org_entities: {
                ...item.org_entities,
                [entity]: newValue
              }
            }
          : item
      ));
    } catch (err) {
      console.error('Error toggling entity:', err);
      alert('Failed to update entity');
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
        .from('addresspren')
        .update({ [editingCell.field]: processedValue })
        .eq('address_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.address_id === editingCell.id 
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
  const handleBooleanToggle = async (id: number, field: keyof Address, currentValue: boolean | null) => {
    const newValue = currentValue === null ? true : !currentValue;
    
    try {
      const { error } = await supabase
        .from('addresspren')
        .update({ [field]: newValue })
        .eq('address_id', id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.address_id === id ? { ...item, [field]: newValue } : item
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update field');
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    if (!user?.user_internal_id) return;

    try {
      const newRecord = {
        address_datum: 'New Address',
        street_number: '',
        street_name: '',
        apartment_unit: '',
        city: '',
        state_code: '',
        state_full: '',
        zip_code: '',
        country_code: 'US',
        country_full: 'United States',
        latitude: null,
        longitude: null,
        address_notes: '',
        address_source: 'manual',
        is_primary: false,
        is_verified: false,
        user_internal_id: user.user_internal_id
      };

      const { data: insertedData, error } = await supabase
        .from('addresspren')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      // Add org entities structure
      const addressWithEntities = {
        ...insertedData,
        org_entities: {
          starred: false,
          flagged: false,
          circled: false,
          squared: false,
          triangled: false
        }
      };

      // Add to local data at the beginning
      setData([addressWithEntities, ...data]);
      
      // Set first editable cell to editing mode
      setEditingCell({ id: insertedData.address_id, field: 'address_datum' });
      setEditingValue('New Address');
    } catch (err) {
      console.error('Error creating record:', err);
      alert('Failed to create record');
    }
  };

  // Handle popup form submission
  const handleCreateSubmit = async () => {
    if (!user?.user_internal_id) return;

    try {
      const insertData = {
        address_datum: formData.address_datum?.trim() || null,
        street_number: formData.street_number?.trim() || null,
        street_name: formData.street_name?.trim() || null,
        apartment_unit: formData.apartment_unit?.trim() || null,
        city: formData.city?.trim() || null,
        state_code: formData.state_code?.trim() || null,
        state_full: formData.state_full?.trim() || null,
        zip_code: formData.zip_code?.trim() || null,
        country_code: formData.country_code?.trim() || 'US',
        country_full: formData.country_full?.trim() || 'United States',
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        address_notes: formData.address_notes?.trim() || null,
        address_source: formData.address_source || 'manual',
        is_primary: formData.is_primary,
        is_verified: formData.is_verified,
        user_internal_id: user.user_internal_id
      };
      
      const { data: insertedData, error } = await supabase
        .from('addresspren')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      setIsCreateModalOpen(false);
      resetForm();
      
      // Add org entities structure
      const addressWithEntities = {
        ...insertedData,
        org_entities: {
          starred: false,
          flagged: false,
          circled: false,
          squared: false,
          triangled: false
        }
      };
      
      setData([addressWithEntities, ...data]);
    } catch (err) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      address_datum: '',
      street_number: '',
      street_name: '',
      apartment_unit: '',
      city: '',
      state_code: '',
      state_full: '',
      zip_code: '',
      country_code: 'US',
      country_full: 'United States',
      latitude: 0,
      longitude: 0,
      address_notes: '',
      address_source: 'manual',
      is_primary: false,
      is_verified: false
    });
  };

  // Render organizational entities
  const renderOrgEntities = (address: Address) => {
    const entities = address.org_entities || {
      starred: false,
      flagged: false,
      circled: false,
      squared: false,
      triangled: false
    };

    return (
      <div className="flex space-x-1">
        <button
          onClick={() => handleEntityToggle(address.address_id, 'starred')}
          className={`w-6 h-6 rounded ${entities.starred ? 'bg-yellow-400' : 'bg-gray-200'} flex items-center justify-center text-xs`}
          title="Star"
        >
          ⭐
        </button>
        <button
          onClick={() => handleEntityToggle(address.address_id, 'flagged')}
          className={`w-6 h-6 rounded ${entities.flagged ? 'bg-red-400' : 'bg-gray-200'} flex items-center justify-center text-xs`}
          title="Flag"
        >
          🚩
        </button>
        <button
          onClick={() => handleEntityToggle(address.address_id, 'circled')}
          className={`w-6 h-6 rounded-full ${entities.circled ? 'bg-blue-400' : 'bg-gray-200'} flex items-center justify-center text-xs`}
          title="Circle"
        >
          ●
        </button>
        <button
          onClick={() => handleEntityToggle(address.address_id, 'squared')}
          className={`w-6 h-6 ${entities.squared ? 'bg-green-400' : 'bg-gray-200'} flex items-center justify-center text-xs`}
          title="Square"
        >
          ■
        </button>
        <button
          onClick={() => handleEntityToggle(address.address_id, 'triangled')}
          className={`w-6 h-6 ${entities.triangled ? 'bg-purple-400' : 'bg-gray-200'} flex items-center justify-center text-xs`}
          title="Triangle"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
        >
          ▲
        </button>
      </div>
    );
  };

  // Render cell content
  const renderCell = (item: Address, column: typeof columns[0]) => {
    const value = item[column.key];
    const isEditing = editingCell?.id === item.address_id && editingCell?.field === column.key;
    const isReadOnly = column.readOnly;

    if (column.type === 'boolean' && !isReadOnly) {
      return (
        <button
          onClick={() => handleBooleanToggle(item.address_id, column.key, value as boolean | null)}
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

    return (
      <div
        onClick={() => handleCellClick(item.address_id, column.key, value)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 ${!isReadOnly ? 'cursor-text' : 'cursor-default'} truncate`}
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
            <NubraTablefaceKite tableType="addresspren-grid" />
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
                        setSelectedRows(new Set(paginatedData.map(item => item.address_id)));
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
                <th className="px-2 py-3 text-left border border-gray-200" style={{ width: '160px' }}>
                  <span className="font-bold text-xs lowercase">entities</span>
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left cursor-pointer hover:bg-gray-100 border border-gray-200 px-2 py-1"
                    style={column.width ? { 
                      width: column.width, 
                      maxWidth: column.width, 
                      minWidth: column.width 
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
                <tr key={item.address_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 border border-gray-200">
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedRows);
                        if (newSelected.has(item.address_id)) {
                          newSelected.delete(item.address_id);
                        } else {
                          newSelected.add(item.address_id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={selectedRows.has(item.address_id)}
                        onChange={() => {}} // Handled by div onClick
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1 border border-gray-200" style={{ width: '160px', maxWidth: '160px', minWidth: '160px' }}>
                    {renderOrgEntities(item)}
                  </td>
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className="border border-gray-200"
                      style={column.width ? { 
                        width: column.width, 
                        maxWidth: column.width, 
                        minWidth: column.width 
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Address</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <input
                  type="text"
                  value={formData.address_datum}
                  onChange={(e) => setFormData({ ...formData, address_datum: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="123 Main St, Anytown, CA 12345"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Number</label>
                <input
                  type="text"
                  value={formData.street_number}
                  onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  type="text"
                  value={formData.street_name}
                  onChange={(e) => setFormData({ ...formData, street_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Main St"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit/Apt</label>
                <input
                  type="text"
                  value={formData.apartment_unit}
                  onChange={(e) => setFormData({ ...formData, apartment_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Apt 2B"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Anytown"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                <input
                  type="text"
                  value={formData.state_code}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Full Name</label>
                <input
                  type="text"
                  value={formData.state_full}
                  onChange={(e) => setFormData({ ...formData, state_full: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="California"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="12345"
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
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.address_notes}
                  onChange={(e) => setFormData({ ...formData, address_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes about this address..."
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
                    id="is_verified"
                    checked={formData.is_verified}
                    onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="is_verified" className="text-sm font-medium text-gray-700">
                    Verified
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