'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';
import PlancheEditPopup from './PlancheEditPopup';

// Dynamic import of NubraTablefaceKite
const NubraTablefaceKite = dynamic(() => import('@/app/components/shared/NubraTablefaceKite'), {
  ssr: false
});

interface PlancheRecord {
  planch_id: number;
  planch_name: string | null;
  planch_desc: string | null;
  planch_datum: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
}

interface EditingCell {
  rowId: number;
  field: keyof PlancheRecord;
}

export default function PlanchjarTable() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  // State management
  const [planches, setPlanches] = useState<PlancheRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState<Set<number>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupPlancheId, setPopupPlancheId] = useState<number | undefined>(undefined);

  // Load data on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadPlanches();
    }
  }, [user]);

  const loadPlanches = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('planches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPlanches(data || []);
    } catch (err) {
      console.error('Error loading planches:', err);
      setError('Failed to load planches');
    } finally {
      setLoading(false);
    }
  };

  // Filter planches based on search term
  const filteredPlanches = useMemo(() => {
    if (!searchTerm) return planches;
    
    return planches.filter(planche => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (planche.planch_name?.toLowerCase().includes(searchLower)) ||
        (planche.planch_desc?.toLowerCase().includes(searchLower)) ||
        (planche.planch_datum?.toLowerCase().includes(searchLower)) ||
        planche.planch_id.toString().includes(searchLower)
      );
    });
  }, [planches, searchTerm]);

  // Paginate filtered results
  const totalItems = filteredPlanches.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? totalItems : Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredPlanches.slice(startIndex, endIndex);

  // Handle checkbox selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === currentItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentItems.map(item => item.planch_id)));
    }
  };

  // Handle inline editing
  const startEditing = (rowId: number, field: keyof PlancheRecord, currentValue: any) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    const { rowId, field } = editingCell;
    setSaving(prev => new Set([...prev, rowId]));
    
    try {
      const { error } = await supabase
        .from('planches')
        .update({ [field]: editValue || null })
        .eq('planch_id', rowId);

      if (error) throw error;

      // Update local state
      setPlanches(prev => prev.map(planche => 
        planche.planch_id === rowId 
          ? { ...planche, [field]: editValue || null }
          : planche
      ));
      
      setEditingCell(null);
      setEditValue('');
    } catch (err) {
      console.error('Error saving edit:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle create new inline
  const handleCreateInline = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('planches')
        .insert({
          planch_name: null,
          planch_desc: null,
          planch_datum: null,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setPlanches(prev => [data, ...prev]);
      
      // Start editing the name field of the new record
      setTimeout(() => {
        startEditing(data.planch_id, 'planch_name', '');
      }, 100);
    } catch (err) {
      console.error('Error creating planche:', err);
      alert('Failed to create new planche');
    }
  };

  // Handle create new popup
  const handleCreatePopup = () => {
    setPopupPlancheId(undefined);
    setShowPopup(true);
  };

  const handleEditPopup = (plancheId: number) => {
    setPopupPlancheId(plancheId);
    setShowPopup(true);
  };

  const handlePopupSave = () => {
    loadPlanches(); // Refresh data
    setShowPopup(false);
    setPopupPlancheId(undefined);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setPopupPlancheId(undefined);
  };

  // Pagination controls component
  const PaginationControls = ({ position }: { position: 'top' | 'bottom' }) => (
    <div className="flex items-center space-x-4">
      {/* Items per page */}
      <div className="flex items-center">
        <span className="text-sm text-gray-700 mr-2">Items per page:</span>
        <div className="flex border border-gray-300 rounded">
          {[10, 20, 50, 100, 200, 500, -1].map((size, index) => (
            <button
              key={size}
              onClick={() => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                itemsPerPage === size 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white hover:bg-gray-200'
              } ${
                index === 0 ? 'rounded-l' : index === 6 ? 'rounded-r border-r' : ''
              }`}
              style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
            >
              {size === -1 ? 'All' : size}
            </button>
          ))}
        </div>
      </div>

      {/* Page navigation */}
      {itemsPerPage !== -1 && (
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mr-2">Page:</span>
          <div className="flex border border-gray-300 rounded">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let pageNum;
              if (totalPages <= 10) {
                pageNum = i + 1;
              } else if (currentPage <= 5) {
                pageNum = i + 1;
              } else if (currentPage > totalPages - 5) {
                pageNum = totalPages - 9 + i;
              } else {
                pageNum = currentPage - 4 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-2.5 text-sm border -mr-px cursor-pointer ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white hover:bg-gray-200'
                  } ${
                    i === 0 ? 'rounded-l' : i === Math.min(totalPages, 10) - 1 ? 'rounded-r border-r' : ''
                  }`}
                  style={{ fontSize: '14px', paddingTop: '10px', paddingBottom: '10px' }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search box */}
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Search planches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSearchTerm('')}
          className="px-2 py-2 bg-yellow-400 text-black text-xs font-bold border border-l-0 border-gray-300 rounded-r hover:bg-yellow-500"
        >
          CL
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading planches...</div>
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
    <div className="p-6">
      {/* Create buttons */}
      <div className="mb-6 flex space-x-4">
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
      </div>

      {/* NubraTablefaceKite label */}
      <div className="mb-4">
        <NubraTablefaceKite />
      </div>

      {/* Top pagination controls */}
      <div className="mb-4 flex justify-start">
        <PaginationControls position="top" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {/* Checkbox column */}
                <th className="w-12 px-3 py-3">
                  <div 
                    className="flex items-center justify-center cursor-pointer h-full w-full"
                    onClick={handleSelectAll}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.size === currentItems.length && currentItems.length > 0}
                      onChange={handleSelectAll}
                      className="pointer-events-none"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </th>
                
                {/* Data columns */}
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">planch_id</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">planch_name</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">planch_desc</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">planch_datum</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">created_at</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">updated_at</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">user_id</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="font-bold text-xs lowercase text-gray-900">actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((planche) => (
                <tr key={planche.planch_id} className="hover:bg-gray-50">
                  {/* Checkbox column */}
                  <td className="w-12 px-3 py-4">
                    <div 
                      className="flex items-center justify-center cursor-pointer h-full w-full"
                      onClick={() => handleRowSelect(planche.planch_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.has(planche.planch_id)}
                        onChange={() => handleRowSelect(planche.planch_id)}
                        className="pointer-events-none"
                        style={{ width: '20px', height: '20px' }}
                      />
                    </div>
                  </td>
                  
                  {/* planch_id (read-only) */}
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {planche.planch_id}
                  </td>
                  
                  {/* planch_name (editable) */}
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {editingCell?.rowId === planche.planch_id && editingCell.field === 'planch_name' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          disabled={saving.has(planche.planch_id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        onClick={() => startEditing(planche.planch_id, 'planch_name', planche.planch_name)}
                      >
                        {planche.planch_name || <span className="text-gray-400 italic">Click to edit</span>}
                      </div>
                    )}
                  </td>
                  
                  {/* planch_desc (editable) */}
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {editingCell?.rowId === planche.planch_id && editingCell.field === 'planch_desc' ? (
                      <div className="flex items-center space-x-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1 min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={saveEdit}
                            disabled={saving.has(planche.planch_id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        onClick={() => startEditing(planche.planch_id, 'planch_desc', planche.planch_desc)}
                      >
                        {planche.planch_desc ? (
                          <div className="whitespace-pre-wrap">
                            {planche.planch_desc.length > 100 
                              ? planche.planch_desc.substring(0, 100) + '...' 
                              : planche.planch_desc}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Click to edit</span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* planch_datum (editable) */}
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {editingCell?.rowId === planche.planch_id && editingCell.field === 'planch_datum' ? (
                      <div className="flex items-center space-x-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1 min-h-[80px] font-mono"
                          autoFocus
                        />
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={saveEdit}
                            disabled={saving.has(planche.planch_id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        onClick={() => startEditing(planche.planch_id, 'planch_datum', planche.planch_datum)}
                      >
                        {planche.planch_datum ? (
                          <div className="whitespace-pre-wrap font-mono text-xs">
                            {planche.planch_datum.length > 150 
                              ? planche.planch_datum.substring(0, 150) + '...' 
                              : planche.planch_datum}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Click to edit</span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* created_at (read-only) */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(planche.created_at).toLocaleString()}
                  </td>
                  
                  {/* updated_at (read-only) */}
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {planche.updated_at ? new Date(planche.updated_at).toLocaleString() : '-'}
                  </td>
                  
                  {/* user_id (read-only) */}
                  <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                    {planche.user_id?.substring(0, 8)}...
                  </td>
                  
                  {/* actions */}
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => handleEditPopup(planche.planch_id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No planches match your search' : 'No planches found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom pagination controls */}
      <div className="mt-4 flex justify-start">
        <PaginationControls position="bottom" />
      </div>

      {/* Results summary */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{endIndex} of {totalItems} planches
        {searchTerm && ` (filtered from ${planches.length} total)`}
      </div>

      {/* Edit Popup */}
      <PlancheEditPopup
        isOpen={showPopup}
        plancheId={popupPlancheId}
        onSave={handlePopupSave}
        onClose={handlePopupClose}
      />
    </div>
  );
}