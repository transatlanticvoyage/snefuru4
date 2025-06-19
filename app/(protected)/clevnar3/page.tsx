"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ApiKeySlotJoined {
  // api_key_slots columns (left side - primary entity)
  slot_id: string;
  slot_name: string | null;
  m1platcodehandle: string | null;
  m1datum: string | null;
  m1ueplatlabel: string | null;
  m1inuse: boolean;
  m2platcodehandle: string | null;
  m2datum: string | null;
  m2ueplatlabel: string | null;
  m2inuse: boolean;
  m3platcodehandle: string | null;
  m3datum: string | null;
  m3ueplatlabel: string | null;
  m3inuse: boolean;
  slot_created_at: string;
  slot_updated_at: string;
  fk_iservices_provider_id: string | null;
  slot_publicly_shown: boolean;
  fk_ai_model_id: string | null;
  count_active_modules_on_slot: number;
  is_ai_model: boolean;
  
  // api_keys_t3 columns (right side - joined user data)
  api_key_id: string | null;
  fk_user_id: string | null;
  fk_slot_id: string | null;
  key_created_at: string | null;
  key_updated_at: string | null;
  d_m1platcodehandle: string | null;
  d_m2platcodehandle: string | null;
  d_m3platcodehandle: string | null;
  d_slot_name: string | null;
  d_user_email: string | null;
}

const columns = [
  // api_key_slots columns
  'slot_id',
  'slot_name',
  'm1inuse',
  'm1platcodehandle',
  'm1ueplatlabel',
  'm1datum',
  'm2inuse',
  'm2platcodehandle',
  'm2ueplatlabel',
  'm2datum', 
  'm3inuse',
  'm3platcodehandle',
  'm3ueplatlabel',
  'm3datum',
  'slot_created_at',
  'slot_updated_at',
  'fk_iservices_provider_id',
  'slot_publicly_shown',
  'fk_ai_model_id',
  'count_active_modules_on_slot',
  'is_ai_model',
  
  // api_keys_t3 columns
  'api_key_id',
  'fk_user_id',
  'fk_slot_id',
  'key_created_at',
  'key_updated_at',
  'd_m1platcodehandle',
  'd_m2platcodehandle',
  'd_m3platcodehandle',
  'd_slot_name',
  'd_user_email'
];

