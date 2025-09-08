'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import CreateEditModal from './CreateEditModal';

const NubraTablefaceKite = dynamic(
  () => import('@/app/utils/nubra-tableface-kite').then(mod => ({ default: mod.NubraTablefaceKite })),
  { ssr: false }
);

interface KarmaWizardSession {
  session_id: string;
  janky_rel_sitespren_id: string | null;
  sitespren_base: string | null;
  session_name: string;
  rel_gcon_piece_id: string;
  user_id: string;
  cached_sitespren_base_note: string | null;
  steps_completed: number;
  step_left_off_at: number;
  total_steps_planned: number;
  session_status: string;
  wizard_config: any;
  cached_gcon_data: any;
  cached_sitespren_data: any;
  api_usage_log: any;
  error_log: any;
  completion_percentage: number | null;
  estimated_time_remaining: string | null;
  session_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  last_activity_at: string | null;
}

export default function KarmajarTable() {
  const [data, setData] = useState<KarmaWizardSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof KarmaWizardSession>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KarmaWizardSession | null>(null);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const supabase = createClientComponentClient();

  // Column definitions
  const columns = [
    { key: 'session_id', label: 'session_id', type: 'text', readonly: true },
    { key: 'janky_rel_sitespren_id', label: 'janky_rel_sitespren_id', type: 'text' },
    { key: 'sitespren_base', label: '(from fk)sitespren_base', type: 'text', readonly: true },
    { key: 'created_at', label: 'created_at', type: 'timestamp', readonly: true },
    { key: 'session_name', label: 'session_name', type: 'text' },
    { key: 'rel_gcon_piece_id', label: 'rel_gcon_piece_id', type: 'text' },
    { key: 'cached_sitespren_base_note', label: 'cached_sitespren_base_note', type: 'text' },
    { key: 'steps_completed', label: 'steps_completed', type: 'integer' },
    { key: 'step_left_off_at', label: 'step_left_off_at', type: 'integer' },
    { key: 'total_steps_planned', label: 'total_steps_planned', type: 'integer' },
    { key: 'session_status', label: 'session_status', type: 'select', options: ['active', 'completed', 'paused', 'error', 'cancelled'] },
    { key: 'wizard_config', label: 'wizard_config', type: 'json' },
    { key: 'cached_gcon_data', label: 'cached_gcon_data', type: 'json' },
    { key: 'cached_sitespren_data', label: 'cached_sitespren_data', type: 'json' },
    { key: 'api_usage_log', label: 'api_usage_log', type: 'json' },
    { key: 'error_log', label: 'error_log', type: 'json' },
    { key: 'completion_percentage', label: 'completion_percentage', type: 'number' },
    { key: 'estimated_time_remaining', label: 'estimated_time_remaining', type: 'text' },
    { key: 'session_notes', label: 'session_notes', type: 'text' },
    { key: 'updated_at', label: 'updated_at', type: 'timestamp', readonly: true },
    { key: 'completed_at', label: 'completed_at', type: 'timestamp' },
    { key: 'last_activity_at', label: 'last_activity_at', type: 'timestamp' },
    { key: 'user_id', label: 'user_id', type: 'text', readonly: true }
  ];

  // Get user internal ID and fetch data
  const fetchUserAndData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // First get the internal user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        setError('User not found in users table');
        setLoading(false);
        return;
      }

      const userInternalId = userData.id;
      setUserInternalId(userInternalId);

      // Now get user's karma wizard sessions using the internal user ID with sitespren JOIN
      const { data: records, error } = await supabase
        .from('karma_wizard_sessions')
        .select(`
          *,
          sitespren:janky_rel_sitespren_id (
            sitespren_base
          )
        `)
        .eq('user_id', userInternalId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process the records to flatten the sitespren data
      const processedRecords = (records || []).map(record => ({
        ...record,
        sitespren_base: record.sitespren?.sitespren_base || null
      }));

      setData(processedRecords);
    } catch (error) {
      console.error('Error fetching karma_wizard_sessions:', error);
      setError('Failed to fetch karma wizard sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndData();
  }, []);

  // Filter and paginate data
  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter((item) =>
        Object.entries(item).some(([key, value]) => {
          if (value === null || value === undefined) return false;
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : value.toString();
          return stringValue.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    return filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return sortOrder === 'asc' ? -1 : 1;
      if (bVal === null) return sortOrder === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === -1) return filteredData; // Show all
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  // Handle row selection
  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.session_id)));
    }
  };

  // Handle sorting
  const handleSort = (field: keyof KarmaWizardSession) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Inline editing handlers
  const handleCellClick = (id: string, field: string, currentValue: any) => {
    const column = columns.find(col => col.key === field);
    if (column?.readonly) return;
    
    setEditingCell({ id, field });
    
    if (column?.type === 'json') {
      setEditingValue(JSON.stringify(currentValue || {}, null, 2));
    } else {
      setEditingValue(currentValue?.toString() || '');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const { id, field } = editingCell;
    const column = columns.find(col => col.key === field);
    
    let processedValue: any = editingValue;
    
    try {
      if (column?.type === 'integer') {
        processedValue = editingValue === '' ? null : parseInt(editingValue, 10);
        if (editingValue !== '' && isNaN(processedValue)) {
          alert('Invalid number format');
          return;
        }
      } else if (column?.type === 'number') {
        processedValue = editingValue === '' ? null : parseFloat(editingValue);
        if (editingValue !== '' && isNaN(processedValue)) {
          alert('Invalid number format');
          return;
        }
      } else if (column?.type === 'json') {
        try {
          processedValue = editingValue === '' ? {} : JSON.parse(editingValue);
        } catch (e) {
          alert('Invalid JSON format');
          return;
        }
      } else if (editingValue === '') {
        processedValue = null;
      }

      await updateField(id, field as keyof KarmaWizardSession, processedValue);
      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error saving cell:', error);
      alert('Error saving value');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const updateField = async (id: string, field: keyof KarmaWizardSession, value: any) => {
    try {
      const updateData: any = { [field]: value };
      
      // Update the updated_at timestamp
      updateData.updated_at = new Date().toISOString();
      
      // If we're updating session_status to 'completed', set completed_at
      if (field === 'session_status' && value === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('karma_wizard_sessions')
        .update(updateData)
        .eq('session_id', id);

      if (error) {
        console.error('Error updating field:', error);
        alert(`Error updating field: ${error.message}`);
        return;
      }

      // Refetch data to get the updated record
      await fetchUserAndData();
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Error updating field');
    }
  };

  // Create new record inline
  const createNewRecordInline = async () => {
    if (!userInternalId) {
      console.error('User internal ID not available');
      return;
    }

    try {
      // Prompt for gcon_piece_id
      const gconPieceId = prompt('Enter the gcon_piece ID:');
      if (!gconPieceId) return;

      const { data: newRecord, error } = await supabase
        .from('karma_wizard_sessions')
        .insert({
          session_name: 'New Session',
          rel_gcon_piece_id: gconPieceId,
          user_id: userInternalId,
          session_status: 'active',
          steps_completed: 0,
          step_left_off_at: 1,
          total_steps_planned: 4
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new karma_wizard_sessions record:', error);
        alert(`Error creating new record: ${error.message}`);
        return;
      }

      // Refresh the data
      await fetchUserAndData();
      
      // Focus on the first editable cell
      setTimeout(() => {
        handleCellClick(newRecord.session_id, 'session_name', 'New Session');
      }, 100);
    } catch (error) {
      console.error('Error creating new record:', error);
      alert('Error creating new record');
    }
  };

  // Handle resume session - navigate to karmawiz
  const handleResumeSession = (sessionId: string, stepLeftOffAt: number, e: React.MouseEvent) => {
    const url = `/karmawiz?wizsession=${sessionId}&step=${stepLeftOffAt}`;
    
    // Check if user wants to open in new tab (Ctrl+click, Cmd+click, or middle click)
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  // Delete selected records
  const deleteSelectedRecords = async () => {
    if (selectedRows.size === 0) return;
    
    if (!confirm(`Delete ${selectedRows.size} selected record(s)?`)) return;

    try {
      const { error } = await supabase
        .from('karma_wizard_sessions')
        .delete()
        .in('session_id', Array.from(selectedRows));

      if (error) {
        console.error('Error deleting records:', error);
        alert(`Error deleting records: ${error.message}`);
        return;
      }

      setData(prev => prev.filter(item => !selectedRows.has(item.session_id)));
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Error deleting records');
    }
  };

  // Render cell content
  const renderCell = (item: KarmaWizardSession, column: typeof columns[0]) => {
    const value = item[column.key as keyof KarmaWizardSession];
    const isEditing = editingCell?.id === item.session_id && editingCell?.field === column.key;
    const isReadOnly = column.readonly;

    if (isEditing) {
      if (column.type === 'select' && column.options) {
        return (
          <div className="flex items-center space-x-1">
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCellSave();
                }
                if (e.key === 'Escape') handleCellCancel();
              }}
              className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              {column.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button
              onClick={handleCellSave}
              className="text-green-600 hover:text-green-800 text-sm"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={handleCellCancel}
              className="text-red-600 hover:text-red-800 text-sm"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-1">
          <textarea
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCellSave();
              }
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
            rows={column.type === 'json' ? 3 : 1}
          />
          <button
            onClick={handleCellSave}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={handleCellCancel}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    // Format display value
    let displayValue = '';
    if (column.type === 'timestamp') {
      displayValue = value ? new Date(value as string).toLocaleString() : '';
    } else if (column.type === 'json') {
      displayValue = value ? JSON.stringify(value, null, 2) : '{}';
    } else {
      displayValue = value?.toString() || '';
    }

    return (
      <div
        onClick={() => !isReadOnly && handleCellClick(item.session_id, column.key, value)}
        className={`min-w-[30px] min-h-[1.25rem] px-1 py-0.5 rounded break-words ${
          !isReadOnly ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        } ${isReadOnly ? 'text-gray-500' : ''}`}
        style={{ 
          maxWidth: column.type === 'json' ? '300px' : '200px', 
          wordWrap: 'break-word', 
          overflowWrap: 'break-word',
          whiteSpace: column.type === 'json' ? 'pre-wrap' : 'normal'
        }}
        title={isReadOnly ? displayValue : `${displayValue} (Click to edit)`}
      >
        {column.type === 'json' ? (
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue}
          </pre>
        ) : (
          displayValue
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading Karma Wizard Sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Pagination component
  const PaginationControls = () => {
    const pageNumbers = [];
    const maxPagesToShow = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <button
            onClick={() => { setItemsPerPage(10); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border-t border-b border-l cursor-pointer ${
              itemsPerPage === 10 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '4px 0 0 4px' }}
          >
            10
          </button>
          <button
            onClick={() => { setItemsPerPage(20); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border-t border-b cursor-pointer ${
              itemsPerPage === 20 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            20
          </button>
          <button
            onClick={() => { setItemsPerPage(50); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border-t border-b cursor-pointer ${
              itemsPerPage === 50 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            50
          </button>
          <button
            onClick={() => { setItemsPerPage(100); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border cursor-pointer ${
              itemsPerPage === 100 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            100
          </button>
          <button
            onClick={() => { setItemsPerPage(200); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border-t border-b cursor-pointer ${
              itemsPerPage === 200 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            200
          </button>
          <button
            onClick={() => { setItemsPerPage(500); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border-t border-b cursor-pointer ${
              itemsPerPage === 500 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
          >
            500
          </button>
          <button
            onClick={() => { setItemsPerPage(-1); setCurrentPage(1); }}
            className={`px-2 py-2.5 text-sm border cursor-pointer ${
              itemsPerPage === -1 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '0 4px 4px 0' }}
          >
            All
          </button>
        </div>

        {itemsPerPage !== -1 && totalPages > 1 && (
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-2 py-2.5 text-sm border-t border-b border-l cursor-pointer ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-200'
              }`}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '4px 0 0 4px' }}
            >
              ←
            </button>
            {pageNumbers.map((num, index) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-2.5 text-sm border-t border-b ${index === 0 ? '' : ''} cursor-pointer ${
                  currentPage === num ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
                }`}
                style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 py-2.5 text-sm border cursor-pointer ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-200'
              }`}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '0 4px 4px 0' }}
            >
              →
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
            style={{ fontSize: '14px' }}
          />
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-2 bg-yellow-400 text-black border border-yellow-500 font-bold text-sm"
            style={{ fontSize: '14px', width: '40px', height: '40px' }}
          >
            CL
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Karma Wizard Sessions</h1>
      
      {/* Control buttons and pagination */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={createNewRecordInline}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create New (Inline)
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create New (Popup)
            </button>
            {selectedRows.size > 0 && (
              <button
                onClick={deleteSelectedRecords}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Selected ({selectedRows.size})
              </button>
            )}
          </div>
        </div>

        {/* Nubra Tableface Kite */}
        <div className="mb-2">
          <NubraTablefaceKite variant="karma-wizard" />
        </div>

        {/* Top pagination controls */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredData.length} records
          </div>
          <PaginationControls />
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th 
                className="border border-gray-300 px-2 py-2 cursor-pointer hover:bg-gray-200"
                onClick={toggleSelectAll}
                style={{ width: '40px' }}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={() => {}}
                    className="w-5 h-5"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th
                className="border border-gray-300 px-2 py-2 text-left"
                style={{ width: '80px' }}
              >
                <span className="font-bold text-sm lowercase">resume</span>
              </th>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="border border-gray-300 px-2 py-2 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort(column.key as keyof KarmaWizardSession)}
                >
                  <span className="font-bold text-sm lowercase">
                    {column.label}
                    {sortField === column.key && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.session_id} className="hover:bg-gray-50">
                <td 
                  className="border border-gray-300 px-2 py-1 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleRowSelection(item.session_id)}
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.session_id)}
                      onChange={() => {}}
                      className="w-5 h-5"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeSession(item.session_id, item.step_left_off_at, e);
                      }}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      style={{ fontSize: '16px' }}
                      title="Resume session"
                    >
                      resume
                    </button>
                  </div>
                </td>
                {columns.map(column => (
                  <td key={column.key} className="border border-gray-300 px-2 py-1 text-sm">
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <PaginationControls />
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <CreateEditModal
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          onSubmit={async (formData) => {
            if (isEditModalOpen && editingRecord) {
              // Update existing record
              const { error } = await supabase
                .from('karma_wizard_sessions')
                .update(formData)
                .eq('session_id', editingRecord.session_id);

              if (error) {
                console.error('Error updating record:', error);
                alert(`Error updating record: ${error.message}`);
                return;
              }
            } else {
              // Create new record
              if (!userInternalId) {
                alert('User not authenticated');
                return;
              }

              const { error } = await supabase
                .from('karma_wizard_sessions')
                .insert({
                  ...formData,
                  user_id: userInternalId
                });

              if (error) {
                console.error('Error creating record:', error);
                alert(`Error creating record: ${error.message}`);
                return;
              }
            }

            await fetchUserAndData();
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          editingRecord={editingRecord}
          userInternalId={userInternalId}
        />
      )}
    </div>
  );
}