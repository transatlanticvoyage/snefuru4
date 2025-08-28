'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';
import DriggsPacksExpandEditor from '@/app/components/shared/DriggsPacksExpandEditor';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface DriggsPacksRecord {
  dpack_id: number;
  dpack_datum: string | null;
  dpack_note: string | null;
  dpack_realm: string | null;
  dpack_name: string | null;
  dpack_description: string | null;
  user_id_created_by: string | null;
  created_at: string;
  updated_at: string | null;
  is_starred: boolean | null;
  is_flagged: boolean | null;
}

export default function DriggsPacksTable() {
  const { user } = useAuth();
  const [data, setData] = useState<DriggsPacksRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<keyof DriggsPacksRecord>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DriggsPacksRecord | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Expand popup states
  const [expandPopup, setExpandPopup] = useState<{ dpackId: number } | null>(null);
  
  // Form data for creating/editing
  const [formData, setFormData] = useState({
    dpack_datum: '',
    dpack_note: '',
    dpack_realm: '',
    dpack_name: '',
    dpack_description: ''
  });

  const supabase = createClientComponentClient();

  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: fetchedData, error } = await supabase
        .from('driggs_packs')
        .select('dpack_id, dpack_datum, dpack_note, dpack_realm, dpack_name, dpack_description, user_id_created_by, created_at, updated_at, is_starred, is_flagged')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setData(fetchedData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Permission check function for editing records
  const canEditRecord = (record: DriggsPacksRecord): boolean => {
    // Admin users can edit everything
    if (user?.is_admin) return true;
    
    // Non-admin users can only edit "personal" realm records they created
    return record.dpack_realm === 'personal' && record.user_id_created_by === userInternalId;
  };

  // Get internal user ID from users table
  useEffect(() => {
    const getInternalUserId = async () => {
      if (!user?.id) return;

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!error && userData) {
          setUserInternalId(userData.id);
        }
      } catch (err) {
        console.error('Error getting internal user ID:', err);
      }
    };

    if (user?.id) {
      getInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (!searchTerm.trim()) return true;
      return Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort data
    filtered = filtered.sort((a, b) => {
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
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? filteredAndSortedData.length : startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: keyof DriggsPacksRecord) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle row selection
  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === currentData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentData.map(item => item.dpack_id)));
    }
  };

  // Pagination controls component
  const PaginationControls = () => {
    const pageOptions = [10, 20, 50, 100, 200, 500];
    
    return (
      <div className="flex items-center space-x-4">
        {/* Items per page */}
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Show:</span>
          <div className="flex border border-gray-300">
            {pageOptions.map((option, index) => (
              <button
                key={option}
                onClick={() => {
                  setItemsPerPage(option);
                  setCurrentPage(1);
                }}
                className={`px-2 py-2 text-sm transition-colors ${
                  itemsPerPage === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                } ${
                  index === 0 ? 'rounded-l' : 
                  index === pageOptions.length - 1 ? 'rounded-r' : ''
                } border-r border-gray-300 last:border-r-0`}
                style={{ 
                  fontSize: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px'
                }}
              >
                {option}
              </button>
            ))}
            <button
              onClick={() => {
                setItemsPerPage(-1);
                setCurrentPage(1);
              }}
              className={`px-2 py-2 text-sm transition-colors rounded-r ${
                itemsPerPage === -1
                  ? 'bg-blue-500 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
              style={{ 
                fontSize: '14px',
                paddingTop: '10px',
                paddingBottom: '10px'
              }}
            >
              All
            </button>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Page:</span>
          <div className="flex border border-gray-300">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2 text-sm transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-700'
                  } ${
                    i === 0 ? 'rounded-l' : 
                    i === Math.min(totalPages, 10) - 1 ? 'rounded-r' : ''
                  } border-r border-gray-300 last:border-r-0`}
                  style={{ 
                    fontSize: '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 10 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`px-2 py-2 text-sm transition-colors rounded-r ${
                  currentPage === totalPages
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
                style={{ 
                  fontSize: '14px',
                  paddingTop: '10px',
                  paddingBottom: '10px'
                }}
              >
                {totalPages}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Toggle star status with immediate UI update
  const toggleStar = async (id: number, currentValue: boolean | null) => {
    const newValue = !currentValue;
    
    // Optimistically update UI immediately
    setData(prev => prev.map(item => 
      item.dpack_id === id ? { ...item, is_starred: newValue } : item
    ));
    
    // Update database
    try {
      const { error } = await supabase
        .from('driggs_packs')
        .update({ is_starred: newValue })
        .eq('dpack_id', id);

      if (error) {
        console.error('Error updating star:', error);
        // Revert optimistic update on error
        setData(prev => prev.map(item => 
          item.dpack_id === id ? { ...item, is_starred: currentValue } : item
        ));
      }
    } catch (error) {
      console.error('Error updating star:', error);
      // Revert optimistic update on error
      setData(prev => prev.map(item => 
        item.dpack_id === id ? { ...item, is_starred: currentValue } : item
      ));
    }
  };

  // Toggle flag status with immediate UI update
  const toggleFlag = async (id: number, currentValue: boolean | null) => {
    const newValue = !currentValue;
    
    // Optimistically update UI immediately
    setData(prev => prev.map(item => 
      item.dpack_id === id ? { ...item, is_flagged: newValue } : item
    ));
    
    // Update database
    try {
      const { error } = await supabase
        .from('driggs_packs')
        .update({ is_flagged: newValue })
        .eq('dpack_id', id);

      if (error) {
        console.error('Error updating flag:', error);
        // Revert optimistic update on error
        setData(prev => prev.map(item => 
          item.dpack_id === id ? { ...item, is_flagged: currentValue } : item
        ));
      }
    } catch (error) {
      console.error('Error updating flag:', error);
      // Revert optimistic update on error
      setData(prev => prev.map(item => 
        item.dpack_id === id ? { ...item, is_flagged: currentValue } : item
      ));
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    if (!userInternalId) {
      alert('User information not loaded. Please try again.');
      return;
    }

    try {
      const { data: newRecord, error } = await supabase
        .from('driggs_packs')
        .insert([{
          dpack_datum: 'New Record',
          dpack_note: 'Enter note...',
          dpack_realm: user?.is_admin ? 'adminpublic' : 'personal',
          dpack_name: null,
          dpack_description: null,
          user_id_created_by: userInternalId
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Add to local data at the beginning
      setData(prevData => [newRecord, ...prevData]);
      
      // Start editing the first field
      setEditingCell({ id: newRecord.dpack_id, field: 'dpack_datum' });
      setEditingValue('New Record');
    } catch (err: any) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err.message}`);
    }
  };

  // Handle inline editing
  const handleCellClick = (id: number, field: string, value: any) => {
    if (field === 'dpack_id' || field === 'created_at' || field === 'updated_at') return;
    
    // Check permissions before allowing edit
    const record = data.find(r => r.dpack_id === id);
    if (!record || !canEditRecord(record)) {
      return; // Don't allow editing if user lacks permission
    }
    
    setEditingCell({ id, field });
    setEditingValue(value || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const updateData = {
        [editingCell.field]: editingValue.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('driggs_packs')
        .update(updateData)
        .eq('dpack_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData =>
        prevData.map(item =>
          item.dpack_id === editingCell.id
            ? { ...item, ...updateData }
            : item
        )
      );

      setEditingCell(null);
      setEditingValue('');
    } catch (err: any) {
      console.error('Error updating record:', err);
      alert(`Failed to update record: ${err.message}`);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle expand popup
  const handleExpandClick = (dpackId: number) => {
    console.log(`Opening driggs packs editor for dpack_id ${dpackId}`);
    setExpandPopup({ dpackId });
  };

  const handleExpandSave = async (dpackId: number, field: 'dpack_datum' | 'dpack_note' | 'dpack_realm' | 'dpack_name' | 'dpack_description', value: string) => {
    if (!expandPopup) return;

    // Check permissions before allowing save
    const record = data.find(r => r.dpack_id === dpackId);
    if (!record || !canEditRecord(record)) {
      alert('You do not have permission to edit this record.');
      return;
    }

    try {
      const updateData = {
        [field]: value,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('driggs_packs')
        .update(updateData)
        .eq('dpack_id', dpackId);

      if (error) throw error;

      // Update local data
      setData(data.map(item => 
        item.dpack_id === dpackId ? { 
          ...item, 
          [field]: value,
          updated_at: new Date().toISOString()
        } : item
      ));
    } catch (error) {
      console.error('Error saving driggs pack:', error);
      throw error;
    }
  };

  const handleExpandClose = () => {
    setExpandPopup(null);
  };

  // Handle form submission for popup modal
  const handleCreateSubmit = async () => {
    if (!userInternalId) {
      alert('User information not loaded. Please try again.');
      return;
    }

    try {
      // Set default realm based on user permissions
      const defaultRealm = user?.is_admin ? 'adminpublic' : 'personal';
      const finalRealm = formData.dpack_realm.trim() || defaultRealm;
      
      const insertData = {
        dpack_datum: formData.dpack_datum.trim() || null,
        dpack_note: formData.dpack_note.trim() || null,
        dpack_realm: finalRealm,
        dpack_name: formData.dpack_name.trim() || null,
        dpack_description: formData.dpack_description.trim() || null,
        user_id_created_by: userInternalId
      };
      
      const { error: insertError } = await supabase
        .from('driggs_packs')
        .insert([insertData]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error creating record:', err);
      alert(`Failed to create record: ${err.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      dpack_datum: '',
      dpack_note: '',
      dpack_realm: '',
      dpack_name: '',
      dpack_description: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading driggs_packs data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Nubra Tableface Kite */}
      <div className="px-4 py-2">
        <NubraTablefaceKite text="driggs_packs tableface" />
      </div>

      {/* Top Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 border-t-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
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
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white" style={{ borderCollapse: 'collapse' }}>
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox column */}
              <th 
                className="w-8 px-3 py-3 text-left cursor-pointer hover:bg-gray-100"
                onClick={handleSelectAll}
                style={{ width: '20px', height: '20px', border: '1px solid gray' }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === currentData.length && currentData.length > 0}
                    onChange={() => {}} // Handled by onClick above
                    className="w-5 h-5 rounded border-gray-300"
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
              </th>
              
              {/* Star column */}
              <th className="w-12 px-2 py-3 text-center" style={{ border: '1px solid gray' }}>
                <span className="text-lg">⭐</span>
              </th>
              
              {/* Flag column */}
              <th className="w-12 px-2 py-3 text-center" style={{ border: '1px solid gray' }}>
                <span className="text-lg">🚩</span>
              </th>
              
              {/* Data columns */}
              {['dpack_id', 'dpack_datum'].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field as keyof DriggsPacksRecord)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ border: '1px solid gray' }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{field}</span>
                    {sortField === field && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              
              {/* New custom columns */}
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider" style={{ border: '1px solid gray' }}>
                asn planch
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider" style={{ border: '1px solid gray' }}>
                format
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider" style={{ border: '1px solid gray' }}>
                export
              </th>
              
              {/* Remaining data columns */}
              {['dpack_note', 'dpack_realm', 'dpack_name', 'dpack_description', 'created_at', 'updated_at'].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field as keyof DriggsPacksRecord)}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-900 lowercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ border: '1px solid gray' }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{field}</span>
                    {sortField === field && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((record) => {
              const canEdit = canEditRecord(record);
              return (
              <tr 
                key={record.dpack_id} 
                className={`hover:bg-gray-50 ${!canEdit ? 'opacity-60 bg-gray-25' : ''}`}
                title={!canEdit ? 'Read-only: Admin permissions required' : ''}
              >
                {/* Checkbox */}
                <td 
                  className="w-8 px-3 py-4 cursor-pointer"
                  onClick={() => handleSelectRow(record.dpack_id)}
                  style={{ width: '20px', border: '1px solid gray' }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.dpack_id)}
                      onChange={() => {}} // Handled by onClick above
                      className="w-5 h-5 rounded border-gray-300"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </td>

                {/* Star column */}
                <td className="px-2 py-4 text-center" style={{ border: '1px solid gray' }}>
                  <div className="flex items-center justify-center">
                    <div
                      onClick={() => toggleStar(record.dpack_id, record.is_starred)}
                      className="cursor-pointer hover:scale-110 transition-transform duration-200 p-1"
                      title={record.is_starred ? "Click to unstar" : "Click to star"}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        className={record.is_starred ? "text-red-600" : "text-gray-400"}
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill={record.is_starred ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </td>

                {/* Flag column */}
                <td className="px-2 py-4 text-center" style={{ border: '1px solid gray' }}>
                  <div className="flex items-center justify-center">
                    <div
                      onClick={() => toggleFlag(record.dpack_id, record.is_flagged)}
                      className="cursor-pointer hover:scale-110 transition-transform duration-200 p-1"
                      title={record.is_flagged ? "Click to unflag" : "Click to flag"}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        className={record.is_flagged ? "text-red-600" : "text-gray-400"}
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill={record.is_flagged ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </td>

                {/* Data fields - First part: dpack_id and dpack_datum */}
                {Object.entries(record).filter(([field]) => field !== 'is_starred' && field !== 'is_flagged' && (field === 'dpack_id' || field === 'dpack_datum')).map(([field, value]) => {
                  const isEditing = editingCell?.id === record.dpack_id && editingCell?.field === field;
                  const isReadonly = field === 'dpack_id' || field === 'created_at' || field === 'updated_at';
                  
                  // Special handling for dpack_datum column
                  if (field === 'dpack_datum') {
                    return (
                      <td key={field} className="px-6 py-4 text-sm text-gray-900" style={{ border: '1px solid gray' }}>
                        <div className="flex items-center space-x-2">
                          <div className="truncate flex-1">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') handleCellCancel();
                                }}
                                className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <div 
                                className="cursor-pointer hover:bg-yellow-50 p-1 rounded"
                                onClick={() => handleCellClick(record.dpack_id, field, value)}
                              >
                                {value ? value.toString().substring(0, 10) + (value.toString().length > 10 ? '...' : '') : 'Click to edit'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleExpandClick(record.dpack_id)}
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
                      key={field}
                      className={`px-6 py-4 text-sm ${isReadonly ? 'text-gray-500' : 'text-gray-900 cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !isReadonly && handleCellClick(record.dpack_id, field, value)}
                      style={{ border: '1px solid gray' }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className={`${!isReadonly ? 'hover:bg-yellow-50' : ''} p-1 rounded`}>
                          {field === 'created_at' || field === 'updated_at' 
                            ? value ? new Date(value).toLocaleString() : 'N/A'
                            : value || (isReadonly ? 'N/A' : 'Click to edit')
                          }
                        </div>
                      )}
                    </td>
                  );
                })}
                
                {/* New dummy columns */}
                <td className="px-6 py-4 text-sm text-gray-900" style={{ border: '1px solid gray' }}>
                  -
                </td>
                <td className="px-6 py-4 text-sm text-gray-900" style={{ border: '1px solid gray' }}>
                  -
                </td>
                <td className="px-2 py-4 text-sm text-gray-900" style={{ border: '1px solid gray' }}>
                  <div className="flex flex-col gap-1">
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded border text-gray-700 transition-colors">
                      sharkintax - equal signs and hyphens
                    </button>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded border text-gray-700 transition-colors">
                      vertical transposed csv paste
                    </button>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded border text-gray-700 transition-colors">
                      vertical transposed csv download
                    </button>
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded border text-gray-700 transition-colors">
                      vertical transposed xls download
                    </button>
                  </div>
                </td>
                
                {/* Remaining data fields */}
                {Object.entries(record).filter(([field]) => field !== 'is_starred' && field !== 'is_flagged' && field !== 'dpack_id' && field !== 'dpack_datum').map(([field, value]) => {
                  const isEditing = editingCell?.id === record.dpack_id && editingCell?.field === field;
                  const isReadonly = field === 'dpack_id' || field === 'created_at' || field === 'updated_at';
                  
                  return (
                    <td
                      key={field}
                      className={`px-6 py-4 text-sm ${isReadonly ? 'text-gray-500' : 'text-gray-900 cursor-pointer hover:bg-gray-50'}`}
                      onClick={() => !isReadonly && handleCellClick(record.dpack_id, field, value)}
                      style={{ border: '1px solid gray' }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className={`${!isReadonly ? 'hover:bg-yellow-50' : ''} p-1 rounded`}>
                          {field === 'created_at' || field === 'updated_at' 
                            ? value ? new Date(value).toLocaleString() : 'N/A'
                            : value || (isReadonly ? 'N/A' : 'Click to edit')
                          }
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(startIndex + (itemsPerPage === -1 ? filteredAndSortedData.length : itemsPerPage), filteredAndSortedData.length)} of {filteredAndSortedData.length} records
            </div>
            <PaginationControls />
          </div>
        </div>
      </div>

      {/* Expand Popup Modal */}
      <DriggsPacksExpandEditor
        isOpen={!!expandPopup}
        initialDpackId={expandPopup?.dpackId || 1}
        onSave={handleExpandSave}
        onClose={handleExpandClose}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create New Driggs Pack</h2>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="text"
                  value={formData.dpack_datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_datum: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={formData.dpack_note}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Realm
                </label>
                <input
                  type="text"
                  value={formData.dpack_realm}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_realm: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.dpack_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.dpack_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, dpack_description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}