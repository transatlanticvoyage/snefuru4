'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

interface Coltemp {
  coltemp_id: number;
  rel_utg_id: string;
  coltemp_name: string | null;
  coltemp_category: string | null;
  coltemp_display_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  button_text: string | null;
  tooltip_text: string | null;
  default_header_row_color: string | null;
  fk_user_id: string | null;
  coltemp_color: string | null;
  coltemp_icon: string | null; // deprecated
  icon_name: string | null;
  icon_color: string | null;
  cached_rackui_count: number | null;
  cached_rackui_json: any | null;
  nubra_lake_of_ui_columns: string | null;
}

export default function ColtempjarClient() {
  console.log('🚀 ColtempjarClient component loaded!');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [data, setData] = useState<Coltemp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<number, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [actualUserId, setActualUserId] = useState<string | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Create new inline entry
  const createNewInlineEntry = async () => {
    try {
      // First, get an existing UTG ID from the current data, or use null if none available
      const existingUtgIds = getUniqueValues('rel_utg_id');
      const firstValidUtgId = existingUtgIds.length > 0 ? existingUtgIds[0] : null;

      const { data: newRecord, error } = await supabase
        .from('coltemps')
        .insert({
          rel_utg_id: firstValidUtgId, // Use existing UTG ID or null
          coltemp_name: null,
          coltemp_category: null,
          coltemp_display_name: null,
          is_default: false,
          button_text: null,
          tooltip_text: null,
          default_header_row_color: null,
          fk_user_id: actualUserId, // Use actual user record ID, not auth ID
          coltemp_color: null,
          coltemp_icon: null, // deprecated
          icon_name: null,
          icon_color: '#666666',
          nubra_lake_of_ui_columns: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new inline entry:', error);
        const errorMessage = error.message || 'Failed to create new entry';
        const errorDetails = error.details || '';
        const errorHint = error.hint || '';
        
        alert(`Failed to create new entry:\n${errorMessage}\n${errorDetails}\n${errorHint}`.trim());
        return;
      }

      // Update local state - add new record at the beginning
      setData(prev => [newRecord, ...prev]);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
      updateURLParams({ page: 1 });
    } catch (error: any) {
      console.error('Error creating new inline entry:', error);
      const errorMessage = error.message || 'Failed to create new entry';
      alert(`Failed to create new entry: ${errorMessage}`);
    }
  };
  
  // Initialize state from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams?.get('perPage')) || 50);
  const [sortField, setSortField] = useState<keyof Coltemp | null>(
    (searchParams?.get('sortField') as keyof Coltemp) || null
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams?.get('sortOrder') as 'asc' | 'desc') || 'asc'
  );
  
  // Filter states from URL parameters
  const [filters, setFilters] = useState({
    rel_utg_id: searchParams?.get('rel_utg_id') || 'all',
    coltemp_category: searchParams?.get('coltemp_category') || 'all',
    is_default: searchParams?.get('filter_is_default') || 'all'
  });
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Coltemp | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSecondConfirm, setDeleteSecondConfirm] = useState(false);
  
  // Nubra Lake popup modal state
  const [nubraLakePopup, setNubraLakePopup] = useState<{
    isOpen: boolean;
    record: Coltemp | null;
    mode: 'view' | 'edit';
  }>({
    isOpen: false,
    record: null,
    mode: 'view'
  });
  const [nubraLakeEditValue, setNubraLakeEditValue] = useState<string>('');
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  
  // Form data
  const getEmptyFormData = () => ({
    rel_utg_id: '',
    coltemp_name: '',
    coltemp_category: '',
    coltemp_display_name: '',
    is_default: false,
    button_text: '',
    tooltip_text: '',
    default_header_row_color: '',
    fk_user_id: '',
    coltemp_color: '',
    coltemp_icon: '', // deprecated
    icon_name: '',
    icon_color: '#666666',
    nubra_lake_of_ui_columns: ''
  });
  
  const [formData, setFormData] = useState<any>(getEmptyFormData());

  useEffect(() => {
    if (user) {
      checkUserAdminStatus();
    }
  }, [user]);

  const checkUserAdminStatus = async () => {
    try {
      setCheckingAdmin(true);
      console.log('Checking admin status for user ID:', user?.id);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, is_admin')
        .eq('auth_id', user?.id)
        .single();

      if (error) {
        console.error('Admin check error:', error);
        throw error;
      }
      
      const adminStatus = userData?.is_admin || false;
      console.log('Admin status result:', adminStatus);
      
      // Store the actual user record ID for data filtering
      setActualUserId(userData?.id);
      setIsAdmin(adminStatus);
      
      // After checking admin status, fetch data
      await fetchData(adminStatus);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      await fetchData(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchData = async (userIsAdmin: boolean = isAdmin) => {
    try {
      setLoading(true);
      
      console.log(`Fetching data with admin status: ${userIsAdmin}`);
      
      let query = supabase
        .from('coltemps')
        .select('*');
      
      // ONLY filter if user is NOT admin
      if (!userIsAdmin && actualUserId) {
        console.log('Applying regular user filters');
        // Regular users see only their own records + adminpublic records
        query = query.or(`fk_user_id.eq.${actualUserId},coltemp_category.eq.adminpublic`);
      } else if (userIsAdmin) {
        console.log('Admin user - no filters applied, fetching ALL records');
      }
      // If userIsAdmin is TRUE, no filtering applied - get ALL records
      
      const { data: coltemps, error } = await query.order('coltemp_id', { ascending: true });

      if (error) throw error;
      setData(coltemps || []);
      
      console.log(`✅ Successfully fetched ${coltemps?.length || 0} coltemp records (isAdmin: ${userIsAdmin})`);
      if (coltemps && coltemps.length > 0) {
        console.log('First few records:', coltemps.slice(0, 3).map(r => ({ id: r.coltemp_id, name: r.coltemp_name, category: r.coltemp_category })));
      }
      
      // Fetch live counts for all coltemps
      await fetchLiveCounts(coltemps || []);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Failed to load column templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveCounts = async (coltemps: Coltemp[]) => {
    try {
      const counts: Record<number, number> = {};
      
      // Fetch live count for each coltemp
      for (const coltemp of coltemps) {
        const { count, error } = await supabase
          .from('coltemp_rackui_relations')
          .select('*', { count: 'exact', head: true })
          .eq('fk_coltemp_id', coltemp.coltemp_id)
          .eq('is_visible', true);
          
        if (!error && count !== null) {
          counts[coltemp.coltemp_id] = count;
        }
      }
      
      setLiveCounts(counts);
    } catch (err) {
      console.error('Error fetching live counts:', err);
    }
  };

  const refreshCache = async () => {
    try {
      // Trigger the cache update function
      const { error } = await supabase.rpc('update_rackui_coltemp_cache');
      if (error) throw error;
      
      // Refresh the data
      await fetchData();
      
      console.log('Cache refreshed successfully');
    } catch (err) {
      console.error('Error refreshing cache:', err);
      alert('Failed to refresh cache');
    }
  };

  // Update URL parameters
  const updateURLParams = (params: Record<string, any>) => {
    const newParams = new URLSearchParams(searchParams?.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/coltempjar?${newParams.toString()}`);
  };

  // Get unique values for filters
  const getUniqueValues = (field: keyof Coltemp) => {
    const values = new Set(data.map(item => item[field]));
    return Array.from(values).filter(Boolean).sort();
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = ['coltemp_name', 'coltemp_category', 'coltemp_display_name', 'button_text', 'tooltip_text'];
        const matches = searchableFields.some(field => {
          const value = (item as any)[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        });
        if (!matches) return false;
      }
      
      // Field filters
      if (filters.rel_utg_id !== 'all' && item.rel_utg_id !== filters.rel_utg_id) return false;
      if (filters.coltemp_category !== 'all' && item.coltemp_category !== filters.coltemp_category) return false;
      if (filters.is_default !== 'all' && item.is_default !== (filters.is_default === 'true')) return false;
      
      return true;
    });
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Handle sort
  const handleSort = (field: keyof Coltemp) => {
    if (sortField === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      updateURLParams({ sortOrder: newOrder });
    } else {
      setSortField(field);
      setSortOrder('asc');
      updateURLParams({ sortField: field, sortOrder: 'asc' });
    }
  };

  // Prepare form data for database
  const prepareFormData = () => {
    const prepared: any = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value === '') {
        prepared[key] = null;
      } else {
        prepared[key] = value;
      }
    });
    return prepared;
  };

  // Handle create
  const handleCreate = async () => {
    try {
      const { error: insertError } = await supabase
        .from('coltemps')
        .insert([prepareFormData()]);
        
      if (insertError) throw insertError;
      
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error creating record:', err);
      const errorMessage = err.message || 'Failed to create record';
      const errorDetails = err.details || '';
      const errorHint = err.hint || '';
      
      alert(`Failed to create record:\n${errorMessage}\n${errorDetails}\n${errorHint}`.trim());
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!editingRecord) return;
    
    try {
      const { error: updateError } = await supabase
        .from('coltemps')
        .update(prepareFormData())
        .eq('coltemp_id', editingRecord.coltemp_id);
        
      if (updateError) throw updateError;
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error updating record:', err);
      const errorMessage = err.message || 'Failed to update record';
      const errorDetails = err.details || '';
      const errorHint = err.hint || '';
      
      alert(`Failed to update record:\n${errorMessage}\n${errorDetails}\n${errorHint}`.trim());
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!deleteSecondConfirm) {
      setDeleteSecondConfirm(true);
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('coltemps')
        .delete()
        .eq('coltemp_id', id);
        
      if (deleteError) throw deleteError;
      
      setDeleteConfirmId(null);
      setDeleteSecondConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record');
    }
  };

  // Start edit
  const startEdit = (record: Coltemp) => {
    setEditingRecord(record);
    const editData: any = {};
    Object.keys(getEmptyFormData()).forEach(key => {
      const value = (record as any)[key];
      editData[key] = value === null ? '' : value;
    });
    setFormData(editData);
    setIsEditModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData(getEmptyFormData());
  };

  // Handle inline editing
  const startInlineEdit = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue || '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingValue || null };
      const { error } = await supabase
        .from('coltemps')
        .update(updates)
        .eq('coltemp_id', editingCell.id);

      if (error) throw error;

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.coltemp_id === editingCell.id 
            ? { ...item, [editingCell.field]: editingValue || null }
            : item
        )
      );
      
      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      console.error('Error updating field:', err);
      alert('Failed to update field');
    }
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };
  
  // Nubra Lake popup handlers
  const openNubraLakePopup = (record: Coltemp, mode: 'view' | 'edit' = 'view') => {
    setNubraLakePopup({
      isOpen: true,
      record,
      mode
    });
    setNubraLakeEditValue(record.nubra_lake_of_ui_columns || '');
  };
  
  const closeNubraLakePopup = () => {
    setNubraLakePopup({
      isOpen: false,
      record: null,
      mode: 'view'
    });
    setNubraLakeEditValue('');
  };
  
  const saveNubraLakeValue = async () => {
    if (!nubraLakePopup.record) return;
    
    try {
      const { error } = await supabase
        .from('coltemps')
        .update({ nubra_lake_of_ui_columns: nubraLakeEditValue || null })
        .eq('coltemp_id', nubraLakePopup.record.coltemp_id);
        
      if (error) throw error;
      
      // Update local data
      setData(prevData =>
        prevData.map(item =>
          item.coltemp_id === nubraLakePopup.record!.coltemp_id
            ? { ...item, nubra_lake_of_ui_columns: nubraLakeEditValue || null }
            : item
        )
      );
      
      closeNubraLakePopup();
    } catch (err) {
      console.error('Error updating nubra_lake_of_ui_columns:', err);
      alert('Failed to update field');
    }
  };

  // Define which fields can be inline edited
  const inlineEditableFields = [
    'rel_utg_id', 'coltemp_name', 'coltemp_category', 'coltemp_display_name',
    'button_text', 'tooltip_text', 'default_header_row_color', 'fk_user_id',
    'coltemp_color', 'coltemp_icon', 'icon_name', 'icon_color'
    // nubra_lake_of_ui_columns handled via popup
  ];
  
  // Get ordered column keys (placing nubra_lake_of_ui_columns near the left)
  const getOrderedColumns = (record: Coltemp | null) => {
    if (!record) return [];
    
    const allKeys = Object.keys(record).filter(
      key => key !== 'cached_rackui_count' && key !== 'cached_rackui_json'
    );
    
    // Define desired column order (nubra_lake_of_ui_columns in position 4)
    const priorityOrder = [
      'coltemp_id',
      'rel_utg_id',
      'coltemp_name',
      'nubra_lake_of_ui_columns',
      'coltemp_category',
      'coltemp_display_name'
    ];
    
    // Get remaining columns not in priority order
    const remainingKeys = allKeys.filter(key => !priorityOrder.includes(key));
    
    // Combine priority columns with remaining columns
    return [...priorityOrder.filter(key => allKeys.includes(key)), ...remainingKeys];
  };

  // Render form fields
  const renderFormFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">rel_utg_id *</label>
          <input
            type="text"
            value={formData.rel_utg_id}
            onChange={(e) => setFormData({...formData, rel_utg_id: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_name</label>
          <input
            type="text"
            value={formData.coltemp_name}
            onChange={(e) => setFormData({...formData, coltemp_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_category</label>
          <input
            type="text"
            value={formData.coltemp_category}
            onChange={(e) => setFormData({...formData, coltemp_category: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_display_name</label>
          <input
            type="text"
            value={formData.coltemp_display_name}
            onChange={(e) => setFormData({...formData, coltemp_display_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">is_default</label>
          <input
            type="checkbox"
            checked={formData.is_default}
            onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">button_text</label>
          <input
            type="text"
            value={formData.button_text}
            onChange={(e) => setFormData({...formData, button_text: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">tooltip_text</label>
          <textarea
            value={formData.tooltip_text}
            onChange={(e) => setFormData({...formData, tooltip_text: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">default_header_row_color</label>
          <input
            type="text"
            value={formData.default_header_row_color}
            onChange={(e) => setFormData({...formData, default_header_row_color: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g. #ffffff"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">fk_user_id</label>
          <input
            type="text"
            value={formData.fk_user_id}
            onChange={(e) => setFormData({...formData, fk_user_id: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="User UUID (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_color</label>
          <input
            type="text"
            value={formData.coltemp_color}
            onChange={(e) => setFormData({...formData, coltemp_color: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g. #FF5733"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">coltemp_icon (deprecated)</label>
          <input
            type="text"
            value={formData.coltemp_icon}
            onChange={(e) => setFormData({...formData, coltemp_icon: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g. home, user, settings"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">icon_name</label>
          <input
            type="text"
            value={formData.icon_name}
            onChange={(e) => setFormData({...formData, icon_name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g. star, circle, arrow-up"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">icon_color</label>
          <input
            type="text"
            value={formData.icon_color}
            onChange={(e) => setFormData({...formData, icon_color: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g. #FF5733"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">nubra_lake_of_ui_columns</label>
          <textarea
            value={formData.nubra_lake_of_ui_columns}
            onChange={(e) => setFormData({...formData, nubra_lake_of_ui_columns: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="UI columns configuration"
            rows={3}
          />
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access this page.</p>
      </div>
    );
  }

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">
          {checkingAdmin ? 'Checking permissions...' : 'Loading column templates...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                Admin View
              </span>
              <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
                Admin Panel
              </Link>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {isAdmin ? 'Column Templates (Admin)' : 'My Column Templates'}
          </h1>
          <p className="text-gray-600" style={{ fontSize: '16px' }}>
            <span className="font-bold">main db table:</span> coltemps
            {isAdmin ? ' (viewing all users)' : ' (your templates + public)'}
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  updateURLParams({ search: e.target.value, page: 1 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isAdmin ? 'Create New Template' : 'Create My Template'}
              </button>
              <button
                onClick={createNewInlineEntry}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {isAdmin ? 'Create New Entry (Inline)' : 'Quick Create'}
              </button>
              {isAdmin && (
                <button
                  onClick={refreshCache}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  update_rackui_coltemp_cache
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setItemsPerPage(value);
                  setCurrentPage(1);
                  updateURLParams({ perPage: value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UTG ID</label>
              <select
                value={filters.rel_utg_id}
                onChange={(e) => {
                  setFilters({...filters, rel_utg_id: e.target.value});
                  setCurrentPage(1);
                  updateURLParams({ rel_utg_id: e.target.value, page: 1 });
                }}
                className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                  filters.rel_utg_id !== 'all' 
                    ? 'font-bold text-white' 
                    : ''
                }`}
                style={filters.rel_utg_id !== 'all' ? { backgroundColor: '#103c0a' } : {}}
              >
                <option value="all">All</option>
                {getUniqueValues('rel_utg_id').map(value => (
                  <option key={value as string} value={value as string}>
                    {value as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.coltemp_category}
                onChange={(e) => {
                  setFilters({...filters, coltemp_category: e.target.value});
                  setCurrentPage(1);
                  updateURLParams({ coltemp_category: e.target.value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                {getUniqueValues('coltemp_category').map(value => (
                  <option key={value as string} value={value as string}>
                    {value as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Is Default</label>
              <select
                value={filters.is_default}
                onChange={(e) => {
                  setFilters({...filters, is_default: e.target.value});
                  setCurrentPage(1);
                  updateURLParams({ filter_is_default: e.target.value, page: 1 });
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" style={{ borderCollapse: 'collapse' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-1 text-left text-xs text-gray-400 italic" style={{ border: '1px solid #d1d5db' }}>
                    -
                  </th>
                  {getOrderedColumns(data[0] || null).map(key => (
                    <th
                      key={`table-${key}`}
                      className="px-1 py-1 text-left text-xs text-gray-400 italic"
                      style={{ border: '1px solid #d1d5db' }}
                    >
                      coltemps
                    </th>
                  ))}
                  <th className="px-1 py-1 text-left text-xs text-gray-400 italic" style={{ border: '1px solid #d1d5db' }}>
                    coltemps
                  </th>
                  <th className="px-1 py-1 text-left text-xs text-gray-400 italic" style={{ border: '1px solid #d1d5db' }}>
                    coltemps
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                    Actions
                  </th>
                  {getOrderedColumns(data[0] || null).map(key => (
                    <th
                      key={key}
                      className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100"
                      style={{ border: '1px solid #d1d5db' }}
                      onClick={() => handleSort(key as keyof Coltemp)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{key.toLowerCase()}</span>
                        {sortField === key && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                    <span style={{ fontWeight: 'bold' }}>cached_rackui_count (json)</span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 tracking-wider" style={{ border: '1px solid #d1d5db' }}>
                    <span style={{ fontWeight: 'bold' }}>live_rackui_count (db)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row) => (
                  <tr key={row.coltemp_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm" style={{ border: '1px solid #d1d5db' }}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(row)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {deleteConfirmId === row.coltemp_id ? (
                          <>
                            <button
                              onClick={() => handleDelete(row.coltemp_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              {deleteSecondConfirm ? 'Really?' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(null);
                                setDeleteSecondConfirm(false);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(row.coltemp_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                    {getOrderedColumns(row).map((key) => {
                      const value = (row as any)[key];
                      const isEditing = editingCell?.id === row.coltemp_id && editingCell?.field === key;
                      const isEditable = inlineEditableFields.includes(key);
                      
                      // Special handling for nubra_lake_of_ui_columns
                      if (key === 'nubra_lake_of_ui_columns') {
                        return (
                          <td key={key} className="px-3 py-2 text-sm text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                            <div className="flex items-center gap-2">
                              {value ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Has Data
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  Empty
                                </span>
                              )}
                              <button
                                onClick={() => openNubraLakePopup(row, 'view')}
                                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              >
                                Open Popup
                              </button>
                            </div>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={key} className="px-3 py-2 text-sm text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                          {isEditable ? (
                            isEditing ? (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={saveInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit();
                                  if (e.key === 'Escape') cancelInlineEdit();
                                }}
                                className="w-full px-1 py-0.5 border border-blue-500 rounded"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="min-w-[30px] min-h-[1.25rem] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                                onClick={() => startInlineEdit(row.coltemp_id, key, value)}
                                title="Click to edit"
                              >
                                {value === null ? '' : String(value)}
                              </div>
                            )
                          ) : typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                           value === null ? '' : String(value)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-sm text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                      {(() => {
                        try {
                          const jsonData = typeof row.cached_rackui_json === 'string' 
                            ? JSON.parse(row.cached_rackui_json) 
                            : row.cached_rackui_json;
                          return Array.isArray(jsonData) ? jsonData.length : 0;
                        } catch {
                          return 0;
                        }
                      })()}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                      {liveCounts[row.coltemp_id] || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(1);
                updateURLParams({ page: 1 });
              }}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                updateURLParams({ page: newPage });
              }}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                updateURLParams({ page: newPage });
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => {
                setCurrentPage(totalPages);
                updateURLParams({ page: totalPages });
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Column Template</h2>
              {renderFormFields()}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Column Template</h2>
              {renderFormFields()}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Nubra Lake Popup Modal */}
        {nubraLakePopup.isOpen && nubraLakePopup.record && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  Nubra Lake UI Columns - {nubraLakePopup.record.coltemp_name || `ID: ${nubraLakePopup.record.coltemp_id}`}
                </h2>
                <div className="flex items-center gap-2">
                  {nubraLakePopup.mode === 'view' ? (
                    <button
                      onClick={() => setNubraLakePopup(prev => ({ ...prev, mode: 'edit' }))}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setNubraLakePopup(prev => ({ ...prev, mode: 'view' }))}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Cancel Edit
                      </button>
                      <button
                        onClick={saveNubraLakeValue}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Save Changes
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (nubraLakeEditValue) {
                        navigator.clipboard.writeText(nubraLakeEditValue);
                        alert('Copied to clipboard!');
                      }
                    }}
                    className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                {nubraLakePopup.mode === 'view' ? (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {nubraLakeEditValue || '(No data)'}
                    </pre>
                  </div>
                ) : (
                  <textarea
                    value={nubraLakeEditValue}
                    onChange={(e) => setNubraLakeEditValue(e.target.value)}
                    className="w-full h-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none"
                    placeholder="Enter UI columns configuration here..."
                    style={{ minHeight: '400px' }}
                  />
                )}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {nubraLakeEditValue ? `${nubraLakeEditValue.length} characters` : 'Empty'}
                </div>
                <button
                  onClick={closeNubraLakePopup}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}