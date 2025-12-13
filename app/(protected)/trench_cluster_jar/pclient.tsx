'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

interface TrenchCluster {
  cluster_id: number;
  cluster_name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface EditingCell {
  id: number;
  field: string;
  value: any;
}

export default function TrenchClusterJarClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Data state
  const [data, setData] = useState<TrenchCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [currentRowPage, setCurrentRowPage] = useState(1);
  const [columnsPerPage, setColumnsPerPage] = useState(10);
  const [currentColumnPage, setCurrentColumnPage] = useState(1);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [isCreatingPopup, setIsCreatingPopup] = useState(false);
  
  // New record state
  const [newRecord, setNewRecord] = useState<Partial<TrenchCluster>>({
    cluster_name: ''
  });
  
  // Bezel chamber visibility states
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [cardioChamberVisible, setCardioChamberVisible] = useState(true);
  const [pecChamberVisible, setPecChamberVisible] = useState(true);
  
  // Define all columns
  const allColumns = [
    { key: 'cluster_id', name: 'cluster_id', table: 'trench_clusters' },
    { key: 'cluster_name', name: 'cluster_name', table: 'trench_clusters' },
    { key: 'created_at', name: 'created_at', table: 'trench_clusters' },
    { key: 'updated_at', name: 'updated_at', table: 'trench_clusters' },
    { key: 'user_id', name: 'user_id', table: 'trench_clusters' }
  ];
  
  // Calculate pagination
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const totalRows = filteredData.length;
  const totalRowPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginatedData = filteredData.slice(
    (currentRowPage - 1) * rowsPerPage,
    currentRowPage * rowsPerPage
  );
  
  const totalColumns = allColumns.length;
  const totalColumnPages = Math.max(1, Math.ceil(totalColumns / columnsPerPage));
  const paginatedColumns = allColumns.slice(
    (currentColumnPage - 1) * columnsPerPage,
    currentColumnPage * columnsPerPage
  );
  
  // Initialize bezel chamber visibility from localStorage
  useEffect(() => {
    const savedMandible = localStorage.getItem('trenchClusterJar_mandibleChamberVisible');
    const savedSinus = localStorage.getItem('trenchClusterJar_sinusChamberVisible');
    const savedCardio = localStorage.getItem('trenchClusterJar_cardioChamberVisible');
    const savedPec = localStorage.getItem('trenchClusterJar_pecChamberVisible');
    
    if (savedMandible !== null) setMandibleChamberVisible(JSON.parse(savedMandible));
    if (savedSinus !== null) setSinusChamberVisible(JSON.parse(savedSinus));
    if (savedCardio !== null) setCardioChamberVisible(JSON.parse(savedCardio));
    if (savedPec !== null) setPecChamberVisible(JSON.parse(savedPec));
  }, []);
  
  // Listen for bezel system visibility changes
  useEffect(() => {
    const handleMandibleChange = (event: CustomEvent) => {
      setMandibleChamberVisible(event.detail.visible);
    };
    const handleSinusChange = (event: CustomEvent) => {
      setSinusChamberVisible(event.detail.visible);
    };
    const handleCardioChange = (event: CustomEvent) => {
      setCardioChamberVisible(event.detail.visible);
    };
    const handlePecChange = (event: CustomEvent) => {
      setPecChamberVisible(event.detail.visible);
    };
    
    window.addEventListener('trenchClusterJarMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
    window.addEventListener('trenchClusterJarSinusChamberVisibilityChange', handleSinusChange as EventListener);
    window.addEventListener('trenchClusterJarCardioChamberVisibilityChange', handleCardioChange as EventListener);
    window.addEventListener('trenchClusterJarPecChamberVisibilityChange', handlePecChange as EventListener);
    
    return () => {
      window.removeEventListener('trenchClusterJarMandibleChamberVisibilityChange', handleMandibleChange as EventListener);
      window.removeEventListener('trenchClusterJarSinusChamberVisibilityChange', handleSinusChange as EventListener);
      window.removeEventListener('trenchClusterJarCardioChamberVisibilityChange', handleCardioChange as EventListener);
      window.removeEventListener('trenchClusterJarPecChamberVisibilityChange', handlePecChange as EventListener);
    };
  }, []);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: clusters, error: fetchError } = await supabase
        .from('trench_clusters')
        .select('*')
        .eq('user_id', user.id)
        .order('cluster_id', { ascending: false });
      
