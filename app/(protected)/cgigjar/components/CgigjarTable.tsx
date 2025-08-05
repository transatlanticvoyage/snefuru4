'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import InputsExpandEditor from '@/app/components/shared/InputsExpandEditor';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

const DrenjariButtonBarDriggsmanLinks = dynamic(
  () => import('@/app/components/DrenjariButtonBarDriggsmanLinks'),
  { ssr: false }
);

interface CitationGig {
  cgig_id: number;
  user_id: string | null;
  cgig_title: string;
  cgig_description: string | null;
  seller_name: string;
  seller_profile_url: string | null;
  cgig_url: string;
  marketplace: string;
  marketplace_category: string | null;
  inputs_v1: string | null;
  inputs_v2: string | null;
  inputs_v3: string | null;
  base_price: number;
  currency: string;
  citations_included: number | null;
  turnaround_days: number | null;
  seller_rating: number | null;
  total_reviews: number;
  da_range: string | null;
  provides_report: boolean;
  quality_score: number | null;
  orders_placed: number;
  last_order_date: string | null;
  is_active: boolean;
  internal_notes: string | null;
  icon_name: string | null;
  icon_color: string | null;
  created_at: string;
  updated_at: string;
}

export default function CgigjarTable() {
  const [data, setData] = useState<CitationGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof CitationGig>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CitationGig | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Expand popup states
  const [expandPopup, setExpandPopup] = useState<{ id: number; field: 'inputs_v1' | 'inputs_v2' | 'inputs_v3'; value: string } | null>(null);
  
  // Form data for creating/editing
  const [formData, setFormData] = useState({
    cgig_title: '',
    cgig_description: '',
    seller_name: '',
    seller_profile_url: '',
    cgig_url: '',
    marketplace: 'fiverr',
    marketplace_category: '',
    inputs_v1: '',
    inputs_v2: '',
    inputs_v3: '',
    base_price: 0,
    currency: 'USD',
    citations_included: 0,
    turnaround_days: 0,
    seller_rating: 0,
    total_reviews: 0,
    da_range: '',
    provides_report: true,
    quality_score: 0,
    orders_placed: 0,
    last_order_date: '',
    is_active: true,
    internal_notes: '',
    icon_name: '',
    icon_color: ''
  });
  
  const supabase = createClientComponentClient();
  
  // Column definitions
  const columns: Array<{ 
    key: keyof CitationGig; 
    type: string; 
    width: string; 
    label: string;
  }> = [
    { key: 'cgig_id', type: 'integer', width: '80px', label: 'cgig_id' },
    { key: 'user_id', type: 'text', width: '100px', label: 'user_id' },
    { key: 'cgig_title', type: 'text', width: '250px', label: 'cgig_title' },
    { key: 'cgig_description', type: 'text', width: '300px', label: 'cgig_description' },
    { key: 'seller_name', type: 'text', width: '150px', label: 'seller_name' },
    { key: 'seller_profile_url', type: 'text', width: '200px', label: 'seller_profile_url' },
    { key: 'cgig_url', type: 'text', width: '200px', label: 'cgig_url' },
    { key: 'marketplace', type: 'text', width: '120px', label: 'marketplace' },
    { key: 'marketplace_category', type: 'text', width: '150px', label: 'marketplace_category' },
    { key: 'inputs_v1', type: 'text', width: '120px', label: 'inputs_v1' },
    { key: 'inputs_v2', type: 'text', width: '120px', label: 'inputs_v2' },
    { key: 'inputs_v3', type: 'text', width: '120px', label: 'inputs_v3' },
    { key: 'base_price', type: 'number', width: '100px', label: 'base_price' },
    { key: 'currency', type: 'text', width: '80px', label: 'currency' },
    { key: 'citations_included', type: 'integer', width: '120px', label: 'citations_included' },
    { key: 'turnaround_days', type: 'integer', width: '100px', label: 'turnaround_days' },
    { key: 'seller_rating', type: 'number', width: '100px', label: 'seller_rating' },
    { key: 'total_reviews', type: 'integer', width: '100px', label: 'total_reviews' },
    { key: 'da_range', type: 'text', width: '100px', label: 'da_range' },
    { key: 'provides_report', type: 'boolean', width: '120px', label: 'provides_report' },
    { key: 'quality_score', type: 'integer', width: '100px', label: 'quality_score' },
    { key: 'orders_placed', type: 'integer', width: '100px', label: 'orders_placed' },
    { key: 'last_order_date', type: 'timestamp', width: '150px', label: 'last_order_date' },
    { key: 'is_active', type: 'boolean', width: '100px', label: 'is_active' },
    { key: 'internal_notes', type: 'text', width: '250px', label: 'internal_notes' },
    { key: 'icon_name', type: 'text', width: '120px', label: 'icon_name' },
    { key: 'icon_color', type: 'text', width: '120px', label: 'icon_color' },
    { key: 'created_at', type: 'timestamp', width: '180px', label: 'created_at' },
    { key: 'updated_at', type: 'timestamp', width: '180px', label: 'updated_at' }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get internal user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        setError('User not found in users table');
        setLoading(false);
        return;
      }
      
      const { data: tableData, error: fetchError } = await supabase
        .from('citation_gigs')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      console.error('Error fetching citation gigs:', err);
      setError('Failed to fetch citation gigs');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (!searchTerm) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage));
  const paginatedData = itemsPerPage === -1 
    ? filteredAndSortedData 
    : filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof CitationGig) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.cgig_id)));
    }
  };

  // Handle row selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle inline editing
  const handleCellClick = (id: number, field: string, value: any) => {
    setEditingCell({ id, field });
    setEditingValue(value?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const { id, field } = editingCell;
      const column = columns.find(col => col.key === field);
      
      let processedValue: any = editingValue;
      
      // Process value based on type
      if (column?.type === 'integer' || column?.type === 'number') {
        processedValue = parseFloat(editingValue) || 0;
      } else if (column?.type === 'boolean') {
        processedValue = editingValue === 'true';
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { error } = await supabase
        .from('citation_gigs')
        .update({ [field]: processedValue })
        .eq('cgig_id', id)
        .eq('user_id', userData.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.cgig_id === id ? { ...item, [field]: processedValue } : item
      ));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating cell:', err);
      alert('Failed to update cell');
    }
  };

  // Handle expand popup
  const handleExpandClick = (id: number, field: 'inputs_v1' | 'inputs_v2' | 'inputs_v3', value: string) => {
    setExpandPopup({ id, field, value: value || '' });
  };

  const handleExpandSave = async (newValue: string) => {
    if (!expandPopup) return;

    const { id, field } = expandPopup;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('User not authenticated');

    // Get internal user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) throw new Error('User not found');
    
    const { error } = await supabase
      .from('citation_gigs')
      .update({ [field]: newValue })
      .eq('cgig_id', id)
      .eq('user_id', userData.id);

    if (error) throw error;

    // Update local data
    setData(data.map(item => 
      item.cgig_id === id ? { ...item, [field]: newValue } : item
    ));
  };

  const handleExpandClose = () => {
    setExpandPopup(null);
  };

  const handleBooleanToggle = async (id: number, field: keyof CitationGig, currentValue: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { error } = await supabase
        .from('citation_gigs')
        .update({ [field]: !currentValue })
        .eq('cgig_id', id)
        .eq('user_id', userData.id);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.cgig_id === id ? { ...item, [field]: !currentValue } : item
      ));
    } catch (err) {
      console.error('Error toggling boolean:', err);
      alert('Failed to update');
    }
  };

  // Create new row inline
  const handleCreateInline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const newRow = {
        user_id: userData.id,
        cgig_title: 'New Citation Gig',
        cgig_description: '',
        seller_name: 'New Seller',
        cgig_url: 'https://example.com',
        marketplace: 'fiverr',
        base_price: 0,
        currency: 'USD',
        provides_report: true,
        total_reviews: 0,
        orders_placed: 0,
        is_active: true
      };

      const { data: createdData, error } = await supabase
        .from('citation_gigs')
        .insert([newRow])
        .select()
        .single();

      if (error) throw error;

      setData([createdData, ...data]);
      
      // Start editing the title of the new row
      setTimeout(() => {
        handleCellClick(createdData.cgig_id, 'cgig_title', createdData.cgig_title);
      }, 100);
    } catch (err) {
      console.error('Error creating row:', err);
      alert('Failed to create new row');
    }
  };

  // Create new with popup
  const handleCreatePopup = () => {
    setFormData({
      cgig_title: '',
      cgig_description: '',
      seller_name: '',
      seller_profile_url: '',
      cgig_url: '',
      marketplace: 'fiverr',
      marketplace_category: '',
      base_price: 0,
      currency: 'USD',
      citations_included: 0,
      turnaround_days: 0,
      seller_rating: 0,
      total_reviews: 0,
      da_range: '',
      provides_report: true,
      quality_score: 0,
      orders_placed: 0,
      last_order_date: '',
      is_active: true,
      internal_notes: '',
      icon_name: '',
      icon_color: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { data: createdData, error } = await supabase
        .from('citation_gigs')
        .insert([{ ...formData, user_id: userData.id }])
        .select()
        .single();

      if (error) throw error;

      setData([createdData, ...data]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating citation gig:', err);
      alert('Failed to create citation gig');
    }
  };

  // Delete selected rows
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    
    if (!confirm(`Delete ${selectedRows.size} selected items?`)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { error } = await supabase
        .from('citation_gigs')
        .delete()
        .in('cgig_id', Array.from(selectedRows))
        .eq('user_id', userData.id);

      if (error) throw error;

      setData(data.filter(item => !selectedRows.has(item.cgig_id)));
      setSelectedRows(new Set());
    } catch (err) {
      console.error('Error deleting rows:', err);
      alert('Failed to delete rows');
    }
  };

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Show:</span>
        <div className="inline-flex" role="group">
          {[10, 20, 50, 100, 200, 500, -1].map((value, index) => (
            <button
              key={value}
              onClick={() => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              className={`
                px-3 py-2 text-sm font-medium border border-gray-300
                ${itemsPerPage === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                ${index === 0 ? 'rounded-l-md' : ''}
                ${index === 6 ? 'rounded-r-md' : ''}
                ${index > 0 ? 'border-l-0' : ''}
                transition-colors duration-150
              `}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {value === -1 ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {/* Page selector */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Page:</span>
        <div className="inline-flex" role="group">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-3 py-2 text-sm font-medium border border-gray-300 rounded-l-md
              ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
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
                  ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'}
                  transition-colors duration-150
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
              ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}
              transition-colors duration-150
            `}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Search box */}
      <div className="flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ height: '38px' }}
        />
        <button
          onClick={() => setSearchTerm('')}
          className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold border border-yellow-400 rounded-r-md text-sm transition-colors duration-150"
          style={{ height: '38px' }}
        >
          CL
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading citation gigs...</div>
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
    <div className="px-6 py-4">
      {/* Drenjari Navigation Links */}
      <DrenjariButtonBarDriggsmanLinks />
      
      {/* Nubra Tableface Kite */}
      <div className="mb-2">
        <NubraTablefaceKite tableType="cgigjar-citation-gigs" />
      </div>

      {/* Top Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={handleCreateInline}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Create New (Inline)
          </button>
          <button
            onClick={handleCreatePopup}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create New (Popup)
          </button>
          {selectedRows.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete Selected ({selectedRows.size})
            </button>
          )}
        </div>
        <PaginationControls />
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {/* Checkbox column */}
                <th 
                  className="w-12 px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={handleSelectAll}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-gray-300 focus:outline-none"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </th>
                {/* Data columns */}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                      column.key === 'inputs_v1' ? 'border-l-2 border-l-black' : ''
                    } ${
                      column.key === 'inputs_v3' ? 'border-r-2 border-r-black' : ''
                    }`}
                    style={{ width: column.width, minWidth: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {sortField === column.key && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row) => (
                <tr key={row.cgig_id} className="hover:bg-gray-50">
                  {/* Checkbox */}
                  <td 
                    className="w-12 px-2 py-2 cursor-pointer"
                    onClick={() => handleRowSelect(row.cgig_id)}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.cgig_id)}
                        onChange={() => {}}
                        className="w-5 h-5 rounded border-gray-300 focus:outline-none"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </div>
                  </td>
                  {/* Data cells */}
                  {columns.map((column) => {
                    const value = row[column.key];
                    const isEditing = editingCell?.id === row.cgig_id && editingCell?.field === column.key;

                    if (column.type === 'boolean') {
                      return (
                        <td 
                          key={column.key} 
                          className={`px-3 py-2 text-sm text-gray-900 ${
                            column.key === 'inputs_v1' ? 'border-l-2 border-l-black' : ''
                          } ${
                            column.key === 'inputs_v3' ? 'border-r-2 border-r-black' : ''
                          }`}
                        >
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={() => handleBooleanToggle(row.cgig_id, column.key, !!value)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                      );
                    }

                    // Special handling for inputs_v* columns
                    if (column.key.startsWith('inputs_v')) {
                      return (
                        <td
                          key={column.key}
                          className={`px-3 py-2 text-sm text-gray-900 ${
                            column.key === 'inputs_v1' ? 'border-l-2 border-l-black' : ''
                          } ${
                            column.key === 'inputs_v3' ? 'border-r-2 border-r-black' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="truncate flex-1">
                              {value ? value.toString().substring(0, 10) + (value.toString().length > 10 ? '...' : '') : '-'}
                            </div>
                            <button
                              onClick={() => handleExpandClick(row.cgig_id, column.key, value?.toString() || '')}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-xs rounded transition-colors"
                            >
                              expand
                            </button>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={column.key}
                        className={`px-3 py-2 text-sm text-gray-900 cursor-pointer ${
                          column.key === 'inputs_v1' ? 'border-l-2 border-l-black' : ''
                        } ${
                          column.key === 'inputs_v3' ? 'border-r-2 border-r-black' : ''
                        }`}
                        onClick={() => !isEditing && handleCellClick(row.cgig_id, column.key, value)}
                      >
                        {isEditing ? (
                          <input
                            type={column.type === 'integer' || column.type === 'number' ? 'number' : 'text'}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave();
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                                setEditingValue('');
                              }
                            }}
                            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div className="truncate">
                            {column.type === 'timestamp' && value
                              ? new Date(value).toLocaleString()
                              : value?.toString() || '-'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {paginatedData.length} of {filteredAndSortedData.length} results
        </div>
        <PaginationControls />
      </div>

      {/* Expand Popup Modal */}
      <InputsExpandEditor
        isOpen={!!expandPopup}
        fieldName={expandPopup?.field || 'inputs_v1'}
        initialValue={expandPopup?.value || ''}
        onSave={handleExpandSave}
        onClose={handleExpandClose}
      />

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isCreateModalOpen ? 'Create Citation Gig' : 'Edit Citation Gig'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData).map(([key, value]) => {
                const column = columns.find(col => col.key === key);
                if (!column) return null;

                if (column.type === 'boolean') {
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value as boolean}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor={key} className="text-sm font-medium text-gray-700">
                        {column.label}
                      </label>
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {column.label}
                    </label>
                    {key.includes('description') || key.includes('notes') ? (
                      <textarea
                        value={value as string}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                    ) : (
                      <input
                        type={column.type === 'integer' || column.type === 'number' ? 'number' : 'text'}
                        value={value as string | number}
                        onChange={(e) => setFormData({ ...formData, [key]: column.type === 'integer' || column.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {isCreateModalOpen ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}