export default function Clevnar3Page() {
  const [data, setData] = useState<ApiKeySlotJoined[]>([]);
  const [filteredData, setFilteredData] = useState<ApiKeySlotJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFields, setEditingFields] = useState<{[key: string]: string}>({});
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
  const [selectedColumnTemplate, setSelectedColumnTemplate] = useState('option1');
  const [selectedStickyColumns, setSelectedStickyColumns] = useState('option1');
  
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    document.title = 'clevnar3 - Snefuru';
    
    // Remove layout constraints for full width
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.className = 'w-full';
    }
    
    // Load state from URL parameters and localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const colTempParam = urlParams.get('coltemp') || localStorage.getItem('clevnar3_coltemp') || 'option1';
    const stickyColParam = urlParams.get('stickycol') || localStorage.getItem('clevnar3_stickycol') || 'option1';
    
    setSelectedColumnTemplate(colTempParam);
    setSelectedStickyColumns(stickyColParam);
    
    // Cleanup function to restore original layout when leaving page
    return () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.className = 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8';
      }
    };
  }, []);

  useEffect(() => {
    fetchJoinedData();
  }, [user]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm) {
      const filtered = data.filter(item => 
        item.slot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m1platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m2platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m3platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m1ueplatlabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m2ueplatlabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.m3ueplatlabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m1platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m2platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_m3platcodehandle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_slot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.d_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.api_key_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, data]);

  const fetchJoinedData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        // Even without user, we can show public slots
        const { data: publicSlots, error: slotsError } = await supabase
          .from('api_key_slots')
          .select('*')
          .eq('slot_publicly_shown', true)
          .order('created_at', { ascending: false });
          
        if (slotsError) throw slotsError;
        
        // Transform to match expected structure
        const transformedSlots = (publicSlots || []).map(slot => ({
          // api_key_slots columns
          slot_id: slot.slot_id,
          slot_name: slot.slot_name,
          m1platcodehandle: slot.m1platcodehandle,
          m1ueplatlabel: null,
          m1datum: null,
          m1inuse: slot.m1inuse,
          m2platcodehandle: slot.m2platcodehandle,
          m2ueplatlabel: null,
          m2datum: null,
          m2inuse: slot.m2inuse,
          m3platcodehandle: slot.m3platcodehandle,
          m3ueplatlabel: null,
          m3datum: null,
          m3inuse: slot.m3inuse,
          slot_created_at: slot.created_at,
          slot_updated_at: slot.updated_at,
          fk_iservices_provider_id: slot.fk_iservices_provider_id,
          slot_publicly_shown: slot.slot_publicly_shown,
          fk_ai_model_id: slot.fk_ai_model_id,
          count_active_modules_on_slot: slot.count_active_modules_on_slot,
          is_ai_model: slot.is_ai_model,
          
          // api_keys_t3 columns (all null for no user)
          api_key_id: null,
          fk_user_id: null,
          fk_slot_id: null,
          key_created_at: null,
          key_updated_at: null,
          d_m1platcodehandle: null,
          d_m2platcodehandle: null,
          d_m3platcodehandle: null,
          d_slot_name: null,
          d_user_email: null
        }));
        
        setData(transformedSlots);
        setFilteredData(transformedSlots);
        setLoading(false);
        return;
      }
      
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        setError('Could not find user record.');
        setData([]);
        setLoading(false);
        return;
      }
      
      // Fetch public slots first
      const { data: slotsData, error: slotsError } = await supabase
        .from('api_key_slots')
        .select('*')
        .eq('slot_publicly_shown', true)
        .order('created_at', { ascending: false });
        
      if (slotsError) throw slotsError;
      
      // Fetch user's api keys
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys_t3')
        .select('*')
        .eq('fk_user_id', userData.id);
        
      if (keysError) throw keysError;
      
      // Manually join the data
      const joinedData = (slotsData || []).map(slot => {
        const userKey = (keysData || []).find(key => key.fk_slot_id === slot.slot_id);
        
        return {
          // api_key_slots columns (rename to match view structure)
          slot_id: slot.slot_id,
          slot_name: slot.slot_name,
          m1platcodehandle: slot.m1platcodehandle,
          m1ueplatlabel: userKey?.m1ueplatlabel || null,
          m1datum: userKey?.m1datum || null,
          m1inuse: slot.m1inuse,
          m2platcodehandle: slot.m2platcodehandle,
          m2ueplatlabel: userKey?.m2ueplatlabel || null,
          m2datum: userKey?.m2datum || null,
          m2inuse: slot.m2inuse,
          m3platcodehandle: slot.m3platcodehandle,
          m3ueplatlabel: userKey?.m3ueplatlabel || null,
          m3datum: userKey?.m3datum || null,
          m3inuse: slot.m3inuse,
          slot_created_at: slot.created_at,
          slot_updated_at: slot.updated_at,
          fk_iservices_provider_id: slot.fk_iservices_provider_id,
          slot_publicly_shown: slot.slot_publicly_shown,
          fk_ai_model_id: slot.fk_ai_model_id,
          count_active_modules_on_slot: slot.count_active_modules_on_slot,
          is_ai_model: slot.is_ai_model,
          
          // api_keys_t3 columns (can be null)
          api_key_id: userKey?.api_key_id || null,
          fk_user_id: userKey?.fk_user_id || null,
          fk_slot_id: userKey?.fk_slot_id || null,
          key_created_at: userKey?.created_at || null,
          key_updated_at: userKey?.updated_at || null,
          d_m1platcodehandle: userKey?.d_m1platcodehandle || null,
          d_m2platcodehandle: userKey?.d_m2platcodehandle || null,
          d_m3platcodehandle: userKey?.d_m3platcodehandle || null,
          d_slot_name: userKey?.d_slot_name || null,
          d_user_email: userKey?.d_user_email || null
        };
      });
      
      setData(joinedData);
      setFilteredData(joinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch joined data');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Column template logic
  const getVisibleColumns = () => {
    const stickyColumnCount = getStickyColumnCount();
    const stickyColumns = columns.slice(0, stickyColumnCount);
    
    switch (selectedColumnTemplate) {
      case 'option1': 
        return columns; // All columns
      case 'option2': {
        const templateColumns = columns.slice(0, 7); // Columns 1-7
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option3': {
        const templateColumns = columns.slice(7, 14); // Columns 8-14
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option4': {
        const templateColumns = columns.slice(14, 21); // Columns 15-21
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      case 'option5': {
        const templateColumns = columns.slice(21, 28); // Columns 22-28
        const combinedColumns = [...stickyColumns];
        templateColumns.forEach(col => {
          if (!stickyColumns.includes(col)) {
            combinedColumns.push(col);
          }
        });
        return combinedColumns;
      }
      default: 
        return columns;
    }
  };

  const getStickyColumnCount = () => {
    switch (selectedStickyColumns) {
      case 'option1': return 1;
      case 'option2': return 2;
      case 'option3': return 3;
      case 'option4': return 4;
      case 'option5': return 5;
      default: return 1;
    }
  };

  const getColumnSeparators = (col: string) => {
    // Left separators for m1inuse, m2inuse, m3inuse
    const hasLeftSeparator = col === 'm1inuse' || col === 'm2inuse' || col === 'm3inuse';
    // Right separator for m3datum
    const hasRightSeparator = col === 'm3datum';
    
    return { hasLeftSeparator, hasRightSeparator };
  };

  const updateUrlAndStorage = (colTemp: string, stickyCol: string) => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('coltemp', colTemp);
    url.searchParams.set('stickycol', stickyCol);
    window.history.replaceState({}, '', url.toString());
    
    // Update localStorage
    localStorage.setItem('clevnar3_coltemp', colTemp);
    localStorage.setItem('clevnar3_stickycol', stickyCol);
  };

  const handleColumnTemplateChange = (option: string) => {
    setSelectedColumnTemplate(option);
    updateUrlAndStorage(option, selectedStickyColumns);
  };

  const handleStickyColumnsChange = (option: string) => {
    setSelectedStickyColumns(option);
    updateUrlAndStorage(selectedColumnTemplate, option);
  };

  const handleSaveApiKey = async (slotId: string, moduleNumber: string, apiKeyValue: string) => {
    if (!user?.id || !apiKeyValue.trim()) return;
    
    const fieldKey = `${slotId}_${moduleNumber}`;
    setSavingFields(new Set([...savingFields, fieldKey]));
    
    try {
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        throw new Error('Could not find user record.');
      }
      
      // Check if user already has an api_keys_t3 record for this slot
      const { data: existingKey, error: checkError } = await supabase
        .from('api_keys_t3')
        .select('*')
        .eq('fk_user_id', userData.id)
        .eq('fk_slot_id', slotId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }
      
      const updateData = {
        [`${moduleNumber}datum`]: apiKeyValue.trim(),
        updated_at: new Date().toISOString()
      };
      
      if (existingKey) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('api_keys_t3')
          .update(updateData)
          .eq('api_key_id', existingKey.api_key_id);
          
        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('api_keys_t3')
          .insert({
            fk_user_id: userData.id,
            fk_slot_id: slotId,
            ...updateData,
            created_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
      // Clear the editing field and refresh data
      const newEditingFields = { ...editingFields };
      delete newEditingFields[fieldKey];
      setEditingFields(newEditingFields);
      
      await fetchJoinedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      const newSavingFields = new Set(savingFields);
      newSavingFields.delete(fieldKey);
      setSavingFields(newSavingFields);
    }
  };

  const handleSaveUeplatLabel = async (slotId: string, moduleNumber: string, labelValue: string) => {
    if (!user?.id) return;
    
    const fieldKey = `${slotId}_${moduleNumber}_ueplatlabel`;
    setSavingFields(new Set([...savingFields, fieldKey]));
    
    try {
      // Get user's DB id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
        
      if (userError || !userData) {
        throw new Error('Could not find user record.');
      }
      
      // Check if user already has an api_keys_t3 record for this slot
      const { data: existingKey, error: checkError } = await supabase
        .from('api_keys_t3')
        .select('*')
        .eq('fk_user_id', userData.id)
        .eq('fk_slot_id', slotId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }
      
      const updateData = {
        [`${moduleNumber}ueplatlabel`]: labelValue.trim() || null,
        updated_at: new Date().toISOString()
      };
      
      if (existingKey) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('api_keys_t3')
          .update(updateData)
          .eq('api_key_id', existingKey.api_key_id);
          
        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('api_keys_t3')
          .insert({
            fk_user_id: userData.id,
            fk_slot_id: slotId,
            ...updateData,
            created_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
      // Clear the editing field and refresh data
      const newEditingFields = { ...editingFields };
      delete newEditingFields[fieldKey];
      setEditingFields(newEditingFields);
      
      await fetchJoinedData();
    } catch (err) {
      console.error('Save label error details:', {
        error: err,
        slotId,
        moduleNumber,
        labelValue,
        fieldKey,
        updateData
      });
      setError(err instanceof Error ? err.message : 'Failed to save label');
    } finally {
      const newSavingFields = new Set(savingFields);
      newSavingFields.delete(fieldKey);
      setSavingFields(newSavingFields);
    }
  };

  const formatColumnData = (col: string, value: any, item?: ApiKeySlotJoined) => {
    
    switch (col) {
      case 'slot_id':
      case 'api_key_id':
      case 'fk_user_id':
      case 'fk_slot_id':
      case 'fk_iservices_provider_id':
      case 'fk_ai_model_id':
        if (value === null || value === undefined) return '-';
        return value.substring(0, 8) + '...';
      case 'slot_created_at':
      case 'slot_updated_at':
      case 'key_created_at':
      case 'key_updated_at':
        if (value === null || value === undefined) return '-';
        return new Date(value).toLocaleString();
      case 'm1datum':
      case 'm2datum':
      case 'm3datum':
        // Always show interactive elements for datum fields when user is logged in
        if (!item || !user?.id) {
          if (value === null || value === undefined) return '-';
          // Show masked API key for non-logged in users
          const keyLength = value.length;
          if (keyLength <= 8) return '********';
          return value.substring(0, 4) + '...' + value.substring(keyLength - 4);
        }
        
        // Check if corresponding module is in use
        const moduleNumber = col.replace('datum', ''); // m1, m2, or m3
        const inUseField = `${moduleNumber}inuse` as keyof ApiKeySlotJoined;
        const isModuleInUse = item[inUseField] as boolean;
        
        if (!isModuleInUse) {
          return (
            <span className="text-gray-400 italic text-sm">
              Module not active
            </span>
          );
        }
        
        const fieldKey = `${item.slot_id}_${moduleNumber}`;
        const isEditing = editingFields.hasOwnProperty(fieldKey);
        const isSaving = savingFields.has(fieldKey);
        
        if (isEditing) {
          return (
            <div className="flex space-x-2 min-w-0">
              <input
                type="text"
                value={editingFields[fieldKey] || ''}
                onChange={(e) => setEditingFields({...editingFields, [fieldKey]: e.target.value})}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Enter ${moduleNumber} API key`}
                disabled={isSaving}
              />
              <button
                onClick={() => handleSaveApiKey(item.slot_id, moduleNumber, editingFields[fieldKey] || '')}
                disabled={isSaving || !editingFields[fieldKey]?.trim()}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  const newEditingFields = { ...editingFields };
                  delete newEditingFields[fieldKey];
                  setEditingFields(newEditingFields);
                }}
                disabled={isSaving}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>
          );
        }
        
        // Not editing - show value with edit button or add button
        if (value === null || value === undefined) {
          return (
            <button
              onClick={() => setEditingFields({...editingFields, [fieldKey]: ''})}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Add Key
            </button>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {!value || value.length <= 8 ? '••••••••' : value.substring(0, 4) + '••••' + value.substring(value.length - 4)}
              </span>
              <button
                onClick={() => setEditingFields({...editingFields, [fieldKey]: value || ''})}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            </div>
          );
        }
        
      case 'm1ueplatlabel':
      case 'm2ueplatlabel':
      case 'm3ueplatlabel':
        // Show editable ueplatlabel fields for logged-in users
        if (!item || !user?.id) {
          if (value === null || value === undefined) return '-';
          return String(value);
        }
        
        // Check if corresponding module is in use
        const labelModuleNumber = col.replace('ueplatlabel', ''); // m1, m2, or m3
        const labelInUseField = `${labelModuleNumber}inuse` as keyof ApiKeySlotJoined;
        const isLabelModuleInUse = item[labelInUseField] as boolean;
        
        if (!isLabelModuleInUse) {
          return (
            <span className="text-gray-400 italic text-sm">
              Module not active
            </span>
          );
        }
        
        const labelFieldKey = `${item.slot_id}_${labelModuleNumber}_ueplatlabel`;
        const isLabelEditing = editingFields.hasOwnProperty(labelFieldKey);
        const isLabelSaving = savingFields.has(labelFieldKey);
        
        if (isLabelEditing) {
          return (
            <div className="flex space-x-2 min-w-0">
              <input
                type="text"
                value={editingFields[labelFieldKey] || ''}
                onChange={(e) => setEditingFields({...editingFields, [labelFieldKey]: e.target.value})}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Enter ${labelModuleNumber} label`}
                disabled={isLabelSaving}
              />
              <button
                onClick={() => handleSaveUeplatLabel(item.slot_id, labelModuleNumber, editingFields[labelFieldKey] || '')}
                disabled={isLabelSaving}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLabelSaving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  const newEditingFields = { ...editingFields };
                  delete newEditingFields[labelFieldKey];
                  setEditingFields(newEditingFields);
                }}
                disabled={isLabelSaving}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>
          );
        }
        
        // Not editing - show value with edit button or add button
        if (value === null || value === undefined || value === '') {
          return (
            <button
              onClick={() => setEditingFields({...editingFields, [labelFieldKey]: ''})}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Add Label
            </button>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                {value}
              </span>
              <button
                onClick={() => setEditingFields({...editingFields, [labelFieldKey]: value || ''})}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            </div>
          );
        }
        
      case 'm1inuse':
      case 'm2inuse':
      case 'm3inuse':
      case 'slot_publicly_shown':
      case 'is_ai_model':
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      case 'count_active_modules_on_slot':
        if (value === null || value === undefined) return '-';
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {value}
          </span>
        );
      default:
        if (value === null || value === undefined) return '-';
        return String(value);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      if (startPage === 1) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loading) return <div className="p-6">Loading API key slots...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  const stickyColumnCount = getStickyColumnCount();
  const visibleColumns = getVisibleColumns();

  return (
    <div className="w-full min-h-screen bg-gray-50 -m-6 ml-2">
      <div className="p-6 w-full max-w-none">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">API Key Slots Management</h1>
        <p className="text-sm text-gray-600 mb-6">SQL View: sqlview_apikeysjoined1 (api_key_slots LEFT JOIN api_keys_t3)</p>
      
      {/* Column Template Control Bar */}
      <div className="mb-6 flex items-stretch space-x-4">
        {/* SQL View Info */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs" style={{maxWidth: '130px', maxHeight: '75px'}}>
          <div className="font-semibold text-gray-700 mb-1">SQL View Info</div>
          <div className="text-gray-600">view name: sqlview_apikeysjoined1</div>
          <div className="text-gray-600"># columns: {columns.length}</div>
        </div>

        {/* Column Template Options */}
        <div className="bg-white border border-gray-300 rounded-lg p-2" style={{maxWidth: '600px', maxHeight: '75px'}}>
          <div className="flex space-x-1">
            {[
              { id: 'option1', label: 'OPTION 1', subtitle: 'col temp all', range: 'columns 1-~' },
              { id: 'option2', label: 'OPTION 2', subtitle: 'col temp a', range: 'columns 1-7' },
              { id: 'option3', label: 'OPTION 3', subtitle: 'col temp b', range: 'columns 8-14' },
              { id: 'option4', label: 'OPTION 4', subtitle: 'col temp c', range: 'columns 15-21' },
              { id: 'option5', label: 'OPTION 5', subtitle: 'col temp d', range: 'columns 22-28' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => handleColumnTemplateChange(option.id)}
                className={`text-xs leading-tight p-2 rounded border text-center ${
                  selectedColumnTemplate === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '120px'}}
              >
                <div className="font-semibold">{option.label}</div>
                <div>{option.subtitle}</div>
                <div>{option.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Columns Control */}
        <div className="bg-white border border-gray-300 rounded-lg p-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">Sticky Columns</div>
          <div className="flex space-x-1">
            {[
              { id: 'option1', label: 'OPTION 1', subtitle: '1 left-most', range: 'column' },
              { id: 'option2', label: 'OPTION 2', subtitle: '2 left-most', range: 'columns' },
              { id: 'option3', label: 'OPTION 3', subtitle: '3 left-most', range: 'columns' },
              { id: 'option4', label: 'OPTION 4', subtitle: '4 left-most', range: 'columns' },
              { id: 'option5', label: 'OPTION 5', subtitle: '5 left-most', range: 'columns' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => handleStickyColumnsChange(option.id)}
                className={`text-xs leading-tight p-1 rounded border text-center ${
                  selectedStickyColumns === option.id
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{width: '80px'}}
              >
                <div className="font-semibold">{option.label}</div>
                <div>{option.subtitle}</div>
                <div>{option.range}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search API Key Slots</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by slot names, module names, IDs, or email..."
              />
            </div>
          </div>
          <button
            onClick={fetchJoinedData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
            <span className="font-medium text-gray-900">{totalItems}</span> API key slots
          </span>
          <div className="flex items-center space-x-2">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
              Items per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th colSpan={Math.min(visibleColumns.length, 21)} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-blue-50">
                API Key Slots (Primary Entity)
              </th>
              {visibleColumns.length > 21 && (
                <th colSpan={Math.min(visibleColumns.length - 21, 10)} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-green-50">
                  User API Keys (Joined Data)
                </th>
              )}
            </tr>
            <tr>
              {visibleColumns.map((col, index) => {
                // Determine background color based on column type
                let bgColor = 'bg-blue-50'; // Default for api_key_slots columns
                
                if (col.startsWith('api_key_') || col.startsWith('fk_user_') || col.startsWith('fk_slot_') || 
                    col.startsWith('key_') || col.startsWith('d_')) {
                  bgColor = 'bg-green-50'; // api_keys_t3 columns
                } else if (col === 'm1datum' || col === 'm2datum' || col === 'm3datum' || 
                           col === 'm1ueplatlabel' || col === 'm2ueplatlabel' || col === 'm3ueplatlabel') {
                  bgColor = 'bg-green-50'; // m*datum and m*ueplatlabel are from api_keys_t3 but positioned with slots
                } else if (col.startsWith('m') && (col.endsWith('inuse') || col.endsWith('platcodehandle'))) {
                  bgColor = 'bg-blue-50'; // m*inuse and m*platcodehandle are from api_key_slots
                }

                // Sticky logic: first N columns are always sticky
                const isSticky = index < stickyColumnCount;
                const stickyClass = isSticky ? 'sticky left-0 z-10' : '';
                const leftPosition = isSticky ? `${index * 150}px` : 'auto';
                
                // Check if this is the last sticky column
                const isLastSticky = index === stickyColumnCount - 1;
                
                const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                
                return (
                  <th 
                    key={col} 
                    className={`px-6 py-3 text-left text-xs font-bold text-gray-500 lowercase tracking-wider ${bgColor} ${stickyClass} relative`}
                    style={isSticky ? { left: leftPosition } : {}}
                  >
                    {hasLeftSeparator && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                    )}
                    {col}
                    {hasRightSeparator && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                    )}
                    {isLastSticky && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item, index) => (
              <tr key={item.slot_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {visibleColumns.map((col, colIndex) => {
                  // Sticky logic: first N columns are always sticky
                  const isSticky = colIndex < stickyColumnCount;
                  const stickyClass = isSticky ? 'sticky left-0 z-10' : '';
                  const leftPosition = isSticky ? `${colIndex * 150}px` : 'auto';
                  const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  
                  // Check if this is the last sticky column
                  const isLastSticky = colIndex === stickyColumnCount - 1;
                  
                  const { hasLeftSeparator, hasRightSeparator } = getColumnSeparators(col);
                  
                  return (
                    <td 
                      key={col} 
                      className={`px-6 py-4 text-sm text-gray-900 ${stickyClass} ${bgClass} relative`}
                      style={isSticky ? { left: leftPosition } : {}}
                    >
                      {hasLeftSeparator && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                      <div className={col.includes('datum') || col.includes('ueplatlabel') ? 'min-w-48' : 'max-w-xs'}>
                        {formatColumnData(col, item[col as keyof ApiKeySlotJoined], item)}
                      </div>
                      {hasRightSeparator && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                      {isLastSticky && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-black"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="First Page"
          >
            <span className="sr-only">First</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {getPageNumbers().map((pageNum, index) => (
            <span key={index}>
              {pageNum === '...' ? (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => handlePageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === pageNum
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </span>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last Page"
          >
            <span className="sr-only">Last</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-6 0a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API key slots found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No slots match your search criteria.' : 'No publicly available API key slots found.'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}