      if (fetchError) {
        console.error('Error fetching trench clusters:', fetchError);
        setError(fetchError.message);
        return;
      }
      
      setData(clusters || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Create new record (inline)
  const handleCreateInline = async () => {
    if (!user?.id) return;
    
    try {
      const { data: newCluster, error: insertError } = await supabase
        .from('trench_clusters')
        .insert({
          cluster_name: 'New Cluster',
          user_id: user.id
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating cluster:', insertError);
        setError(insertError.message);
        return;
      }
      
      // Add to data and start editing
      setData(prev => [newCluster, ...prev]);
      setEditingCell({ id: newCluster.cluster_id, field: 'cluster_name', value: newCluster.cluster_name });
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Create new record (popup)
  const handleCreatePopup = async () => {
    if (!user?.id || !newRecord.cluster_name?.trim()) return;
    
    try {
      const { data: newCluster, error: insertError } = await supabase
        .from('trench_clusters')
        .insert({
          cluster_name: newRecord.cluster_name,
          user_id: user.id
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating cluster:', insertError);
        setError(insertError.message);
        return;
      }
      
      setData(prev => [newCluster, ...prev]);
      setNewRecord({ cluster_name: '' });
      setIsCreatingPopup(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Update cell value
  const handleCellUpdate = async (id: number, field: string, value: any) => {
    try {
      const { error: updateError } = await supabase
        .from('trench_clusters')
        .update({ [field]: value })
        .eq('cluster_id', id);
      
      if (updateError) {
        console.error('Error updating cluster:', updateError);
        setError(updateError.message);
        return;
      }
      
      // Update local data
      setData(prev => prev.map(item => 
        item.cluster_id === id ? { ...item, [field]: value } : item
      ));
      setEditingCell(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Delete selected records
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('trench_clusters')
        .delete()
        .in('cluster_id', selectedIds);
      
      if (deleteError) {
        console.error('Error deleting clusters:', deleteError);
        setError(deleteError.message);
        return;
      }
      
      // Update local data
      setData(prev => prev.filter(item => !selectedIds.includes(item.cluster_id)));
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Toggle row selection
  const toggleRowSelection = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map(item => item.cluster_id));
    }
    setSelectAll(!selectAll);
  };
  
  // Row pagination functions
  const handleRowPageChange = (page: number) => {
    let newPage = page;
    if (newPage < 1) newPage = totalRowPages; // Wrap to last page
    if (newPage > totalRowPages) newPage = 1; // Wrap to first page
    setCurrentRowPage(newPage);
  };
  
  // Column pagination functions
  const handleColumnPageChange = (page: number) => {
    let newPage = page;
    if (newPage < 1) newPage = totalColumnPages; // Wrap to last page
    if (newPage > totalColumnPages) newPage = 1; // Wrap to first page
    setCurrentColumnPage(newPage);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  // Render pagination button with circular arrow icons
  const renderPaginationButton = (direction: 'prev' | 'next', onClick: () => void) => {
    return (
      <button
        onClick={onClick}
        className="w-8 h-8 border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
        style={{ borderRadius: '4px' }}
      >
        {direction === 'prev' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    );
  };
  
  // Row pagination bars
  const RowPaginationBar1 = () => (
    <div className="flex items-center space-x-2">
      {renderPaginationButton('prev', () => handleRowPageChange(currentRowPage - 1))}
      <span className="text-sm font-medium">Page {currentRowPage} of {totalRowPages}</span>
      {renderPaginationButton('next', () => handleRowPageChange(currentRowPage + 1))}
    </div>
  );
  
  const RowPaginationBar2 = () => (
    <div className="flex items-center space-x-2">
      <select
        value={rowsPerPage}
        onChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setCurrentRowPage(1);
        }}
        className="text-sm border border-gray-300 rounded px-2 py-1"
      >
        <option value={20}>20/page</option>
        <option value={50}>50/page</option>
        <option value={100}>100/page</option>
        <option value={200}>200/page</option>
      </select>
    </div>
  );
  
  // Column pagination bars
  const ColumnPaginationBar1 = () => (
    <div className="flex items-center space-x-2">
      {renderPaginationButton('prev', () => handleColumnPageChange(currentColumnPage - 1))}
      <span className="text-sm font-medium">Col {currentColumnPage} of {totalColumnPages}</span>
      {renderPaginationButton('next', () => handleColumnPageChange(currentColumnPage + 1))}
    </div>
  );
  
  const ColumnPaginationBar2 = () => (
    <div className="flex items-center space-x-2">
      <select
        value={columnsPerPage}
        onChange={(e) => {
          setColumnsPerPage(Number(e.target.value));
          setCurrentColumnPage(1);
        }}
        className="text-sm border border-gray-300 rounded px-2 py-1"
      >
        <option value={5}>5/page</option>
        <option value={10}>10/page</option>
        <option value={15}>15/page</option>
        <option value={20}>20/page</option>
      </select>
    </div>
  );
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Chambers */}
      {mandibleChamberVisible && (
        <div className="mandible_chamber" style={{ border: '1px solid black', padding: '10px', margin: 0 }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            mandible_chamber
          </div>
          
          {/* Create buttons */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleCreateInline}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
            >
              create new (inline)
            </button>
            
            <button
              onClick={() => setIsCreatingPopup(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
            >
              create new (popup)
            </button>
            
            {selectedIds.length > 0 && (
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
              >
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>
      )}
      
      {sinusChamberVisible && (
        <div className="sinus_chamber" style={{ border: '1px solid black', padding: '10px', margin: 0 }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            sinus_chamber
          </div>
        </div>
      )}
      
      {cardioChamberVisible && (
        <div className="cardio_chamber" style={{ border: '1px solid black', padding: '10px', margin: 0 }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            cardio_chamber
          </div>
        </div>
      )}
      
      {pecChamberVisible && (
        <div className="pec_chamber" style={{ border: '1px solid black', padding: '10px', margin: 0 }}>
          <div className="font-bold" style={{ fontSize: '16px', marginBottom: '12px' }}>
            pec_chamber
          </div>
        </div>
      )}
      
      {/* Rocket Chamber */}
      <div className="rocket_chamber_div" style={{ 
        border: '1px solid black', 
        padding: 0,
        margin: 0,
        position: 'relative'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '4px', 
          left: '4px', 
          fontSize: '16px', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="black"
            style={{ transform: 'rotate(15deg)' }}
          >
            <ellipse cx="12" cy="8" rx="3" ry="6" fill="black"/>
            <path d="M12 2 L15 8 L9 8 Z" fill="black"/>
            <path d="M9 12 L7 14 L9 16 Z" fill="black"/>
            <path d="M15 12 L17 14 L15 16 Z" fill="black"/>
            <path d="M10 14 L9 18 L10.5 16 L12 20 L13.5 16 L15 18 L14 14 Z" fill="black"/>
            <circle cx="12" cy="6" r="1" fill="white"/>
          </svg>
          rocket_chamber
        </div>
        <div style={{ marginTop: '24px', paddingTop: '4px', paddingBottom: 0, paddingLeft: '8px', paddingRight: '8px' }}>
          <div className="flex items-end justify-between">
            <div className="flex items-end space-x-8">
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>row pagination</span>
                        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                          Showing <span style={{ fontWeight: 'bold' }}>{rowsPerPage}</span> of <span style={{ fontWeight: 'bold' }}>{totalRows}</span> results
                        </span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        search box 2
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        wolf sticky columns exclusion band
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        pillarshift column templates
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>column pagination</span>
                        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                          Showing <span style={{ fontWeight: 'bold' }}>{Math.min(columnsPerPage, paginatedColumns.length)}</span> non-sticky(non wolf band) columns of <span style={{ fontWeight: 'bold' }}>{totalColumns}</span> sourcedef columns
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <div className="flex items-end space-x-4">
                        <RowPaginationBar1 />
                        <RowPaginationBar2 />
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <div className="flex items-end">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search clusters..."
                          className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ width: '200px', marginBottom: '3px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        />
                        <button
                          onClick={clearSearch}
                          className="bg-yellow-200 hover:bg-yellow-300 text-black font-medium px-3 py-2 text-sm transition-colors"
                          style={{ 
                            height: '38px',
                            borderTopRightRadius: '4px', 
                            borderBottomRightRadius: '4px',
                            border: '1px solid #d1d5db',
                            borderLeft: 'none'
                          }}
                        >
                          CL
                        </button>
                      </div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        wolf options
                      </button>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <button
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        use the pillarshift coltemp system
                      </button>
                    </td>
                    <td style={{ border: '1px solid black', padding: '4px' }}>
                      <div className="flex items-end space-x-4">
                        <ColumnPaginationBar1 />
                        <ColumnPaginationBar2 />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Table */}
      <div className="bg-white shadow overflow-hidden">
        <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="shenfur_db_table_name_tr">
              <th 
                className="for_db_table_abstract_checkbox for_db_column_abstract_checkbox" 
                style={{ border: '1px solid gray', padding: 0, textAlign: 'left' }}
              >
                <div 
                  className="cell_inner_wrapper_div cursor-pointer flex items-center justify-center" 
                  style={{ width: '60px', height: '40px' }}
                  onClick={toggleSelectAll}
                >
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="pointer-events-none"
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
              </th>
              {paginatedColumns.map((column) => (
                <th 
                  key={column.key}
                  className={`for_db_table_${column.table} for_db_column_${column.name}`}
                  style={{ border: '1px solid gray', padding: 0, textAlign: 'left' }}
                >
                  <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{column.table}</span>
                  </div>
                </th>
              ))}
            </tr>
            <tr className="shenfur_db_column_name_tr">
              <th 
                className="for_db_table_abstract_checkbox for_db_column_abstract_checkbox" 
                style={{ border: '1px solid gray', padding: 0, textAlign: 'left' }}
              >
                <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>select</span>
                </div>
              </th>
              {paginatedColumns.map((column) => (
                <th 
                  key={column.key}
                  className={`for_db_table_${column.table} for_db_column_${column.name}`}
                  style={{ border: '1px solid gray', padding: 0, textAlign: 'left' }}
                >
                  <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{column.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.cluster_id}>
                <td 
                  className="for_db_table_abstract_checkbox for_db_column_abstract_checkbox" 
                  style={{ border: '1px solid gray', padding: 0 }}
                >
                  <div 
                    className="cell_inner_wrapper_div cursor-pointer flex items-center justify-center" 
                    style={{ width: '60px', height: '40px' }}
                    onClick={() => toggleRowSelection(item.cluster_id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.cluster_id)}
                      onChange={() => toggleRowSelection(item.cluster_id)}
                      className="pointer-events-none"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </td>
                {paginatedColumns.map((column) => {
                  const value = item[column.key as keyof TrenchCluster];
                  const isEditing = editingCell?.id === item.cluster_id && editingCell?.field === column.key;
                  const isEditable = column.key !== 'cluster_id' && column.key !== 'created_at' && column.key !== 'updated_at' && column.key !== 'user_id';
                  
                  return (
                    <td 
                      key={column.key}
                      className={`for_db_table_${column.table} for_db_column_${column.name}`}
                      style={{ border: '1px solid gray', padding: 0 }}
                    >
                      <div className="cell_inner_wrapper_div" style={{ padding: '8px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={() => handleCellUpdate(item.cluster_id, column.key, editingCell.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCellUpdate(item.cluster_id, column.key, editingCell.value);
                              }
                            }}
                            className="w-full px-2 py-1 border border-blue-500 rounded"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className={isEditable ? "cursor-pointer hover:bg-gray-50" : ""}
                            onClick={() => {
                              if (isEditable) {
                                setEditingCell({ id: item.cluster_id, field: column.key, value });
                              }
                            }}
                          >
                            {column.key === 'created_at' || column.key === 'updated_at' 
                              ? new Date(String(value)).toLocaleString()
                              : String(value || '')
                            }
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Create Popup */}
      {isCreatingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Cluster</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cluster Name
              </label>
              <input
                type="text"
                value={newRecord.cluster_name || ''}
                onChange={(e) => setNewRecord({ ...newRecord, cluster_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter cluster name"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreatingPopup(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePopup}
                disabled={!newRecord.cluster_name?.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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